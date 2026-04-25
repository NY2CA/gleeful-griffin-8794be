import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import { useAuth } from '@/hooks/useAuth';
import { useCourse } from '@/hooks/useCourse';
import { useBilling } from '@/hooks/useBilling';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { course, modules, progress, isComplete } = useCourse('multifamily-mastery');
  const { status: billing, openPortal } = useBilling({ enabled: Boolean(user) });

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

  return (
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
                  {progress.percentage === 0 ? 'Start Week 1' : 'Resume program'}
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

        {/* Modules grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((m, i) => {
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
      </div>
    </main>
  );
}
