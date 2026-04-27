/**
 * Stripe SDK wrapper + shared helpers.
 *
 * Configuration (set these as env vars on Netlify):
 *   STRIPE_SECRET_KEY        — server-side key, starts with sk_test_ or sk_live_
 *   STRIPE_WEBHOOK_SECRET    — signing secret for the webhook endpoint (whsec_…)
 *   STRIPE_PRICE_ANNUAL      — recurring price id for the annual tier
 *   STRIPE_PRICE_MONTHLY     — recurring price id for the monthly tier
 *   STRIPE_PRICE_LIFETIME    — one-off price id for the lifetime tier
 *   APP_URL                  — used to build Checkout success/cancel redirects
 */

import Stripe from 'stripe';
import type { Plan, UserRecord } from './store';

let _client: Stripe | null = null;

/** Lazy-init so missing keys don't blow up functions that don't use Stripe. */
export function stripe(): Stripe {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Set it on Netlify → Environment variables.'
    );
  }
  _client = new Stripe(key, { apiVersion: '2024-06-20' });
  return _client;
}

export function webhookSecret(): string {
  const raw = process.env.STRIPE_WEBHOOK_SECRET;
  if (!raw) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is not configured. Copy the signing secret from the Stripe webhook endpoint.'
    );
  }
  return raw;
}

/** The three plans the platform offers. */
export const PLAN_DEFINITIONS: Array<{
  id: Exclude<Plan, null>;
  label: string;
  priceEnv: 'STRIPE_PRICE_ANNUAL' | 'STRIPE_PRICE_MONTHLY' | 'STRIPE_PRICE_LIFETIME';
  mode: 'subscription' | 'payment';
  description: string;
  /** Marketing copy shown on /pricing — actual amounts come from Stripe. */
  headline: string;
  bullets: string[];
}> = [
  {
    id: 'annual',
    label: 'Annual',
    priceEnv: 'STRIPE_PRICE_ANNUAL',
    mode: 'subscription',
    description: 'Save vs. monthly. Billed once a year.',
    headline: 'Best value for committed operators',
    bullets: [
      '12-week Multifamily Mastery program',
      'All underwriting models, LOI, PPM outline',
      'Quarterly live Q&A with Lou Rescia',
      'New content and templates as they ship',
    ],
  },
  {
    id: 'monthly',
    label: 'Monthly',
    priceEnv: 'STRIPE_PRICE_MONTHLY',
    mode: 'subscription',
    description: 'Pay as you go. Cancel any time.',
    headline: 'Start this month, decide later',
    bullets: [
      '12-week Multifamily Mastery program',
      'All underwriting models, LOI, PPM outline',
      'Cancel any time from the billing portal',
    ],
  },
  {
    id: 'lifetime',
    label: 'Lifetime',
    priceEnv: 'STRIPE_PRICE_LIFETIME',
    mode: 'payment',
    description: 'One payment. Yours forever.',
    headline: 'The forever plan',
    bullets: [
      'Everything in Annual, never expires',
      'All future releases included',
      'One-time payment, no renewal',
    ],
  },
];

/** Map a Stripe price id (from env) back to our internal plan id. */
export function planForPriceId(priceId: string | null | undefined): Plan {
  if (!priceId) return null;
  const map: Record<string, Plan> = {
    [process.env.STRIPE_PRICE_ANNUAL || '']: 'annual',
    [process.env.STRIPE_PRICE_MONTHLY || '']: 'monthly',
    [process.env.STRIPE_PRICE_LIFETIME || '']: 'lifetime',
  };
  return map[priceId] ?? null;
}

/** Look up the Stripe price id for a plan, from env. */
export function priceIdForPlan(plan: Plan): string | null {
  if (!plan) return null;
  switch (plan) {
    case 'annual':
      return process.env.STRIPE_PRICE_ANNUAL || null;
    case 'monthly':
      return process.env.STRIPE_PRICE_MONTHLY || null;
    case 'lifetime':
      return process.env.STRIPE_PRICE_LIFETIME || null;
  }
}

/**
 * Get or create a Stripe customer for this user. Attaches our internal user
 * id in `metadata.appUserId` so webhooks can resolve back to our user row
 * even if email changes.
 */
export async function ensureStripeCustomer(user: UserRecord): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const s = stripe();
  const customer = await s.customers.create({
    email: user.email,
    name: user.name,
    metadata: { appUserId: user.id },
  });
  return customer.id;
}

/** Build the success/cancel redirect URLs from APP_URL (or a fallback). */
export function billingRedirectUrls(
  origin: string
): { success: string; cancel: string } {
  const base = (process.env.APP_URL || origin || '').replace(/\/+$/, '');
  return {
    success: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel: `${base}/billing/cancel`,
  };
}

/** Fallback when APP_URL isn't set: derive from the incoming request. */
export function requestOrigin(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}
