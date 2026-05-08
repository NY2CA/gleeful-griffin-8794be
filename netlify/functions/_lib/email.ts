/**
 * Resend-backed transactional email.
 *
 * We hit the Resend REST API directly so we don't pull in another SDK on the
 * functions runtime. Docs: https://resend.com/docs/api-reference/emails/send-email
 *
 * Required env vars (set in Netlify site settings):
 *   RESEND_API_KEY   e.g. re_xxxxxxxx
 *   RESEND_FROM      e.g. "Rescia Properties <no-reply@mail.resciaproperties.com>"
 *                    (the domain must be verified in your Resend account)
 *   APP_URL          e.g. https://members.resciaproperties.com
 *                    (used to build absolute links inside emails)
 *
 * sendPasswordResetEmail() returns silently on success. On failure it logs
 * and throws — callers should decide whether to surface that to the client.
 * The forgot-password endpoint deliberately swallows errors so we don't
 * leak whether the address is registered.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

interface ResendPayload {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function resendSend(payload: ResendPayload): Promise<void> {
  const apiKey = getEnv('RESEND_API_KEY');
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
}

/**
 * Generic Resend send used by the drip sequence. If `from` is omitted, falls
 * back to the RESEND_FROM env var. Throws on non-2xx so the caller can mark
 * the drip as un-sent and retry on the next cron tick.
 */
export async function sendBrandedEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}): Promise<void> {
  const from = input.from || getEnv('RESEND_FROM');
  await resendSend({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    reply_to: input.replyTo,
    cc: input.cc,
    bcc: input.bcc,
  });
}

/**
 * Returns just the `<address>` portion of a Resend From string. Useful when
 * you want to keep the verified sender address but swap the display name
 * (e.g. "Lou — Rescia Properties <no-reply@mail.resciaproperties.com>").
 */
export function extractEmailAddress(fromString: string): string {
  const match = fromString.match(/<([^>]+)>/);
  return match ? match[1] : fromString.trim();
}

/** HTML escape — exposed so drip.ts doesn't have to re-implement it. */
export function escapeHtmlForEmail(s: string): string {
  return escapeHtml(s);
}

export interface PasswordResetEmailInput {
  to: string;
  name: string;
  resetUrl: string;
  /** Minutes until the link expires. Default 30. */
  expiresInMinutes?: number;
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
  const from = getEnv('RESEND_FROM');
  const expires = input.expiresInMinutes ?? 30;
  const firstName = input.name.split(' ')[0] || 'there';

  await resendSend({
    from,
    to: input.to,
    subject: 'Reset your Multifamily Mastery password',
    html: resetEmailHtml({ firstName, resetUrl: input.resetUrl, expires }),
    text: resetEmailText({ firstName, resetUrl: input.resetUrl, expires }),
  });
}

interface ResetEmailVars {
  firstName: string;
  resetUrl: string;
  expires: number;
}

