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

/**
 * Status of a Deal in the Mastery Live coaching workflow.
 *
 * Lifecycle:
 *   submitted   — Member just submitted via /submit-deal. Awaiting Diva/Lou review.
 *   in_review   — Admin opened it; reviewing the underwriting before next call.
 *   active      — Promoted to active coaching. Surfaces on dashboard "Your deal" card.
 *   on_hold     — Temporarily paused (member walked from LOI, exploring next deal).
 *   closed_won  — Member closed the deal. Archive but keep history.
 *   closed_lost — Walked away or lost to another bidder. Archive.
 */
export type DealStatus =
  | 'submitted'
  | 'in_review'
  | 'active'
  | 'on_hold'
  | 'closed_won'
  | 'closed_lost';

/**
 * A Deal record · Mastery Live coaching workspace.
 *
 * Submitted by the member via /submit-deal, populated/promoted by Diva/Lou
 * via /admin/deals. Surfaces on the member's /dashboard "Your deal" card
 * once status is `active`.
 */
export interface Deal {
  id: string;
  /** ISO timestamp — when the member submitted. */
  submittedAt: string;
  /** ISO timestamp — last admin update. */
  updatedAt: string;
  status: DealStatus;
  // ── Property ──────────────────────────────────────────────────────
  /** Display name · e.g. "Garland · 142-unit Class B". */
  name: string;
  /** Full street address. */
  address?: string;
  /** Number of units. */
  units?: number;
  /** Asset class (B+, B, C+, etc.). */
  assetClass?: string;
  /** Asking price in dollars. */
  askingPrice?: number;
  // ── Underwriting (member-submitted) ───────────────────────────────
  /** Underwritten year-1 stabilized NOI. */
  underwrittenNoi?: number;
  /** Underwritten YOC, e.g. "7.4%". */
  underwrittenYoc?: string;
  /** Target levered IRR, e.g. "17.2%". */
  targetIrr?: string;
  /** Where the member is on the deal · "pre-LOI", "in LOI", "in DD", "PSA". */
  stage?: string;
  /** What the member wants help with on the next call. */
  coachingFocus?: string;
  // ── Admin annotations ─────────────────────────────────────────────
  /** Notes from Diva/Lou after review. Shown to member on their dashboard. */
  reviewNotes?: string;
}

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
  /**
   * Wave 15.2 · ISO date when admin-granted access expires. Optional —
   * absent (or undefined) means the grant is indefinite, which is the
   * default behavior carried over from before this field existed. When
   * set, hasActiveAccess() returns false once the current time passes
   * this date. Useful for partner comps with a fixed term, or onboarding
   * a student who already has X months of mentoring left from a prior
   * agreement. Lifetime purchases and Stripe subs are unaffected.
   */
  adminGrantedUntil?: string;
  // ── Drip campaign ──────────────────────────────────────────────────────
  /**
   * ISO — set the FIRST time access becomes active (admin grant or paid
   * Stripe). Drives the 12-week drip schedule. Once set, never overwritten,
   * so a member who churns and re-subscribes doesn't re-receive the welcome
   * arc. Clear this manually if you ever want to restart the sequence.
   */
  dripAnchorAt?: string;
  /**
   * Map of drip-id → ISO timestamp when sent. Idempotent send guard: if the
   * key exists, the scheduled function won't re-send. Drip ids: 'welcome',
   * 'w1', 'w2', ..., 'w12', 'capstone'.
   */
  dripSent?: Record<string, string>;
  // ── Mastery Live · deals (Wave 14.1) ───────────────────────────────────
  /**
   * Deals the member has submitted for coaching review. Most recent first.
   * Surfaces on /dashboard "Your deal" card when one is active.
   * Populated/promoted by Diva/Lou via /admin/deals.
   */
  deals?: Deal[];
}

export type ProgressMap = Record<string, Record<string, boolean>>;
// progress[courseId][moduleId] = true

// ─────────────────────────────────────────────────────────────────────
// Weekly Reads · Wave 16.1
//
// Editorial surface shared between the Mastery Live and Self-Study
// dashboards. Lou or Diva publish 3-5 articles each Tuesday via the
// /admin/weekly-reads form on the Mastery site; both dashboards read
// the same blob so updates land on both at once. Self-Study fetches
// via Mastery's public /api/weekly-reads endpoint (CORS-open) instead
// of duplicating the storage on its own backend.
// ─────────────────────────────────────────────────────────────────────

export interface WeeklyReadArticle {
  /** Source publication, e.g. "CBRE", "Multifamily Executive". */
  source: string;
  /** Human-readable date of the source article, e.g. "Apr 29". */
  dateLabel: string;
  /** Article headline. */
  title: string;
  /** One-line "why this matters to you" framing for members. */
  why: string;
  /** Direct link to the article. Required. */
  href: string;
}

