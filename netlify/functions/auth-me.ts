import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import { findAllActiveDeals, getUserById, isAdminEmail } from './_lib/store';
import { json, error, handleOptions } from './_lib/response';

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return error('Method not allowed', 405);

  const claims = await requireSession(req);
  if (!claims) return error('Unauthorized', 401);

  // Pull the user record from the store so we can return derived fields
  // (most importantly the active deals for the "Your deal(s)" dashboard
  // card). If the record fails to load for any reason, we still return the
  // JWT claims so the user stays authenticated — degraded but functional.
  const record = await getUserById(claims.sub);
  const activeDeals = findAllActiveDeals(record);

  return json({
    user: {
      id: claims.sub,
      email: claims.email,
      name: claims.name,
      isAdmin: isAdminEmail(claims.email),
      // Wave 14.3 · returns ALL live deals (sorted most-recent first), so
      // members tracking multiple LOIs see them all. Empty array when none.
      // Closed_won / closed_lost are excluded — those live in deal history,
      // not the active workspace.
      activeDeals,
      // Wave 14.1 backward-compat shim · the single most-recent live deal,
      // or null. Keeps older clients that still read `activeDeal` working
      // while frontend migrates to `activeDeals[]`.
      activeDeal: activeDeals[0] ?? null,
    },
  });
};

export const config: Config = {
  path: '/api/auth/me',
};
