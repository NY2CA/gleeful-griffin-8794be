import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '@/components/Card';
import { useBilling } from '@/hooks/useBilling';
import { useAuth } from '@/hooks/useAuth';

/**
 * Checkout → success landing.
 *
 * Stripe redirects here with ?session_id=cs_… once the payment clears.
 * The webhook has already (or will in a second or two) update the user record,
 * so we poll /api/billing/status until hasAccess flips to true, then redirect
 * to the dashboard.
 */
export default function BillingSuccessPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { status, refresh } = useBilling({ enabled: Boolean(user) });
  const [waited, setWaited] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  // Poll billing status every 1.5s for up to ~20s while we wait for the webhook.
  useEffect(() => {
    if (!user) return;
    if (status?.hasAccess) return;
    const tick = setInterval(() => {
      refresh();
      setWaited((w) => w + 1);
    }, 1500);
    return () => clearInterval(tick);
  }, [user, status?.hasAccess, refresh]);

  useEffect(() => {
    if (status?.hasAccess) {
      const t = setTimeout(() => router.replace('/dashboard'), 1200);
      return () => clearTimeout(t);
    }
  }, [status?.hasAccess, router]);

  return (
    <main className="page page-center">
      <div className="container flex items-center justify-center">
        <Card variant="offer" className="w-full max-w-[520px] text-center">
          {status?.hasAccess ? (
            <>
              <p className="eyebrow" style={{ color: 'var(--gold-deep)' }}>Welcome</p>
              <h1 className="font-display font-medium text-navy" style={{ fontSize: 36 }}>
                Payment received.
              </h1>
              <p className="text-ink-dim mt-3">
                Your {status.lifetime ? 'lifetime' : status.plan} plan is active. Redirecting you to the dashboard&hellip;
              </p>
              <div className="mt-6">
                <Link href="/dashboard" className="btn-primary">
                  Go to dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="eyebrow">Finalizing</p>
              <h1 className="font-display font-medium text-navy" style={{ fontSize: 32 }}>
                Confirming your payment&hellip;
              </h1>
              <p className="text-ink-dim mt-3">
                Stripe is letting us know. This usually takes a couple of seconds.
                {waited > 10 && (
                  <>
                    <br />
                    <br />
                    Taking longer than expected?{' '}
                    <Link href="/dashboard" className="text-navy underline underline-offset-2">
                      Jump to the dashboard
                    </Link>
                    {' '}and refresh.
                  </>
                )}
              </p>
              <div className="mt-6">
                <div className="mx-auto w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
