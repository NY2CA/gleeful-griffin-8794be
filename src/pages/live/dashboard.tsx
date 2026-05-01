import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * /live/dashboard — kept as a redirect to /dashboard. Wave 13 unified
 * the two surfaces; the Mastery Live treatment is now the canonical
 * post-login dashboard. This stub stays so saved bookmarks resolve.
 */
export default function LiveDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return null;
}
