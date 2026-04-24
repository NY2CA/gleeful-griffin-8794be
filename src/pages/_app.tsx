import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // The landing page ("/") ships its own marketing navigation (logo, curriculum,
  // results, mentor, FAQ, Book Strategy Call). The member Navigation is meant
  // for authenticated / app routes, so we suppress it on the marketing home.
  const isLanding = router.pathname === '/';

  return (
    <AuthProvider>
      <Head>
        <title>Multifamily Mastery · Rescia Properties</title>
        <meta
          name="description"
          content="The complete 12-module multifamily real estate mentoring program. From market identification to exit — the proven system for building wealth through multifamily real estate. Book your free strategy call."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {!isLanding && <Navigation />}
      <Component {...pageProps} />
    </AuthProvider>
  );
}
