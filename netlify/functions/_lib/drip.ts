/**
 * 12-week drip campaign for Multifamily Mastery members.
 *
 * Schedule (in days from `dripAnchorAt`):
 *   day  0 — welcome           (sent immediately when access is first granted)
 *   day  7 — w1  (Module 1 priming)
 *   day 14 — w2
 *   day 21 — w3
 *   ...
 *   day 84 — w12
 *   day 98 — capstone          (two weeks after Week 12 lands)
 *
 * The scheduled function (`scheduled-drip.ts`) runs daily, walks each member,
 * computes how many days they're past their anchor, and sends every drip whose
 * `dueDay` has passed and whose id is not yet in `user.dripSent`.
 *
 * Why a per-user `dripSent` map: idempotency. If the cron crashes mid-batch
 * or the function gets re-invoked, we don't double-send. Resend will also
 * dedupe at their layer if we accidentally try, but belt-and-braces.
 *
 * To customize copy: edit DRIP_ITEMS below. To shift the schedule: change
 * the `dueDay` numbers. The id strings are durable — don't rename them once
 * any user has received that drip.
 */

import { sendBrandedEmail, escapeHtmlForEmail, extractEmailAddress } from './email';
import { saveUser, type UserRecord } from './store';

/**
 * Two senders alternate across the 14-email arc — Lou and Diva — so members
 * hear from both partners over the program. Whichever persona is the From,
 * the other goes on CC, so both have visibility on every send and either
 * can respond if a member replies-all.
 *
 * Customize display names + reply-to addresses via env (see drip-related env
 * vars in the README). The actual sending email address is always pulled
 * from RESEND_FROM (since that's the verified domain Resend will let us
 * send from).
 */
export type SenderPersona = 'lou' | 'diva';

