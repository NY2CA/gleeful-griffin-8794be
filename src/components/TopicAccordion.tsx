import { useState } from 'react';
import type { Topic } from '@/data/courses';

/**
 * Renders a module's topics as an accordion of expandable cards. Each card
 * shows the topic title + summary closed; expands to show the full body,
 * worked example, pitfalls, and related-topic chips.
 *
 * Markdown in `body` is intentionally minimal — we handle `**bold**`,
 * `_italic_`, and paragraph breaks. No external dependency.
 */
export default function TopicAccordion({ topics }: { topics: Topic[] }) {
  const [open, setOpen] = useState<string | null>(topics[0]?.id ?? null);

  if (!topics?.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {topics.map((t, i) => {
        const isOpen = open === t.id;
        return (
          <div
            key={t.id}
            id={t.id}
            className="bg-white border border-line rounded-xs overflow-hidden"
            style={{
              boxShadow: isOpen ? 'var(--shadow-soft)' : undefined,
              borderColor: isOpen ? 'var(--gold)' : undefined,
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : t.id)}
              className="w-full text-left p-6 flex items-start gap-4 hover:bg-cream-warm transition-colors"
              aria-expanded={isOpen}
            >
              <span
                className="font-mono text-[11px] tracking-[0.18em] pt-1"
                style={{ color: 'var(--gold-deep)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1">
                <h4 className="font-display text-lg text-navy leading-snug">{t.title}</h4>
                <p className="text-ink-dim mt-1 text-sm leading-relaxed">{t.summary}</p>
              </div>
              <span
                className="text-ink-dim text-lg pt-1 transition-transform"
                style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}
                aria-hidden
              >
                +
              </span>
            </button>

            {isOpen && (
              <div className="px-6 pb-6 pl-[68px] flex flex-col gap-5 border-t border-line pt-5">
                <TopicBody markdown={t.body} />

                {t.example && (
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
                      Worked example
                    </span>
                    <p className="text-ink leading-relaxed text-sm">{t.example}</p>
                  </div>
                )}

                {t.pitfalls && t.pitfalls.length > 0 && (
                  <div>
                    <span className="eyebrow block mb-2">Common pitfalls</span>
                    <ul className="space-y-2">
                      {t.pitfalls.map((p, j) => (
                        <li key={j} className="flex gap-2 text-ink text-sm leading-relaxed">
                          <span
                            className="font-mono text-[11px] pt-1"
                            style={{ color: 'var(--gold-deep)' }}
                          >
                            ×
                          </span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {t.related && t.related.length > 0 && (
                  <div>
                    <span className="eyebrow block mb-2">Related</span>
                    <div className="flex flex-wrap gap-2">
                      {t.related.map((id) => {
                        const target = topics.find((x) => x.id === id);
                        const label = target?.title ?? id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              if (target) {
                                setOpen(id);
                                // Defer so the DOM paints before we scroll.
                                setTimeout(() => {
                                  document
                                    .getElementById(id)
                                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 30);
                              }
                            }}
                            className="text-xs px-3 py-1 rounded-xs border border-line hover:border-gold hover:text-navy transition-colors"
                            style={{ color: 'var(--ink-dim)' }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Tiny markdown renderer — handles **bold**, _italic_, and paragraph
 * breaks (blank line = new paragraph). Safe against HTML injection because
 * we never use dangerouslySetInnerHTML: we render inline segments via
 * React nodes.
 */
function TopicBody({ markdown }: { markdown: string }) {
  const paragraphs = markdown.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-3 text-ink leading-relaxed">
      {paragraphs.map((p, i) => (
        <p key={i}>{renderInline(p)}</p>
      ))}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  // Tokenize: split on **…** and _…_ boundaries. Keep delimiters in the output.
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="text-navy">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^_[^_]+_$/.test(part)) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}
