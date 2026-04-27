import type { Config } from '@netlify/functions';
import { requireSession, normalizeEmail } from './_lib/auth';
import { isAdminEmail, getUserByEmail, saveUser } from './_lib/store';
import { json, error, handleOptions, parseJsonBody } from './_lib/response';

interface Body {
  email?: string;
}

/**
 * POST /api/admin/grant-access
 * Body: { email }
 *
 * Marks the target user as admin-granted (independent of Stripe). The next
 * /api/billing/status call for that user will return hasAccess: true.
 * Restricted to ADMIN_EMAILS.
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

    user.adminGrantedAt = new Date().toISOString();
    user.adminGrantedBy = session.email;
    await saveUser(user);

    return json({
      ok: true,
      email: user.email,
      adminGrantedAt: user.adminGrantedAt,
      adminGrantedBy: user.adminGrantedBy,
    });
  } catch (err) {
    console.error('[admin-grant-access] error', err);
    return error('Unable to grant access', 500);
  }
};

export const config: Config = {
  path: '/api/admin/grant-access',
};
