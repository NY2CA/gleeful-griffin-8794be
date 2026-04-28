import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import UpsellModal from '@/components/UpsellModal';
import { useAuth } from '@/hooks/useAuth';
import { useCourse } from '@/hooks/useCourse';
import { useBilling } from '@/hooks/useBilling';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { course, modules, progress, isComplete } = useCourse('multifamily-mastery');
  const { status: billing, openPortal, startCheckout } = useBilling({ enabled: Boolean(user) });

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user || !course) {
    return (
      <main className="page page-center">
        <div className="container text-center text-ink-dim">Loading…</div>
      </main>
    );
  }

  // Find first incomplete module as the "resume" target
  const resume = modules.find((m) => !isComplete(m.id)) ?? modules[0];
  const hasAccess = billing?.hasAccess ?? false;

  // Pull orientation out of the weekly grid so it can render as its own
  // "Start Here" hero card above the Week 1-12 lineup. This keeps the
  // curriculum's natural numbering intact (orientation is Week 0, not Week 1).
  const orientation = modules.find((m) => m.id === 'orientation');
  const weeklyModules = modules.filter((m) => m.id !== 'orientation');
  const orientationDone = orientation ? isComplete(orientation.id) : false;

  return (
    <>
    <main className="page">
      <div className="container grid gap-12">
        {/* Access-pending banner — shown until Rescia Properties grants access. */}
        {billing && !hasAccess && (
          <Card variant="offer" className="border-gold" style={{ borderColor: 'var(--gold)', borderWidth: 2 }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="eyebrow" style={{ color: 'var(--gold-deep)' }}>Access pending</span>
                <h3 className="font-display text-2xl text-navy mt-1">
                  Welcome — your membership is under review.
                </h3>
                <p className="text-ink-dim mt-2" style={{ maxWidth: 560 }}>
                  Rescia Properties will reach out to confirm enrollment and
                  activate your access. If you haven&rsquo;t heard from us
                  within one business day, email{' '}
                  <a
                    href="mailto:lou@resciaproperties.com"
                    className="text-navy underline underline-offset-2"
                  >
                    lou@resciaproperties.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Welcome hero */}
        <Card variant="hero">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-2">
              <span className="eyebrow" style={{ color: 'var(--gold-bright)' }}>
                Member dashboard
              </span>
              <h3
                className="font-display font-medium"
                style={{ fontSize: 'clamp(30px, 4vw, 44px)', color: 'var(--cream)' }}
              >
                Welcome back, {user.name.split(' ')[0]}.
              </h3>
              <p style={{ color: 'var(--cream-warm)', maxWidth: 540, lineHeight: 1.55 }}>
                {!hasAccess
                  ? 'Preview the curriculum below. Unlock the program to start Week 1.'
                  : progress.percentage === 100
                  ? 'You have completed every module. Bespoke coaching requests are open.'
                  : progress.percentage === 0
                  ? 'Welcome aboard. Start with the 20-minute orientation below — it sets you up for the 12 weeks ahead.'
                  : `You are ${progress.percentage}% through ${course.title}. Resume where you left off.`}
              </p>
            </div>
            <div className="flex flex-col items-start gap-3">
              <ProgressBar current={progress.completed} total={progress.total} />
              {hasAccess ? (
                <Link
                  href={`/course/${resume.id}`}
                  className="btn-primary"
                  style={{ background: 'var(--gold)', borderColor: 'var(--gold)' }}
                >
                  {resume.id === 'orientation'
                    ? 'Begin orientation'
                    : progress.percentage === 0
                    ? 'Start Week 1'
                    : 'Resume program'}
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="btn-primary"
                  style={{ background: 'var(--gold)', borderColor: 'var(--gold)' }}
                >
                  Choose a plan
                </Link>
              )}
            </div>
          </div>
        </Card>

        {/* Billing strip — only when access is active */}
        {billing && hasAccess && (
          <Card variant="offer">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <span className="eyebrow">Your plan</span>
                <p className="font-display text-xl text-navy">
                  {billing.lifetime
                    ? 'Lifetime · paid in full'
                    : billing.plan
                    ? `${billing.plan[0].toUpperCase()}${billing.plan.slice(1)}`
                    : 'Active'}
                </p>
                {billing.currentPeriodEnd && !billing.lifetime && (
                  <p className="text-ink-dim text-sm">
                    {billing.cancelAtPeriodEnd ? 'Ends on' : 'Renews on'}{' '}
                    {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              {!billing.lifetime && billing.hasBillingAccount && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    openPortal().catch((err) => alert(err.message || 'Unable to open portal'))
                  }
                >
                  Manage billing
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Course progress summary */}
        <section>
          <div className="section-head" style={{ marginBottom: 24 }}>
            <span className="eyebrow">Your program</span>
            <h2 style={{ fontSize: 32 }}>{course.title}</h2>
            <p>{course.description}</p>
          </div>
          <ProgressBar
            current={progress.completed}
            total={progress.total}
            showLabel
            className="mb-8"
          />
        </section>

        {/* Start Here · Orientation — rendered as a separate hero card so it
            doesn't shift the Week 1-12 numbering in the modules grid below.
            Gold accent + prominent CTA so brand-new members know exactly
            where to begin on day one. */}
        {orientation && (
          <section>
            <Card
              variant="offer"
              className="max-w-full"
              style={{
                borderColor: 'var(--gold)',
                borderWidth: 2,
                borderStyle: 'solid',
              }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2">
                  <span className="eyebrow" style={{ color: 'var(--gold-deep)' }}>
                    Start here · {orientation.duration}
                  </span>
                  <h3 className="font-display text-2xl text-navy">
                    {orientation.title}
                  </h3>
                  <p className="text-ink-dim" style={{ maxWidth: 560 }}>
                    {orientation.description}
                  </p>
                </div>
                {hasAccess ? (
                  <Link
                    href={`/course/${orientation.id}`}
                    className="btn-primary"
                    style={{
                      background: 'var(--gold)',
                      borderColor: 'var(--gold)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {orientationDone ? 'Revisit orientation' : 'Begin orientation'}
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className="btn-primary"
                    style={{
                      background: 'var(--gold)',
                      borderColor: 'var(--gold)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Unlock orientation
                  </Link>
                )}
              </div>
            </Card>
          </section>
        )}

        {/* Modules grid — iterates over weeklyModules so the orientation
            (rendered as its own hero card above) doesn't claim the Week 1
            slot. Re-indexed so Week 1-12 numbering stays accurate. */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyModules.map((m, i) => {
              const done = isComplete(m.id);
              const status = !hasAccess ? 'Locked' : done ? 'Completed' : 'In progress';
              const cls = !hasAccess
                ? 'module locked'
                : done
                ? 'module completed'
                : 'module in-progress';
              const href = hasAccess ? `/course/${m.id}` : '/pricing';
              return (
                <Link
                  key={m.id}
                  href={href}
                  className={cls}
                  style={{ textDecoration: 'none' }}
                >
                  <span className="num">Week {i + 1} · {m.duration}</span>
                  <h4>{m.title.replace(/^Week \d+\s·\s/, '')}</h4>
                  <p>{m.description}</p>
                  <span className="status">{status}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Templates */}
        <section>
          <Card variant="offer" className="max-w-full">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <span className="eyebrow">Toolkit</span>
                <h3 className="font-display text-2xl">Templates &amp; models</h3>
                <p className="text-ink-dim" style={{ maxWidth: 520 }}>
                  Underwriting model, investor pipeline CRM, CapEx tracker, distribution
                  waterfall, quarterly LP report, LOI, PPM outline, email campaign, PSA
                  checklist, DD checklist, PM RFP.
                </p>
              </div>
              {hasAccess ? (
                <Button variant="secondary" onClick={() => router.push('/templates')}>
                  Open toolkit
                </Button>
              ) : (
                <Link href="/pricing" className="btn-secondary">
                  Unlock toolkit
                </Link>
              )}
            </div>
          </Card>
        </section>

        {/* Admin shortcut — only visible to ADMIN_EMAILS users */}
        {user.isAdmin && (
          <section>
            <Card variant="offer" className="max-w-full" style={{ borderColor: 'var(--navy)', borderWidth: 1, borderStyle: 'solid' }}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2">
                  <span className="eyebrow" style={{ color: 'var(--navy)' }}>Admin tools</span>
                  <h3 className="font-display text-2xl">Member management</h3>
                  <p className="text-ink-dim" style={{ maxWidth: 520 }}>
                    Grant or revoke course access for partners, vendors, and beta members
                    — independent of Stripe billing.
                  </p>
                </div>
                <Link href="/admin/members" className="btn-secondary">
                  Open admin
                </Link>
              </div>
            </Card>
          </section>
        )}
      </div>
    </main>

    {/* 11-month upsell — only fires for active annual subs not already winding
        down, when renewal is within 30 days. Component handles its own
        per-cycle dismissal via localStorage. */}
    {billing &&
      hasAccess &&
      billing.plan === 'annual' &&
      !billing.cancelAtPeriodEnd &&
      billing.currentPeriodEnd && (
        <UpsellModal
          renewalDate={billing.currentPeriodEnd}
          firstName={user.name.split(' ')[0]}
          onUpgrade={async () => {
            try {
              await startCheckout('lifetime');
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Unable to open checkout');
            }
          }}
        />
      )}

    {/* ========== FOOTER ========== */}
    {/* Replicates the landing page .footer-brand pattern so members see the
        same Rescia/Multifamily Mastery branding and program tagline at the
        bottom of the dashboard. The CSS class hooks (.footer-brand,
        .nav-logo, .nav-logo-text, .footer-bottom) live in styles/landing.css
        which is imported globally via _app.tsx. */}
    <footer>
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/dashboard" className="nav-logo">
              <img src="/rescia-logo.png" alt="Rescia Properties" />
              <div className="nav-logo-text">
                <span className="nav-logo-name">Rescia Properties</span>
                <span className="nav-logo-tag">Multifamily Mastery</span>
              </div>
            </Link>
            <p>
              The complete multifamily real estate mentoring program. From market
              identification to exit &mdash; the proven system for building wealth
              through multifamily real estate.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <div>&copy; 2026 Rescia Properties &middot; Multifamily Mastery &middot; All rights reserved</div>
          <div>Not a securities offering &middot; Past performance not indicative of future results</div>
        </div>
      </div>
    </footer>
    </>
  );
}
