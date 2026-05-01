import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import { useAuth } from '@/hooks/useAuth';
import {
  liveModules,
  mockCohortState,
  mockCoachingCall,
  mockDeal,
  mockMemos,
  mockWeeklyReads,
} from '@/data/live';

/**
 * Mastery Live · cohort dashboard.
 *
 * Lives at /live/dashboard. Course-specific surface — independent of the
 * /dashboard route which serves the Multifamily Mastery course.
 *
 * Access gating
 * ─────────────
 * For the initial preview wave, this page is gated to `user.isAdmin`
 * users only. Lou (admin) can preview the dashboard at the live URL
 * before any cohort members exist. When the first Live cohort member
 * is enrolled, the gate flips to a `cohort: 'live'` field on the user
 * record (see TODO inline below). Self-Study and Foundations buyers
 * never reach this route.
 */
export default function LiveDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Auth + access gate. Three states:
  //   1. loading        → render the loading shell
  //   2. no user        → kick to /login
  //   3. user, !admin   → kick to /dashboard (no Live access yet)
  // TODO: replace `user.isAdmin` with `user.cohort === 'live'` when
  // the cohort field is added to the user store. Until then, only
  // admins (Lou + invited collaborators) can preview Live.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.isAdmin) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  // Toggle a body-level class so the global nav style override (defined
  // in <style jsx global> below) only applies while this route is mounted.
  // Using a body class instead of a wrapper keeps the override available
  // for the fixed-position <Navigation /> rendered above by _app.tsx.
  useEffect(() => {
    document.body.classList.add('live-dashboard-active');
    return () => {
      document.body.classList.remove('live-dashboard-active');
    };
  }, []);

  if (loading || !user || !user.isAdmin) {
    return (
      <main className="page page-center" style={{ background: 'var(--navy)' }}>
        <div className="container text-center" style={{ color: 'var(--cream-warm)' }}>
          Loading…
        </div>
      </main>
    );
  }

  // Module status helpers — derive from the cohort state so the data
  // wiring stays in /data/live.ts and the page stays declarative.
  function moduleStatus(modId: string): 'complete' | 'in-progress' | 'available' {
    if (mockCohortState.modulesCompleteIds.includes(modId)) return 'complete';
    if (mockCohortState.moduleInProgressId === modId) return 'in-progress';
    return 'available';
  }

  const completeCount = mockCohortState.modulesCompleteIds.length;
  const totalModules = liveModules.length;
  const firstName = user.name.split(' ')[0];

  return (
    <>
      {/*
        Per-page CSS overrides. The shared <Navigation /> component is
        rendered in _app.tsx and uses a translucent cream background
        (`rgba(250, 247, 242, 0.82)` + backdrop blur) which reads as a
        muted grey when the page below it is navy. Repaint it white for
        this route only — scoped via :global() so the override applies
        only while the Live dashboard is mounted.
      */}
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

      {/* Live dashboard runs in its own visual world — navy background,
          gold accents. Wrapping <main> so the navigation chrome and
          footer (which use cream backgrounds) don't bleed through. */}
      <main className="page" style={{ background: 'var(--navy)', color: 'var(--cream)' }}>
        <div className="container grid gap-12">
          {/* ─── WELCOME HERO ─────────────────────────────────── */}
          <Card variant="hero" style={{ background: 'linear-gradient(135deg, var(--navy-soft) 0%, var(--navy) 100%)' }}>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-2">
                <span className="eyebrow" style={{ color: 'var(--gold-bright)' }}>
                  Mastery Live · {mockCohortState.cohortName}
                </span>
                <h3
                  className="font-display font-medium"
                  style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--cream)', lineHeight: 1.15 }}
                >
                  Welcome back, {firstName} —{' '}
                  <em style={{ fontStyle: 'italic', color: 'var(--gold-bright)', fontWeight: 400 }}>
                    your month {mockCohortState.monthOfTwelve} begins.
                  </em>
                </h3>
                <p style={{ color: 'rgba(250, 247, 242, 0.72)', maxWidth: 560, lineHeight: 1.55 }}>
                  Your coaching call this week is anchored on the Garland 142-unit
                  underwriting — Diva and Lou will walk through your assumptions live.
                </p>
              </div>
              <div className="flex flex-col items-start gap-3" style={{ minWidth: 240 }}>
                <ProgressBar current={completeCount} total={totalModules} />
                <Link
                  href="/live/dashboard"
                  className="btn-primary"
                  style={{ background: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--navy)' }}
                >
                  Resume program
                </Link>
              </div>
            </div>
          </Card>

          {/* ─── NEXT COACHING CALL · centerpiece ─────────────── */}
          <Card
            variant="offer"
            style={{
              background: 'linear-gradient(135deg, var(--navy-soft) 0%, #1f315a 100%)',
              border: '1px solid var(--gold)',
              color: 'var(--cream)',
              position: 'relative',
            }}
          >
            <span style={liveExclusiveBadge}>Live exclusive</span>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <span className="eyebrow" style={{ color: 'var(--gold-bright)' }}>Next coaching call</span>
                <h3 className="font-display" style={{ fontSize: 26, color: 'var(--gold-bright)', margin: '4px 0', fontWeight: 500 }}>
                  {mockCoachingCall.whenHuman}
                </h3>
                <p style={{ color: 'rgba(250, 247, 242, 0.78)', maxWidth: 460, margin: 0 }}>
                  with{' '}
                  <em style={{ fontStyle: 'italic', color: 'var(--gold-bright)' }}>Diva and Lou</em> —
                  focus: <strong>{mockCoachingCall.focus}.</strong> {mockCoachingCall.preBrief}
                </p>
              </div>
              <div className="flex flex-col gap-2 md:flex-row" style={{ gap: 10 }}>
                <a
                  href={mockCoachingCall.icsHref}
                  className="btn-primary"
                  style={{ background: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--navy)', whiteSpace: 'nowrap' }}
                >
                  Add to calendar
                </a>
                <a
                  href={mockCoachingCall.questionHref}
                  className="btn-secondary"
                  style={{ borderColor: 'var(--gold)', color: 'var(--gold-bright)', whiteSpace: 'nowrap' }}
                >
                  Submit a question
                </a>
              </div>
            </div>
          </Card>

          {/* ─── AI TUTOR + YOUR DEAL ─────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Tutor · gold-gradient first-class card */}
            <Card
              variant="offer"
              style={{
                background: 'linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%)',
                color: 'var(--navy)',
                border: '1px solid var(--gold)',
                position: 'relative',
              }}
            >
              <span style={{ ...liveExclusiveBadge, background: 'var(--navy)', color: 'var(--gold-bright)' }}>
                Live exclusive
              </span>
              <div className="flex flex-col gap-3">
                <span className="eyebrow" style={{ color: 'rgba(15, 30, 61, 0.65)' }}>AI tutor</span>
                <h3 className="font-display" style={{ fontSize: 22, color: 'var(--navy)', margin: 0, fontWeight: 500 }}>
                  Stuck on something? Ask the AI.
                </h3>
                <p style={{ color: 'rgba(15, 30, 61, 0.78)', margin: 0, maxWidth: 440 }}>
                  Trained on the Mastery curriculum and Rescia's deal-by-deal commentary.
                  Ask anything from "explain reversion cap rate" to "stress my Garland exit
                  assumptions at a 50bp cap expansion."
                </p>
                <div>
                  <Button
                    variant="primary"
                    style={{ background: 'var(--navy)', borderColor: 'var(--navy)', color: 'var(--gold-bright)' }}
                  >
                    Open AI tutor
                  </Button>
                </div>
              </div>
            </Card>

            {/* Your deal workspace */}
            <Card
              variant="offer"
              style={{
                background: '#1f315a',
                border: '1px solid rgba(184, 148, 90, 0.18)',
                color: 'var(--cream)',
                position: 'relative',
              }}
            >
              <span style={liveExclusiveBadge}>Live exclusive</span>
              <div className="flex flex-col gap-2">
                <span className="eyebrow" style={{ color: 'var(--gold)' }}>Your deal</span>
                <h3 className="font-display" style={{ fontSize: 19, color: 'var(--gold-bright)', margin: '4px 0 12px', fontWeight: 500 }}>
                  {mockDeal.name}
                </h3>
                <DealRow k="Status" v={mockDeal.status} highlight />
                <DealRow k="Underwritten YOC" v={mockDeal.yoc} />
                <DealRow k="Target IRR" v={mockDeal.irr} />
                <DealRow k="Coaching focus" v={mockDeal.coachingFocus} />
              </div>
            </Card>
          </div>

          {/* ─── CURRICULUM (12 modules unlocked) ─────────────── */}
          <section>
            <div className="section-head" style={{ marginBottom: 24 }}>
              <span className="eyebrow" style={{ color: 'var(--gold)' }}>Your curriculum</span>
              <h2 style={{ fontSize: 28, color: 'var(--cream)' }}>All 12 modules · unlocked from day one</h2>
              <p style={{ color: 'rgba(250, 247, 242, 0.62)' }}>
                Work them in sequence; the preferred course progression — or jump ahead.
                Diva and Lou track your progress and bring it into coaching.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveModules.map((m) => {
                const status = moduleStatus(m.id);
                return (
                  <div
                    key={m.id}
                    className="module"
                    style={liveModuleStyle(status)}
                  >
                    <span className="num" style={{ color: 'var(--gold)' }}>
                      Module {m.num} · {m.duration}
                    </span>
                    <h4 style={{ color: 'var(--cream)' }}>{m.title}</h4>
                    <p style={{ color: 'rgba(250, 247, 242, 0.62)' }}>{m.description}</p>
                    <span
                      className="status"
                      style={{
                        color:
                          status === 'in-progress'
                            ? 'var(--gold-bright)'
                            : status === 'complete'
                            ? 'rgba(250, 247, 242, 0.62)'
                            : 'rgba(250, 247, 242, 0.42)',
                      }}
                    >
                      {status === 'complete'
                        ? 'Complete'
                        : status === 'in-progress'
                        ? `In progress · ${mockCohortState.moduleInProgressPct}%`
                        : 'Available'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ─── DEAL MEMOS + TOOLKIT ─────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              variant="offer"
              style={{
                background: '#1f315a',
                border: '1px solid rgba(184, 148, 90, 0.18)',
                color: 'var(--cream)',
                position: 'relative',
              }}
            >
              <span style={liveExclusiveBadge}>Live exclusive</span>
              <span className="eyebrow" style={{ color: 'var(--gold)' }}>
                Deal memos · from the Rescia desk
              </span>
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
                  <Link
                    href="/templates"
                    className="btn-secondary"
                    style={{ borderColor: 'var(--gold)', color: 'var(--gold-bright)' }}
                  >
                    Open toolkit
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* ─── WEEKLY READS · curated Tuesdays ──────────────── */}
          <Card
            variant="offer"
            style={{
              background: '#1f315a',
              border: '1px solid rgba(184, 148, 90, 0.18)',
              color: 'var(--cream)',
            }}
          >
            <div className="flex flex-col gap-3">
              <span className="eyebrow" style={{ color: 'var(--gold)' }}>
                This week's reads · curated Tuesdays
              </span>
              <h3 className="font-display" style={{ fontSize: 20, color: 'var(--cream)', margin: 0, fontWeight: 500 }}>
                What we're reading this week.
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginTop: 6 }}>
                {mockWeeklyReads.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--navy)',
                      border: '1px solid rgba(184, 148, 90, 0.18)',
                      borderRadius: 4,
                      padding: '14px 16px',
                    }}
                  >
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
                    </div>
                    <div style={{ color: 'rgba(250, 247, 242, 0.62)', fontSize: 12, lineHeight: 1.45 }}>
                      {r.why}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer · navy variant so the chrome stays consistent */}
      <footer style={{ background: 'var(--navy-deep)', color: 'rgba(250, 247, 242, 0.6)', padding: '28px 0', fontSize: 12 }}>
        <div className="container" style={{ textAlign: 'center', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Rescia Properties · Mastery Live · {mockCohortState.cohortName}
        </div>
      </footer>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Small helpers + style objects kept in-file so the page stays one
// import. Promote to /components when a second Live page reuses them.
// ─────────────────────────────────────────────────────────────────────

// Block-level badge sitting at the top of a Live-only card. Block
// display + width:fit-content forces the badge onto its own line so
// the following eyebrow / heading content starts cleanly on a new
// line below — earlier inline-block sat next to the eyebrow text on
// the Deal Memos card and crowded it.
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

function liveModuleStyle(status: 'complete' | 'in-progress' | 'available'): React.CSSProperties {
  return {
    background: '#1f315a',
    border: '1px solid rgba(184, 148, 90, 0.18)',
    borderLeft: `3px solid ${status === 'in-progress' ? 'var(--gold-bright)' : 'var(--gold)'}`,
    borderRadius: 4,
  };
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
