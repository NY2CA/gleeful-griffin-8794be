import type { Config } from '@netlify/functions';
import { requireSession, normalizeEmail } from './_lib/auth';
import { isAdminEmail, getUserByEmail, saveUser, markAccessGranted } from './_lib/store';
import { json, error, handleOptions, parseJsonBody } from './_lib/response';
import { sendWelcomeNow } from './_lib/drip';

/**
 * Allowed shorthand durations for `body.duration`. Each maps to a number of
 * months added to "now" to produce `adminGrantedUntil`. 'indefinite' means
 * no expiry (the field is cleared or left absent).
 */
type DurationShorthand = 'indefinite' | '1mo' | '3mo' | '6mo' | '12mo';

interface Body {
  email?: string;
  /**
   * Wave 15.2 · how long the grant should last. Either:
   *   - a shorthand string ('indefinite' | '1mo' | '3mo' | '6mo' | '12mo')
   *   - an explicit ISO date string for a custom expiry
   *   - undefined → defaults to 'indefinite' (preserves prior behavior)
   */
  duration?: DurationShorthand | string;
}

/**
 * POST /api/admin/grant-access
 * Body: { email, duration? }
 *
 * Marks the target user as admin-granted (independent of Stripe). The next
 * /api/billing/status call for that user will return hasAccess: true.
 * Restricted to ADMIN_EMAILS.
 *
 * Wave 15.2 · `duration` is optional. If provided as a shorthand or ISO
 * date, persists `adminGrantedUntil`. After that date, hasActiveAccess()
 * returns false and the member loses access automatically. Re-granting
 * overwrites the previous expiry.
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

    // Wave 15.2 · resolve the optional duration into an ISO expiry (or undefined).
    const grantedUntil = resolveExpiry(body.duration);
    if (grantedUntil === 'invalid') {
      return error(
        'Invalid duration. Use one of: indefinite, 1mo, 3mo, 6mo, 12mo, or an ISO date string.',
        400,
      );
    }

    user.adminGrantedAt = new Date().toISOString();
    user.adminGrantedBy = session.email;
    if (grantedUntil) {
      user.adminGrantedUntil = grantedUntil;
    } else {
      // 'indefinite' or omitted → clear any previous expiry.
      delete user.adminGrantedUntil;
    }
    // Set the drip anchor on first-ever access. markAccessGranted is a no-op
    // if the anchor was already set (e.g. via a prior Stripe purchase that
    // was later canceled and is now being re-granted manually).
    const isFirstAccess = markAccessGranted(user);
    await saveUser(user);

    // Fire the welcome email immediately on first-ever access. Errors here
    // are logged but don't fail the grant — the daily cron will retry.
    if (isFirstAccess) {
      try {
        await sendWelcomeNow(user);
      } catch (err) {
        console.error('[admin-grant-access] welcome email failed', err);
      }
    }

    return json({
      ok: true,
      email: user.email,
      adminGrantedAt: user.adminGrantedAt,
      adminGrantedBy: user.adminGrantedBy,
      adminGrantedUntil: user.adminGrantedUntil ?? null,
      welcomeQueued: isFirstAccess,
    });
  } catch (err) {
    console.error('[admin-grant-access] error', err);
    return error('Unable to grant access', 500);
  }
};

/**
 * Resolves the body's `duration` field into an ISO expiry timestamp.
 *   undefined / 'indefinite'  → returns undefined (no expiry, indefinite grant)
 *   '1mo' | '3mo' | '6mo' | '12mo'  → adds N months to now, returns ISO
 *   ISO date string  → parsed and returned (must be in the future)
 *   anything else  → returns 'invalid' (caller responds 400)
 */
function resolveExpiry(input: unknown): string | undefined | 'invalid' {
  if (input === undefined || input === null || input === '' || input === 'indefinite') {
    return undefined;
  }
  if (typeof input !== 'string') return 'invalid';

  const monthMap: Record<string, number> = {
    '1mo': 1,
    '3mo': 3,
    '6mo': 6,
    '12mo': 12,
  };
  if (input in monthMap) {
    const d = new Date();
    d.setMonth(d.getMonth() + monthMap[input]);
    return d.toISOString();
  }

  // Try parsing as an ISO date (e.g. '2026-12-31' or '2026-12-31T00:00:00Z').
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return 'invalid';
  if (parsed.getTime() <= Date.now()) {
    // Custom date can't be in the past — that would immediately revoke access.
    return 'invalid';
  }
  return parsed.toISOString();
}

export const config: Config = {
  path: '/api/admin/grant-access',
};
