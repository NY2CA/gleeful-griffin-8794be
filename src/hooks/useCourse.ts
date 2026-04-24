import { useCallback, useEffect, useState } from 'react';
import { COURSES, Course, Module, getCourse } from '@/data/courses';
import { api, ApiError, getToken } from '@/lib/api';

type ProgressMap = Record<string, Record<string, boolean>>;
// progress[courseId][moduleId] = completed?

/**
 * useCourse — reads and writes progress via the Netlify Functions API.
 *
 * Behaviour:
 *   - On mount (when a token is present), GET /api/progress to hydrate state.
 *   - markComplete() optimistically updates local state and POSTs in the
 *     background. If the server rejects the write we revert to whatever it
 *     last confirmed.
 *   - When the user is signed out, everything falls through to an empty
 *     progress map (no localStorage fallback — progress is membership-gated).
 */
export function useCourse(courseId: string = 'multifamily-mastery') {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const data = await api<{ progress: ProgressMap }>('/api/progress');
        if (!cancelled) setProgress(data.progress || {});
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // Token is bad — let useAuth handle the sign-out flow.
        } else {
          console.warn('[useCourse] load failed', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const course: Course | undefined = getCourse(courseId);

  const completedCount = course
    ? course.modules.filter((m) => progress[courseId]?.[m.id]).length
    : 0;
  const total = course?.modules.length ?? 0;
  const percentage = total ? Math.round((completedCount / total) * 100) : 0;

  const isComplete = useCallback(
    (moduleId: string) => Boolean(progress[courseId]?.[moduleId]),
    [progress, courseId]
  );

  const markComplete = useCallback(
    async (moduleId: string, completed = true) => {
      // Optimistic update
      const previous = progress;
      const optimistic: ProgressMap = {
        ...progress,
        [courseId]: { ...(progress[courseId] || {}) },
      };
      if (completed) optimistic[courseId][moduleId] = true;
      else delete optimistic[courseId][moduleId];
      setProgress(optimistic);

      try {
        const data = await api<{ progress: ProgressMap }>('/api/progress/mark', {
          method: 'POST',
          body: { courseId, moduleId, completed },
        });
        setProgress(data.progress || optimistic);
      } catch (err) {
        console.error('[useCourse] mark failed', err);
        // Roll back on failure
        setProgress(previous);
      }
    },
    [courseId, progress]
  );

  function getModule(moduleId: string): Module | undefined {
    return course?.modules.find((m) => m.id === moduleId);
  }

  function getNextModule(currentId: string): Module | undefined {
    if (!course) return undefined;
    const i = course.modules.findIndex((m) => m.id === currentId);
    return i >= 0 ? course.modules[i + 1] : undefined;
  }

  return {
    course,
    courses: COURSES,
    modules: course?.modules ?? [],
    progress: { completed: completedCount, total, percentage },
    isComplete,
    markComplete,
    getModule,
    getNextModule,
    loading,
  };
}
