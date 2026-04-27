import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';

export type Plan = 'annual' | 'monthly' | 'lifetime' | null;
export type SubscriptionStatus =
  | 'none'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export interface BillingStatus {
  hasAccess: boolean;
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  lifetime: boolean;
  hasBillingAccount: boolean;
}

/**
 * Reads the user's billing state from /api/billing/status. Exposes helpers
 * to start checkout or open the billing portal.
 *
 * Call this only inside pages that are already authenticated — it assumes
 * the bearer token is present.
 */
export function useBilling(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api<BillingStatus>('/api/billing/status');
      setStatus(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Not authenticated — leave status null. The page's auth guard will redirect.
        setStatus(null);
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load billing');
      }
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startCheckout = useCallback(
    async (plan: Exclude<Plan, null>): Promise<void> => {
      const { url } = await api<{ url: string }>('/api/billing/checkout', {
        method: 'POST',
        body: { plan },
      });
      window.location.href = url;
    },
    []
  );

  const openPortal = useCallback(async (): Promise<void> => {
    const { url } = await api<{ url: string }>('/api/billing/portal', {
      method: 'POST',
    });
    window.location.href = url;
  }, []);

  return { status, loading, error, refresh, startCheckout, openPortal };
}
