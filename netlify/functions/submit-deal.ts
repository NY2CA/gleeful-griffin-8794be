import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import {
  getUserById,
  saveUser,
  newDealId,
  type Deal,
  type UserRecord,
} from './_lib/store';
import { sendBrandedEmail, escapeHtmlForEmail } from './_lib/email';
import { json, error, handleOptions } from './_lib/response';

/**
 * POST /api/submit-deal · Mastery Live · Wave 14.1
 *
 * Captures a member's deal submission and notifies Diva and Lou via Resend.
 *
 * Auth: requires a valid session (any logged-in member can submit). Gating
 * on Live cohort vs admin is handled at the dashboard surface; this endpoint
 * accepts submissions and lets the admin review filter at /admin/deals.
 *
 * Request body:
 * {
 *   name: string                  (required · "Garland 142-unit Class B")
 *   address?: string
 *   units?: number
 *   assetClass?: string
 *   askingPrice?: number
 *   underwrittenNoi?: number
 *   underwrittenYoc?: string      ("7.4%")
 *   targetIrr?: string            ("17.2%")
 *   stage?: string                ("pre-LOI", "in LOI", "in DD", "PSA")
 *   coachingFocus?: string        (free-text · what the member wants help with)
 * }
 *
 * Response:
 * { ok: true, deal: Deal }
 *
 * Side effect: sends an HTML email to ADMIN_EMAILS with submission details
 * so Diva/Lou can review before the next coaching call.
 */
export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return error('Method not allowed', 405);

  const claims = await requireSession(req);
  if (!claims) return error('Unauthorized', 401);

  // Parse + validate body
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return error('Invalid JSON', 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return error('Property name is required', 400);
  if (name.length > 200) return error('Property name too long', 400);

  // Optional fields — coerce + clamp
  const optionalString = (v: unknown, max = 500): string | undefined => {
    if (typeof v !== 'string') return undefined;
    const t = v.trim();
    if (!t) return undefined;
    return t.slice(0, max);
  };
  const optionalNumber = (v: unknown): number | undefined => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim()) {
      const n = Number(v.replace(/[$,]/g, ''));
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  // Pull current user record
  const user = await getUserById(claims.sub);
  if (!user) return error('User not found', 404);

  const now = new Date().toISOString();
  const deal: Deal = {
    id: newDealId(),
    submittedAt: now,
    updatedAt: now,
    status: 'submitted',
    name,
    address: optionalString(body.address),
    units: optionalNumber(body.units),
    assetClass: optionalString(body.assetClass, 80),
    askingPrice: optionalNumber(body.askingPrice),
    underwrittenNoi: optionalNumber(body.underwrittenNoi),
    underwrittenYoc: optionalString(body.underwrittenYoc, 40),
    targetIrr: optionalString(body.targetIrr, 40),
    stage: optionalString(body.stage, 80),
    coachingFocus: optionalString(body.coachingFocus, 2000),
  };

  // Append to user's deals (most recent last; dashboard sorts by updatedAt)
  const updated: UserRecord = {
    ...user,
    deals: [...(user.deals ?? []), deal],
  };
  await saveUser(updated);

  // Notify Diva and Lou via Resend. Soft-fail: if email fails, the deal
  // record is still saved — admin can still review via /admin/deals.
  try {
    await notifyAdminsOfSubmission(updated, deal);
  } catch (err) {
    console.warn('[submit-deal] Resend notification failed', err);
  }

  return json({ ok: true, deal });
};

async function notifyAdminsOfSubmission(user: UserRecord, deal: Deal): Promise<void> {
  const adminList = (process.env.ADMIN_EMAILS || '').trim();
  if (!adminList) return; // No admins configured — silently skip.

  const recipients = adminList
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  if (!recipients.length) return;

  const subject = `Mastery Live · New deal submission · ${deal.name}`;
  const fmt = (label: string, value: string | number | undefined) =>
    value === undefined || value === '' || value === null
      ? ''
      : `<tr><td style="padding:6px 14px 6px 0;color:#4a4a52;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;vertical-align:top;">${escapeHtmlForEmail(
          label
        )}</td><td style="padding:6px 0;color:#1a1a1a;font-size:14px;line-height:1.5;">${escapeHtmlForEmail(
          String(value)
        )}</td></tr>`;
  const dollar = (n: number | undefined) =>
    n === undefined ? undefined : '$' + n.toLocaleString();

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:32px 16px;background:#faf7f2;font-family:Inter,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6dfd2;border-radius:4px;padding:32px;">
    <div style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#b8945a;margin-bottom:8px;">Mastery Live · Deal submission</div>
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#0f1e3d;margin:0 0 6px;font-weight:500;">${escapeHtmlForEmail(deal.name)}</h2>
    <p style="color:#4a4a52;font-size:13px;margin:0 0 24px;">Submitted by <strong>${escapeHtmlForEmail(user.name)}</strong> · ${escapeHtmlForEmail(user.email)}</p>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border-top:1px solid #e6dfd2;border-bottom:1px solid #e6dfd2;margin-bottom:20px;">
      ${fmt('Address', deal.address)}
      ${fmt('Units', deal.units)}
      ${fmt('Asset class', deal.assetClass)}
      ${fmt('Asking price', dollar(deal.askingPrice))}
      ${fmt('Stage', deal.stage)}
      ${fmt('Underwritten NOI', dollar(deal.underwrittenNoi))}
      ${fmt('Underwritten YOC', deal.underwrittenYoc)}
      ${fmt('Target IRR', deal.targetIrr)}
    </table>
    ${
      deal.coachingFocus
        ? `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8a6f3f;margin-bottom:6px;">Coaching focus</div><p style="color:#1a1a1a;font-size:14px;line-height:1.55;margin:0 0 24px;white-space:pre-wrap;">${escapeHtmlForEmail(deal.coachingFocus)}</p>`
        : ''
    }
    <p style="color:#4a4a52;font-size:13px;line-height:1.55;margin:0;">Review at <a href="${process.env.APP_URL || 'https://app.example.com'}/admin/deals" style="color:#0f1e3d;">/admin/deals</a> · promote to active to surface on member's dashboard.</p>
  </div>
</body>
</html>`;

  const text = [
    `Mastery Live · New deal submission`,
    ``,
    `Property: ${deal.name}`,
    deal.address ? `Address: ${deal.address}` : '',
    `Submitted by: ${user.name} (${user.email})`,
    ``,
    deal.units !== undefined ? `Units: ${deal.units}` : '',
    deal.assetClass ? `Asset class: ${deal.assetClass}` : '',
    deal.askingPrice !== undefined ? `Asking: $${deal.askingPrice.toLocaleString()}` : '',
    deal.stage ? `Stage: ${deal.stage}` : '',
    deal.underwrittenNoi !== undefined
      ? `Underwritten NOI: $${deal.underwrittenNoi.toLocaleString()}`
      : '',
    deal.underwrittenYoc ? `Underwritten YOC: ${deal.underwrittenYoc}` : '',
    deal.targetIrr ? `Target IRR: ${deal.targetIrr}` : '',
    deal.coachingFocus ? `\nCoaching focus:\n${deal.coachingFocus}` : '',
    ``,
    `Review at ${process.env.APP_URL || ''}/admin/deals`,
  ]
    .filter(Boolean)
    .join('\n');

  await sendBrandedEmail({
    to: recipients[0],
    cc: recipients.slice(1),
    replyTo: user.email,
    subject,
    html,
    text,
  });
}

export const config: Config = {
  path: '/api/submit-deal',
};
