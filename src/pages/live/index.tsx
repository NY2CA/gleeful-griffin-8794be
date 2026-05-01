import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * /live — kept as a redirect so any saved bookmarks or external links to
 * /live or /live/dashboard land on the unified /dashboard. The Mastery
 * Live treatment IS the dashboard now (Wave 13 consolidation).
 */
export default function LiveIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return null;
}
