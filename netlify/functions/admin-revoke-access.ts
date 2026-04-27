import type { Config } from '@netlify/functions';
import { requireSession, normalizeEmail } from './_lib/auth';
import { isAdminEmail, getUserByEmail, saveUser } from './_lib/store';
import { json, error, handleOptions, parseJsonBody } from './_lib/response';

interface Body {
  email?: string;
}

/**
 * POST /api/admin/revoke-access
 * Body: { email }
 *
 * Clears the admin grant on the target user. Stripe-managed access (active
 * subscription, lifetime purchase) is NOT touched — admins can only revoke
 * access they themselves granted. Restricted to ADMIN_EMAILS.
 *
 * Admins cannot revoke their own access (that's an env-var, not a flag).
 */
export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return error('Method not allowed', 405);

  const session = await requireSession(req);
  if (!session) return error('Not authenticated', 401);
  if (!isAdminEmail(session.email)) return error('Forbidden', 403);

  try {
    const body = await parseJsonBody<Body>(req);
    const email = normalizeEmail(body.email || '');
    if (!email) return error('email is required', 400);

    const user = await getUserByEmail(email);
    if (!user) return error('User not found', 404);

    if (!user.adminGrantedAt) {
      return error(
        'No admin grant on this account — Stripe-managed access cannot be revoked here',
        409
      );
    }

    user.adminGrantedAt = undefined;
    user.adminGrantedBy = undefined;
    await saveUser(user);

    return json({ ok: true, email: user.email });
  } catch (err) {
    console.error('[admin-revoke-access] error', err);
    return error('Unable to revoke access', 500);
  }
};

export const config: Config = {
  path: '/api/admin/revoke-access',
};
