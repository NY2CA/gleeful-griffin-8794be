import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import {
  isAdminEmail,
  listAllUsers,
  type Deal,
  type UserRecord,
} from './_lib/store';
import { json, error, handleOptions } from './_lib/response';

/**
 * GET /api/admin/deals · Mastery Live · Wave 14.2
 *
 * Lists every deal across every member, flattened into a single sorted array
 * with the submitting member's name/email/id stitched onto each row. Restricted
 * to ADMIN_EMAILS. Sorted by `updatedAt` desc so the freshest activity is on
 * top — when a member submits a new deal or an admin promotes one, it pops to
 * the top of the table.
 *
 * Response shape:
 * {
 *   deals: Array<Deal & { memberId, memberName, memberEmail }>,
 *   count: number,
 *   stats: {
 *     submitted: number,
 *     in_review: number,
 *     active: number,
 *     on_hold: number,
 *     closed_won: number,
 *     closed_lost: number
 *   }
 * }
 */
export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return error('Method not allowed', 405);

  const session = await requireSession(req);
  if (!session) return error('Not authenticated', 401);
  if (!isAdminEmail(session.email)) return error('Forbidden', 403);

  try {
    const users = await listAllUsers();
    const flat: AdminDealRow[] = [];

    for (const u of users) {
      if (!u.deals?.length) continue;
      for (const d of u.deals) {
        flat.push(projectDeal(u, d));
      }
    }

    // Most recently updated first.
    flat.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

    const stats = {
      submitted: 0,
      in_review: 0,
      active: 0,
      on_hold: 0,
      closed_won: 0,
      closed_lost: 0,
    };
    for (const r of flat) {
      const s = r.status as keyof typeof stats;
      if (s in stats) stats[s] += 1;
    }

    return json({ deals: flat, count: flat.length, stats });
  } catch (err) {
    console.error('[admin-list-deals] error', err);
    return error('Unable to list deals', 500);
  }
};

interface AdminDealRow extends Deal {
  memberId: string;
  memberName: string;
  memberEmail: string;
}

function projectDeal(u: UserRecord, d: Deal): AdminDealRow {
  return {
    ...d,
    memberId: u.id,
    memberName: u.name,
    memberEmail: u.email,
  };
}

export const config: Config = {
  path: '/api/admin/deals',
};
