import type { Config } from '@netlify/functions';
import type Stripe from 'stripe';
import { stripe, webhookSecret, planForPriceId } from './_lib/stripe';
import {
  getUserByEmail,
  getUserById,
  saveUser,
  markAccessGranted,
  hasActiveAccess,
  type UserRecord,
  type SubscriptionStatus,
} from './_lib/store';
import { sendWelcomeNow } from './_lib/drip';

/**
 * POST /api/billing/webhook
 *
 * Stripe → our server. Handles the events that drive member access:
 *
 *   checkout.session.completed        — someone just bought a plan
 *   customer.subscription.created     — sub started
 *   customer.subscription.updated     — plan change, renewal, or cancel-at-period-end flip
 *   customer.subscription.deleted     — sub ended (past_due dunning fails, or cancel now)
 *   invoice.paid                      — recurring payment succeeded (refresh period end)
 *   invoice.payment_failed            — card failed; downgrade if unpaid
 *
 * IMPORTANT: Stripe signs the raw request body. Do NOT JSON.parse before
 * verifying the signature — use req.text() and pass that string to
 * stripe.webhooks.constructEventAsync(...).
 *
 * Configure the endpoint at Stripe → Developers → Webhooks:
 *   URL: https://your-site.netlify.app/api/billing/webhook
 *   Events: the six listed above.
 * Copy the signing secret (whsec_…) into STRIPE_WEBHOOK_SECRET.
 */

async function findUser(customerId: string | null | undefined, appUserId?: string | null): Promise<UserRecord | null> {
  if (appUserId) {
    const byId = await getUserById(appUserId);
    if (byId) return byId;
  }
  if (customerId) {
    // Fallback: look up the customer in Stripe to get the email, then find the
    // user record by email. This handles the rare case where appUserId wasn't
    // in the event metadata (e.g. very old subscriptions created out of band).
    try {
      const customer = await stripe().customers.retrieve(customerId);
      if (customer && !customer.deleted) {
        const email = (customer.email || '').trim().toLowerCase();
        if (email) {
          const user = await getUserByEmail(email);
          if (user) return user;
        }
      }
    } catch (err) {
      console.warn('[webhook] failed to load customer', customerId, err);
    }
  }
  return null;
}

async function handleSubscription(sub: Stripe.Subscription): Promise<void> {
  const appUserId = (sub.metadata?.appUserId as string | undefined) ?? null;
  const user = await findUser(
    typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
    appUserId
  );
  if (!user) {
    console.warn('[webhook] subscription event without matching user', sub.id);
    return;
  }

  const priceId = sub.items.data[0]?.price.id;
  const plan = planForPriceId(priceId);

  user.stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  user.stripeSubscriptionId = sub.id;
  user.stripePriceId = priceId;
  user.plan = plan;
  user.subscriptionStatus = sub.status as SubscriptionStatus;
  user.currentPeriodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : undefined;
  user.cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);

  // If this update is what makes the user "active" for the first time ever,
  // anchor the drip clock and fire the welcome email. markAccessGranted is
  // idempotent — a churn → re-sub will NOT re-anchor.
  const isFirstAccess = hasActiveAccess(user) && markAccessGranted(user);
  await saveUser(user);
  if (isFirstAccess) {
    try {
      await sendWelcomeNow(user);
    } catch (err) {
      console.error('[webhook] welcome email failed', err);
    }
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const appUserId =
    (session.metadata?.appUserId as string | undefined) ??
    (session.client_reference_id as string | undefined) ??
    null;
  const user = await findUser(
    typeof session.customer === 'string' ? session.customer : session.customer?.id,
    appUserId
  );
  if (!user) {
    console.warn('[webhook] checkout.session.completed without matching user', session.id);
    return;
  }

  if (typeof session.customer === 'string') {
    user.stripeCustomerId = session.customer;
  }

  if (session.mode === 'payment') {
    // Lifetime — one-off purchase. No subscription to track.
    user.plan = 'lifetime';
    user.subscriptionStatus = 'active';
    user.lifetimePurchasedAt = new Date().toISOString();
    user.cancelAtPeriodEnd = false;
    user.currentPeriodEnd = undefined;
    user.stripeSubscriptionId = undefined;
    // Record the price id for bookkeeping.
    try {
      const line = await stripe().checkout.sessions.listLineItems(session.id, {
        limit: 1,
      });
      user.stripePriceId = line.data[0]?.price?.id;
    } catch {
      /* best-effort */
    }
    // First-ever access? Anchor the drip + fire welcome.
    const isFirstAccess = markAccessGranted(user);
    await saveUser(user);
    if (isFirstAccess) {
      try {
        await sendWelcomeNow(user);
      } catch (err) {
        console.error('[webhook] welcome email failed', err);
      }
    }
    return;
  }

  // Subscription mode — the detailed fields are populated by the
  // customer.subscription.created event that always follows. But we still want
  // to mark the customer id immediately so the portal works.
  await saveUser(user);
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  // Renewal — refresh period_end from the subscription record.
  if (!invoice.subscription || typeof invoice.subscription !== 'string') return;
  const sub = await stripe().subscriptions.retrieve(invoice.subscription);
  await handleSubscription(sub);
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.subscription || typeof invoice.subscription !== 'string') return;
  const sub = await stripe().subscriptions.retrieve(invoice.subscription);
  await handleSubscription(sub);
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Missing stripe-signature', { status: 400 });

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return new Response('Unable to read body', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret()
    );
  } catch (err) {
    console.error('[webhook] signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscription(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        // Unhandled events are a no-op. Stripe retries only on non-2xx, so we
        // return 200 to acknowledge receipt and keep the log clean.
        break;
    }
  } catch (err) {
    console.error('[webhook] handler error', event.type, err);
    // Return 500 so Stripe retries.
    return new Response('Handler error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
};

export const config: Config = {
  path: '/api/billing/webhook',
};
