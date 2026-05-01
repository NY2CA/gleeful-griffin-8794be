import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Defensive redirect: if a visitor is already authenticated (e.g. they
  // clicked "Sign In" from the landing page even though their JWT is still
  // valid in localStorage), bounce them straight to /dashboard instead of
  // showing the login form. The `loading` guard prevents a flash of the
  // form during the initial /api/auth/me check on mount.
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page page-center">
      <div className="container flex items-center justify-center">
        <Card variant="offer" className="w-full max-w-[480px]">
          <div className="section-head" style={{ marginBottom: 24 }}>
            <span className="eyebrow">Member sign-in</span>
            <h2 style={{ fontSize: 36 }}>Welcome back.</h2>
            <p style={{ fontSize: 15 }}>
              Sign in to continue your Multifamily Mastery program.
            </p>
          </div>
          <form onSubmit={onSubmit} noValidate>
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@firm.com"
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              error={error ?? undefined}
            />
            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <div className="flex items-center justify-between mt-6 text-sm text-ink-dim">
            <Link href="/forgot-password" className="hover:text-navy">
              Forgot password?
            </Link>
            <span>
              New here?{' '}
              <Link href="/signup" className="text-navy underline underline-offset-2">
                Create an account
              </Link>
            </span>
          </div>
        </Card>
      </div>
    </main>
  );
}
