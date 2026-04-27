import type { Config } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import { getStore } from '@netlify/blobs';
import { requireSession } from './_lib/auth';
import { getUserByEmail, hasActiveAccess } from './_lib/store';
import { json, error, handleOptions, parseJsonBody } from './_lib/response';

/**
 * POST /api/ai/ask
 * Body: { question: string, topic: { id, title, summary, body, example?, pitfalls?[] }, moduleTitle?: string }
 *
 * Lou's Multifamily Mastery course helper, powered by Claude Haiku. Each
 * request injects the active topic as context so answers stay grounded in
 * the curriculum rather than going general-purpose.
 *
 * Gating: must be authenticated AND have active access (admin / lifetime /
 * active subscription / admin-granted).
 *
 * Rate limit: 25 calls per user per UTC day. We persist a small counter in
 * Netlify Blobs keyed by `${userId}:${YYYY-MM-DD}`.
 *
 * Required env: ANTHROPIC_API_KEY  (set in Netlify site → Environment).
 */

const DAILY_LIMIT = 25;
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 700;

interface TopicCtx {
  id: string;
  title: string;
  summary: string;
  body: string;
  example?: string;
  pitfalls?: string[];
}

interface Body {
  question?: string;
  topic?: TopicCtx;
  moduleTitle?: string;
}

function rateStore() {
  return getStore({ name: 'aiUsage', consistency: 'strong' });
}

function todayKey(userId: string): string {
  const d = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  return `${userId}:${d}`;
}

async function checkAndIncrement(userId: string): Promise<{ allowed: boolean; used: number }> {
  const store = rateStore();
  const key = todayKey(userId);
  const current = ((await store.get(key, { type: 'json' })) as { n?: number } | null)?.n ?? 0;
  if (current >= DAILY_LIMIT) return { allowed: false, used: current };
  await store.setJSON(key, { n: current + 1 });
  return { allowed: true, used: current + 1 };
}

function buildSystemPrompt(moduleTitle: string | undefined): string {
  return [
    'You are the in-line study coach inside Multifamily Mastery, a 12-week multifamily real-estate program by Rescia Properties.',
    'You answer student questions about a single topic from the curriculum.',
    'Stay strictly within multifamily real-estate investing, capital structure, underwriting, operations, asset management, exits, and the practical mechanics that operators use day-to-day.',
    'When a question drifts off-topic, redirect to the active topic instead of answering it.',
    'Use the supplied topic context as the source of truth — do not contradict the program. If the topic context is silent on something, you can add useful context but flag it as outside the topic.',
    'Be concise: 3-6 short paragraphs or a tight bullet list. Cite real numbers in worked examples when it helps.',
    'Never invent specific deals, securities, or legal advice. Suggest the student bring deal-specific questions to a CPA, securities attorney, or PM as appropriate.',
    moduleTitle ? `The active module is: ${moduleTitle}.` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function formatTopicContext(t: TopicCtx): string {
  const parts: string[] = [];
  parts.push(`# Topic: ${t.title} (${t.id})`);
  if (t.summary) parts.push(`**Summary**: ${t.summary}`);
  if (t.body) parts.push(`**Lesson body**:\n${t.body}`);
  if (t.example) parts.push(`**Worked example**:\n${t.example}`);
  if (t.pitfalls?.length) {
    parts.push(
      `**Common pitfalls**:\n${t.pitfalls.map((p) => `- ${p}`).join('\n')}`
    );
  }
  return parts.join('\n\n');
}

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return error('Method not allowed', 405);

  const session = await requireSession(req);
  if (!session) return error('Not authenticated', 401);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[ai-ask] ANTHROPIC_API_KEY is not set');
    return error('AI assistant is not configured on this site', 503);
  }

  let body: Body;
  try {
    body = await parseJsonBody<Body>(req);
  } catch {
    return error('Invalid JSON body', 400);
  }

  const question = (body.question || '').trim();
  if (!question) return error('question is required', 400);
  if (question.length > 1500) return error('Question is too long (max 1500 chars)', 400);

  const topic = body.topic;
  if (!topic || !topic.id || !topic.title) {
    return error('topic context is required', 400);
  }

  // Access check — must be a paying member, lifetime, admin-granted, or admin.
  const user = await getUserByEmail(session.email);
  if (!user) return error('Account not found', 404);
  if (!hasActiveAccess(user)) {
    return error('Active membership required to use the AI assistant', 402);
  }

  // Rate limit.
  const rate = await checkAndIncrement(user.id);
  if (!rate.allowed) {
    return error(
      `Daily AI limit reached (${DAILY_LIMIT}/day). Resets at 00:00 UTC.`,
      429,
      { used: rate.used, limit: DAILY_LIMIT }
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    const system = buildSystemPrompt(body.moduleTitle);
    const topicBlock = formatTopicContext(topic);

    const completion = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: topicBlock },
            { type: 'text', text: `Student question:\n${question}` },
          ],
        },
      ],
    });

    const answer = completion.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .trim();

    return json({
      answer,
      usage: {
        used: rate.used,
        limit: DAILY_LIMIT,
        remaining: Math.max(0, DAILY_LIMIT - rate.used),
      },
      topicId: topic.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed';
    console.error('[ai-ask] error', err);
    return error('Unable to reach the AI assistant. Please try again.', 502, {
      detail: message.slice(0, 200),
    });
  }
};

export const config: Config = {
  path: '/api/ai/ask',
};