export interface DripItem {
  id: string;
  dueDay: number;
  /** Which partner is the visible From on this email. */
  senderPersona: SenderPersona;
  subject: string;
  /** A short pre-header / inbox preview line. */
  preheader: string;
  /** Eyebrow above the headline in the email body. */
  eyebrow: string;
  /** Headline — set in display serif. */
  headline: string;
  /** Lead paragraph. */
  lead: string;
  /** 2-4 short bullet points (this week's deliverables / focus). */
  bullets: string[];
  /** A single closer paragraph above the CTA. Optional. */
  closer?: string;
  /** CTA button label. */
  ctaLabel: string;
  /**
   * Path the CTA links to (relative). Combined with APP_URL at send time.
   * Default '/dashboard'.
   */
  ctaPath?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * 14-email schedule. Each is short, action-focused, and links back to the
 * platform. We don't replicate curriculum in email — emails create momentum;
 * the platform delivers the content.
 * ────────────────────────────────────────────────────────────────────────── */

const DRIP_ITEMS: DripItem[] = [
  {
    id: 'welcome',
    dueDay: 0,
    senderPersona: 'lou',
    subject: 'Welcome to Multifamily Mastery — start here',
    preheader:
      'Your 12-week operator program starts now. The first 20 minutes are the orientation.',
    eyebrow: 'Day 1 · welcome',
    headline: 'Welcome to Multifamily Mastery.',
    lead:
      'You now have access to the full 12-week program — twelve modules covering market selection, sourcing, underwriting, debt, capital raising, legal, due diligence, operations, and exit. Plus the orientation that ties it all together.',
    bullets: [
      'Spend 20 minutes today on the **Start Here** orientation. Six topics on how to get the most from each module, how to use the AI study coach, and what to do in your first 7 days.',
      'After the orientation, **pick a target market** before the end of the week — even tentatively. Every module reads sharper when anchored to a real MSA.',
      'Block weekly study time on your calendar. Members who treat it as a recurring meeting finish; those who don\u2019t, don\u2019t.',
    ],
    closer:
      'Email rescia@resciaproperties.com for any access or account questions, or lou@resciaproperties.com for program and curriculum questions. We aim to respond within one business day.',
    ctaLabel: 'Open the orientation',
    ctaPath: '/course/orientation',
  },
  {
    id: 'w1',
    dueDay: 7,
    senderPersona: 'diva',
    subject: 'Week 1 · MSA & Market Selection',
    preheader: 'This week: rank MSAs on real wages, jobs, households, and supply.',
    eyebrow: 'Week 1 · your move this week',
    headline: 'Pick a market you can defend in two sentences.',
    lead:
      'Module 1 introduces the four demand drivers and the data sources that replace CoStar. The deliverable for Week 1 isn\u2019t "I learned about MSAs." It\u2019s a tentative target market you can defend on real wages, jobs, household formation, and supply.',
    bullets: [
      'Read **Deep Dive** across two evenings. Don\u2019t crush it in one sitting.',
      'Take **Quiz Me** the next morning — overnight spacing is the point.',
      'Read **Common Mistakes** before you sit down to score markets in your shortlist.',
      'Pick a target MSA by Friday. Refine in Module 2.',
    ],
    ctaLabel: 'Open Week 1',
    ctaPath: '/course/w1-msa',
  },
  {
    id: 'w2',
    dueDay: 14,
    senderPersona: 'lou',
    subject: 'Week 2 · Submarket Intelligence',
    preheader: 'Zoom in: which neighborhoods inside your MSA actually hold rent?',
    eyebrow: 'Week 2 · your move this week',
    headline: 'Inside your MSA, find the submarkets that hold rent.',
    lead:
      'MSA-level metrics get you to the right metro. Submarket-level metrics decide whether your specific deal works. This week you build a tier list of submarkets inside the market you picked in Week 1, scored on the criteria that predict same-store NOI.',
    bullets: [
      'Build a 3-tier submarket map for your target MSA (avoid / consider / focus).',
      'Layer in school zones, crime, retail anchors, supply pipeline within 2 miles.',
      'By Friday, narrow your acquisition focus to 2-3 submarkets.',
    ],
    ctaLabel: 'Open Week 2',
    ctaPath: '/course/w2-submarket',
  },
  {
    id: 'w3',
    dueDay: 21,
    senderPersona: 'diva',
    subject: 'Week 3 · Deal Sourcing',
    preheader: 'On-market vs. off-market vs. broker relationships — the realistic mix.',
    eyebrow: 'Week 3 · your move this week',
    headline: 'Build the pipeline your underwriting will need.',
    lead:
      'Most first-time operators waste months on off-market direct outreach with no list discipline. Module 3 is the realistic mix: which broker relationships you cultivate first, what an on-market funnel actually returns, and when off-market is worth the dollar-cost.',
    bullets: [
      'Identify the 3 broker shops actively trading in your submarket(s).',
      'Set up CoStar/CREXi/MarketSpace alerts with your buy box.',
      'Fill the **Investor pipeline CRM** template with your first 10 broker contacts.',
    ],
    ctaLabel: 'Open Week 3',
    ctaPath: '/course/w3-sourcing',
  },
  {
    id: 'w4',
    dueDay: 28,
    senderPersona: 'lou',
    subject: 'Week 4 · Underwriting',
    preheader: 'Open the model. Run a real deal end-to-end.',
    eyebrow: 'Week 4 · your move this week',
    headline: 'Run the underwriting model on a real or hypothetical deal.',
    lead:
      'This is the module that makes the rest of the program tangible. You open the multi-tab Excel model, paste in a rent roll, normalize the T-12, and see what the deal does. Module 4 walks you through every assumption — and every assumption you should NOT trust.',
    bullets: [
      'Read Deep Dive over 2-3 evenings — it\u2019s the longest module.',
      'Open the **Underwriting model** (Excel) and run it on a target deal.',
      'Use the AI study coach to pressure-test sensitivities (DSCR, exit cap, expense ratio).',
    ],
    ctaLabel: 'Open Week 4',
    ctaPath: '/course/w4-underwriting',
  },
  {
    id: 'w5',
    dueDay: 35,
    senderPersona: 'diva',
    subject: 'Week 5 · Stress Testing & CapEx',
    preheader: 'What does the deal do when rates rise 150 bps and rent stalls?',
    eyebrow: 'Week 5 · your move this week',
    headline: 'Re-underwrite the same deal — under stress.',
    lead:
      'Module 5 is the most counter-intuitive in the program: you re-underwrite the deal you just modeled, but now under realistic adverse conditions. Rate shocks, cap rate expansion, expense overruns, lease-up risk. The deals that survive stress are the deals worth pursuing.',
    bullets: [
      'Open the **Stress test workbook** and run all five pre-built scenarios.',
      'Build a **CapEx tracker** for the deal — line-item by unit and common area.',
      'If the stressed IRR drops below your hurdle, kill or re-trade the deal.',
    ],
    ctaLabel: 'Open Week 5',
    ctaPath: '/course/w5-stress',
  },
  {
    id: 'w6',
    dueDay: 42,
    senderPersona: 'lou',
    subject: 'Week 6 · Debt Sourcing',
    preheader: 'Agency vs. bank vs. bridge — and what your DSCR actually allows.',
    eyebrow: 'Week 6 · your move this week',
    headline: 'Decide your debt strategy before you offer.',
    lead:
      'You\u2019re halfway through the program. Module 6 is debt — agency, bank, bridge, debt funds. Each has a different DSCR floor, prepayment penalty, and rate structure. The decision is rarely "best rate." It\u2019s "best fit for the business plan."',
    bullets: [
      'Identify the right debt product for your deal type and hold horizon.',
      'Get one indicative quote from a mortgage broker or agency lender.',
      'Plug the actual debt terms back into the underwriting model.',
    ],
    ctaLabel: 'Open Week 6',
    ctaPath: '/course/w6-debt',
  },
  {
    id: 'w7',
    dueDay: 49,
    senderPersona: 'diva',
    subject: 'Week 7 · LOI',
    preheader: 'The LOI tells the seller who you are — write it like a closer.',
    eyebrow: 'Week 7 · your move this week',
    headline: 'Draft a defensible LOI on your target deal.',
    lead:
      'Most first-time LOIs leak negotiating leverage. Module 7 walks through every line of the **LOI template** — the negotiable terms, the deliverables window, the financing contingency, the earnest money structure — and explains the seller\u2019s read of each one.',
    bullets: [
      'Open the **LOI template** and customize it to your deal.',
      'Decide your earnest money structure and DD timeline before you send.',
      'Have your real estate attorney review BEFORE submission, not after.',
    ],
    ctaLabel: 'Open Week 7',
    ctaPath: '/course/w7-loi',
  },
  {
    id: 'w8',
    dueDay: 56,
    senderPersona: 'lou',
    subject: 'Week 8 · Capital Raising',
    preheader: 'Build the investor pipeline now — your PPM is one module away.',
    eyebrow: 'Week 8 · your move this week',
    headline: 'Engage your securities attorney this week.',
    lead:
      'Module 8 is capital raising. The single most common mistake is waiting until Module 9 to engage a securities attorney. By then, you\u2019re writing the PPM with no counsel on retainer. Engage them this week so they have ramp-up time on your structure, market, and capital plan.',
    bullets: [
      'Engage a securities attorney with multifamily syndication experience.',
      'Build the **Investor pipeline CRM** with 25-50 prospect contacts.',
      'Define your offering structure — preferred return, GP/LP split, hurdles.',
    ],
    ctaLabel: 'Open Week 8',
    ctaPath: '/course/w8-capital',
  },
  {
    id: 'w9',
    dueDay: 63,
    senderPersona: 'diva',
    subject: 'Week 9 · PPM & Legal',
    preheader: 'The PPM outline is a starting point. Your attorney closes it.',
    eyebrow: 'Week 9 · your move this week',
    headline: 'Walk the PPM outline through with counsel.',
    lead:
      'Module 9 is the legal architecture of your offering — Reg D 506(b) vs. 506(c), accredited verification, blue-sky filings, the operating agreement. The **PPM outline** in the toolkit is a structural starting point; your securities attorney customizes and finalizes it.',
    bullets: [
      'Open the **PPM outline** and review with your securities attorney.',
      'Decide on 506(b) vs. 506(c) and document the rationale.',
      'Set up your accredited investor verification workflow.',
    ],
    ctaLabel: 'Open Week 9',
    ctaPath: '/course/w9-ppm',
  },
  {
    id: 'w10',
    dueDay: 70,
    senderPersona: 'lou',
    subject: 'Week 10 · PSA & Due Diligence',
    preheader: 'Every line of the PSA you negotiate. Every doc you collect in DD.',
    eyebrow: 'Week 10 · your move this week',
    headline: 'Lock the PSA. Run the DD checklist.',
    lead:
      'Module 10 is the contract phase. Every negotiable term in the **PSA**, every document you collect in **DD**, and the timing dance between the two. Most retrades happen in DD — Module 10 walks through the line items that warrant retrade and the ones that don\u2019t.',
    bullets: [
      'Use the **PSA + DD checklists** to organize the contract phase.',
      'Order title, survey, environmental, property condition reports.',
      'Build your DD finding log so retrade conversations are evidence-backed.',
    ],
    ctaLabel: 'Open Week 10',
    ctaPath: '/course/w10-psa-dd',
  },
  {
    id: 'w11',
    dueDay: 77,
    senderPersona: 'diva',
    subject: 'Week 11 · Property Management',
    preheader: 'Choose your PM in week 11, not week 14.',
    eyebrow: 'Week 11 · your move this week',
    headline: 'Hire your PM before close, not after.',
    lead:
      'Module 11 is property management — choosing one, onboarding one, and managing the relationship. The biggest first-deal mistake is waiting until after close to start the PM RFP process. By then you\u2019re in lease-up with no operations partner.',
    bullets: [
      'Send the **PM RFP** to 3 candidate property management firms.',
      'Reference-check at least 2 current owners per finalist.',
      'Sign the PM agreement at least 2 weeks before close.',
    ],
    ctaLabel: 'Open Week 11',
    ctaPath: '/course/w11-pm',
  },
  {
    id: 'w12',
    dueDay: 84,
    senderPersona: 'lou',
    subject: 'Week 12 · Exit & Reporting',
    preheader: 'You\u2019re at the finish. Plan the exit before you close.',
    eyebrow: 'Week 12 · your move this week',
    headline: 'Plan the exit on day one.',
    lead:
      'Final module. Module 12 is exit strategy and quarterly LP reporting. The thesis: your exit plan is set on day one of the hold, not month 36. Refi, sale, 1031, recap — each has different implications for the underwriting you finished in Module 4.',
    bullets: [
      'Open the **Distribution waterfall** and project LP and GP cash flows.',
      'Customize the **Quarterly LP report** template for your investor base.',
      'Document the exit plan in writing before close.',
    ],
    ctaLabel: 'Open Week 12',
    ctaPath: '/course/w12-exit',
  },
  {
    id: 'capstone',
    dueDay: 98,
    senderPersona: 'diva',
    subject: 'You finished the program — what\u2019s next',
    preheader:
      'You\u2019ve worked through all twelve modules. Bespoke coaching is open.',
    eyebrow: 'Capstone',
    headline: 'You\u2019ve finished Multifamily Mastery.',
    lead:
      'Twelve modules, fourteen weeks, a target market, a real underwriting model, a debt strategy, a capital plan, and the legal architecture for an offering. Most members tell us the program shifts from "I\u2019m studying" to "I\u2019m operating" somewhere around Module 6. If that has happened for you, the next layer is execution — and that\u2019s where bespoke coaching helps.',
    bullets: [
      'Revisit any module — the platform stays open for the life of your membership.',
      'Bring a real deal to a 1:1 coaching session for line-by-line review.',
      'Re-run the quizzes annually to keep the operator instincts sharp.',
    ],
    closer:
      'Reach out to lou@resciaproperties.com for coaching or strategy work, or rescia@resciaproperties.com for scheduling and renewals. We\u2019re both on this email.',
    ctaLabel: 'Open dashboard',
    ctaPath: '/dashboard',
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 * Send logic
 * ────────────────────────────────────────────────────────────────────────── */

const MS_PER_DAY = 86_400_000;

/** Days elapsed (floored) since the user's drip anchor. Returns null if no anchor. */
export function daysSinceAnchor(user: UserRecord, now: Date = new Date()): number | null {
  if (!user.dripAnchorAt) return null;
  const anchor = new Date(user.dripAnchorAt).getTime();
  if (!Number.isFinite(anchor)) return null;
  return Math.floor((now.getTime() - anchor) / MS_PER_DAY);
}

/** Returns the drip items that are due AND not yet sent for this user. */
export function dueDrips(user: UserRecord, now: Date = new Date()): DripItem[] {
  const days = daysSinceAnchor(user, now);
  if (days === null || days < 0) return [];
  const sent = user.dripSent || {};
  return DRIP_ITEMS.filter((item) => item.dueDay <= days && !sent[item.id]);
}

/**
 * Sends the welcome drip immediately. Used by access-grant flows so brand-new
 * members get an email within seconds of being granted access (rather than
 * waiting up to 24 hours for the next cron tick).
 */
export async function sendWelcomeNow(user: UserRecord): Promise<void> {
  const item = DRIP_ITEMS.find((i) => i.id === 'welcome');
  if (!item) return;
  if (user.dripSent?.welcome) return;
  await sendDripItem(user, item);
}

/**
 * Sends every due drip for a single user. Call from the daily cron.
 * Errors on individual sends are logged but do NOT abort the batch — the
 * unsent drips remain unsent in the user record and will be retried tomorrow.
 */
export async function runDripForUser(user: UserRecord): Promise<{
  attempted: number;
  sent: number;
  failed: number;
}> {
  const due = dueDrips(user);
  let sent = 0;
  let failed = 0;
  for (const item of due) {
    try {
      await sendDripItem(user, item);
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error('[drip] send failed', { user: user.email, drip: item.id, err });
    }
  }
  return { attempted: due.length, sent, failed };
}

async function sendDripItem(user: UserRecord, item: DripItem): Promise<void> {
  const firstName = (user.name || 'there').split(' ')[0] || 'there';
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
  const ctaPath = item.ctaPath || '/dashboard';
  const ctaUrl = appUrl ? `${appUrl}${ctaPath}` : ctaPath;

  const sender = senderProfile(item.senderPersona);
  const partner = senderProfile(item.senderPersona === 'lou' ? 'diva' : 'lou');

  await sendBrandedEmail({
    to: user.email,
    subject: item.subject,
    html: dripHtml(item, firstName, ctaUrl),
    text: dripText(item, firstName, ctaUrl),
    from: sender.fromLine,
    replyTo: sender.replyTo,
    cc: partner.replyTo,
  });

  // Mark sent BEFORE persisting so an exception during the persist step
  // doesn't leave us in an inconsistent state where the email shipped but
  // the record didn't capture it. If save fails, the cron will re-send on
  // the next tick — Resend deduplicates rapid duplicates within seconds at
  // their layer, but worst case the member sees one duplicate, never zero.
  user.dripSent = { ...(user.dripSent || {}), [item.id]: new Date().toISOString() };
  await saveUser(user);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Persona resolution. Each persona contributes a display name (the friendly
 * part of the From line) and a reply-to address. The actual sending address
 * is always pulled from RESEND_FROM (the verified domain Resend lets us send
 * from), so personas just override the visible "name" portion.
 *
 * Env var overrides (all optional):
 *   DRIP_FROM_NAME_LOU      e.g. "Lou — Rescia Properties"
 *   DRIP_FROM_NAME_DIVA     e.g. "Diva — Rescia Properties"
 *   DRIP_REPLY_TO_LOU       e.g. "lou@resciaproperties.com"
 *   DRIP_REPLY_TO_DIVA      e.g. "rescia@resciaproperties.com"
 *
 * The CC for each send is the OTHER persona's reply-to — so members hear from
 * one of us and the other is silently looped in for visibility.
 * ────────────────────────────────────────────────────────────────────────── */

interface SenderProfile {
  /** The full From line: `"Display Name <verified@domain>"`. */
  fromLine: string;
  /** The reply-to address for this persona. */
  replyTo: string;
}

function senderProfile(persona: SenderPersona): SenderProfile {
  // The verified sending address is always RESEND_FROM. Personas only swap
  // the friendly display name portion. If RESEND_FROM isn't set we fall back
  // to a sensible default — the actual send will fail loudly elsewhere.
  const baseFrom = process.env.RESEND_FROM || 'no-reply@mail.resciaproperties.com';
  const sendingAddress = extractEmailAddress(baseFrom);

  if (persona === 'lou') {
    const displayName =
      process.env.DRIP_FROM_NAME_LOU || 'Lou Lopez — Rescia Properties';
    const replyTo = process.env.DRIP_REPLY_TO_LOU || 'lou@resciaproperties.com';
    return {
      fromLine: `${displayName} <${sendingAddress}>`,
      replyTo,
    };
  }
  // diva
  const displayName =
    process.env.DRIP_FROM_NAME_DIVA || 'Diva Lopez — Rescia Properties';
  const replyTo = process.env.DRIP_REPLY_TO_DIVA || 'rescia@resciaproperties.com';
  return {
    fromLine: `${displayName} <${sendingAddress}>`,
    replyTo,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Email template — same brand vocabulary as the password reset email
 * (cream background, navy heading, gold accent rule, JetBrains eyebrow).
 * Keeps Multifamily Mastery transactional + lifecycle email visually consistent.
 * ────────────────────────────────────────────────────────────────────────── */

function dripHtml(item: DripItem, firstName: string, ctaUrl: string): string {
  const bullets = item.bullets
    .map(
      (b) =>
        `<li style="margin:0 0 10px;font-size:15px;line-height:1.55;color:#4a4a52;">${markdownLite(
          b
        )}</li>`
    )
    .join('');
  const closer = item.closer
    ? `<tr><td style="padding:0 40px 24px 40px;"><p style="font-size:14px;line-height:1.55;color:#4a4a52;margin:0;">${markdownLite(
        item.closer
      )}</p></td></tr>`
    : '';
  return /* html */ `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtmlForEmail(item.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#faf7f2;font-family:Inter,Arial,sans-serif;color:#1a1a1a;">
    <span style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;color:#faf7f2;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${escapeHtmlForEmail(item.preheader)}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e6dfd2;border-radius:4px;overflow:hidden;">
            <tr>
              <td style="height:2px;background:linear-gradient(90deg,#b8945a 0%,#d4b176 50%,#b8945a 100%);font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:40px 40px 8px 40px;">
                <div style="font-family:'JetBrains Mono',Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a6f3f;">
                  ${escapeHtmlForEmail(item.eyebrow)}
                </div>
                <h1 style="font-family:'Playfair Display',Georgia,serif;font-weight:500;color:#0f1e3d;font-size:26px;line-height:1.25;margin:14px 0 0;">
                  ${escapeHtmlForEmail(item.headline)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 0 40px;">
                <p style="font-size:15px;line-height:1.6;color:#4a4a52;margin:0 0 16px;">
                  Hi ${escapeHtmlForEmail(firstName)},
                </p>
                <p style="font-size:15px;line-height:1.6;color:#4a4a52;margin:0 0 18px;">
                  ${markdownLite(item.lead)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 8px 40px;">
                <ul style="padding:0 0 0 20px;margin:0 0 18px;">
                  ${bullets}
                </ul>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 24px 40px;">
                <a href="${escapeHtmlForEmail(
                  ctaUrl
                )}" style="display:inline-block;background:#0f1e3d;color:#faf7f2;text-decoration:none;padding:14px 26px;border-radius:2px;font-size:15px;letter-spacing:0.01em;">
                  ${escapeHtmlForEmail(item.ctaLabel)}
                </a>
              </td>
            </tr>
            ${closer}
            <tr>
              <td style="padding:20px 40px;background:#f4efe6;border-top:1px solid #e6dfd2;">
                <p style="font-size:11px;line-height:1.55;color:#8a8a92;letter-spacing:0.04em;margin:0;">
                  Rescia Properties &middot; Multifamily Mastery &middot; &copy; ${new Date().getFullYear()}
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

function dripText(item: DripItem, firstName: string, ctaUrl: string): string {
  const bullets = item.bullets.map((b) => '  - ' + stripMarkdownLite(b)).join('\n');
  const closer = item.closer ? '\n\n' + stripMarkdownLite(item.closer) : '';
  return [
    `${item.eyebrow.toUpperCase()}`,
    '',
    item.headline,
    '',
    `Hi ${firstName},`,
    '',
    stripMarkdownLite(item.lead),
    '',
    bullets,
    '',
    `${item.ctaLabel}: ${ctaUrl}`,
    closer,
    '',
    '— Rescia Properties · Multifamily Mastery',
  ].join('\n');
}

/** Renders **bold** as <strong> for HTML emails. Otherwise escapes. */
function markdownLite(s: string): string {
  // Escape first, then re-introduce bold spans. Order matters.
  const escaped = escapeHtmlForEmail(s);
  return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#0f1e3d;">$1</strong>');
}

/** Strips **bold** markers for plain-text fallback. */
function stripMarkdownLite(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1');
}

/** Exposed for tests / admin tooling. */
export const __DRIP_ITEMS_FOR_INSPECTION = DRIP_ITEMS;
