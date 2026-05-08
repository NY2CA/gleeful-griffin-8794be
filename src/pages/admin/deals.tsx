import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/lib/api';

/**
 * Admin · /admin/deals · Mastery Live · Wave 14.2
 *
 * Lists every deal submitted by every member. Diva and Lou use this to:
 *   - See what's queued for the next coaching call
 *   - Fill in missing underwriting fields (YOC / IRR)
 *   - Add review notes that show up on the member's "Your deal" card
 *   - Promote submitted → active so it goes live on the member's dashboard
 *   - Archive closed deals
 *
 * Backend: GET /api/admin/deals (list) · POST /api/admin/deals/update (mutate)
 * Both gated to ADMIN_EMAILS server-side.
 */

type DealStatus =
  | 'submitted'
  | 'in_review'
  | 'active'
  | 'on_hold'
  | 'closed_won'
  | 'closed_lost';

interface AdminDealRow {
  id: string;
  submittedAt: string;
  updatedAt: string;
  status: DealStatus;
  name: string;
  address?: string;
  units?: number;
  assetClass?: string;
  askingPrice?: number;
  underwrittenNoi?: number;
  underwrittenYoc?: string;
  targetIrr?: string;
  stage?: string;
  coachingFocus?: string;
  reviewNotes?: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
}

interface ListResponse {
  deals: AdminDealRow[];
  count: number;
  stats: Record<DealStatus, number>;
}

type Filter = 'all' | 'live' | DealStatus;

