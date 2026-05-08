import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import { isAdminEmail } from './_lib/store';
import { json, error, handleOptions } from './_lib/response';
import { curateWeeklyReadsFromWeb } from './_lib/curate';

/**
 * POST /api/admin/suggest-weekly-reads · Wave 16.1
 *
 * Admin-triggered "Refresh from autofeed" call. Uses Claude with the
 * web_search tool to find fresh multifamily articles from the past week.
 * Returns suggestions to the admin form for review — does NOT publish.
 * Admin reviews, edits, swaps, then clicks Publish to save.
 *
 * Default count: 3. Admin can request 4 or 5 via ?count=N query param.
 *
 * Response: { articles: WeeklyReadArticle[], raw?: string }
 *   - articles is the parsed list (always 0-5 items)
 *   - raw is the literal Claude response text (only when parse partially fails)
 *
 * Admin-gated. Costs ~$0.01-0.02 per call (Claude Haiku + a few web searches).
 */
export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return error('Method not allowed', 405);

  const session = await requireSession(req);
  if (!session) return error('Not authenticated', 401);
  if (!isAdminEmail(session.email)) return error('Forbidden', 403);

  // Parse `count` from query string · default 3, accept 3-5
  const url = new URL(req.url);
  const countParam = parseInt(url.searchParams.get('count') || '3', 10);
  const count: 3 | 4 | 5 = countParam === 4 ? 4 : countParam === 5 ? 5 : 3;

  const result = await curateWeeklyReadsFromWeb(count);
  if (!result) {
    return error(
      'Article curation failed. Check ANTHROPIC_API_KEY env var and Function logs.',
      502,
    );
  }

  return json({ articles: result.articles, raw: result.raw });
};

export const config: Config = {
  path: '/api/admin/suggest-weekly-reads',
};
