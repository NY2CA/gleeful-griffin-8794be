import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import { findActiveDeal, getUserById, isAdminEmail } from './_lib/store';
import { json, error, handleOptions } from './_lib/response';

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return error('Method not allowed', 405);

  const claims = await requireSession(req);
  if (!claims) return error('Unauthorized', 401);

  // Pull the user record from the store so we can return derived fields
  // (most importantly the active deal for the "Your deal" dashboard card).
  // If the record fails to load for any reason, we still return the JWT
  // claims so the user stays authenticated — degraded but functional.
  const record = await getUserById(claims.sub);
  const activeDeal = findActiveDeal(record);

  return json({
    user: {
      id: claims.sub,
      email: claims.email,
      name: claims.name,
      isAdmin: isAdminEmail(claims.email),
      // Surface the active deal (if any) so the dashboard "Your deal" card
      // can render real per-user data. Mastery Live members who haven't
      // submitted yet get `activeDeal: null` and the dashboard renders the
      // empty state with the submission CTA.
      activeDeal: activeDeal ?? null,
    },
  });
};

export const config: Config = {
  path: '/api/auth/me',
};
