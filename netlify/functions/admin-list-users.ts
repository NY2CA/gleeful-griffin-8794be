import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import {
  isAdminEmail,
  listAllUsers,
  hasActiveAccess,
  type UserRecord,
} from './_lib/store';
import { json, error, handleOptions } from './_lib/response';

/**
 * GET /api/admin/users
 *
 * Lists every member account in the store. Restricted to emails in the
 * ADMIN_EMAILS env var. Returns a sanitized projection — no password hashes,
 * no Stripe customer ids — just what the /admin/members table renders.
 */
export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return error('Method not allowed', 405);

  const session = await requireSession(req);
  if (!session) return error('Not authenticated', 401);
  if (!isAdminEmail(session.email)) return error('Forbidden', 403);

  try {
    const users = await listAllUsers();
    const rows = users
      .map((u) => projectUser(u))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return json({ users: rows, count: rows.length });
  } catch (err) {
    console.error('[admin-list-users] error', err);
    return error('Unable to list users', 500);
  }
};

function projectUser(u: UserRecord) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt,
    hasAccess: hasActiveAccess(u),
    isAdmin: isAdminEmail(u.email),
    plan: u.plan ?? null,
    subscriptionStatus: u.subscriptionStatus ?? 'none',
    lifetime: Boolean(u.lifetimePurchasedAt),
    adminGrantedAt: u.adminGrantedAt ?? null,
    adminGrantedBy: u.adminGrantedBy ?? null,
    currentPeriodEnd: u.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: Boolean(u.cancelAtPeriodEnd),
  };
}

export const config: Config = {
  path: '/api/admin/users',
};
