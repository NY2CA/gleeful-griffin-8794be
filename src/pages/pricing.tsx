import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { useBilling, type Plan } from '@/hooks/useBilling';

/**
 * Three marketing cards for the Annual / Monthly / Lifetime plans.
 *
 * Hitting "Choose" on any card:
 *   - If the visitor isn't signed in → redirect to /signup?next=/pricing
 *   - If they are signed in → POST /api/billing/checkout and redirect to Stripe
 *
 * Actual prices live in Stripe. We only render marketing headline/bullets here;
 * Stripe Checkout shows the authoritative amount.
 */

interface PlanCard {
  id: Exclude<Plan, null>;
  label: string;
  price: string;
  cadence: string;
  blurb: string;
  bullets: string[];
  highlight?: boolean;
}

const PLANS: PlanCard[] = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$149',
    cadence: '/month',
    blurb: 'Start this month. Cancel any time from the portal.',
    bullets: [
      '12-week Multifamily Mastery program',
      'Underwriting models, LOI, PPM outline',
      'Cancel any time',
    ],
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '$1,497',
    cadence: '/year',
    blurb: 'Best value for committed operators. Billed once a year.',
    bullets: [
      'Everything in Monthly',
      'Quarterly live Q&A with Lou Rescia',
      'Save ~17% vs. monthly',
      'New content as it ships',
    ],
    highlight: true,
  },
  {
    id: 'lifetime',
    label: 'Lifetime',
    price: '$2,997',
    cadence: 'once',
    blurb: 'One payment. Yours forever, including future releases.',
    bullets: [
      'Everything in Annual, never expires',
      'All future releases included',
      'One-time payment',
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { status, startCheckout } = useBilling({ enabled: Boolean(user) });

  const [busy, setBusy] = useState<Exclude<Plan, null> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If a signed-in user with active access lands here, nudge them back to
    // their dashboard so they don't accidentally buy a second plan.
    if (status?.hasAccess) {
      // Don't auto-redirect; just show a banner. They may want to upgrade.
    }
  }, [status]);

  async function choose(plan: Exclude<Plan, null>) {
    setError(null);
    if (!user) {
      router.push(`/signup?next=${encodeURIComponent('/pricing')}`);
      return;
    }
    setBusy(plan);
    try {
      await startCheckout(plan);
      // Redirect happens inside startCheckout — keep busy until then.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout');
      setBusy(null);
    }
  }

  return (
    <main className="page">
      <div className="container grid gap-12">
        <div className="section-head text-center" style={{ marginBottom: 0 }}>
          <span className="eyebrow">Pricing</span>
          <h1 className="font-display font-medium" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>
            One program. Three ways to join.
          </h1>
          <p className="text-ink-dim" style={{ maxWidth: 640, margin: '0 auto' }}>
            Every plan unlocks the full 12-week Multifamily Mastery curriculum
            and every model and template. Pick the cadence that fits.
          </p>
        </div>

        {status?.hasAccess && (
          <Card variant="offer" className="text-center">
            <p className="text-navy font-display text-xl mb-2">
              You already have access.
            </p>
            <p className="text-ink-dim mb-5">
              Your current plan: <strong>{status.lifetime ? 'Lifetime' : status.plan ?? '—'}</strong>.
              Manage it from the billing portal.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/dashboard" className="btn-primary">
                Go to dashboard
              </Link>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((p) => (
            <Card
              key={p.id}
              variant="offer"
              className={p.highlight ? 'border-gold' : ''}
              style={p.highlight ? { borderColor: 'var(--gold)', borderWidth: 2 } : undefined}
            >
              {p.highlight && (
                <span
                  className="eyebrow"
                  style={{
                    color: 'var(--gold-deep)',
                    background: 'var(--gold-soft)',
                    padding: '4px 10px',
                    borderRadius: 999,
                    display: 'inline-block',
                    marginBottom: 8,
                  }}
                >
                  Most popular
                </span>
              )}
              <h3 className="font-display text-2xl text-navy">{p.label}</h3>
              <div className="mt-3 flex items-end gap-2">
                <span className="font-display text-4xl text-navy">{p.price}</span>
                <span className="text-ink-dim">{p.cadence}</span>
              </div>
              <p className="mt-3 text-ink-dim" style={{ minHeight: 48 }}>{p.blurb}</p>
              <ul className="mt-6 space-y-2">
                {p.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-ink">
                    <span className="text-gold-deep">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button
                  fullWidth
                  variant={p.highlight ? 'primary' : 'secondary'}
                  disabled={busy !== null || authLoading}
                  onClick={() => choose(p.id)}
                >
                  {busy === p.id ? 'Redirecting…' : user ? 'Choose' : 'Sign up and choose'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {error && (
          <p className="text-center text-red-600 text-sm">{error}</p>
        )}

        <p className="text-center text-ink-dim text-sm">
          Prices shown are defaults. The authoritative amount is confirmed on
          Stripe&rsquo;s checkout page before you pay.
        </p>

        <div className="text-center">
          <Link href="/dashboard" className="text-navy underline underline-offset-2 text-sm">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
