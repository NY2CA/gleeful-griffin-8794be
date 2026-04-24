import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import { getUserByEmail, hasActiveAccess } from './_lib/store';
import { json, error, handleOptions } from './_lib/response';

/**
 * GET /api/billing/status
 *
 * Returns the authenticated user's current billing state. Used by the
 * frontend to decide whether to show the paywall, the portal, or full
 * course content.
 */
export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return error('Method not allowed', 405);

  const session = await requireSession(req);
  if (!session) return error('Not authenticated', 401);

  try {
    const user = await getUserByEmail(session.email);
    if (!user) return error('Account not found', 404);

    return json({
      hasAccess: hasActiveAccess(user),
      plan: user.plan ?? null,
      subscriptionStatus: user.subscriptionStatus ?? 'none',
      currentPeriodEnd: user.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd ?? false,
      lifetime: Boolean(user.lifetimePurchasedAt),
      hasBillingAccount: Boolean(user.stripeCustomerId),
    });
  } catch (err) {
    console.error('[billing-status] error', err);
    return error('Unable to load billing status', 500);
  }
};

export const config: Config = {
  path: '/api/billing/status',
};
