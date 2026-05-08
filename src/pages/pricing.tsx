import Link from 'next/link';
import Card from '@/components/Card';
import { useAuth } from '@/hooks/useAuth';

/**
 * Mastery Site · /pricing — the public ladder
 *
 * Wave 15.1 · restructured from the legacy Monthly/Annual/Lifetime grid into
 * the three-tier story that matches the rest of Rescia Properties' offering:
 *
 *   1. Foundations  · $99      · multifamily basics for first-time investors
 *   2. Self-Study   · $1,997   · the full 12-week curriculum, self-paced
 *   3. Mastery Live · by inquiry · curriculum + ongoing monthly coaching
 *
 * Each card hands off to the right destination:
 *   - Foundations → external Foundations site
 *   - Self-Study  → external Self-Study site
 *   - Live        → strategy-call form on the landing page (replaceable with
 *                   a Calendly URL via the STRATEGY_CALL_URL constant)
 *
 * The page deliberately doesn't run Stripe checkout from the UI — Foundations
 * and Self-Study handle their own checkout on their own sites; Live is sold
 * on a strategy call. That decoupling keeps the pricing page a pure routing
 * surface.
 */

// ──────────────────────────────────────────────────────────────────
// Configuration · these three URLs control where each card sends
// the visitor. Update in one place when domains change. The Live CTA
// can swap to a Calendly URL the day you have one — every other change
// is a content tweak in the PLANS array.
// ──────────────────────────────────────────────────────────────────

const FOUNDATIONS_URL = 'https://foundations.resciaproperties.com';
const SELFSTUDY_URL   = 'https://selfstudy.resciaproperties.com';
/** Strategy-call CTA target. Mastery Live is sold by inquiry — the Calendly
 *  page captures name/email at booking, and Diva/Lou get the slot. Mirrored
 *  in src/pages/index.tsx so all "Book Strategy Call" CTAs go to the same
 *  place. */
const STRATEGY_CALL_URL = 'https://calendly.com/mastery-live-strategy-call';

interface PlanCard {
  id: 'foundations' | 'self-study' | 'live';
  eyebrow: string;
  label: string;
  price: string;
  cadence: string;
  blurb: string;
  bullets: string[];
  ctaLabel: string;
  ctaUrl: string;
  ctaExternal: boolean;
  highlight?: boolean;
}

const PLANS: PlanCard[] = [
  {
    id: 'foundations',
    eyebrow: 'Start here',
    label: 'Foundations',
    price: '$99',
    cadence: 'one-time',
    blurb:
      'Multifamily basics for first-time investors. Six self-paced modules in Diva’s voice — terminology, market analysis, and the math behind returns.',
    bullets: [
      'Six modules · ~10 hours of focused content',
      'Self-paced, lifetime access',
      'Glossary, returns calculator, deal anatomy',
      'Self-assessment + module one-pagers',
      'Upgrade credit toward Self-Study available',
    ],
    ctaLabel: 'Start with Foundations →',
    ctaUrl: FOUNDATIONS_URL,
    ctaExternal: true,
  },
  {
    id: 'self-study',
    eyebrow: 'Most popular',
    label: 'Mastery · Self-Study',
    price: '$1,997',
    cadence: 'one-time',
    blurb:
      'The full twelve-week Multifamily Mastery curriculum, self-paced. Underwriting models, legal templates, and the same playbook Lou uses on live deals.',
    bullets: [
      'Twelve modules · ~60 hours of focused content',
      'Excel underwriting + LOI + PPM outline included',
      'Quiz + common-mistakes library per module',
      'Lifetime access · all future updates included',
      'Coaching not included — add it via Mastery Live',
    ],
    ctaLabel: 'Enroll in Self-Study →',
    ctaUrl: SELFSTUDY_URL,
    ctaExternal: true,
    highlight: true,
  },
  {
    id: 'live',
    eyebrow: 'Coaching tier',
    label: 'Mastery Live',
    price: 'By inquiry',
    cadence: 'application',
    blurb:
      'The full curriculum plus ongoing monthly coaching with Diva Rescia and Lou Lopez. Submit deals for review; we work them with you call by call.',
    bullets: [
      'Everything in Self-Study',
      'Ongoing monthly coaching with Diva and Lou',
      'Submit deals through the member dashboard for review',
      'Diva and Lou pressure-test your underwriting and notes',
      'Selective enrollment via free 30-minute strategy call',
    ],
    ctaLabel: 'Book a strategy call →',
    ctaUrl: STRATEGY_CALL_URL,
    ctaExternal: true,
  },
];

