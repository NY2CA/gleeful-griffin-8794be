import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/auth/forgot', {
        method: 'POST',
        body: { email },
        anonymous: true,
      });
    } catch {
      // Swallow — the server returns a generic success on purpose, so even an
      // error here shouldn't leak whether the email exists.
    } finally {
      setBusy(false);
      setSent(true);
    }
  }

  return (
    <main className="page page-center">
      <div className="container flex items-center justify-center">
        <Card variant="offer" className="w-full max-w-[480px]">
          <div className="section-head" style={{ marginBottom: 24 }}>
            <span className="eyebrow">Reset password</span>
            <h2 style={{ fontSize: 36 }}>We&rsquo;ll send you a link.</h2>
            <p style={{ fontSize: 15 }}>
              Enter the email on your membership and we&rsquo;ll send a reset
              link if it matches an account.
            </p>
          </div>
          {sent ? (
            <div>
              <p className="text-ink-dim mb-6">
                If an account exists for <strong className="text-navy">{email}</strong>,
                a reset link is on its way. Check your inbox &mdash; including spam.
              </p>
              <Link href="/login" className="btn-primary w-full justify-center">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <Input
                label="Email"
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@firm.com"
              />
              <Button type="submit" fullWidth disabled={busy}>
                {busy ? 'Sending…' : 'Send reset link'}
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