export interface WeeklyReadsBlob {
  /** ISO timestamp · when this set of reads was published. */
  publishedAt: string;
  /**
   * Email of the admin who published, OR 'autofeed@scheduled' for the
   * Tuesday cron auto-publish. Use to drive UI hints ("Published by autofeed
   * — last refreshed Tuesday at 8am").
   */
  publishedBy: string;
  /**
   * Wave 16.1 · true when the blob was auto-published by the scheduled
   * Tuesday cron via Claude web-search curation. Admin manual publishes
   * always set this to false (or omit). Lets the UI show an indicator.
   */
  autoGenerated?: boolean;
  /** 3-5 articles to surface this week. */
  articles: WeeklyReadArticle[];
}

export function usersStore() {
  return getStore({ name: 'users', consistency: 'strong' });
}

export function progressStore() {
  return getStore({ name: 'progress', consistency: 'strong' });
}

export function userIndexStore() {
  return getStore({ name: 'userIndex', consistency: 'strong' });
}

/**
 * Wave 16.1 · stores the current weekly-reads blob. Single key 'current'
 * — there's only ever one "this week's reads" set live at a time. Past
 * weeks aren't kept (could be added later as an archive feature).
 */
export function weeklyReadsStore() {
  return getStore({ name: 'weeklyReads', consistency: 'strong' });
}

export async function getCurrentWeeklyReads(): Promise<WeeklyReadsBlob | null> {
  const store = weeklyReadsStore();
  return (await store.get('current', { type: 'json' })) as WeeklyReadsBlob | null;
}

export async function saveWeeklyReads(blob: WeeklyReadsBlob): Promise<void> {
  const store = weeklyReadsStore();
  await store.setJSON('current', blob);
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
 *   3. Users with an active admin grant always have access — UNLESS
 *      `adminGrantedUntil` is set and has passed (Wave 15.2 expiry).
 *   4. Subscribers have access when their subscription is `active` or `trialing`.
 */
export function hasActiveAccess(user: UserRecord | null | undefined): boolean {
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  if (user.lifetimePurchasedAt) return true;
  if (user.adminGrantedAt) {
    // Wave 15.2 · admin grants can carry an optional expiry. If absent,
    // grant is indefinite. If set and in the future, still active. If set
    // and in the past, the grant has expired — fall through to other rules.
    if (!user.adminGrantedUntil) return true;
    if (new Date(user.adminGrantedUntil).getTime() > Date.now()) return true;
    // expired admin grant → keep checking other rules below
  }
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
 * Marks a user's drip anchor (the day-zero of their 12-week drip schedule)
 * the first time access becomes active. Idempotent — subsequent calls are
 * no-ops, so a churn → re-sub user does NOT restart the sequence.
 *
 * Returns true if the anchor was just set (caller can fire the welcome
 * email immediately), false if it was already set previously.
 *
 * The caller is responsible for persisting the user record.
 */
export function markAccessGranted(user: UserRecord): boolean {
  if (user.dripAnchorAt) return false;
  user.dripAnchorAt = new Date().toISOString();
  return true;
}

/**
 * Generates a stable deal id. Format: `d_<timestamp>_<random>`.
 */
export function newDealId(): string {
  return (
    'd_' +
    Date.now().toString(36) +
    '_' +
    Math.random().toString(36).slice(2, 8)
  );
}

/**
 * Returns the most relevant deal for dashboard rendering: the most recently
 * updated active or in_review or submitted deal. Returns undefined if the
 * member has no live deals (closed-won and closed-lost are excluded — those
 * are archives, not active workspaces).
 *
 * Kept for backward compat with anything that still expects a single deal.
 * Wave 14.3 dashboards prefer `findAllActiveDeals()` which returns the full
 * list so members tracking multiple LOIs see them all.
 */
export function findActiveDeal(user: UserRecord | null | undefined): Deal | undefined {
  return findAllActiveDeals(user)[0];
}

/**
 * Returns every live deal on the user record, sorted most-recently-updated
 * first. Excludes closed_won / closed_lost (those are archives). Wave 14.3
 * dashboard renders this as a stack so a member with three open LOIs sees
 * all three at once.
 */
export function findAllActiveDeals(user: UserRecord | null | undefined): Deal[] {
  if (!user?.deals?.length) return [];
  const live = user.deals.filter((d) =>
    d.status === 'submitted' ||
    d.status === 'in_review' ||
    d.status === 'active' ||
    d.status === 'on_hold'
  );
  return live.slice().sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
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
