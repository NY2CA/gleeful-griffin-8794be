import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import { getUserByEmail } from './_lib/store';
import { stripe, requestOrigin } from './_lib/stripe';
import { json, error, handleOptions } from './_lib/response';

/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Billing Portal session and returns the URL. Members use
 * the portal to update their card, switch plans, or cancel.
 * Requires an existing stripeCustomerId — anyone who has completed checkout
 * once will have one.
 */
export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return error('Method not allowed', 405);

  const session = await requireSession(req);
  if (!session) return error('Not authenticated', 401);

  try {
    const user = await getUserByEmail(session.email);
    if (!user) return error('Account not found', 404);
    if (!user.stripeCustomerId) {
      return error(
        'No billing account on file. Purchase a plan first.',
        400
      );
    }

    const base = (process.env.APP_URL || requestOrigin(req)).replace(/\/+$/, '');
    const portal = await stripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${base}/dashboard`,
    });

    return json({ url: portal.url });
  } catch (err) {
    console.error('[billing-portal] error', err);
    const msg = err instanceof Error ? err.message : 'Unable to open billing portal';
    return error(msg, 500);
  }
};

export const config: Config = {
  path: '/api/billing/portal',
};
