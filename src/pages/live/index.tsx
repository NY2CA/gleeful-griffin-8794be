import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * /live — bare redirect to /live/dashboard so the cohort URL is
 * predictable. Kept as its own page (rather than rewriting in
 * next.config.js) so future per-cohort marketing splash content
 * can live here without a config change.
 */
export default function LiveIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/live/dashboard');
  }, [router]);
  return null;
}
