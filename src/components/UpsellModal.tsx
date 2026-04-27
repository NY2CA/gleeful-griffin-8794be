import React, { useEffect, useState } from 'react';
import Button from './Button';

/**
 * 11-month upsell modal — shown to annual subscribers when they're within
 * ~30 days of renewal. Offers a one-click upgrade to Lifetime so they can
 * lock the program in instead of renewing.
 *
 * Dismissal is tied to the specific renewal cycle (currentPeriodEnd) so the
 * popup re-appears next year if they keep renewing without upgrading.
 */

const STORAGE_PREFIX = 'mfm_upsell_dismissed_';

export interface UpsellModalProps {
  /** Stripe currentPeriodEnd ISO timestamp — the trigger anchor. */
  renewalDate: string;
  /** Friendly first name to personalize the headline. */
  firstName?: string;
  /** Called when the user clicks "Upgrade to Lifetime" — should kick off checkout. */
  onUpgrade: () => Promise<void> | void;
  /** Called when the user dismisses ("Remind me later" or X). */
  onDismiss?: () => void;
  /** Override the auto-open logic (used by tests / preview). */
  forceOpen?: boolean;
}

/**
 * Returns true when the renewal is within 30 days AND the user hasn't
 * dismissed this cycle. Pure function so it can be unit-tested.
 */
export function shouldShowUpsell(renewalDate: string, now = Date.now()): boolean {
  if (!renewalDate) return false;
  if (typeof window === 'undefined') return false;
  const end = new Date(renewalDate).getTime();
  if (Number.isNaN(end)) return false;
  const daysOut = (end - now) / (1000 * 60 * 60 * 24);
  if (daysOut > 30 || daysOut < 0) return false;
  const key = STORAGE_PREFIX + renewalDate;
  return !window.localStorage.getItem(key);
}

export default function UpsellModal({
  renewalDate,
  firstName,
  onUpgrade,
  onDismiss,
  forceOpen,
}: UpsellModalProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    setOpen(shouldShowUpsell(renewalDate));
  }, [renewalDate, forceOpen]);

  function close(persist: boolean) {
    if (persist && renewalDate) {
      try {
        window.localStorage.setItem(STORAGE_PREFIX + renewalDate, '1');
      } catch {
        /* ignore quota errors */
      }
    }
    setOpen(false);
    onDismiss?.();
  }

  async function handleUpgrade() {
    setBusy(true);
    try {
      await onUpgrade();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const days = Math.max(
    0,
    Math.round((new Date(renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upsell-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11, 24, 51, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
      onClick={() => close(true)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--cream)',
          borderRadius: 12,
          maxWidth: 520,
          width: '100%',
          padding: 32,
          position: 'relative',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          borderTop: '4px solid var(--gold)',
        }}
      >
        <button
          onClick={() => close(true)}
          aria-label="Dismiss"
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            background: 'transparent',
            border: 0,
            fontSize: 22,
            color: 'var(--ink-dim)',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <span className="eyebrow" style={{ color: 'var(--gold-deep)' }}>
          Renewal coming up
        </span>
        <h3
          id="upsell-title"
          className="font-display"
          style={{ fontSize: 28, color: 'var(--navy)', marginTop: 6, marginBottom: 12 }}
        >
          {firstName ? `${firstName}, lock it in` : 'Lock in your access'}
        </h3>
        <p className="text-ink-dim" style={{ lineHeight: 1.6 }}>
          Your annual subscription renews in{' '}
          <strong style={{ color: 'var(--navy)' }}>
            {days} day{days === 1 ? '' : 's'}
          </strong>
          {' '}({new Date(renewalDate).toLocaleDateString()}).
          Switch to <strong style={{ color: 'var(--navy)' }}>Lifetime</strong> instead — pay
          once, keep your seat through every Wave update, and skip every future renewal.
        </p>

        <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', display: 'grid', gap: 8 }}>
          <Bullet>One-time payment — no more annual cards</Bullet>
          <Bullet>Every future content update included</Bullet>
          <Bullet>Permanent toolkit + template access</Bullet>
        </ul>

        <div className="flex flex-col md:flex-row gap-3 mt-2">
          <Button
            onClick={handleUpgrade}
            disabled={busy}
            style={{ background: 'var(--gold)', borderColor: 'var(--gold)' }}
            fullWidth
          >
            {busy ? 'Opening checkout…' : 'Upgrade to Lifetime'}
          </Button>
          <Button variant="secondary" onClick={() => close(true)} fullWidth>
            Remind me at renewal
          </Button>
        </div>

        <p className="text-ink-dim text-sm" style={{ marginTop: 14, textAlign: 'center' }}>
          Or do nothing — your annual renewal still goes through automatically.
        </p>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: 'var(--ink)' }}>
      <span
        aria-hidden
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: 'var(--gold)',
          color: 'var(--navy)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