function resetEmailHtml({ firstName, resetUrl, expires }: ResetEmailVars): string {
  // Inline styles only — many email clients strip <style> tags.
  return /* html */ `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Reset your password</title>
  </head>
  <body style="margin:0;padding:0;background:#faf7f2;font-family:Inter,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e6dfd2;border-radius:4px;overflow:hidden;">
            <tr>
              <td style="height:2px;background:linear-gradient(90deg,#b8945a 0%,#d4b176 50%,#b8945a 100%);font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:40px 40px 16px 40px;">
                <div style="font-family:'JetBrains Mono',Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a6f3f;">
                  Rescia Properties &middot; Members
                </div>
                <h1 style="font-family:'Playfair Display',Georgia,serif;font-weight:500;color:#0f1e3d;font-size:28px;line-height:1.2;margin:16px 0 0;">
                  Reset your password
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 8px 40px;">
                <p style="font-size:15px;line-height:1.55;color:#4a4a52;margin:0 0 16px;">
                  Hi ${escapeHtml(firstName)},
                </p>
                <p style="font-size:15px;line-height:1.55;color:#4a4a52;margin:0 0 16px;">
                  We received a request to reset the password on your Multifamily Mastery account.
                  Click the button below to choose a new one. The link expires in ${expires} minutes.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 8px 40px;">
                <a href="${resetUrl}" style="display:inline-block;background:#0f1e3d;color:#faf7f2;text-decoration:none;padding:16px 28px;border-radius:2px;font-size:15px;letter-spacing:0.01em;">
                  Reset password
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <p style="font-size:13px;line-height:1.55;color:#8a8a92;margin:0 0 12px;">
                  Or paste this URL into your browser:
                </p>
                <p style="font-size:12px;line-height:1.55;color:#4a4a52;word-break:break-all;margin:0 0 24px;">
                  ${escapeHtml(resetUrl)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 32px 40px;border-top:1px solid #e6dfd2;">
                <p style="font-size:12px;line-height:1.55;color:#8a8a92;margin:24px 0 0;">
                  If you didn&rsquo;t request this, you can safely ignore this email &mdash; your
                  password won&rsquo;t change until someone follows the link above and sets a
                  new one.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px;background:#f4efe6;border-top:1px solid #e6dfd2;">
                <p style="font-size:11px;line-height:1.55;color:#8a8a92;letter-spacing:0.04em;margin:0;">
                  Private &amp; Confidential &middot; Rescia Properties, LLC &middot; &copy; ${new Date().getFullYear()}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function resetEmailText({ firstName, resetUrl, expires }: ResetEmailVars): string {
  return [
    `Hi ${firstName},`,
    '',
    'We received a request to reset the password on your Multifamily Mastery account.',
    `Use the link below to choose a new one. It expires in ${expires} minutes.`,
    '',
    resetUrl,
    '',
    'If you didn\u2019t request this, you can safely ignore this email.',
    '',
    '— Rescia Properties · Private & Confidential',
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build the reset URL we include in the email. Uses APP_URL if set, otherwise
 * falls back to the origin of the request that triggered the forgot flow.
 */
export function buildResetUrl(token: string, fallbackOrigin?: string): string {
  const base =
    process.env.APP_URL ||
    fallbackOrigin ||
    '';
  if (!base) throw new Error('APP_URL is not set and no request origin was provided');
  return `${base.replace(/\/$/, '')}/reset?token=${encodeURIComponent(token)}`;
}

// ─────────────────────────────────────────────────────────────────────
// Mastery Live · Wave 14.3 · Member-facing deal-update notifications
// ─────────────────────────────────────────────────────────────────────

/**
 * The kind of admin action that just happened on a deal — drives subject
 * line + body copy. Triggered from /api/admin/deals/update when a status
 * flip or review-notes change is detected.
 *
 *   promoted_to_active  · status went to 'active' from anything else
 *   notes_updated       · status is 'active' AND reviewNotes changed
 *   paused_on_hold      · status went to 'on_hold'
 *   archived_won        · status went to 'closed_won'
 *   archived_lost       · status went to 'closed_lost'
 *
 * Note: 'submitted' and 'in_review' are intermediate admin states that the
 * member never sees emails for — only terminal-ish transitions trigger.
 */
export type DealUpdateKind =
  | 'promoted_to_active'
  | 'notes_updated'
  | 'paused_on_hold'
  | 'archived_won'
  | 'archived_lost';

export interface DealUpdateEmailInput {
  to: string;
  /** Member's display name. We strip to first name. */
  memberName: string;
  /** Property name (e.g. "Garland · 142-unit Class B"). */
  dealName: string;
  /** Optional review notes — only included for `promoted_to_active` and `notes_updated`. */
  reviewNotes?: string;
  /** Optional bcc to admins so Diva/Lou see what got sent (defaults to ADMIN_EMAILS). */
  ccAdmins?: boolean;
}

/**
 * Sends a transactional email to the member about a status change on their
 * deal. The five `DealUpdateKind` variants all share the same brand chrome —
 * what changes is the eyebrow, headline, body, and CTA label.
 *
 * Errors are thrown — caller (admin-update-deal) should soft-fail so the
 * persisted status change is never lost over a flaky email step.
 */
export async function sendDealUpdateEmail(
  kind: DealUpdateKind,
  input: DealUpdateEmailInput,
): Promise<void> {
  const from = getEnv('RESEND_FROM');
  const firstName = (input.memberName || '').split(' ')[0] || 'there';
  const dashboardUrl = (process.env.APP_URL || '').replace(/\/$/, '') + '/dashboard';
  const submitUrl = (process.env.APP_URL || '').replace(/\/$/, '') + '/submit-deal';

  const copy = dealUpdateCopy(kind, input.dealName);
  const ctaUrl = copy.ctaUrl === 'submit' ? submitUrl : dashboardUrl;

  const html = dealUpdateHtml({
    eyebrow: copy.eyebrow,
    headline: copy.headline,
    firstName,
    body: copy.body,
    ctaLabel: copy.ctaLabel,
    ctaUrl,
    reviewNotes: kind === 'promoted_to_active' || kind === 'notes_updated' ? input.reviewNotes : undefined,
  });
  const text = dealUpdateText({
    firstName,
    body: copy.body,
    ctaLabel: copy.ctaLabel,
    ctaUrl,
    reviewNotes: kind === 'promoted_to_active' || kind === 'notes_updated' ? input.reviewNotes : undefined,
  });

  // Optionally bcc admins so they have a record. Default true — Lou/Diva like
  // having the receipt in their inbox.
  const bcc =
    input.ccAdmins !== false
      ? (process.env.ADMIN_EMAILS || '')
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean)
      : undefined;

  await resendSend({
    from,
    to: input.to,
    subject: copy.subject,
    html,
    text,
    bcc: bcc && bcc.length ? bcc : undefined,
  });
}

interface DealUpdateCopy {
  eyebrow: string;
  subject: string;
  headline: string;
  body: string;
  ctaLabel: string;
  /** Either `dashboard` (default) or `submit` — picks which URL to wire to the CTA. */
  ctaUrl: 'dashboard' | 'submit';
}

function dealUpdateCopy(kind: DealUpdateKind, dealName: string): DealUpdateCopy {
  switch (kind) {
    case 'promoted_to_active':
      return {
        eyebrow: 'Mastery Live · Coaching update',
        subject: `Your deal is now active in coaching · ${dealName}`,
        headline: `${dealName} is active in coaching.`,
        body:
          'We reviewed your underwriting and the deal is now live on your dashboard. ' +
          'Notes from Diva and Lou are below — open the dashboard for the full record.',
        ctaLabel: 'Open dashboard',
        ctaUrl: 'dashboard',
      };
    case 'notes_updated':
      return {
        eyebrow: 'Mastery Live · New notes',
        subject: `New notes on ${dealName}`,
        headline: `New notes on ${dealName}.`,
        body:
          'Diva and Lou added new notes on your deal. ' +
          'Take a look before our next coaching call.',
        ctaLabel: 'Read the notes',
        ctaUrl: 'dashboard',
      };
    case 'paused_on_hold':
      return {
        eyebrow: 'Mastery Live · On hold',
        subject: `Pausing ${dealName}`,
        headline: `${dealName} is on hold.`,
        body:
          'Marked as on-hold so it stops competing for attention on your dashboard. ' +
          'Reach out when you want to pick it back up — happy to walk it again.',
        ctaLabel: 'View dashboard',
        ctaUrl: 'dashboard',
      };
    case 'archived_won':
      return {
        eyebrow: 'Mastery Live · Closed won',
        subject: `${dealName} · Closed won`,
        headline: `Congrats on closing ${dealName}.`,
        body:
          'Marked closed-won. We will keep this in your history. ' +
          'When you are ready for the next one, submit it and we will line it up.',
        ctaLabel: 'Submit your next deal',
        ctaUrl: 'submit',
      };
    case 'archived_lost':
      return {
        eyebrow: 'Mastery Live · Closed',
        subject: `${dealName} · Closed`,
        headline: `${dealName} is closed.`,
        body:
          'Marked closed. Whether you walked or it walked from you, the next one is in front of you. ' +
          'Diva or Lou will note any takeaways at the next coaching call.',
        ctaLabel: 'Submit your next deal',
        ctaUrl: 'submit',
      };
  }
}

interface DealUpdateHtmlVars {
  eyebrow: string;
  headline: string;
  firstName: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  reviewNotes?: string;
}

function dealUpdateHtml(v: DealUpdateHtmlVars): string {
  const notesBlock = v.reviewNotes
    ? `
            <tr>
              <td style="padding:8px 40px 0 40px;">
                <div style="background:#f4efe6;border-left:3px solid #b8945a;padding:16px 18px;border-radius:2px;">
                  <div style="font-family:'JetBrains Mono',Menlo,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#8a6f3f;margin-bottom:6px;">
                    Notes from Diva and Lou
                  </div>
                  <p style="font-size:14px;line-height:1.6;color:#1a1a1a;margin:0;white-space:pre-wrap;">
                    ${escapeHtml(v.reviewNotes)}
                  </p>
                </div>
              </td>
            </tr>`
    : '';

  return /* html */ `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(v.headline)}</title>
  </head>
  <body style="margin:0;padding:0;background:#faf7f2;font-family:Inter,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e6dfd2;border-radius:4px;overflow:hidden;">
            <tr>
              <td style="height:2px;background:linear-gradient(90deg,#b8945a 0%,#d4b176 50%,#b8945a 100%);font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:36px 40px 12px 40px;">
                <div style="font-family:'JetBrains Mono',Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a6f3f;">
                  ${escapeHtml(v.eyebrow)}
                </div>
                <h1 style="font-family:'Playfair Display',Georgia,serif;font-weight:500;color:#0f1e3d;font-size:26px;line-height:1.25;margin:14px 0 0;">
                  ${escapeHtml(v.headline)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 8px 40px;">
                <p style="font-size:15px;line-height:1.55;color:#4a4a52;margin:18px 0 16px;">
                  Hi ${escapeHtml(v.firstName)},
                </p>
                <p style="font-size:15px;line-height:1.6;color:#1a1a1a;margin:0 0 4px;">
                  ${escapeHtml(v.body)}
                </p>
              </td>
            </tr>
            ${notesBlock}
            <tr>
              <td style="padding:24px 40px 8px 40px;">
                <a href="${v.ctaUrl}" style="display:inline-block;background:#0f1e3d;color:#faf7f2;text-decoration:none;padding:14px 24px;border-radius:2px;font-size:14px;letter-spacing:0.01em;">
                  ${escapeHtml(v.ctaLabel)}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <p style="font-size:12px;line-height:1.55;color:#8a8a92;margin:0 0 24px;">
                  Replying to this email goes straight to coaching.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px;background:#f4efe6;border-top:1px solid #e6dfd2;">
                <p style="font-size:11px;line-height:1.55;color:#8a8a92;letter-spacing:0.04em;margin:0;">
                  Mastery Live · Rescia Properties, LLC · &copy; ${new Date().getFullYear()}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Plain-text alternative for the deal-update email. Doesn't render the
 * eyebrow or headline (those are visual chrome for the HTML version), so
 * the parameter type omits them. Lets the call site avoid passing dead
 * data while still type-checking strictly.
 */
function dealUpdateText(v: Omit<DealUpdateHtmlVars, 'eyebrow' | 'headline'>): string {
  const lines = [
    `Hi ${v.firstName},`,
    '',
    v.body,
  ];
  if (v.reviewNotes) {
    lines.push('', '— Notes from Diva and Lou —', '', v.reviewNotes);
  }
  lines.push('', `${v.ctaLabel}: ${v.ctaUrl}`, '', '— Mastery Live · Rescia Properties');
  return lines.join('\n');
}
