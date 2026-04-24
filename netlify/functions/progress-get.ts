import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import { getProgress } from './_lib/store';
import { json, error, handleOptions } from './_lib/response';

/**
 * GET /api/progress
 * Returns the full progress map for the authenticated user:
 *   { progress: { [courseId]: { [moduleId]: true } } }
 */
export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return error('Method not allowed', 405);

  const claims = await requireSession(req);
  if (!claims) return error('Unauthorized', 401);

  try {
    const progress = await getProgress(claims.sub);
    return json({ progress });
  } catch (err) {
    console.error('[progress-get] error', err);
    return error('Unable to load progress', 500);
  }
};

export const config: Config = {
  path: '/api/progress',
};
