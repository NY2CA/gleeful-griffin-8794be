import type { Config } from '@netlify/functions';
import {
  normalizeEmail,
  signResetToken,
  hashFingerprint,
} from './_lib/auth';
import { getUserByEmail } from './_lib/store';
import { sendPasswordResetEmail, buildResetUrl } from './_lib/email';
import { json, error, parseJsonBody, handleOptions } from './_lib/response';

/**
 * POST /api/auth/forgot
 *   body: { email }
 *
 * Behaviour:
 *   - Always returns { ok: true } (no account enumeration).
 *   - When the email matches a user, we mint a 30-minute reset JWT bound to
 *     the user's current password-hash fingerprint and email it via Resend.
 *   - If Resend fails, we log and still return ok:true. Monitor the function
 *     logs for real delivery issues.
 */

interface ForgotBody {
  email?: string;
}

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return error('Method not allowed', 405);

  let body: ForgotBody;
  try {
    body = await parseJsonBody<ForgotBody>(req);
  } catch {
    return error('Invalid JSON body', 400);
  }

  const email = normalizeEmail(body.email || '');
  if (!email) return error('Email is required', 400);

  try {
    const user = await getUserByEmail(email);
    if (user) {
      const token = await signResetToken({
        sub: user.id,
        email: user.email,
        pwd: hashFingerprint(user.passwordHash),
      });
      const origin = new URL(req.url).origin;
      const resetUrl = buildResetUrl(token, origin);

      try {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
          expiresInMinutes: 30,
        });
      } catch (sendErr) {
        // Deliberately swallow — a send failure should not reveal that the
        // email was valid. Log it for observability.
        console.error('[auth-forgot] email send failed', sendErr);
      }
    } else {
      // Small jitter so timing doesn't leak existence.
      await new Promise((r) => setTimeout(r, 80));
    }
    return json({ ok: true });
  } catch (err) {
    console.error('[auth-forgot] error', err);
    return json({ ok: true });
  }
};

export const config: Config = {
  path: '/api/auth/forgot',
};
