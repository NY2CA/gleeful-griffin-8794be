import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import { getUserByEmail, saveUser, type Plan } from './_lib/store';
import {
  stripe,
  priceIdForPlan,
  ensureStripeCustomer,
  billingRedirectUrls,
  requestOrigin,
} from './_lib/stripe';
import { json, error, parseJsonBody, handleOptions } from './_lib/response';

/**
 * POST /api/billing/checkout
 *   body: { plan: 'annual' | 'monthly' | 'lifetime' }
 *
 * Creates a Stripe Checkout Session for the authenticated user and returns
 * the redirect URL. Subscriptions use `mode: 'subscription'`; the one-time
 * lifetime plan uses `mode: 'payment'`.
 */

interface CheckoutBody {
  plan?: string;
}

const VALID_PLANS: Exclude<Plan, null>[] = ['annual', 'monthly', 'lifetime'];

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return error('Method not allowed', 405);

  const session = await requireSession(req);
  if (!session) return error('Not authenticated', 401);

  let body: CheckoutBody;
  try {
    body = await parseJsonBody<CheckoutBody>(req);
  } catch {
    return error('Invalid JSON body', 400);
  }

  const plan = (body.plan || '').toLowerCase() as Exclude<Plan, null>;
  if (!VALID_PLANS.includes(plan)) {
    return error('Unknown plan. Expected one of annual | monthly | lifetime.', 400);
  }

  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return error(
      `Stripe price id for "${plan}" is not configured. Set STRIPE_PRICE_${plan.toUpperCase()} on Netlify.`,
      500
    );
  }

  try {
    const user = await getUserByEmail(session.email);
    if (!user) return error('Account not found', 404);

    const customerId = await ensureStripeCustomer(user);
    // Persist the customer id early so we can match webhooks to this user even
    // if checkout fails and we never see `checkout.session.completed`.
    if (!user.stripeCustomerId) {
      user.stripeCustomerId = customerId;
      await saveUser(user);
    }

    const { success, cancel } = billingRedirectUrls(requestOrigin(req));
    const isSubscription = plan !== 'lifetime';

    const checkout = await stripe().checkout.sessions.create({
      customer: customerId,
      mode: isSubscription ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success,
      cancel_url: cancel,
      client_reference_id: user.id,
      metadata: {
        appUserId: user.id,
        plan,
      },
      // For subscriptions, attach metadata to the resulting subscription so
      // renewal webhooks (customer.subscription.updated) carry the plan id.
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: { appUserId: user.id, plan },
            },
            allow_promotion_codes: true,
          }
        : {
            payment_intent_data: {
              metadata: { appUserId: user.id, plan },
            },
          }),
    });

    if (!checkout.url) {
      return error('Stripe did not return a checkout URL', 502);
    }
    return json({ url: checkout.url, id: checkout.id });
  } catch (err) {
    console.error('[billing-checkout] error', err);
    const msg = err instanceof Error ? err.message : 'Unable to start checkout';
    return error(msg, 500);
  }
};

export const config: Config = {
  path: '/api/billing/checkout',
};
