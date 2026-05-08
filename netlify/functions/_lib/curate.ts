/**
 * Shared weekly-reads curation logic · Wave 16.1
 *
 * Used by two callers:
 *   - admin-suggest-weekly-reads · admin-triggered "Refresh from autofeed"
 *     button on the /admin/weekly-reads form
 *   - scheduled-weekly-reads · Tuesday 8am ET cron auto-publish
 *
 * Both call `curateWeeklyReadsFromWeb()` which uses Claude with the
 * web_search tool to find current multifamily articles, then asks Claude
 * to return them as a strict-JSON array of {source, dateLabel, title, why,
 * href} objects. Default 3 articles, max 5.
 *
 * Returns null on any failure (Anthropic API error, parse failure, empty
 * search). The two callers handle null differently — admin endpoint
 * returns 502, scheduled cron just logs and skips the publish.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { WeeklyReadArticle } from './store';

const MODEL = 'claude-haiku-4-5-20251001';

export interface CurationResult {
  articles: WeeklyReadArticle[];
  /** Raw Claude response text · for debugging when JSON parse fails. */
  raw?: string;
}

export async function curateWeeklyReadsFromWeb(
  count: 3 | 4 | 5 = 3,
): Promise<CurationResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[curate] ANTHROPIC_API_KEY not set');
    return null;
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = [
    'You are a multifamily real estate news curator for an audience of active operators',
    'and syndicators (LPs and GPs running deals at $5M-$50M scale). Your job is to find',
    `${count} articles from the past 7 days that move the needle on real underwriting,`,
    'debt structure, market positioning, or operations decisions. Avoid: generic',
    "investing 101 content, listicles, sponsored content, and anything older than a week.",
  ].join(' ');

  const userPrompt = [
    `Search the web for ${count} multifamily real estate articles published in the last`,
    '7 days that would be useful reading for active multifamily operators. Prefer:',
    'CBRE, Multi-Housing News, Multifamily Dive, NMHC, Yardi Matrix, NAHB, Bisnow,',
    'GlobeSt, JLL, RealPage, Trepp, Marcus & Millichap. Topics that are most useful:',
    'cap rate movements, debt market shifts (agency, bridge, CMBS), supply/absorption',
    'reads, rent growth by market, property tax / insurance shocks, regulatory changes,',
    'deal structuring trends, operator-level NOI levers.',
    '',
    'Return EXACTLY this JSON shape, no prose, no markdown fences, no commentary:',
    '',
    `{"articles":[{"source":"...","dateLabel":"...","title":"...","why":"...","href":"https://..."}]}`,
    '',
    'Field rules:',
    '- source: publication name only (e.g. "Multi-Housing News")',
    '- dateLabel: short human date like "May 5" or "Q1 2026"',
    '- title: article headline, no quotes around it',
    '- why: ONE line (max 200 chars) explaining why an active operator should read this',
    '- href: full https:// URL to the actual article (not the publication homepage)',
    '',
    `Return exactly ${count} articles. If you can't find ${count} fresh articles, find as many`,
    'as you can up to that count — but never include placeholder URLs or invented titles.',
  ].join('\n');

  let response: Anthropic.Messages.Message;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      tools: [
        // Anthropic web search tool · gives Claude live web access
        // for the curation. Capped at 3 web-search calls per request.
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3,
        } as unknown as Anthropic.Messages.Tool,
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });
  } catch (err) {
    console.error('[curate] Anthropic API error', err);
    return null;
  }

  // Walk the content blocks to find the final text block (Claude returns
  // tool_use blocks for the web searches plus a final text block with the
  // structured JSON output).
  let text = '';
  for (const block of response.content) {
    if (block.type === 'text') {
      text += block.text;
    }
  }

  if (!text.trim()) {
    console.warn('[curate] Claude returned no text content');
    return null;
  }

  // Strip code fences if Claude returned them despite the instruction
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  let parsed: { articles?: unknown };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Sometimes Claude returns JSON wrapped in extra prose. Try to extract
    // the first top-level JSON object.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn('[curate] Could not parse JSON from Claude output', { raw: cleaned.slice(0, 400) });
      return { articles: [], raw: cleaned };
    }
    try {
      parsed = JSON.parse(match[0]);
    } catch (err) {
      console.warn('[curate] Final JSON parse failed', err);
      return { articles: [], raw: cleaned };
    }
  }

  const list = Array.isArray(parsed.articles) ? parsed.articles : [];
  const articles: WeeklyReadArticle[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const a = item as Record<string, unknown>;
    const source = typeof a.source === 'string' ? a.source.trim() : '';
    const title = typeof a.title === 'string' ? a.title.trim() : '';
    const href = typeof a.href === 'string' ? a.href.trim() : '';
    if (!source || !title || !href || !/^https?:\/\//i.test(href)) continue;
    articles.push({
      source: source.slice(0, 80),
      dateLabel: typeof a.dateLabel === 'string' ? a.dateLabel.trim().slice(0, 40) : '',
      title: title.slice(0, 200),
      why: typeof a.why === 'string' ? a.why.trim().slice(0, 280) : '',
      href: href.slice(0, 1000),
    });
    if (articles.length >= count) break;
  }

  return { articles, raw: cleaned };
}
