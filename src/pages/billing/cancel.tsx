import Link from 'next/link';
import Card from '@/components/Card';

/**
 * Stripe redirects here when the customer backs out of Checkout.
 * Nothing has been charged. We just reassure and point them back to /pricing.
 */
export default function BillingCancelPage() {
  return (
    <main className="page page-center">
      <div className="container flex items-center justify-center">
        <Card variant="offer" className="w-full max-w-[520px] text-center">
          <p className="eyebrow">Checkout canceled</p>
          <h1 className="font-display font-medium text-navy" style={{ fontSize: 32 }}>
            No charge. No worries.
          </h1>
          <p className="text-ink-dim mt-3">
            You backed out before paying, and we didn&rsquo;t charge anything.
            Come back whenever you&rsquo;re ready.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/pricing" className="btn-primary">
              Back to pricing
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              Dashboard
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
