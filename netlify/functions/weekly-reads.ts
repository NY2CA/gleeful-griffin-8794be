import type { Config } from '@netlify/functions';
import { getCurrentWeeklyReads } from './_lib/store';

/**
 * Public · GET /api/weekly-reads · Wave 16.1
 *
 * Returns the currently-published weekly reads blob. Both the Mastery
 * Live dashboard (same site) and the Self-Study dashboard (cross-site)
 * fetch from this endpoint to render the "What we're reading this week"
 * card. CORS is wide-open since the content is intentionally public —
 * meant for any authenticated member surface that wants to surface it.
 *
 * Response:
 *   200 { blob: WeeklyReadsBlob | null }   · current published reads, or null if never published
 *   405 { error: 'Method not allowed' }     · for non-GET / non-OPTIONS
 *   500 on storage failure
 *
 * Caching: Cache-Control: public, max-age=60. Sixty seconds keeps the
 * load light (members hitting their dashboard rapid-refresh hit our
 * Blob store at most once a minute) without making editorial updates
 * feel stale — admin publishes propagate within a minute.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '600',
};

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  try {
    const blob = await getCurrentWeeklyReads();
    return new Response(JSON.stringify({ blob }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        ...CORS,
      },
    });
  } catch (err) {
    console.error('[weekly-reads] read error', err);
    return new Response(JSON.stringify({ error: 'Unable to read weekly reads' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
};

export const config: Config = {
  path: '/api/weekly-reads',
};
