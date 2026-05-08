import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

/**
 * Mastery Live · /submit-deal
 *
 * Member-facing form to submit a deal for coaching review with Diva and Lou.
 * Captures the property and underwriting fields, posts to /api/submit-deal,
 * which appends the deal to the user's record and emails Diva/Lou for review.
 *
 * After successful submission, redirects back to /dashboard where the
 * "Your deal" card now shows status: submitted (in review).
 */
export default function SubmitDealPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Auth gate · only logged-in members can submit
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // Toggle the white-nav body class so the shared <Navigation> repaints
  // to white against this dashboard-style navy background.
  useEffect(() => {
    document.body.classList.add('live-dashboard-active');
    return () => {
      document.body.classList.remove('live-dashboard-active');
    };
  }, []);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [units, setUnits] = useState('');
  const [assetClass, setAssetClass] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [stage, setStage] = useState('pre-LOI');
  const [underwrittenNoi, setUnderwrittenNoi] = useState('');
  const [underwrittenYoc, setUnderwrittenYoc] = useState('');
  const [targetIrr, setTargetIrr] = useState('');
  const [coachingFocus, setCoachingFocus] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Property name is required.');
      return;
    }
    setBusy(true);
    try {
      await api('/api/submit-deal', {
        method: 'POST',
        body: {
          name: name.trim(),
          address: address.trim() || undefined,
          units: units ? Number(units) : undefined,
          assetClass: assetClass.trim() || undefined,
          askingPrice: askingPrice ? Number(askingPrice.replace(/[$,]/g, '')) : undefined,
          stage: stage.trim() || undefined,
          underwrittenNoi: underwrittenNoi
            ? Number(underwrittenNoi.replace(/[$,]/g, ''))
            : undefined,
          underwrittenYoc: underwrittenYoc.trim() || undefined,
          targetIrr: targetIrr.trim() || undefined,
          coachingFocus: coachingFocus.trim() || undefined,
        },
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="page page-center" style={{ background: 'var(--navy)' }}>
        <div className="container text-center" style={{ color: 'rgba(250, 247, 242, 0.62)' }}>
          Loading…
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <>
        <style jsx global>{`
          body.live-dashboard-active .nav {
            background: #ffffff !important;
            border-bottom-color: rgba(184, 148, 90, 0.18) !important;
          }
          body.live-dashboard-active .nav .brand,
          body.live-dashboard-active .nav .links a {
            color: var(--navy);
          }
        `}</style>
        <main className="page" style={{ background: 'var(--navy)', minHeight: '80vh' }}>
          <div className="container" style={{ maxWidth: 600, margin: '0 auto', paddingTop: 64 }}>
            <Card
              variant="offer"
              style={{
                background: 'linear-gradient(135deg, var(--navy-soft) 0%, #1f315a 100%)',
                border: '1px solid var(--gold)',
                color: 'var(--cream)',
              }}
            >
              <span className="eyebrow" style={{ color: 'var(--gold-bright)' }}>Submitted · in review</span>
              <h2
                className="font-display"
                style={{
                  fontSize: 28,
                  color: 'var(--cream)',
                  margin: '8px 0 16px',
                  fontWeight: 500,
                }}
              >
                Your deal is with Diva and Lou.
              </h2>
              <p style={{ color: 'rgba(250, 247, 242, 0.78)', lineHeight: 1.6 }}>
                We&rsquo;ll review the underwriting and respond by your next coaching call.
                The &ldquo;Your deal&rdquo; card on your dashboard now shows status: submitted.
                Once reviewed, we&rsquo;ll promote it to active and add review notes there.
              </p>
              <div style={{ marginTop: 24 }}>
                <Link
                  href="/dashboard"
                  className="btn-primary"
                  style={{ background: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--navy)' }}
                >
                  Back to dashboard →
                </Link>
              </div>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        body.live-dashboard-active .nav {
          background: #ffffff !important;
          border-bottom-color: rgba(184, 148, 90, 0.18) !important;
        }
        body.live-dashboard-active .nav .brand,
        body.live-dashboard-active .nav .links a {
          color: var(--navy);
        }
      `}</style>
      <main className="page" style={{ background: 'var(--navy)', color: 'var(--cream)' }}>
        <div className="container" style={{ maxWidth: 720, margin: '0 auto', paddingTop: 32 }}>
          <div className="section-head" style={{ marginBottom: 24 }}>
            <span className="eyebrow" style={{ color: 'var(--gold-bright)' }}>
              Mastery Live · Coaching workspace
            </span>
            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(28px, 4vw, 36px)',
                color: 'var(--cream)',
                margin: '8px 0 12px',
                fontWeight: 500,
                lineHeight: 1.15,
              }}
            >
              Submit a deal for review.
            </h1>
            <p style={{ color: 'rgba(250, 247, 242, 0.72)', maxWidth: 560, lineHeight: 1.55 }}>
              Share the property, your underwriting, and what you want to work on. Diva and Lou
              will review before your next coaching call. Required: property name. Everything
              else is optional but useful.
            </p>
          </div>

          <Card
            variant="offer"
            style={{
              background: '#1f315a',
              border: '1px solid rgba(184, 148, 90, 0.18)',
              color: 'var(--cream)',
            }}
          >
            <form onSubmit={onSubmit} noValidate>
              <FieldLabel>Property</FieldLabel>
              <Input
                label="Property name"
                type="text"
                name="name"
                required
                placeholder="Garland · 142-unit Class B"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Address (optional)"
                type="text"
                name="address"
                placeholder="123 Main St, Garland, TX 75040"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input
                  label="Units"
                  type="number"
                  name="units"
                  placeholder="142"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                />
                <Input
                  label="Asset class"
                  type="text"
                  name="assetClass"
                  placeholder="B value-add"
                  value={assetClass}
                  onChange={(e) => setAssetClass(e.target.value)}
                />
              </div>
              <Input
                label="Asking price"
                type="text"
                name="askingPrice"
                placeholder="$33,400,000"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
              />
              <FieldLabel style={{ marginTop: 24 }}>Stage</FieldLabel>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                style={selectStyle}
              >
                <option value="pre-LOI">Pre-LOI · evaluating</option>
                <option value="in LOI">In LOI · negotiating</option>
                <option value="in DD">In DD · investigating</option>
                <option value="PSA">PSA · post-DD, pre-close</option>
              </select>

              <FieldLabel style={{ marginTop: 24 }}>Underwriting (optional)</FieldLabel>
              <Input
                label="Underwritten Year-1 NOI"
                type="text"
                name="underwrittenNoi"
                placeholder="$1,742,000"
                value={underwrittenNoi}
                onChange={(e) => setUnderwrittenNoi(e.target.value)}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input
                  label="Underwritten YOC"
                  type="text"
                  name="underwrittenYoc"
                  placeholder="7.4%"
                  value={underwrittenYoc}
                  onChange={(e) => setUnderwrittenYoc(e.target.value)}
                />
                <Input
                  label="Target IRR"
                  type="text"
                  name="targetIrr"
                  placeholder="17.2%"
                  value={targetIrr}
                  onChange={(e) => setTargetIrr(e.target.value)}
                />
              </div>

              <FieldLabel style={{ marginTop: 24 }}>Coaching focus</FieldLabel>
              <p
                style={{
                  fontSize: 13,
                  color: 'rgba(250, 247, 242, 0.62)',
                  margin: '0 0 8px',
                  lineHeight: 1.5,
                }}
              >
                What do you want Diva and Lou to pressure-test? Rent assumptions? Cap rate?
                Bear case? Be specific — the more concrete, the more useful the call.
              </p>
              <textarea
                value={coachingFocus}
                onChange={(e) => setCoachingFocus(e.target.value)}
                rows={5}
                placeholder="e.g. Stress-test rent push assumption against the West Valley supply pipeline. Want to validate exit cap at 5.85% given 2026 absorption forecasts."
                style={textareaStyle}
              />

              {error && (
                <p
                  style={{
                    color: '#fda4af',
                    fontSize: 14,
                    marginTop: 16,
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                <Button
                  type="submit"
                  disabled={busy}
                  style={{ background: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--navy)' }}
                >
                  {busy ? 'Submitting…' : 'Submit deal for review'}
                </Button>
                <Link
                  href="/dashboard"
                  className="btn-secondary"
                  style={{ borderColor: 'var(--gold)', color: 'var(--gold-bright)' }}
                >
                  Cancel
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}

function FieldLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--gold)',
        marginBottom: 12,
        marginTop: 8,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--navy)',
  color: 'var(--cream)',
  border: '1px solid rgba(184, 148, 90, 0.3)',
  borderRadius: 4,
  fontFamily: 'var(--sans)',
  fontSize: 14,
  marginBottom: 16,
  appearance: 'auto',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--navy)',
  color: 'var(--cream)',
  border: '1px solid rgba(184, 148, 90, 0.3)',
  borderRadius: 4,
  fontFamily: 'var(--sans)',
  fontSize: 14,
  lineHeight: 1.55,
  resize: 'vertical' as const,
  minHeight: 120,
};
