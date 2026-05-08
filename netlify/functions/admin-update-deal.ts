import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import {
  isAdminEmail,
  getUserById,
  saveUser,
  type Deal,
  type DealStatus,
  type UserRecord,
} from './_lib/store';
import { sendDealUpdateEmail, type DealUpdateKind } from './_lib/email';
import { json, error, handleOptions, parseJsonBody } from './_lib/response';

/**
 * POST /api/admin/deals/update · Mastery Live · Wave 14.2
 *
 * Lets Diva or Lou mutate a member's deal record from the /admin/deals
 * surface. Restricted to ADMIN_EMAILS.
 *
 * Body:
 * {
 *   memberId: string                (required · which user owns this deal)
 *   dealId: string                  (required · which deal in their array)
 *   // any subset of:
 *   status?: DealStatus
 *   underwrittenYoc?: string | null    (null clears)
 *   targetIrr?: string | null
 *   stage?: string | null
 *   coachingFocus?: string | null
 *   reviewNotes?: string | null
 * }
 *
 * Response: { ok: true, deal: Deal }
 *
 * Notes:
 *   - We bump `updatedAt` on every successful patch.
 *   - Field semantics: passing `null` (or empty string) clears the optional
 *     field; passing `undefined` (omitting the key) leaves it unchanged.
 *   - We DO NOT let admins rewrite the property name, address, units, asking,
 *     NOI, or askingPrice — those are member-submitted facts and should be
 *     edited by the member, not the admin. Patching the underwriting metrics
 *     (YOC/IRR) is allowed because admins commonly fill those in for members
 *     who left them blank.
 */
export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return error('Method not allowed', 405);

  const session = await requireSession(req);
  if (!session) return error('Not authenticated', 401);
  if (!isAdminEmail(session.email)) return error('Forbidden', 403);

  let body: Body;
  try {
    body = await parseJsonBody<Body>(req);
  } catch {
    return error('Invalid JSON', 400);
  }

  const memberId = typeof body.memberId === 'string' ? body.memberId.trim() : '';
  const dealId = typeof body.dealId === 'string' ? body.dealId.trim() : '';
  if (!memberId) return error('memberId is required', 400);
  if (!dealId) return error('dealId is required', 400);

  const user = await getUserById(memberId);
  if (!user) return error('Member not found', 404);
  if (!user.deals?.length) return error('Member has no deals', 404);

  const idx = user.deals.findIndex((d) => d.id === dealId);
  if (idx < 0) return error('Deal not found', 404);
  const original = user.deals[idx];

  const patched: Deal = { ...original };

  if (body.status !== undefined) {
    if (!isValidStatus(body.status)) return error('Invalid status', 400);
    patched.status = body.status;
  }

  applyEditableString(patched, 'underwrittenYoc', body.underwrittenYoc, 40);
  applyEditableString(patched, 'targetIrr', body.targetIrr, 40);
  applyEditableString(patched, 'stage', body.stage, 80);
  applyEditableString(patched, 'coachingFocus', body.coachingFocus, 2000);
  applyEditableString(patched, 'reviewNotes', body.reviewNotes, 2000);

  patched.updatedAt = new Date().toISOString();

  const updatedUser: UserRecord = {
    ...user,
    deals: user.deals.map((d, i) => (i === idx ? patched : d)),
  };
  await saveUser(updatedUser);

  // ── Wave 14.3 · member notification ────────────────────────────
  // Detect the kind of change that just happened and fire a member
  // email if appropriate. Soft-fail: a Resend error never blocks
  // the persisted update from being saved. The admin can always
  // re-trigger the notification by editing again.
  const notifyMember = body.notifyMember !== false; // default true
  const kind = detectUpdateKind(original, patched);
  let notified = false;
  if (notifyMember && kind) {
    try {
      await sendDealUpdateEmail(kind, {
        to: user.email,
        memberName: user.name,
        dealName: patched.name,
        reviewNotes: patched.reviewNotes,
      });
      notified = true;
    } catch (err) {
      console.warn('[admin-update-deal] member notification failed', err);
    }
  }

  return json({ ok: true, deal: patched, notified, notificationKind: kind });
};

/**
 * Returns the kind of member-facing notification this update should trigger,
 * or null if no notification is appropriate.
 *
 * Priority — status flips beat note-only updates because they are the bigger
 * event from the member's perspective. If both happen in one save (admin
 * promotes to active AND adds notes), the `promoted_to_active` email is the
 * one that fires (and it includes the notes inline).
 *
 * Status flips that we DO NOT notify on:
 *   - submitted ↔ in_review · admin housekeeping, member doesn't care
 *   - any change with the same final status · no-op
 */
function detectUpdateKind(prev: Deal, next: Deal): DealUpdateKind | null {
  if (prev.status !== next.status) {
    if (next.status === 'active') return 'promoted_to_active';
    if (next.status === 'on_hold') return 'paused_on_hold';
    if (next.status === 'closed_won') return 'archived_won';
    if (next.status === 'closed_lost') return 'archived_lost';
    // submitted ↔ in_review changes — silent
    return null;
  }
  // Same status, but reviewNotes changed — only notify when status is active
  // and the notes are non-empty (clearing notes shouldn't email anyone).
  if (next.status === 'active') {
    const prevNotes = (prev.reviewNotes ?? '').trim();
    const nextNotes = (next.reviewNotes ?? '').trim();
    if (nextNotes && prevNotes !== nextNotes) {
      return 'notes_updated';
    }
  }
  return null;
}

interface Body {
  memberId?: string;
  dealId?: string;
  status?: DealStatus;
  underwrittenYoc?: string | null;
  targetIrr?: string | null;
  stage?: string | null;
  coachingFocus?: string | null;
  reviewNotes?: string | null;
  /**
   * Wave 14.3 · whether to email the member about this update. Defaults to
   * true. Admins can pass `false` to suppress (e.g. fixing a typo where the
   * member doesn't need to know).
   */
  notifyMember?: boolean;
}

const VALID_STATUSES: DealStatus[] = [
  'submitted',
  'in_review',
  'active',
  'on_hold',
  'closed_won',
  'closed_lost',
];

function isValidStatus(s: unknown): s is DealStatus {
  return typeof s === 'string' && VALID_STATUSES.includes(s as DealStatus);
}

/**
 * The subset of `Deal` keys this endpoint will let an admin patch as a free
 * string. Constrained to optional `string` fields only, so `delete` and
 * `assign` operations are type-safe under TS strict mode without casts.
 *
 * Property facts (name, address, units, askingPrice, underwrittenNoi, etc.)
 * are NOT in this list — those are member-attested and we don't want admins
 * silently rewriting them. Status is handled separately because it has its
 * own enum validation. Numeric fields would need a different helper.
 */
type EditableStringKey =
  | 'underwrittenYoc'
  | 'targetIrr'
  | 'stage'
  | 'coachingFocus'
  | 'reviewNotes';

/**
 * Applies an editable optional-string field on a Deal.
 *   undefined  → leave unchanged (key omitted from request)
 *   null / ''  → clear the field
 *   string     → trim, clamp to maxLen, assign
 */
function applyEditableString(
  target: Deal,
  key: EditableStringKey,
  value: string | null | undefined,
  maxLen: number,
): void {
  if (value === undefined) return;
  if (value === null || (typeof value === 'string' && value.trim() === '')) {
    delete target[key];
    return;
  }
  if (typeof value !== 'string') return;
  target[key] = value.trim().slice(0, maxLen);
}

export const config: Config = {
  path: '/api/admin/deals/update',
};