export default function PricingPage() {
  const { user, loading: authLoading } = useAuth();

  return (
    <main className="page">
      <div className="container grid gap-12">
        {/* ─── Header ──────────────────────────────────────────── */}
        <div className="section-head text-center" style={{ marginBottom: 0 }}>
          <span className="eyebrow">Pricing</span>
          <h1
            className="font-display font-medium"
            style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          >
            Three ways to learn the multifamily game.
          </h1>
          <p
            className="text-ink-dim"
            style={{ maxWidth: 720, margin: '0 auto', lineHeight: 1.55 }}
          >
            Start with the basics, work through the full self-paced
            curriculum, or step into ongoing coaching with Diva and Lou. Each
            tier builds on the one before — and the credit applies if you
            decide to step up.
          </p>
        </div>

        {/* ─── Cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((p) => (
            <Card
              key={p.id}
              variant="offer"
              className={p.highlight ? 'border-gold' : ''}
              style={
                p.highlight
                  ? { borderColor: 'var(--gold)', borderWidth: 2 }
                  : undefined
              }
            >
              <span
                className="eyebrow"
                style={
                  p.highlight
                    ? {
                        color: 'var(--gold-deep)',
                        background: 'var(--gold-soft)',
                        padding: '4px 10px',
                        borderRadius: 999,
                        display: 'inline-block',
                        marginBottom: 8,
                      }
                    : { display: 'inline-block', marginBottom: 8 }
                }
              >
                {p.eyebrow}
              </span>
              <h3 className="font-display text-2xl text-navy">{p.label}</h3>
              <div className="mt-3 flex items-end gap-2">
                <span className="font-display text-4xl text-navy">
                  {p.price}
                </span>
                <span className="text-ink-dim">{p.cadence}</span>
              </div>
              <p
                className="mt-3 text-ink-dim"
                style={{ minHeight: 96, lineHeight: 1.5 }}
              >
                {p.blurb}
              </p>
              <ul className="mt-6 space-y-2">
                {p.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-ink">
                    <span className="text-gold-deep">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {p.ctaExternal ? (
                  <a
                    href={p.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={p.highlight ? 'btn-primary' : 'btn-secondary'}
                    style={{
                      display: 'inline-flex',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    {p.ctaLabel}
                  </a>
                ) : (
                  <Link
                    href={p.ctaUrl}
                    className={p.highlight ? 'btn-primary' : 'btn-secondary'}
                    style={{
                      display: 'inline-flex',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    {p.ctaLabel}
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* ─── Ladder logic copy ───────────────────────────────── */}
        <div
          className="text-center"
          style={{
            maxWidth: 720,
            margin: '0 auto',
            color: 'var(--ink-dim)',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          <p>
            Not sure which fits? Most operators start with{' '}
            <strong style={{ color: 'var(--navy)' }}>Foundations</strong> if
            multifamily is new to them, jump straight to{' '}
            <strong style={{ color: 'var(--navy)' }}>Self-Study</strong> if
            they already know the basics, and book a{' '}
            <strong style={{ color: 'var(--navy)' }}>strategy call for Live</strong>
            {' '}when they have a deal in flight or want a coach in the room.
            Selection is intentional — Live is selective on both sides.
          </p>
        </div>

        {/* ─── Logged-in member nudge / signed-out signin link ── */}
        <div className="text-center" style={{ marginTop: 12 }}>
          {!authLoading && user ? (
            <Link
              href="/dashboard"
              className="text-navy underline underline-offset-2 text-sm"
            >
              Back to your dashboard
            </Link>
          ) : (
            <p className="text-ink-dim text-sm">
              Already a member?{' '}
              <Link
                href="/login"
                className="text-navy underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
