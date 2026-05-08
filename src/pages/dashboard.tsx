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
import {
  mockCoachingCall,
  mockMemos,
  mockWeeklyReads,
} from '@/data/live';

/**
 * Wave 15.2 · master flag for the two mock-content surfaces ("Deal memos ·
 * from the Rescia desk" and "What we're reading this week"). Both were
 * showing fake placeholder content to every Mastery Live member, which was
 * confusing students. Set to `true` once both feeds have a real wire-up:
 *   - Deal memos · admin-curated CMS surface for Diva/Lou to publish memos
 *   - Weekly reads · the Tuesday cron output landing in a real CMS surface
 * Until then, both cards are hidden. Toolkit (real surface) renders full
 * width when the memos card is gated off.
 */
const SHOW_MOCK_FEEDS = false;

/**
 * Member dashboard.
 *
 * Wave 13 unified design: the Mastery Live dashboard treatment is now the
 * canonical post-login surface. There is no longer a separate /live/dashboard
 * route — every authenticated member lands here.
 *
 * Visual: navy + gold (Mastery brand at full intensity) using inline style
 * overrides on the existing Card components. Nav repaints to white via the
 * `live-dashboard-active` body class.
 *
 * Data wiring:
 *   • Auth        — useAuth (real)
 *   • Billing     — useBilling (real, controls hasAccess)
 *   • Curriculum  — useCourse('multifamily-mastery') (real progress per user)
 *   • Coaching    — mockCoachingCall (Calendly integration is the next wire-up)
 *   • AI tutor    — links into resume module which renders AskAboutTopic
 *   • Your deal(s) — real per-user data via user.activeDeals[] (Wave 14.3 multi-deal)
 *   • Deal memos  — mockMemos (CMS surface is the next wire-up)
 *   • Weekly reads — mockWeeklyReads (Tuesday cron output is the next wire-up)
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { course, modules, progress, isComplete } = useCourse('multifamily-mastery');
  const { status: billing, openPortal, startCheckout } = useBilling({ enabled: Boolean(user) });

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // White-nav body class — kept while this route is mounted, removed on unmount
  useEffect(() => {
    document.body.classList.add('live-dashboard-active');
    return () => {
      document.body.classList.remove('live-dashboard-active');
    };
  }, []);

  if (loading || !user || !course) {
    return (
      <main className="page page-center" style={{ background: 'var(--navy)' }}>
        <div className="container text-center" style={{ color: 'rgba(250, 247, 242, 0.62)' }}>
          Loading…
        </div>
      </main>
    );
  }

  // First incomplete module as the resume target
  const resume = modules.find((m) => !isComplete(m.id)) ?? modules[0];
  const hasAccess = billing?.hasAccess ?? false;

  // Pull orientation out of the weekly grid (same logic as the prior dashboard)
  const orientation = modules.find((m) => m.id === 'orientation');
  const weeklyModules = modules.filter((m) => m.id !== 'orientation');
  const orientationDone = orientation ? isComplete(orientation.id) : false;
  const completeWeekly = weeklyModules.filter((m) => isComplete(m.id)).length;

  const firstName = user.name.split(' ')[0];

  return (
    <>
      {/* Scoped global override: repaint the shared <Navigation /> banner
          to white while this dashboard is mounted, since the navy page
          background below would otherwise turn the cream nav into a
          murky grey. */}
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
        <div className="container grid gap-12">

          {/* ─── ACCESS-PENDING BANNER ──────────────────────────
              Shown until Rescia Properties grants access. Replaces the
              welcome hero CTA when billing.hasAccess is false. */}
          {billing && !hasAccess && (
            <Card
              variant="offer"
              style={{
                background: 'linear-gradient(135deg, var(--navy-soft) 0%, #1f315a 100%)',
                border: '1px solid var(--gold)',
                color: 'var(--cream)',
              }}
            >
              <div className="flex flex-col gap-3">
                <span className="eyebrow" style={{ color: 'var(--gold-bright)' }}>Access pending</span>
                <h3 className="font-display" style={{ fontSize: 24, color: 'var(--cream)', margin: 0, fontWeight: 500 }}>
                  Welcome — your membership is under review.
                </h3>
                <p style={{ color: 'rgba(250, 247, 242, 0.78)', maxWidth: 560, margin: 0 }}>
                  Rescia Properties will reach out to confirm enrollment and activate your access.
                  If you haven&rsquo;t heard from us within one business day, email{' '}
                  <a
                    href="mailto:rescia@resciaproperties.com"
                    style={{ color: 'var(--gold-bright)', textDecoration: 'underline' }}
                  >
                    rescia@resciaproperties.com
                  </a>.
                </p>
              </div>
            </Card>
          )}

          {/* ─── WELCOME HERO ───────────────────────────────────── */}
          <Card variant="hero" style={{ background: 'linear-gradient(135deg, var(--navy-soft) 0%, var(--navy) 100%)' }}>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-2">
                <span className="eyebrow" style={{ color: 'var(--gold-bright)' }}>Member dashboard</span>
                <h3
                  className="font-display font-medium"
                  style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--cream)', lineHeight: 1.15 }}
                >
                  Welcome back, {firstName}
                  {hasAccess && progress.percentage > 0 && progress.percentage < 100 ? (
                    <>
                      {' '}— <em style={{ fontStyle: 'italic', color: 'var(--gold-bright)', fontWeight: 400 }}>
                        you&rsquo;re {progress.percentage}% in.
                      </em>
                    </>
                  ) : (
                    '.'
                  )}
                </h3>
                <p style={{ color: 'rgba(250, 247, 242, 0.72)', maxWidth: 560, lineHeight: 1.55 }}>
                  {!hasAccess
                    ? 'Preview the curriculum below. Unlock the program to start Module 1.'
                    : progress.percentage === 100
                    ? 'You have completed every module. Bespoke coaching requests are open.'
                    : progress.percentage === 0
                    ? 'Welcome aboard. Begin with the 20-minute orientation — it sets you up for the 12 weeks ahead.'
                    : `Resume where you left off — Diva and Lou track your progress and bring it into coaching.`}
                </p>
              </div>
              <div className="flex flex-col items-start gap-3" style={{ minWidth: 240 }}>
                <ProgressBar current={progress.completed} total={progress.total} />
                {hasAccess ? (
                  <Link
                    href={`/course/${resume.id}`}
                    className="btn-primary"
                    style={{ background: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--navy)' }}
                  >
                    {resume.id === 'orientation'
                      ? 'Begin orientation'
                      : progress.percentage === 0
                      ? 'Start Module 1'
                      : progress.percentage === 100
                      ? 'Review program'
                      : 'Resume program'}
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className="btn-primary"
                    style={{ background: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--navy)' }}
                  >
                    Choose a plan
                  </Link>
                )}
              </div>
            </div>
          </Card>

          {/* ─── BILLING STRIP — only when access is active ────── */}
          {billing && hasAccess && (
            <Card
              variant="offer"
              style={{
                background: '#1f315a',
                border: '1px solid rgba(184, 148, 90, 0.18)',
                color: 'var(--cream)',
              }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="eyebrow" style={{ color: 'var(--gold)' }}>Your plan</span>
                  <p className="font-display" style={{ fontSize: 19, color: 'var(--cream)', margin: 0, fontWeight: 500 }}>
                    {billing.lifetime
                      ? 'Lifetime · paid in full'
                      : billing.plan
                      ? `${billing.plan[0].toUpperCase()}${billing.plan.slice(1)}`
                      : 'Active'}
                  </p>
                  {billing.currentPeriodEnd && !billing.lifetime && (
                    <p style={{ fontSize: 13, color: 'rgba(250, 247, 242, 0.62)', margin: 0 }}>
                      {billing.cancelAtPeriodEnd ? 'Ends on' : 'Renews on'}{' '}
                      {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {!billing.lifetime && billing.hasBillingAccount && (
                  <Button
                    variant="secondary"
                    style={{ borderColor: 'var(--gold)', color: 'var(--gold-bright)' }}
                    onClick={() =>
                      openPortal().catch((err: Error) => alert(err.message || 'Unable to open portal'))
                    }
                  >
                    Manage billing
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* ─── COACHING · evergreen Calendly CTA (Wave 15.4) ───── */}
          {/* Replaces the legacy "Next coaching call" centerpiece that was
              rendering mockCoachingCall.whenHuman ("Tuesday, May 5") and a
              Garland-themed pre-brief to every Live member regardless of
              their actual schedule. Until a real per-member coaching
              schedule + admin curation surface is built, this card is a
              clean, evergreen prompt to book the next session via Calendly.
              Same gold-bordered centerpiece position; no fake data. */}
          {hasAccess && (
            <Card
              variant="offer"
              style={{
                background: 'linear-gradient(135deg, var(--navy-soft) 0%, #1f315a 100%)',
                border: '1px solid var(--gold)',
                color: 'var(--cream)',
              }}
            >
              <span style={liveExclusiveBadge}>Live exclusive</span>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2">
                  <span className="eyebrow" style={{ color: 'var(--gold-bright)' }}>Coaching</span>
                  <h3 className="font-display" style={{ fontSize: 26, color: 'var(--gold-bright)', margin: '4px 0', fontWeight: 500 }}>
                    Schedule your next coaching call.
                  </h3>
                  <p style={{ color: 'rgba(250, 247, 242, 0.78)', maxWidth: 520, margin: 0 }}>
                    Ongoing monthly coaching with{' '}
                    <em style={{ fontStyle: 'italic', color: 'var(--gold-bright)' }}>Diva and Lou</em>.
                    Book a slot when you have a deal in flight or a question
                    you want pressure-tested.
                  </p>
                </div>
                <div>
                  <a
                    href="https://calendly.com/mastery-live-strategy-call"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ background: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--navy)', whiteSpace: 'nowrap' }}
                  >
                    Book coaching call
                  </a>
                </div>
              </div>
            </Card>
          )}

          {/* ─── AI TUTOR · horizontal banner (Wave 15.3) ─────────── */}
          {/* Was a half-width 2-col card paired with Your deal; that left the
              AI tile feeling oversized for its content density and the deals
              tile awkwardly tall when stacked with multiple deals. New layout
              mirrors the "Next coaching call" pattern: full-width with the
              copy on the left and CTA on the right. About half the height. */}
          {hasAccess && (
            <Card
              variant="offer"
              style={{
                background: 'linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%)',
                color: 'var(--navy)',
                border: '1px solid var(--gold)',
              }}
            >
              <span style={{ ...liveExclusiveBadge, background: 'var(--navy)', color: 'var(--gold-bright)' }}>
                Live exclusive
              </span>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                  <span className="eyebrow" style={{ color: 'rgba(15, 30, 61, 0.65)' }}>AI tutor</span>
                  <h3 className="font-display" style={{ fontSize: 22, color: 'var(--navy)', margin: 0, fontWeight: 500 }}>
                    Stuck on something? Ask the AI.
                  </h3>
                  <p style={{ color: 'rgba(15, 30, 61, 0.78)', margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
                    Trained on the Mastery curriculum and Rescia&rsquo;s deal-by-deal
                    commentary. Open it from inside any module — anything from
                    &ldquo;explain reversion cap rate&rdquo; to &ldquo;stress my exit at a 50bp cap expansion.&rdquo;
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <Link
                    href={`/course/${resume.id}`}
                    className="btn-primary"
                    style={{
                      background: 'var(--navy)',
                      borderColor: 'var(--navy)',
                      color: 'var(--gold-bright)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Open AI tutor
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* ─── YOUR DEAL(S) · full-width row (Wave 15.3) ────────── */}
          {/* Pulled out of the 2-col grid so it scales naturally with deal
              count — 1, 3, or 5 deals all read cleanly stacked vertically
              without the AI banner stretching to match. */}
          {hasAccess && (
            <Card
              variant="offer"
              style={{
                background: '#1f315a',
                border: '1px solid rgba(184, 148, 90, 0.18)',
                color: 'var(--cream)',
              }}
            >
              <span style={liveExclusiveBadge}>Live exclusive</span>
              <YourDealCard activeDeals={user.activeDeals ?? []} />
            </Card>
          )}

          {/* ─── CURRICULUM ─────────────────────────────────────── */}
          <section>
            <div className="section-head" style={{ marginBottom: 24 }}>
              <span className="eyebrow" style={{ color: 'var(--gold)' }}>Your curriculum</span>
              <h2 style={{ fontSize: 28, color: 'var(--cream)' }}>{course.title}</h2>
              <p style={{ color: 'rgba(250, 247, 242, 0.62)' }}>
                Work them in sequence; the preferred course progression — or jump ahead.
                Diva and Lou track your progress and bring it into coaching.
              </p>
            </div>
            <ProgressBar
              current={progress.completed}
              total={progress.total}
              showLabel
              className="mb-8"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weeklyModules.map((m, i) => {
                const done = isComplete(m.id);
                const status: 'complete' | 'in-progress' | 'available' | 'locked' = !hasAccess
                  ? 'locked'
                  : done
                  ? 'complete'
                  : m.id === resume.id
                  ? 'in-progress'
                  : 'available';
                const href = hasAccess ? `/course/${m.id}` : '/pricing';
                return (
                  <Link
                    key={m.id}
                    href={href}
                    className="module"
                    style={{
                      ...moduleCardStyle(status),
                      textDecoration: 'none',
                    }}
                  >
                    <span className="num" style={{ color: 'var(--gold)' }}>
                      Module {i + 1} · {m.duration}
                    </span>
                    <h4 style={{ color: 'var(--cream)' }}>{m.title.replace(/^Week \d+\s·\s/, '')}</h4>
                    <p style={{ color: 'rgba(250, 247, 242, 0.62)' }}>{m.description}</p>
                    <span
                      className="status"
                      style={{ color: moduleStatusColor(status) }}
                    >
                      {status === 'complete'
                        ? 'Complete'
                        : status === 'in-progress'
                        ? 'In progress'
                        : status === 'locked'
                        ? 'Locked'
                        : 'Available'}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ─── DEAL MEMOS · solo row when wired (Wave 15.3) ─────── */}
          {/* Wave 15.2 · Deal memos hidden until admin-curated memo system is
              wired. When SHOW_MOCK_FEEDS flips to true, memos render in their
              own full-width row above the Toolkit/Admin pair below. */}
          {hasAccess && SHOW_MOCK_FEEDS && (
            <Card
              variant="offer"
              style={{
                background: '#1f315a',
                border: '1px solid rgba(184, 148, 90, 0.18)',
                color: 'var(--cream)',
              }}
            >
              <span style={liveExclusiveBadge}>Live exclusive</span>
              <span className="eyebrow" style={{ color: 'var(--gold)' }}>Deal memos · from the Rescia desk</span>
              <div style={{ marginTop: 12 }}>
                {mockMemos.map((memo, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '14px 0',
                      borderTop: i === 0 ? 'none' : '1px solid rgba(250, 247, 242, 0.08)',
                    }}
                  >
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.08em',
                        color: 'var(--gold)',
                        marginBottom: 4,
                      }}
                    >
                      {memo.date} · {memo.marketTag}
                    </div>
                    <div style={{ color: 'var(--cream)', fontSize: 13.5, lineHeight: 1.45 }}>
                      {memo.title}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ─── TOOLKIT + ADMIN TILE · uniform 2-col grid (Wave 15.3) ── */}
          {/* For admins, Toolkit (member-facing) and the Coaching workspace
              admin tile sit side-by-side at matching density. For members,
              Toolkit renders alone full-width (no admin tile). The Admin
              tile used to live at the bottom of the page — pulled up here so
              the proportions stay uniform with Toolkit. */}
          {hasAccess && (
            <div className={user.isAdmin ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''}>
              <Card
                variant="offer"
                style={{
                  background: '#1f315a',
                  border: '1px solid rgba(184, 148, 90, 0.18)',
                  color: 'var(--cream)',
                }}
              >
                <div className="flex flex-col gap-3">
                  <span className="eyebrow" style={{ color: 'var(--gold)' }}>Toolkit</span>
                  <h3 className="font-display" style={{ fontSize: 19, color: 'var(--cream)', margin: 0, fontWeight: 500 }}>
                    Models &amp; templates
                  </h3>
                  <p style={{ color: 'rgba(250, 247, 242, 0.62)', margin: 0 }}>
                    Underwriting model · Investor pipeline CRM · CapEx tracker · Distribution
                    waterfall · LP report · LOI · PPM outline · PSA &amp; DD checklists.
                  </p>
                  <div style={{ marginTop: 6 }}>
                    {hasAccess ? (
                      <Link
                        href="/templates"
                        className="btn-secondary"
                        style={{ borderColor: 'var(--gold)', color: 'var(--gold-bright)' }}
                      >
                        Open toolkit
                      </Link>
                    ) : (
                      <Link
                        href="/pricing"
                        className="btn-secondary"
                        style={{ borderColor: 'var(--gold)', color: 'var(--gold-bright)' }}
                      >
                        Unlock toolkit
                      </Link>
                    )}
                  </div>
                </div>
              </Card>

              {user.isAdmin && (
                <Card
                  variant="offer"
                  style={{
                    background: '#1f315a',
                    border: '1px solid var(--gold)',
                    color: 'var(--cream)',
                  }}
                >
                  <div className="flex flex-col gap-3">
                    <span className="eyebrow" style={{ color: 'var(--gold-bright)' }}>Admin tools</span>
                    <h3 className="font-display" style={{ fontSize: 19, color: 'var(--cream)', margin: 0, fontWeight: 500 }}>
                      Coaching workspace · admin
                    </h3>
                    <p style={{ color: 'rgba(250, 247, 242, 0.62)', margin: 0 }}>
                      Review submitted deals, promote them to active, add review notes for
                      the next call. Or grant/revoke access independent of Stripe.
                    </p>
                    <div className="flex flex-wrap gap-3" style={{ marginTop: 6 }}>
                      <Link
                        href="/admin/deals"
                        className="btn-primary"
                        style={{
                          background: 'var(--gold)',
                          borderColor: 'var(--gold)',
                          color: 'var(--navy)',
                        }}
                      >
                        Deals queue →
                      </Link>
                      <Link
                        href="/admin/members"
                        className="btn-secondary"
                        style={{ borderColor: 'var(--gold)', color: 'var(--gold-bright)' }}
                      >
                        Members
                      </Link>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ─── WEEKLY READS · curated Tuesdays (access-only) ──── */}
          {/* Wave 15.2 · hidden until the Tuesday-articles cron is wired into
              a real CMS surface. Was rendering fake CBRE/MFE/Bisnow article
              cards to every member. Toggle SHOW_MOCK_FEEDS to bring back. */}
          {hasAccess && SHOW_MOCK_FEEDS && (
            <Card
              variant="offer"
              style={{
                background: '#1f315a',
                border: '1px solid rgba(184, 148, 90, 0.18)',
                color: 'var(--cream)',
              }}
            >
              <div className="flex flex-col gap-3">
                <span className="eyebrow" style={{ color: 'var(--gold)' }}>This week&rsquo;s reads · curated Tuesdays</span>
                <h3 className="font-display" style={{ fontSize: 20, color: 'var(--cream)', margin: 0, fontWeight: 500 }}>
                  What we&rsquo;re reading this week.
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginTop: 6 }}>
                  {mockWeeklyReads.map((r, i) => {
                    const cardStyle: React.CSSProperties = {
                      background: 'var(--navy)',
                      border: '1px solid rgba(184, 148, 90, 0.18)',
                      borderRadius: 4,
                      padding: '14px 16px',
                      display: 'block',
                      textDecoration: 'none',
                      transition: 'border-color 160ms ease, background 160ms ease',
                    };
                    const inner = (
                      <>
                        <div
                          className="font-mono"
                          style={{
                            fontSize: 10,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'var(--gold)',
                            marginBottom: 4,
                          }}
                        >
                          {r.source} · {r.date}
                        </div>
                        <div className="font-display" style={{ fontSize: 14.5, color: 'var(--cream)', lineHeight: 1.3, marginBottom: 6 }}>
                          {r.title}
                          {r.href && (
                            <span aria-hidden style={{ marginLeft: 6, color: 'var(--gold-bright)', fontFamily: 'var(--mono)', fontSize: 11 }}>
                              ↗
                            </span>
                          )}
                        </div>
                        <div style={{ color: 'rgba(250, 247, 242, 0.62)', fontSize: 12, lineHeight: 1.45 }}>
                          {r.why}
                        </div>
                      </>
                    );
                    return r.href ? (
                      <a
                        key={i}
                        href={r.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={cardStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(184, 148, 90, 0.45)';
                          e.currentTarget.style.background = '#102240';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(184, 148, 90, 0.18)';
                          e.currentTarget.style.background = 'var(--navy)';
                        }}
                      >
                        {inner}
                      </a>
                    ) : (
                      <div key={i} style={cardStyle}>{inner}</div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Wave 15.3 · Admin shortcut moved up next to Toolkit (above)
              for layout uniformity. The /admin/deals + /admin/members links
              now live in the "Coaching workspace · admin" tile in the
              Toolkit row, not as a separate full-width section. */}

        </div>
      </main>

      {/* Footer · navy variant so the chrome stays consistent end-to-end */}
      <footer style={{ background: 'var(--navy-deep)', color: 'rgba(250, 247, 242, 0.6)', padding: '32px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Rescia Properties · Mastery Live · with Diva and Lou
          </div>
          <div style={{ fontSize: 11, color: 'rgba(250, 247, 242, 0.45)' }}>
            &copy; 2026 Rescia Properties · Not a securities offering · Past performance not indicative of future results
          </div>
        </div>
      </footer>

      {/* 11-month upsell — annual subs winding down within 30 days */}
      {billing &&
        hasAccess &&
        billing.plan === 'annual' &&
        !billing.cancelAtPeriodEnd &&
        billing.currentPeriodEnd && (
          <UpsellModal
            renewalDate={billing.currentPeriodEnd}
            firstName={firstName}
            onUpgrade={async () => {
              try {
                await startCheckout('lifetime');
              } catch (err) {
                alert(err instanceof Error ? err.message : 'Unable to open checkout');
              }
            }}
          />
        )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Style helpers — kept in-file so the dashboard stays one import.
// ─────────────────────────────────────────────────────────────────────

const liveExclusiveBadge: React.CSSProperties = {
  display: 'block',
  width: 'fit-content',
  fontFamily:
    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 10,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  padding: '5px 10px',
  background: 'var(--gold)',
  color: 'var(--navy)',
  borderRadius: 2,
  fontWeight: 600,
  marginBottom: 14,
  lineHeight: 1.2,
};

function moduleCardStyle(status: 'complete' | 'in-progress' | 'available' | 'locked'): React.CSSProperties {
  return {
    background: '#1f315a',
    border: '1px solid rgba(184, 148, 90, 0.18)',
    borderLeft: `3px solid ${
      status === 'in-progress'
        ? 'var(--gold-bright)'
        : status === 'locked'
        ? 'rgba(184, 148, 90, 0.35)'
        : 'var(--gold)'
    }`,
    borderRadius: 4,
    opacity: status === 'locked' ? 0.7 : 1,
  };
}

function moduleStatusColor(status: 'complete' | 'in-progress' | 'available' | 'locked'): string {
  if (status === 'in-progress') return 'var(--gold-bright)';
  if (status === 'complete') return 'rgba(250, 247, 242, 0.62)';
  if (status === 'locked') return 'rgba(250, 247, 242, 0.42)';
  return 'rgba(250, 247, 242, 0.42)';
}

function DealRow({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '7px 0',
        fontSize: 13,
        borderTop: '1px solid rgba(250, 247, 242, 0.08)',
      }}
    >
      <span style={{ color: 'rgba(250, 247, 242, 0.62)' }}>{k}</span>
      <span
        className="font-mono"
        style={{
          color: highlight ? 'var(--gold-bright)' : 'var(--cream)',
          fontSize: 12,
        }}
      >
        {v}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// YourDealCard · Wave 14.3 (Mastery Live coaching workspace)
//
// Renders one of:
//   1. No active deals · empty state with "Submit a deal" CTA
//   2. Single live deal · full per-status card (same chrome as Wave 14.1)
//   3. Multiple live deals · "Your deals (N)" stack with one block per deal,
//      separated by gold dividers
//
// Per-status messaging:
//   submitted  · "Just received. We'll review before your next call."
//   in_review  · "Diva and Lou are looking at this now. Notes below soon."
//   active     · full populated card with YOC, IRR, coaching focus, notes
//   on_hold    · "Paused. Resume at your next coaching call."
// ─────────────────────────────────────────────────────────────────────

type ActiveDeal = import('@/hooks/useAuth').ActiveDeal;

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Just submitted',
  in_review: 'In review with Diva and Lou',
  active: 'Active in coaching',
  on_hold: 'On hold',
  closed_won: 'Closed · won',
  closed_lost: 'Closed · walked away',
};

const STATUS_TAGLINE: Record<string, string> = {
  submitted:
    "We'll review your underwriting and respond by your next coaching call. " +
    "Once active, this card shows YOC, IRR, and notes from Diva and Lou.",
  in_review:
    "Diva and Lou are looking at this now. " +
    "Notes will appear below once we promote it to active.",
  active: '',
  on_hold:
    "Paused so it doesn't compete for attention. " +
    "Reach out when you want to pick it back up.",
};

function YourDealCard({ activeDeals }: { activeDeals: ActiveDeal[] }) {
  // ── Empty state · no deals yet ──────────────────────────────────
  if (!activeDeals.length) {
    return (
      <div className="flex flex-col gap-2">
        <span className="eyebrow" style={{ color: 'var(--gold)' }}>Your deal</span>
        <h3
          className="font-display"
          style={{
            fontSize: 19,
            color: 'var(--cream)',
            margin: '4px 0 8px',
            fontWeight: 500,
          }}
        >
          No active deal yet.
        </h3>
        <p
          style={{
            color: 'rgba(250, 247, 242, 0.72)',
            fontSize: 14,
            lineHeight: 1.55,
            margin: '0 0 16px',
          }}
        >
          When you have an LOI in flight or underwriting in progress, submit it here.
          Diva and Lou will review before your next coaching call.
        </p>
        <div>
          <Link
            href="/submit-deal"
            className="btn-primary"
            style={{
              background: 'var(--gold)',
              borderColor: 'var(--gold)',
              color: 'var(--navy)',
              fontSize: 13,
            }}
          >
            Submit a deal →
          </Link>
        </div>
      </div>
    );
  }

  // ── Multi-deal stack ────────────────────────────────────────────
  const isMulti = activeDeals.length > 1;

  return (
    <div className="flex flex-col gap-2">
      <span className="eyebrow" style={{ color: 'var(--gold)' }}>
        {isMulti ? `Your deals · ${activeDeals.length} live` : 'Your deal'}
      </span>
      {activeDeals.map((deal, i) => (
        <div
          key={deal.id}
          style={{
            paddingTop: i === 0 ? 4 : 18,
            marginTop: i === 0 ? 0 : 14,
            borderTop: i === 0 ? 'none' : '1px solid rgba(184, 148, 90, 0.2)',
          }}
        >
          <DealBlock deal={deal} compact={isMulti} />
        </div>
      ))}
      <div style={{ marginTop: 16 }}>
        <Link
          href="/submit-deal"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            color: 'var(--gold-bright)',
            textDecoration: 'underline',
            textDecorationColor: 'rgba(184, 148, 90, 0.4)',
          }}
        >
          {isMulti ? 'Submit another deal →' : 'Submit another deal →'}
        </Link>
      </div>
    </div>
  );
}

function DealBlock({ deal, compact }: { deal: ActiveDeal; compact: boolean }) {
  const isAwaiting = deal.status === 'submitted' || deal.status === 'in_review';
  const isOnHold = deal.status === 'on_hold';
  const isActive = deal.status === 'active';

  return (
    <>
      <h3
        className="font-display"
        style={{
          fontSize: compact ? 17 : 19,
          color: 'var(--gold-bright)',
          margin: '0 0 8px',
          fontWeight: 500,
        }}
      >
        {deal.name}
      </h3>
      <DealRow k="Status" v={STATUS_LABEL[deal.status] ?? deal.status} highlight />

      {/* Awaiting-review state · show submission facts */}
      {isAwaiting && (
        <>
          {deal.stage && <DealRow k="Stage" v={deal.stage} />}
          {deal.units !== undefined && <DealRow k="Units" v={String(deal.units)} />}
          {deal.askingPrice !== undefined && (
            <DealRow k="Asking" v={'$' + deal.askingPrice.toLocaleString()} />
          )}
        </>
      )}

      {/* Active state · show underwriting + notes */}
      {(isActive || isOnHold) && (
        <>
          {deal.stage && <DealRow k="Stage" v={deal.stage} />}
          {deal.underwrittenYoc && <DealRow k="Underwritten YOC" v={deal.underwrittenYoc} />}
          {deal.targetIrr && <DealRow k="Target IRR" v={deal.targetIrr} />}
          {deal.coachingFocus && (
            <DealRow k="Coaching focus" v={deal.coachingFocus.slice(0, 80)} />
          )}
        </>
      )}

      {/* Per-status tagline */}
      {STATUS_TAGLINE[deal.status] && (
        <p
          style={{
            color: 'rgba(250, 247, 242, 0.62)',
            fontSize: 12.5,
            lineHeight: 1.55,
            margin: '12px 0 0',
          }}
        >
          {STATUS_TAGLINE[deal.status]}
        </p>
      )}

      {/* Active-only · review notes pane */}
      {isActive && deal.reviewNotes && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            background: 'rgba(184, 148, 90, 0.08)',
            borderLeft: '2px solid var(--gold)',
            borderRadius: 2,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--gold-bright)',
              marginBottom: 4,
            }}
          >
            Notes from Diva and Lou
          </div>
          <p
            style={{
              color: 'var(--cream)',
              fontSize: 13,
              lineHeight: 1.55,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {deal.reviewNotes}
          </p>
        </div>
      )}
    </>
  );
}
