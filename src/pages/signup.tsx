import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await signup(name, email, password);
      // After creating an account, send the user to the paywall unless a
      // specific post-signup destination was requested (e.g. pricing → signup
      // round-trip).
      const nextRaw = router.query.next;
      const next = Array.isArray(nextRaw) ? nextRaw[0] : nextRaw;
      const safeNext = next && next.startsWith('/') ? next : '/pricing';
      router.push(safeNext);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page page-center">
      <div className="container flex items-center justify-center">
        <Card variant="offer" className="w-full max-w-[480px]">
          <div className="section-head" style={{ marginBottom: 24 }}>
            <span className="eyebrow">Create account</span>
            <h2 style={{ fontSize: 36 }}>Join the program.</h2>
            <p style={{ fontSize: 15 }}>
              Twelve weeks from first market to first close.
            </p>
          </div>
          <form onSubmit={onSubmit} noValidate>
            <Input
              label="Full name"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
            <Input
              label="Confirm password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              error={error ?? undefined}
            />
            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className="mt-6 text-sm text-ink-dim text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-navy underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
