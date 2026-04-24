import type { Config } from '@netlify/functions';
import {
  verifyResetToken,
  hashPassword,
  signSession,
  hashFingerprint,
} from './_lib/auth';
import { getUserByEmail, saveUser } from './_lib/store';
import { json, error, parseJsonBody, handleOptions } from './_lib/response';

/**
 * POST /api/auth/reset
 *   body: { token, password }
 *
 * Consumes a reset token from the email link and sets a new password.
 * Returns a fresh session token so the client can auto sign-in.
 *
 * Security notes:
 *   - Tokens carry `aud: 'password-reset'`, so they cannot be used as session
 *     tokens on protected endpoints.
 *   - Tokens expire after 30 minutes (set at sign time).
 *   - Tokens embed `pwd` (first 24 chars of the current password hash).
 *     When a user resets their password, the hash changes and any
 *     outstanding token becomes invalid on the next verify — this gives us
 *     single-use redemption without tracking nonces server-side.
 */

interface ResetBody {
  token?: string;
  password?: string;
}

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return error('Method not allowed', 405);

  let body: ResetBody;
  try {
    body = await parseJsonBody<ResetBody>(req);
  } catch {
    return error('Invalid JSON body', 400);
  }

  const token = (body.token || '').trim();
  const password = body.password || '';
  if (!token) return error('Reset token is required', 400);
  if (password.length < 8) return error('Password must be at least 8 characters', 400);

  try {
    const claims = await verifyResetToken(token);
    if (!claims) return error('This reset link is invalid or has expired', 400);

    const user = await getUserByEmail(claims.email);
    // If the user was deleted, or the password has already been changed since
    // the token was issued, the fingerprint won't match and we refuse.
    if (!user || hashFingerprint(user.passwordHash) !== claims.pwd) {
      return error('This reset link is invalid or has already been used', 400);
    }

    const passwordHash = await hashPassword(password);
    const updated = { ...user, passwordHash };
    await saveUser(updated);

    const session = await signSession({
      sub: updated.id,
      email: updated.email,
      name: updated.name,
    });
    return json({
      token: session,
      user: { id: updated.id, email: updated.email, name: updated.name },
    });
  } catch (err) {
    console.error('[auth-reset] error', err);
    return error('Unable to reset password', 500);
  }
};

export const config: Config = {
  path: '/api/auth/reset',
};
