import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '@/components/Card';
import { useAuth } from '@/hooks/useAuth';
import { useBilling } from '@/hooks/useBilling';

/**
 * Toolkit page — the 12 Excel + Word templates that ship with the
 * Multifamily Mastery program. Files live in /public/templates/ and are
 * served as static assets by Netlify. Page is gated to authenticated
 * members with active access (admins always pass via ADMIN_EMAILS).
 */

type Kind = 'xlsx' | 'docx';

interface TemplateItem {
  file: string;        // filename in /public/templates/
  title: string;       // display name
  kind: Kind;          // type badge
  desc: string;        // 1-2 sentence description
}

const TEMPLATES: TemplateItem[] = [
  {
    file: '00_Toolkit_Guide.docx',
    title: 'Toolkit Guide',
    kind: 'docx',
    desc: 'Index + how-to for every model and document. Start here before opening any of the other files.',
  },
  {
    file: '01_Underwriting_Model.xlsx',
    title: 'Underwriting Model',
    kind: 'xlsx',
    desc: 'Full T12 / T3 inputs, year-1 stabilized NOI, cap rate, IRR, equity multiple, and stress overlays.',
  },
  {
    file: '02_Investor_Pipeline_CRM.xlsx',
    title: 'Investor Pipeline CRM',
    kind: 'xlsx',
    desc: 'Track LP prospects from intro to commitment — stage, soft-circled amount, follow-up cadence, and reg-D classification.',
  },
  {
    file: '03_CapEx_Budget_Tracker.xlsx',
    title: 'CapEx Budget Tracker',
    kind: 'xlsx',
    desc: 'Year 1–5 capital plan with line-item budget, draw schedule, contingency, and budget-vs-actual variance.',
  },
  {
    file: '04_Distribution_Waterfall.xlsx',
    title: 'Distribution Waterfall',
    kind: 'xlsx',
    desc: 'Pref → catch-up → promote tiers, with LP and GP distribution outputs across the hold period.',
  },
  {
    file: '05_Quarterly_LP_Report.xlsx',
    title: 'Quarterly LP Report',
    kind: 'xlsx',
    desc: 'Property KPIs, NOI variance, occupancy, capital project status, and narrative summary in a single deliverable.',
  },
  {
    file: '06_Letter_of_Intent.docx',
    title: 'Letter of Intent',
    kind: 'docx',
    desc: 'Editable LOI for value-add multifamily acquisitions — price, financing contingencies, DD period, and exclusivity.',
  },
  {
    file: '07_PPM_Outline.docx',
    title: 'PPM Outline',
    kind: 'docx',
    desc: 'Section-by-section Private Placement Memorandum skeleton — risk factors, sponsor bios, fund terms, subscription docs.',
  },
  {
    file: '08_Investor_Email_Campaign.docx',
    title: 'Investor Email Campaign',
    kind: 'docx',
    desc: 'Four-email warm-up sequence for new LP outreach — opener, deep-dive, social proof, and call-to-action.',
  },
  {
    file: '09_PSA_Checklist.docx',
    title: 'PSA Checklist',
    kind: 'docx',
    desc: 'Purchase & Sale Agreement deal-points checklist — what to negotiate before you sign and what to flag for counsel.',
  },
  {
    file: '10_Due_Diligence_Checklist.docx',
    title: 'Due Diligence Checklist',
    kind: 'docx',
    desc: 'Financial, physical, and operational DD items with owner-of-record column and target completion dates.',
  },
  {
    file: '11_Property_Management_RFP.docx',
    title: 'Property Management RFP',
    kind: 'docx',
    desc: 'Vendor RFP template for vetting third-party property managers — scope, fees, reporting, and renewal terms.',
  },
];

function KindBadge({ kind }: { kind: Kind }) {
  const label = kind === 'xlsx' ? 'Excel' : 'Word';
  return (
    <span
      className="eyebrow"
      style={{
        color: 'var(--gold-deep)',
        background: 'var(--gold-soft)',
        padding: '4px 10px',
        borderRadius: 999,
        display: 'inline-block',
        fontSize: 10,
      }}
    >
      {label}
    </span>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { status: billing, loading: billingLoading } = useBilling({ enabled: Boolean(user) });

  // Send unauthenticated visitors to login.
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // Send authenticated-but-no-access users back to dashboard
  // (where they see the "access pending" banner).
  useEffect(() => {
    if (loading || billingLoading) return;
    if (!user) return;
    if (billing && !billing.hasAccess) router.replace('/dashboard');
  }, [loading, billingLoading, user, billing, router]);

  if (loading || !user) {
    return (
      <main className="page page-center">
        <div className="container text-center text-ink-dim">Loading…</div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container grid gap-12">
        <div className="section-head" style={{ marginBottom: 0 }}>
          <span className="eyebrow">Toolkit</span>
          <h1 className="font-display font-medium" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}>
            Templates &amp; models
          </h1>
          <p className="text-ink-dim" style={{ maxWidth: 640 }}>
            Download the institutional-grade Excel models and Word documents
            that pair with the curriculum. Open <strong>00_Toolkit_Guide.docx</strong>
            {' '}first — it indexes how each file fits into the program.
          </p>
        </div>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((t) => (
              <Card key={t.file} variant="offer" className="flex flex-col gap-3">
                <KindBadge kind={t.kind} />
                <h3 className="font-display text-xl text-navy" style={{ minHeight: 56 }}>
                  {t.title}
                </h3>
                <p className="text-ink-dim text-sm" style={{ minHeight: 80, lineHeight: 1.5 }}>
                  {t.desc}
                </p>
                <div className="mt-auto pt-3">
                  <a
                    href={`/templates/${t.file}`}
                    download
                    className="btn-primary"
                    style={{ display: 'inline-block' }}
                  >
                    Download {t.kind === 'xlsx' ? '.xlsx' : '.docx'}
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <div className="text-center">
          <Link href="/dashboard" className="text-navy underline underline-offset-2 text-sm">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
