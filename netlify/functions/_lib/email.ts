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
