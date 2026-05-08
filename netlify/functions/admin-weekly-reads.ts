import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import {
  isAdminEmail,
  saveWeeklyReads,
  getCurrentWeeklyReads,
  type WeeklyReadArticle,
  type WeeklyReadsBlob,
} from './_lib/store';
import { json, error, handleOptions, parseJsonBody } from './_lib/response';

/**
 * Admin · weekly reads CRUD · Wave 16.1
 *
 * GET /api/admin/weekly-reads   · returns the current blob (admin sees what's live + draft)
 * POST /api/admin/weekly-reads  · publishes a new set (replaces current)
 *
 * Both gated to ADMIN_EMAILS. Public read happens via the separate
 * /api/weekly-reads endpoint (CORS-open) so Self-Study and any other
 * site can fetch without authentication.
 *
 * POST body: { articles: WeeklyReadArticle[] }
 *
 * Validation:
 *   - articles must be an array
 *   - 1-5 articles allowed (default autofeed publishes 3; admin can extend
 *     to 5 max). Cap prevents the dashboard surface from getting noisy.
 *   - each article requires source + title + href; dateLabel + why optional
 *   - href must look like a URL (starts with http:// or https://)
 */
export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();

  const session = await requireSession(req);
  if (!session) return error('Not authenticated', 401);
  if (!isAdminEmail(session.email)) return error('Forbidden', 403);

  if (req.method === 'GET') {
    try {
      const current = await getCurrentWeeklyReads();
      return json({ blob: current });
    } catch (err) {
      console.error('[admin-weekly-reads] read error', err);
      return error('Unable to read current weekly reads', 500);
    }
  }

  if (req.method === 'POST') {
    let body: { articles?: unknown };
    try {
      body = await parseJsonBody(req);
    } catch {
      return error('Invalid JSON', 400);
    }

    const articles = validateArticles(body.articles);
    if (!articles) {
      return error(
        'articles must be a 1-5 item array; each needs source, title, and an http(s) href',
        400,
      );
    }

    const blob: WeeklyReadsBlob = {
      publishedAt: new Date().toISOString(),
      publishedBy: session.email,
      articles,
    };

    try {
      await saveWeeklyReads(blob);
      return json({ ok: true, blob });
    } catch (err) {
      console.error('[admin-weekly-reads] save error', err);
      return error('Unable to save weekly reads', 500);
    }
  }

  return error('Method not allowed', 405);
};

/**
 * Validates and normalizes the incoming articles array. Returns a clean
 * array on success, or null on validation failure.
 */
function validateArticles(input: unknown): WeeklyReadArticle[] | null {
  if (!Array.isArray(input)) return null;
  if (input.length < 1 || input.length > 5) return null;

  const out: WeeklyReadArticle[] = [];
  for (const item of input) {
    if (!item || typeof item !== 'object') return null;
    const a = item as Record<string, unknown>;
    const source = typeof a.source === 'string' ? a.source.trim() : '';
    const title = typeof a.title === 'string' ? a.title.trim() : '';
    const href = typeof a.href === 'string' ? a.href.trim() : '';
    if (!source || !title || !href) return null;
    if (!/^https?:\/\//i.test(href)) return null;
    out.push({
      source: source.slice(0, 80),
      dateLabel: typeof a.dateLabel === 'string' ? a.dateLabel.trim().slice(0, 40) : '',
      title: title.slice(0, 200),
      why: typeof a.why === 'string' ? a.why.trim().slice(0, 280) : '',
      href: href.slice(0, 1000),
    });
  }
  return out;
}

export const config: Config = {
  path: '/api/admin/weekly-reads',
};
