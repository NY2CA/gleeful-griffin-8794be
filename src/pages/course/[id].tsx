import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import TopicAccordion from '@/components/TopicAccordion';
import { useAuth } from '@/hooks/useAuth';
import { useCourse } from '@/hooks/useCourse';
import { useBilling } from '@/hooks/useBilling';
import type { QuizItem, Mistake } from '@/data/courses';

type Tab = 'deep' | 'quiz' | 'mistakes';

/**
 * Color-coded difficulty pill rendered in the quiz tab. Foundation =
 * recall, Application = apply a concept/calc, Operator = real-deal
 * judgment call. Designed to be understated so it doesn't compete with
 * the question prose.
 */
function DifficultyBadge({ level }: { level: NonNullable<QuizItem['difficulty']> }) {
  const styles: Record<NonNullable<QuizItem['difficulty']>, { bg: string; fg: string; label: string }> = {
    foundation: {
      bg: 'rgba(79, 109, 122, 0.10)',
      fg: 'var(--ink-dim)',
      label: 'Foundation',
    },
    application: {
      bg: 'var(--gold-soft)',
      fg: 'var(--gold-deep)',
      label: 'Application',
    },
    operator: {
      bg: 'rgba(43, 60, 90, 0.10)',
      fg: 'var(--navy)',
      label: 'Operator',
    },
  };
  const s = styles[level];
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontFamily: 'var(--mono, ui-monospace, monospace)',
        fontSize: 9,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        padding: '3px 9px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

/**
 * Smooth-scrolls to a topic id on the deep-dive accordion. Used by the
 * "Source: …" backlink under each quiz item so students who miss a
 * question can jump to the source topic.
 */
function jumpToTopic(topicId: string, switchTab: (t: Tab) => void) {
  switchTab('deep');
  setTimeout(() => {
    document.getElementById(topicId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 60);
}

/**
 * Renders a single structured Mistake — trap visible, why+fix revealed
 * on click. Mirrors the quiz reveal pattern visually so the two tabs
 * feel like one discipline, not two.
 *
 * Only used when the underlying mistake is the upgraded object shape;
 * legacy string mistakes render inline in the parent. Type narrowing
 * happens at the call site.
 */
function MistakeCard({
  item,
  index,
  revealed,
  onToggle,
  jumpToTopic,
}: {
  item: Exclude<Mistake, string>;
  index: number;
  revealed: boolean;
  onToggle: () => void;
  jumpToTopic: (topicId: string) => void;
}) {
  return (
    <div className="bg-white border border-line rounded-xs p-5">
      <div className="flex items-start gap-4">
        <span
          className="font-mono text-[11px] tracking-[0.18em] pt-1"
          style={{ color: 'var(--gold-deep)' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex-1">
          <p className="text-ink font-medium leading-relaxed">{item.trap}</p>
          {!revealed && (
            <button
              type="button"
              onClick={onToggle}
              className="mt-3 text-sm font-mono tracking-wider"
              style={{
                color: 'var(--gold-deep)',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                fontSize: 11,
              }}
            >
              Show fix &rarr;
            </button>
          )}
          {revealed && (
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <span
                  className="eyebrow block mb-1"
                  style={{ color: 'var(--ink-dim)' }}
                >
                  Why operators fall for it
                </span>
                <p className="text-ink-dim text-sm leading-relaxed">{item.why}</p>
              </div>
              <div
                className="rounded-xs p-4"
                style={{
                  background: 'var(--cream-warm)',
                  borderLeft: '3px solid var(--gold)',
                }}
              >
                <span
                  className="eyebrow block mb-1"
                  style={{ color: 'var(--gold-deep)' }}
                >
                  Fix
                </span>
                <p className="text-ink text-sm leading-relaxed">{item.fix}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                {item.topicId && (
                  <button
                    type="button"
                    onClick={() => jumpToTopic(item.topicId!)}
                    className="text-xs underline underline-offset-2"
                    style={{ color: 'var(--ink-dim)' }}
                  >
                    Back to source topic &rarr;
                  </button>
                )}
                <button
                  type="button"
                  onClick={onToggle}
                  className="text-xs underline underline-offset-2"
                  style={{ color: 'var(--ink-dim)' }}
                >
                  Hide fix
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoursePlayerPage() {
  const router = useRouter();
  const rawId = router.query.id;
  const moduleId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { user, loading } = useAuth();
  const { course, modules, progress, isComplete, markComplete, getNextModule } =
    useCourse('multifamily-mastery');
  const { status: billing, loading: billingLoading } = useBilling({ enabled: Boolean(user) });
  const [tab, setTab] = useState<Tab>('deep');
  // Track which quiz items have had their answer revealed. Reset when the
  // student navigates to a different module so each one starts fresh.
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  // Same pattern for the upgraded Common Mistakes tab — each card starts
  // collapsed showing the trap, expands to reveal the why + fix.
  const [revealedMistakes, setRevealedMistakes] = useState<Set<number>>(new Set());
  useEffect(() => {
    setRevealedAnswers(new Set());
    setRevealedMistakes(new Set());
  }, [moduleId]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // Paywall: authenticated but no active plan → send to /pricing.
  useEffect(() => {
    if (loading || billingLoading) return;
    if (!user) return;
    if (billing && !billing.hasAccess) {
      router.replace('/pricing');
    }
  }, [loading, billingLoading, user, billing, router]);

  if (!moduleId || !course) {
    return (
      <main className="page page-center">
        <div className="container text-center text-ink-dim">Loading…</div>
      </main>
    );
  }

  const mod = modules.find((m) => m.id === moduleId);
  if (!mod) {
    return (
      <main className="page page-center">
        <div className="container text-center">
          <p className="text-ink-dim mb-4">That module could not be found.</p>
          <Link href="/dashboard" className="btn-primary">Back to dashboard</Link>
        </div>
      </main>
    );
  }

  const next = getNextModule(mod.id);
  const done = isComplete(mod.id);

  return (
    <>
    <main className="page">
      <div className="container grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* LEFT — player + content */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="eyebrow hover:text-navy">
              &larr; Dashboard
            </Link>
            <span className="font-mono text-[11px] tracking-[0.18em] text-ink-dim">
              {mod.duration}
            </span>
          </div>

          {/* Video frame (16:9) — renders YouTube embed when videoUrl is set,
              otherwise shows a placeholder until intro video lands. */}
          <div
            className="w-full bg-navy rounded-sm overflow-hidden"
            style={{ aspectRatio: '16 / 9', boxShadow: 'var(--shadow-card)' }}
          >
            {mod.videoUrl ? (
              <iframe
                src={mod.videoUrl}
                title={mod.title}
                className="w-full h-full"
                style={{ border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cream-warm font-mono text-xs tracking-[0.18em]">
                INTRO VIDEO COMING SOON
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display font-medium text-navy" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}>
              {mod.title}
            </h1>
            <p className="text-ink-dim mt-3 leading-relaxed">{mod.description}</p>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button className={tab === 'deep' ? 'active' : ''} onClick={() => setTab('deep')}>
              Deep Dive
            </button>
            <button className={tab === 'quiz' ? 'active' : ''} onClick={() => setTab('quiz')}>
              Quiz Me
            </button>
            <button className={tab === 'mistakes' ? 'active' : ''} onClick={() => setTab('mistakes')}>
              Common Mistakes
            </button>
          </div>

          <div>
            {tab === 'deep' && (
              mod.topics && mod.topics.length > 0 ? (
                <TopicAccordion topics={mod.topics} />
              ) : (
                <div className="bg-white border border-line rounded-xs p-8">
                  <ul className="space-y-4">
                    {mod.deepDive.map((item, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="font-mono text-[11px] tracking-[0.18em] text-gold-deep pt-1">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <p className="text-ink">{item}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-ink-dim text-xs mt-6 pt-4 border-t border-line">
                    Full topic breakdown coming in the next content release.
                  </p>
                </div>
              )
            )}
            {tab === 'quiz' && (
              <div className="bg-white border border-line rounded-xs p-8 space-y-8">
                <p className="text-ink-dim text-sm" style={{ marginTop: '-8px' }}>
                  Try to form your answer first. Then click <strong>Show answer</strong>{' '}
                  to compare against the model response, with optional reveals for the
                  reasoning and the most common wrong answer.
                </p>
                {mod.quiz.map((item, i) => {
                  const revealed = revealedAnswers.has(i);
                  return (
                    <div
                      key={i}
                      className="border-b border-line pb-6 last:border-0 last:pb-0"
                    >
                      {/* Question — always visible */}
                      <div className="flex items-start gap-3 flex-wrap">
                        <span
                          className="font-mono text-[11px] tracking-[0.18em] pt-2"
                          style={{ color: 'var(--gold-deep)' }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {item.difficulty && (
                          <span className="pt-1">
                            <DifficultyBadge level={item.difficulty} />
                          </span>
                        )}
                        <p
                          className="font-display text-lg text-navy flex-1 min-w-0 leading-snug"
                          style={{ margin: 0 }}
                        >
                          {item.q}
                        </p>
                      </div>

                      {/* Reveal control / answer block */}
                      <div className="mt-4 ml-8">
                        {!revealed ? (
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedAnswers((prev) => new Set(prev).add(i))
                            }
                            className="btn-secondary"
                            style={{ fontSize: 13, padding: '8px 16px' }}
                          >
                            Show answer →
                          </button>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div
                              className="rounded-xs p-4"
                              style={{
                                background: 'var(--cream-warm)',
                                borderLeft: '3px solid var(--gold)',
                              }}
                            >
                              <span
                                className="eyebrow block mb-2"
                                style={{ color: 'var(--gold-deep)' }}
                              >
                                Model answer
                              </span>
                              <p className="text-ink leading-relaxed">{item.a}</p>
                            </div>
                            {item.why && (
                              <details className="text-sm">
                                <summary
                                  className="cursor-pointer eyebrow"
                                  style={{ color: 'var(--gold-deep)' }}
                                >
                                  Why this is right
                                </summary>
                                <p className="mt-2 text-ink-dim leading-relaxed">
                                  {item.why}
                                </p>
                              </details>
                            )}
                            {item.trap && (
                              <details className="text-sm">
                                <summary
                                  className="cursor-pointer eyebrow"
                                  style={{ color: 'var(--gold-deep)' }}
                                >
                                  Common wrong answer
                                </summary>
                                <p className="mt-2 text-ink-dim leading-relaxed">
                                  {item.trap}
                                </p>
                              </details>
                            )}
                            <div className="flex items-center gap-4 pt-1 flex-wrap">
                              {item.topicId && (
                                <button
                                  type="button"
                                  onClick={() => jumpToTopic(item.topicId!, setTab)}
                                  className="text-xs text-navy underline underline-offset-2"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                  }}
                                >
                                  ← Back to source topic
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealedAnswers((prev) => {
                                    const next = new Set(prev);
                                    next.delete(i);
                                    return next;
                                  })
                                }
                                className="text-xs text-ink-dim underline underline-offset-2 ml-auto"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  cursor: 'pointer',
                                }}
                              >
                                Hide answer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {tab === 'mistakes' && (
              <div className="bg-white border border-line rounded-xs p-8">
                {/* Per-module Common Mistakes. Two render paths: legacy
                    single-string callouts and the upgraded trap/why/fix
                    triplet tied to a source topic. The structured shape
                    mirrors the quiz pattern — trap on top, why and fix
                    layered below — so a student can scan or drill in. */}
                <p className="text-ink-dim mb-6 text-sm leading-relaxed">
                  Each mistake below is tied to a specific topic and follows the same
                  {' '}<strong>trap → why → fix</strong> pattern operators use in post-mortems.
                  Click <em>Show fix</em> to reveal the corrective action.
                </p>
                <ul className="flex flex-col gap-5">
                  {mod.mistakes.map((item, i) => (
                    <li key={i}>
                      {typeof item === 'string' ? (
                        <div className="flex gap-4">
                          <span className="font-mono text-[11px] tracking-[0.18em] text-gold-deep pt-1">
                            ×
                          </span>
                          <p className="text-ink leading-relaxed">{item}</p>
                        </div>
                      ) : (
                        <MistakeCard
                          item={item}
                          index={i}
                          revealed={revealedMistakes.has(i)}
                          onToggle={() => {
                            setRevealedMistakes((prev) => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              return next;
                            });
                          }}
                          jumpToTopic={(topicId) => jumpToTopic(topicId, setTab)}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant={done ? 'secondary' : 'primary'}
              onClick={() => markComplete(mod.id, !done)}
            >
              {done ? '✓ Completed · undo' : 'Mark complete'}
            </Button>
            {next ? (
              <Link href={`/course/${next.id}`} className="btn-secondary">
                Next lesson →
              </Link>
            ) : (
              <Link href="/dashboard" className="btn-secondary">
                Back to dashboard
              </Link>
            )}
          </div>
        </section>

        {/* RIGHT — progress + module list */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-[108px] h-fit">
          <div>
            <span className="eyebrow">Program progress</span>
            <div className="mt-2">
              <ProgressBar current={progress.completed} total={progress.total} showLabel />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {modules.map((m, i) => {
              const active = m.id === mod.id;
              const c = isComplete(m.id);
              const cls = `module compact ${active ? 'active' : c ? 'completed' : 'in-progress'}`;
              return (
                <Link
                  key={m.id}
                  href={`/course/${m.id}`}
                  className={cls}
                  style={{ textDecoration: 'none' }}
                >
                  <span className="num">
                    Week {i + 1} · {c ? 'Completed' : active ? 'Now playing' : m.duration}
                  </span>
                  <h4>{m.title.replace(/^Week \d+\s·\s/, '')}</h4>
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </main>

    {/* ========== FOOTER ========== */}
    {/* Replicates the landing page .footer-brand pattern so members see the
        same Rescia/Multifamily Mastery branding and program tagline at the
        bottom of every course module page. The CSS class hooks (.footer-brand,
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
