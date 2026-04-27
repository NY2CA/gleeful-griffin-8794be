/**
 * Netlify Blobs-backed persistence.
 *
 * We use three stores:
 *   users         — keyed by normalized email, stores the user record + password hash
 *   progress      — keyed by user id, stores { [courseId]: { [moduleId]: true } }
 *   userIndex     — keyed by user id, stores the email lookup for id→email resolution
 *                   (so Stripe webhooks can find the user by stripeCustomerId via the
 *                   customer's email attribute without a full scan)
 *
 * No database needed. Blobs is included in the free Netlify tier.
 * https://docs.netlify.com/blobs/overview/
 */

import { getStore } from '@netlify/blobs';

/** Subscription/access status persisted on the user record. */
export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

/** Which paid tier the user is on (if any). */
export type Plan = 'annual' | 'monthly' | 'lifetime' | null;

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string; // ISO
  // ── Billing ─────────────────────────────────────────────────────────────
  stripeCustomerId?: string;
  /** Stripe subscription id (absent for one-off lifetime purchases). */
  stripeSubscriptionId?: string;
  /** Stripe price id currently on the subscription (or the one-off purchase). */
  stripePriceId?: string;
  plan?: Plan;
  subscriptionStatus?: SubscriptionStatus;
  /** ISO — next renewal or trial-end date (from Stripe). */
  currentPeriodEnd?: string;
  /** ISO — set when lifetime checkout completes. Never expires. */
  lifetimePurchasedAt?: string;
  /** Whether Stripe says `cancel_at_period_end` is true on the sub. */
  cancelAtPeriodEnd?: boolean;
  /**
   * ISO — set when an admin manually grants access via /admin/members.
   * Independent of Stripe; admin grants don't create a Stripe customer.
   */
  adminGrantedAt?: string;
  /** Email of the admin who last granted access. */
  adminGrantedBy?: string;
}

export type ProgressMap = Record<string, Record<string, boolean>>;
// progress[courseId][moduleId] = true

export function usersStore() {
  return getStore({ name: 'users', consistency: 'strong' });
}

export function progressStore() {
  return getStore({ name: 'progress', consistency: 'strong' });
}

export function userIndexStore() {
  return getStore({ name: 'userIndex', consistency: 'strong' });
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const store = usersStore();
  return (await store.get(email, { type: 'json' })) as UserRecord | null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const idx = userIndexStore();
  const email = (await idx.get(id, { type: 'text' })) as string | null;
  if (!email) return null;
  return getUserByEmail(email);
}

export async function saveUser(user: UserRecord): Promise<void> {
  const store = usersStore();
  await store.setJSON(user.email, user);
  // Maintain the id→email reverse index so webhooks/session lookups work.
  const idx = userIndexStore();
  await idx.set(user.id, user.email);
}

export async function getProgress(userId: string): Promise<ProgressMap> {
  const store = progressStore();
  const data = (await store.get(userId, { type: 'json' })) as ProgressMap | null;
  return data ?? {};
}

export async function saveProgress(userId: string, progress: ProgressMap): Promise<void> {
  const store = progressStore();
  await store.setJSON(userId, progress);
}

/**
 * Returns true if the user currently has access to paid content.
 * Access rules (in priority order):
 *   1. Admins (emails listed in ADMIN_EMAILS env var) always have access.
 *   2. Lifetime purchasers always have access.
 *   3. Users with an active admin grant always have access.
 *   4. Subscribers have access when their subscription is `active` or `trialing`.
 */
export function hasActiveAccess(user: UserRecord | null | undefined): boolean {
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  if (user.lifetimePurchasedAt) return true;
  if (user.adminGrantedAt) return true;
  const s = user.subscriptionStatus;
  return s === 'active' || s === 'trialing';
}

/**
 * Lists every user record in the store. Used by /admin/members.
 *
 * Netlify Blobs supports paginated listing via `paginate: true` which yields
 * an async iterable of pages. For small admin tables this is plenty.
 */
export async function listAllUsers(): Promise<UserRecord[]> {
  const store = usersStore();
  const out: UserRecord[] = [];
  for await (const page of store.list({ paginate: true })) {
    for (const blob of page.blobs ?? []) {
      const rec = (await store.get(blob.key, { type: 'json' })) as UserRecord | null;
      if (rec) out.push(rec);
    }
  }
  return out;
}

/**
 * Checks whether an email is in the ADMIN_EMAILS env list. The env var is a
 * comma-separated list of emails (e.g. "lou@resciaproperties.com,
 * diva@resciaproperties.com"). Empty / missing env returns false.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS || '';
  if (!raw.trim()) return false;
  const normalized = email.trim().toLowerCase();
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}
