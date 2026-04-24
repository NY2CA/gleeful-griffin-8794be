import type { Config } from '@netlify/functions';
import { requireSession } from './_lib/auth';
import { getProgress, saveProgress } from './_lib/store';
import { json, error, parseJsonBody, handleOptions } from './_lib/response';

/**
 * POST /api/progress
 *   Body: { courseId: string, moduleId: string, completed: boolean }
 *
 * Mutates the authenticated user's progress map. Returns the updated map so
 * the client can reconcile without making a second GET.
 */
interface MarkBody {
  courseId?: string;
  moduleId?: string;
  completed?: boolean;
}

export default async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return error('Method not allowed', 405);

  const claims = await requireSession(req);
  if (!claims) return error('Unauthorized', 401);

  let body: MarkBody;
  try {
    body = await parseJsonBody<MarkBody>(req);
  } catch {
    return error('Invalid JSON body', 400);
  }

  const courseId = (body.courseId || '').trim();
  const moduleId = (body.moduleId || '').trim();
  const completed = body.completed !== false; // default true
  if (!courseId || !moduleId) return error('courseId and moduleId are required', 400);

  try {
    const progress = await getProgress(claims.sub);
    const next = { ...progress, [courseId]: { ...(progress[courseId] || {}) } };
    if (completed) {
      next[courseId][moduleId] = true;
    } else {
      delete next[courseId][moduleId];
    }
    await saveProgress(claims.sub, next);
    return json({ progress: next });
  } catch (err) {
    console.error('[progress-mark] error', err);
    return error('Unable to save progress', 500);
  }
};

export const config: Config = {
  path: '/api/progress/mark',
};