export default function AdminDealsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<AdminDealRow[] | null>(null);
  const [stats, setStats] = useState<Record<DealStatus, number> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('live');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AdminDealRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Auth gating: bounce non-logged-in to /login, non-admins to /dashboard.
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!user.isAdmin) router.replace('/dashboard');
  }, [loading, user, router]);

  // Initial load.
  useEffect(() => {
    if (!user?.isAdmin) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.isAdmin]);

  async function refresh() {
    setErr(null);
    try {
      const data = await api<ListResponse>('/api/admin/deals');
      setRows(data.deals);
      setStats(data.stats);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Unable to load deals';
      setErr(msg);
    }
  }

  /**
   * Quick-action: promote a submitted/in_review deal to active so it
   * surfaces on the member's dashboard card.
   */
  async function quickPromote(row: AdminDealRow) {
    setBusyId(row.id);
    setErr(null);
    try {
      await api('/api/admin/deals/update', {
        method: 'POST',
        body: { memberId: row.memberId, dealId: row.id, status: 'active' },
      });
      await refresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Promote failed';
      setErr(`${row.name}: ${msg}`);
    } finally {
      setBusyId(null);
    }
  }

  /**
   * Quick-action: move an active/on_hold deal to closed_lost. Used when the
   * member walked from LOI or lost to another bidder. (We do NOT auto-fire
   * closed_won — that's a deliberate edit via the modal so admins type out
   * any closing notes.)
   */
  async function quickArchive(row: AdminDealRow) {
    if (!confirm(`Archive "${row.name}" as closed (lost / walked)?`)) return;
    setBusyId(row.id);
    setErr(null);
    try {
      await api('/api/admin/deals/update', {
        method: 'POST',
        body: { memberId: row.memberId, dealId: row.id, status: 'closed_lost' },
      });
      await refresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Archive failed';
      setErr(`${row.name}: ${msg}`);
    } finally {
      setBusyId(null);
    }
  }

  const visible = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === 'live') {
        const live = r.status === 'submitted' || r.status === 'in_review' || r.status === 'active' || r.status === 'on_hold';
        if (!live) return false;
      } else if (filter !== 'all') {
        if (r.status !== filter) return false;
      }
      if (q) {
        const blob = `${r.name} ${r.memberName} ${r.memberEmail} ${r.address ?? ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filter, query]);

  if (loading || !user || !user.isAdmin) {
    return (
      <main className="page page-center">
        <div className="container text-center text-ink-dim">Loading…</div>
      </main>
    );
  }

  const liveTotal =
    (stats?.submitted ?? 0) + (stats?.in_review ?? 0) + (stats?.active ?? 0) + (stats?.on_hold ?? 0);

  return (
    <>
      <main className="page">
        <div className="container grid gap-8">
          {/* ─── Header ─────────────────────────────────────────── */}
          <Card variant="hero">
            <div className="flex flex-col gap-2">
              <span className="eyebrow" style={{ color: 'var(--gold-bright)' }}>
                Admin · Mastery Live · Deals
              </span>
              <h3
                className="font-display font-medium"
                style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', color: 'var(--cream)' }}
              >
                Coaching deals queue
              </h3>
              <p style={{ color: 'var(--cream-warm)', maxWidth: 720, lineHeight: 1.55 }}>
                Every deal submitted by every Mastery Live member. Promote
                submitted&nbsp;→ active to surface on the member&rsquo;s dashboard. Edit any
                row to fill in YOC/IRR or add review notes Diva and Lou want the
                member to see.
              </p>
              <div className="flex gap-3" style={{ marginTop: 12 }}>
                <Link
                  href="/admin/members"
                  className="btn-secondary"
                  style={{ borderColor: 'var(--gold)', color: 'var(--gold-bright)' }}
                >
                  Members →
                </Link>
              </div>
            </div>
          </Card>

          {/* ─── Stats strip ────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Live deals" value={liveTotal} accent="navy" />
            <StatTile label="Submitted (new)" value={stats?.submitted ?? 0} />
            <StatTile label="Active" value={stats?.active ?? 0} />
            <StatTile label="Closed (won/lost)" value={(stats?.closed_won ?? 0) + (stats?.closed_lost ?? 0)} />
          </div>

          {/* ─── Controls ───────────────────────────────────────── */}
          <Card>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip current={filter} value="live" onSelect={setFilter} label="Live (open)" />
                <FilterChip current={filter} value="submitted" onSelect={setFilter} label="Submitted" />
                <FilterChip current={filter} value="in_review" onSelect={setFilter} label="In review" />
                <FilterChip current={filter} value="active" onSelect={setFilter} label="Active" />
                <FilterChip current={filter} value="on_hold" onSelect={setFilter} label="On hold" />
                <FilterChip current={filter} value="closed_won" onSelect={setFilter} label="Closed won" />
                <FilterChip current={filter} value="closed_lost" onSelect={setFilter} label="Closed lost" />
                <FilterChip current={filter} value="all" onSelect={setFilter} label="All" />
              </div>
              <div className="flex items-center gap-2 md:w-80">
                <Input
                  placeholder="Search property, member…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button variant="secondary" onClick={() => void refresh()}>
                  Refresh
                </Button>
              </div>
            </div>
          </Card>

          {err && (
            <Card style={{ borderColor: '#b91c1c', borderWidth: 1, borderStyle: 'solid' }}>
              <p className="text-sm" style={{ color: '#b91c1c' }}>{err}</p>
            </Card>
          )}

          {/* ─── Table ──────────────────────────────────────────── */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--ink-dim)', borderBottom: '1px solid var(--line)' }}>
                    <Th>Property</Th>
                    <Th>Member</Th>
                    <Th>Stage</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {!rows && (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-dim)' }}>Loading deals…</td></tr>
                  )}
                  {rows && visible.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-dim)' }}>
                      {rows.length === 0
                        ? 'No deals submitted yet. Members can submit at /submit-deal.'
                        : 'No deals match this filter.'}
                    </td></tr>
                  )}
                  {visible.map((r) => (
                    <tr
                      key={`${r.memberId}:${r.id}`}
                      style={{
                        borderBottom: '1px solid var(--line)',
                        cursor: 'pointer',
                      }}
                      onClick={() => setEditing(r)}
                    >
                      <Td>
                        <div className="flex flex-col">
                          <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{r.name}</span>
                          <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>
                            {[
                              r.units !== undefined ? `${r.units} units` : null,
                              r.assetClass,
                              r.askingPrice !== undefined ? `$${r.askingPrice.toLocaleString()}` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || '—'}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex flex-col">
                          <span style={{ color: 'var(--navy)' }}>{r.memberName}</span>
                          <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>{r.memberEmail}</span>
                        </div>
                      </Td>
                      <Td>{r.stage ?? '—'}</Td>
                      <Td><StatusBadge status={r.status} /></Td>
                      <Td>{formatRelativeDate(r.updatedAt)}</Td>
                      <Td align="right">
                        <div
                          className="flex justify-end gap-2"
                          // Stop the row click from firing when buttons are clicked
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(r.status === 'submitted' || r.status === 'in_review') && (
                            <Button
                              onClick={() => void quickPromote(r)}
                              disabled={busyId === r.id}
                              style={{ background: 'var(--gold)', borderColor: 'var(--gold)' }}
                            >
                              {busyId === r.id ? '…' : 'Promote'}
                            </Button>
                          )}
                          {(r.status === 'active' || r.status === 'on_hold') && (
                            <Button
                              variant="secondary"
                              onClick={() => void quickArchive(r)}
                              disabled={busyId === r.id}
                            >
                              {busyId === r.id ? '…' : 'Archive'}
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => setEditing(r)}
                          >
                            Edit
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-ink-dim text-sm">
            Promote a deal to <strong>active</strong> to surface review notes on the
            member&rsquo;s dashboard. Members never see <em>submitted</em>, <em>on_hold</em>,
            or <em>closed</em> notes — only the active state shows the populated card with
            &ldquo;Notes from Diva and Lou&rdquo;.
          </p>
        </div>
      </main>

      {/* ─── Edit modal ─────────────────────────────────────────── */}
      {editing && (
        <EditDealModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}

      {/* ========== FOOTER ========== */}
      <footer>
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <Link href="/dashboard" className="nav-logo">
                <img src="/rescia-logo.png" alt="Rescia Properties" />
                <div className="nav-logo-text">
                  <span className="nav-logo-name">Rescia Properties</span>
                  <span className="nav-logo-tag">Multifamily Mastery</span>
                </div>
              </Link>
              <p>
                The complete multifamily real estate mentoring program. From market
                identification to exit &mdash; the proven system for building wealth
                through multifamily real estate.
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <div>&copy; 2026 Rescia Properties &middot; Multifamily Mastery &middot; All rights reserved</div>
            <div>Not a securities offering &middot; Past performance not indicative of future results</div>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ─── Edit modal ─────────────────────────────────────────────── */

function EditDealModal({
  row,
  onClose,
  onSaved,
}: {
  row: AdminDealRow;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [status, setStatus] = useState<DealStatus>(row.status);
  const [yoc, setYoc] = useState(row.underwrittenYoc ?? '');
  const [irr, setIrr] = useState(row.targetIrr ?? '');
  const [stage, setStage] = useState(row.stage ?? '');
  const [coachingFocus, setCoachingFocus] = useState(row.coachingFocus ?? '');
  const [reviewNotes, setReviewNotes] = useState(row.reviewNotes ?? '');
  // Wave 14.3 · default ON. Admins can untick for typo fixes / silent edits.
  const [notifyMember, setNotifyMember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /**
   * Predict whether the current edit will trigger a member email so we can
   * show an honest hint above the checkbox. Mirrors detectUpdateKind() in
   * admin-update-deal.ts. We don't have to be perfect here — the server
   * does the authoritative detection — just close enough to set expectation.
   */
  const predictedKind = predictNotificationKind(row, {
    status,
    reviewNotes: reviewNotes.trim(),
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api('/api/admin/deals/update', {
        method: 'POST',
        body: {
          memberId: row.memberId,
          dealId: row.id,
          status,
          // Empty strings get coerced to null server-side (clears the field).
          underwrittenYoc: yoc.trim() ? yoc.trim() : null,
          targetIrr: irr.trim() ? irr.trim() : null,
          stage: stage.trim() ? stage.trim() : null,
          coachingFocus: coachingFocus.trim() ? coachingFocus.trim() : null,
          reviewNotes: reviewNotes.trim() ? reviewNotes.trim() : null,
          notifyMember,
        },
      });
      await onSaved();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Save failed';
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 30, 61, 0.72)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 100,
        padding: '40px 16px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          maxWidth: 640,
          width: '100%',
          borderRadius: 6,
          padding: 32,
          boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
          border: '1px solid var(--line)',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <span className="eyebrow">Edit deal</span>
          <h3
            className="font-display"
            style={{
              fontSize: 24,
              color: 'var(--navy)',
              margin: '6px 0 4px',
              fontWeight: 500,
            }}
          >
            {row.name}
          </h3>
          <p style={{ color: 'var(--ink-dim)', fontSize: 13, margin: 0 }}>
            Submitted by <strong>{row.memberName}</strong> · {row.memberEmail}
            {row.address ? ` · ${row.address}` : ''}
          </p>
        </div>

        <form onSubmit={submit} noValidate>
          <FieldLabel>Status</FieldLabel>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DealStatus)}
            style={selectStyle}
          >
            <option value="submitted">submitted · awaiting review</option>
            <option value="in_review">in_review · we&rsquo;re looking at it</option>
            <option value="active">active · surfacing on member&rsquo;s dashboard</option>
            <option value="on_hold">on_hold · paused, member to come back</option>
            <option value="closed_won">closed_won · member closed</option>
            <option value="closed_lost">closed_lost · walked / lost</option>
          </select>

          <FieldLabel style={{ marginTop: 20 }}>Stage</FieldLabel>
          <Input
            type="text"
            placeholder="pre-LOI · in LOI · in DD · PSA"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          />

          <FieldLabel style={{ marginTop: 20 }}>Underwriting</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input
              label="Underwritten YOC"
              type="text"
              placeholder="7.4%"
              value={yoc}
              onChange={(e) => setYoc(e.target.value)}
            />
            <Input
              label="Target IRR"
              type="text"
              placeholder="17.2%"
              value={irr}
              onChange={(e) => setIrr(e.target.value)}
            />
          </div>

          <FieldLabel style={{ marginTop: 20 }}>Coaching focus (member-submitted)</FieldLabel>
          <textarea
            value={coachingFocus}
            onChange={(e) => setCoachingFocus(e.target.value)}
            rows={3}
            placeholder="What the member wants to work on"
            style={textareaStyle}
          />

          <FieldLabel style={{ marginTop: 20 }}>Review notes (visible to member)</FieldLabel>
          <p style={{ fontSize: 13, color: 'var(--ink-dim)', margin: '0 0 8px', lineHeight: 1.5 }}>
            What Diva and Lou want the member to see on their dashboard once
            this deal is <strong>active</strong>. Keep it punchy — this is the
            note pane on the &ldquo;Your deal&rdquo; card.
          </p>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            rows={6}
            placeholder="e.g. Rent push assumption looks aggressive vs West Valley pipeline. Ask broker for last 12 mo. T-12. Recheck exit cap at 6.10% as your bear case."
            style={textareaStyle}
          />

          {/* ─── Wave 14.3 · Notify-member control ─────────────── */}
          <div
            style={{
              marginTop: 24,
              padding: '14px 16px',
              background: predictedKind ? 'rgba(184, 148, 90, 0.08)' : '#f8f6f2',
              border: '1px solid var(--line)',
              borderLeft: predictedKind
                ? '3px solid var(--gold)'
                : '3px solid var(--line)',
              borderRadius: 4,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
                fontSize: 14,
                color: 'var(--ink)',
              }}
            >
              <input
                type="checkbox"
                checked={notifyMember}
                onChange={(e) => setNotifyMember(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span style={{ flex: 1 }}>
                <strong style={{ fontWeight: 500 }}>
                  Notify member of this update via email
                </strong>
                <br />
                <span style={{ color: 'var(--ink-dim)', fontSize: 13 }}>
                  {predictedKind ? (
                    <>
                      With this save,{' '}
                      <span style={{ color: 'var(--navy)', fontWeight: 500 }}>
                        Mastery Live
                      </span>{' '}
                      {NOTIFICATION_LABEL[predictedKind]} ({row.memberEmail}).
                    </>
                  ) : (
                    <>
                      No email will fire — this edit doesn&rsquo;t change status or
                      add review notes. Submitted&nbsp;↔ in_review and field-only
                      tweaks (YOC / IRR / stage) are silent.
                    </>
                  )}
                </span>
              </span>
            </label>
          </div>

          {err && (
            <p style={{ color: '#b91c1c', fontSize: 14, marginTop: 16, fontFamily: 'var(--mono)' }}>
              {err}
            </p>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy}
              style={{ background: 'var(--gold)', borderColor: 'var(--gold)' }}
            >
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Small helpers ──────────────────────────────────────────── */

function StatTile({ label, value, accent }: { label: string; value: number; accent?: 'navy' }) {
  return (
    <Card style={accent === 'navy' ? { background: '#1f315a', color: 'var(--cream)', borderColor: 'var(--gold)' } : undefined}>
      <span className="eyebrow" style={accent === 'navy' ? { color: 'var(--gold-bright)' } : undefined}>
        {label}
      </span>
      <p
        className="font-display text-3xl mt-1"
        style={accent === 'navy' ? { color: 'var(--cream)' } : { color: 'var(--navy)' }}
      >
        {value}
      </p>
    </Card>
  );
}

function FilterChip({
  current,
  value,
  onSelect,
  label,
}: {
  current: Filter;
  value: Filter;
  onSelect: (f: Filter) => void;
  label: string;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onSelect(value)}
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        border: '1px solid var(--line)',
        background: active ? 'var(--navy)' : 'transparent',
        color: active ? 'var(--cream)' : 'var(--ink)',
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th style={{ padding: '10px 12px', fontWeight: 500, fontSize: 12, textAlign: align, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {children}
    </th>
  );
}

function Td({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <td style={{ padding: '12px', verticalAlign: 'middle', textAlign: align }}>{children}</td>;
}

function StatusBadge({ status }: { status: DealStatus }) {
  const config: Record<DealStatus, { bg: string; fg: string; label: string }> = {
    submitted:   { bg: '#fef3c7', fg: '#92400e', label: 'Submitted' },
    in_review:   { bg: '#e0e7ff', fg: '#3730a3', label: 'In review' },
    active:      { bg: '#dcfce7', fg: '#166534', label: 'Active' },
    on_hold:     { bg: '#f3f4f6', fg: '#4b5563', label: 'On hold' },
    closed_won:  { bg: 'var(--navy)', fg: 'var(--cream)', label: 'Closed · won' },
    closed_lost: { bg: '#fee2e2', fg: '#991b1b', label: 'Closed · lost' },
  };
  const { bg, fg, label } = config[status];
  return (
    <span style={{ padding: '3px 10px', borderRadius: 999, background: bg, color: fg, fontSize: 12, fontWeight: 500 }}>
      {label}
    </span>
  );
}

function FieldLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--gold)',
        marginBottom: 8,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#fff',
  color: 'var(--ink)',
  border: '1px solid var(--line)',
  borderRadius: 4,
  fontFamily: 'var(--sans)',
  fontSize: 14,
  appearance: 'auto',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#fff',
  color: 'var(--ink)',
  border: '1px solid var(--line)',
  borderRadius: 4,
  fontFamily: 'var(--sans)',
  fontSize: 14,
  lineHeight: 1.55,
  resize: 'vertical' as const,
  minHeight: 80,
};

type NotificationKind =
  | 'promoted_to_active'
  | 'notes_updated'
  | 'paused_on_hold'
  | 'archived_won'
  | 'archived_lost';

/**
 * Mirror of admin-update-deal.ts → detectUpdateKind() so the modal can
 * preview which email will get sent before the admin clicks Save. Server is
 * authoritative; this is purely informational UI.
 */
function predictNotificationKind(
  row: AdminDealRow,
  edit: { status: DealStatus; reviewNotes: string },
): NotificationKind | null {
  if (row.status !== edit.status) {
    if (edit.status === 'active') return 'promoted_to_active';
    if (edit.status === 'on_hold') return 'paused_on_hold';
    if (edit.status === 'closed_won') return 'archived_won';
    if (edit.status === 'closed_lost') return 'archived_lost';
    return null; // submitted ↔ in_review · silent
  }
  if (edit.status === 'active') {
    const prevNotes = (row.reviewNotes ?? '').trim();
    if (edit.reviewNotes && edit.reviewNotes !== prevNotes) {
      return 'notes_updated';
    }
  }
  return null;
}

const NOTIFICATION_LABEL: Record<NotificationKind, string> = {
  promoted_to_active: 'will email · "Your deal is now active in coaching"',
  notes_updated:      'will email · "New notes on your deal"',
  paused_on_hold:     'will email · "Pausing your deal"',
  archived_won:       'will email · "Closed won"',
  archived_lost:      'will email · "Closed"',
};

function formatRelativeDate(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    const min = 60_000;
    const hour = 60 * min;
    const day = 24 * hour;
    if (diff < min) return 'just now';
    if (diff < hour) return `${Math.floor(diff / min)}m ago`;
    if (diff < day) return `${Math.floor(diff / hour)}h ago`;
    if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}
