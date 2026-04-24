import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { api } from '@/lib/api';
import { useAuth, type User } from '@/hooks/useAuth';

/**
 * Password-reset redemption page.
 *
 * The email link lands here with ?token=<jwt>. We accept a new password,
 * POST it along with the token to /api/auth/reset, and on success we auto
 * sign-in and redirect to /dashboard.
 */
export default function ResetPage() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Read the token from the URL once the router is ready.
  useEffect(() => {
    if (!router.isReady) return;
    const raw = router.query.token;
    const t = Array.isArray(raw) ? raw[0] : raw;
    setToken(t ?? null);
  }, [router.isReady, router.query.token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Missing reset token. Request a new link from the sign-in page.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const data = await api<{ token: string; user: User }>('/api/auth/reset', {
        method: 'POST',
        body: { token, password },
        anonymous: true,
      });
      setSession(data.token, data.user);
      setDone(true);
      // Brief pause so the user sees the success state, then go home.
      setTimeout(() => router.replace('/dashboard'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password');
    } finally {
      setBusy(false);
    }
  }

  const missingToken = router.isReady && !token;

  return (
    <main className="page page-center">
      <div className="container flex items-center justify-center">
        <Card variant="offer" className="w-full max-w-[480px]">
          <div className="section-head" style={{ marginBottom: 24 }}>
            <span className="eyebrow">Set a new password</span>
            <h2 style={{ fontSize: 36 }}>Choose a new password.</h2>
            <p style={{ fontSize: 15 }}>
              Your reset link is valid for 30 minutes. Pick something you haven&rsquo;t
              used here before.
            </p>
          </div>

          {missingToken ? (
            <div>
              <p className="text-ink-dim mb-6">
                This page needs a reset token in the URL. If you clicked an email
                link and still see this, the link may have expired &mdash; request
                a fresh one from the sign-in page.
              </p>
              <Link href="/forgot-password" className="btn-primary w-full justify-center">
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div>
              <p className="text-navy font-display text-xl mb-3">Password updated.</p>
              <p className="text-ink-dim mb-6">
                Signing you in&hellip; if we don&rsquo;t redirect in a moment,{' '}
                <Link href="/dashboard" className="text-navy underline underline-offset-2">
                  go to your dashboard
                </Link>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <Input
                label="New password"
                type="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
              <Input
                label="Confirm new password"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                error={error ?? undefined}
              />
              <Button type="submit" fullWidth disabled={busy || !token}>
                {busy ? 'Updating password…' : 'Update password'}
              </Button>
            </form>
          )}

          <p className="mt-6 text-sm text-ink-dim text-center">
            <Link href="/login" className="hover:text-navy">
              &larr; Back to sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
