import React, { useState } from 'react';
import type { Topic } from '@/data/courses';
import { api, ApiError } from '@/lib/api';

/**
 * Inline "Ask about this topic" assistant. Lives at the bottom of an open
 * topic accordion. Sends the topic context + the student's question to
 * /api/ai/ask, which is gated by access + rate-limit.
 */

interface AskAboutTopicProps {
  topic: Topic;
  moduleTitle?: string;
}

interface AskResponse {
  answer: string;
  usage: { used: number; limit: number; remaining: number };
  topicId: string;
}

export default function AskAboutTopic({ topic, moduleTitle }: AskAboutTopicProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [usage, setUsage] = useState<AskResponse['usage'] | null>(null);

  async function ask() {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setErr(null);
    setAnswer(null);
    try {
      const data = await api<AskResponse>('/api/ai/ask', {
        method: 'POST',
        body: {
          question: q,
          moduleTitle,
          topic: {
            id: topic.id,
            title: topic.title,
            summary: topic.summary,
            body: topic.body,
            example: topic.example,
            pitfalls: topic.pitfalls,
          },
        },
      });
      setAnswer(data.answer);
      setUsage(data.usage);
    } catch (e) {
      if (e instanceof ApiError) {
        setErr(e.message);
      } else {
        setErr('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void ask();
    }
  }

  return (
    <div
      className="rounded-xs"
      style={{
        background: 'var(--cream-warm)',
        borderLeft: '3px solid var(--navy)',
        padding: 16,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow" style={{ color: 'var(--navy)' }}>
          Ask about this topic
        </span>
        {usage && (
          <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>
            {usage.remaining}/{usage.limit} questions left today
          </span>
        )}
      </div>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKey}
        placeholder={`e.g. "How would I size the loan if DSCR comes in at 1.18 instead of 1.25?"`}
        rows={2}
        disabled={loading}
        style={{
          width: '100%',
          padding: 10,
          border: '1px solid var(--line)',
          borderRadius: 4,
          fontFamily: 'inherit',
          fontSize: 14,
          resize: 'vertical',
          background: 'white',
          color: 'var(--ink)',
        }}
      />

      <div className="flex items-center justify-between mt-2 gap-3">
        <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>
          Tip: ⌘/Ctrl + Enter to ask. Answers stay grounded in this topic.
        </span>
        <button
          type="button"
          onClick={() => void ask()}
          disabled={loading || !question.trim()}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            fontSize: 14,
            background: loading ? 'var(--ink-dim)' : 'var(--navy)',
            borderColor: loading ? 'var(--ink-dim)' : 'var(--navy)',
            opacity: !question.trim() ? 0.6 : 1,
          }}
        >
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </div>

      {err && (
        <p
          style={{
            color: '#b91c1c',
            background: '#fef2f2',
            padding: 10,
            marginTop: 12,
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {err}
        </p>
      )}

      {answer && (
        <div
          style={{
            background: 'white',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: 14,
            marginTop: 12,
          }}
        >
          <span
            className="eyebrow block mb-2"
            style={{ color: 'var(--gold-deep)', fontSize: 11 }}
          >
            Coach
          </span>
          <AnswerBody text={answer} />
        </div>
      )}
    </div>
  );
}

/**
 * Lightweight renderer for the AI answer — preserves paragraph breaks and
 * bullet/numbered lines without pulling in a markdown dependency.
 */
function AnswerBody({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-3" style={{ color: 'var(--ink)', lineHeight: 1.6, fontSize: 14 }}>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const allBullets = lines.every((l) => /^\s*[-*]\s+/.test(l));
        const allNumbered = lines.every((l) => /^\s*\d+[.)]\s+/.test(l));
        if (allBullets && lines.length > 1) {
          return (
            <ul key={i} style={{ paddingLeft: 18, margin: 0 }}>
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.replace(/^\s*[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        if (allNumbered && lines.length > 1) {
          return (
            <ol key={i} style={{ paddingLeft: 22, margin: 0 }}>
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>
              ))}
            </ol>
          );
        }
        return <p key={i} style={{ margin: 0 }}>{renderInline(block)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} style={{ color: 'var(--navy)' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code
          key={i}
          style={{
            background: 'var(--cream-warm)',
            padding: '1px 5px',
            borderRadius: 3,
            fontSize: 13,
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
