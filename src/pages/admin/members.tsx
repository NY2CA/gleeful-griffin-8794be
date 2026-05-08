import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/lib/api';

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  hasAccess: boolean;
  isAdmin: boolean;
  plan: 'annual' | 'monthly' | 'lifetime' | null;
  subscriptionStatus: string;
  lifetime: boolean;
  adminGrantedAt: string | null;
  adminGrantedBy: string | null;
  /** Wave 15.2 · ISO expiry for admin grant; null = indefinite. */
  adminGrantedUntil: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/** Wave 15.2 · duration shorthand sent to /api/admin/grant-access. */
type DurationKey = 'indefinite' | '1mo' | '3mo' | '6mo' | '12mo' | 'custom';

type Filter = 'all' | 'active' | 'pending' | 'admin-granted';

export default function AdminMembersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  /** Wave 15.2 · row currently open in the grant-duration modal. */
  const [grantingRow, setGrantingRow] = useState<AdminUserRow | null>(null);

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
      const data = await api<{ users: AdminUserRow[]; count: number }>(
        '/api/admin/users'
      );
      setRows(data.users);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Unable to load members';
      setErr(msg);
    }
  }

  /**
   * Wave 15.2 · grant access with an optional duration. `duration` is either
   * a shorthand ('indefinite' | '1mo' | '3mo' | '6mo' | '12mo') or an ISO
   * date string for a custom expiry. Server resolves into adminGrantedUntil.
   */
  async function grant(email: string, duration: string) {
    setBusyEmail(email);
    setErr(null);
    try {
      await api('/api/admin/grant-access', {
        method: 'POST',
        body: { email, duration },
      });
      await refresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Grant failed';
      setErr(`${email}: ${msg}`);
    } finally {
      setBusyEmail(null);
    }
  }

  async function revoke(email: string) {
    if (!confirm(`Revoke access for ${email}?`)) return;
    setBusyEmail(email);
    setErr(null);
    try {
      await api('/api/admin/revoke-access', { method: 'POST', body: { email } });
      await refresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Revoke failed';
      setErr(`${email}: ${msg}`);
    } finally {
      setBusyEmail(null);
    }
  }

  const visible = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === 'active' && !r.hasAccess) return false;
      if (filter === 'pending' && r.hasAccess) return false;
      if (filter === 'admin-granted' && !r.adminGrantedAt) return false;
      if (q && !r.email.toLowerCase().includes(q) && !r.name.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [rows, filter, query]);

  const stats = useMemo(() => {
    if (!rows) return { total: 0, active: 0, pending: 0, granted: 0 };
    return {
      total: rows.length,
      active: rows.filter((r) => r.hasAccess).length,
      pending: rows.filter((r) => !r.hasAccess).length,
      granted: rows.filter((r) => r.adminGrantedAt).length,
    };
  }, [rows]);

  if (loading || !user || !user.isAdmin) {
    return (
      <main className="page page-center">
        <div className="container text-center text-ink-dim">Loading…</div>
      </main>
    );
  }

  return (
    <>
      <main className="page">
        <div className="container grid gap-8">
          <Card variant="hero">
            <div className="flex flex-col gap-2">
              <span className="eyebrow" style={{ color: 'var(--gold-bright)' }}>
                Admin · Members
              </span>
              <h3
                className="font-display font-medium"
                style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', color: 'var(--cream)' }}
              >
                Member management
              </h3>
              <p style={{ color: 'var(--cream-warm)', maxWidth: 640, lineHeight: 1.55 }}>
                Grant or revoke course access without going through Stripe. Use this
                when comping access for partners, vendors, or beta members. Members
                with active Stripe subscriptions or lifetime purchases show their
                billing source in the table.
              </p>
            </div>
          </Card>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Total members" value={stats.total} />
            <StatTile label="Active access" value={stats.active} />
            <StatTile label="Pending / no access" value={stats.pending} />
            <StatTile label="Admin-granted" value={stats.granted} />
          </div>

          {/* Controls */}
          <Card>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip current={filter} value="all" onSelect={setFilter} label="All" />
                <FilterChip current={filter} value="active" onSelect={setFilter} label="Active" />
                <FilterChip current={filter} value="pending" onSelect={setFilter} label="Pending" />
                <FilterChip current={filter} value="admin-granted" onSelect={setFilter} label="Admin-granted" />
              </div>
              <div className="flex items-center gap-2 md:w-80">
                <Input
                  placeholder="Search by name or email…"
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

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--ink-dim)', borderBottom: '1px solid var(--line)' }}>
                    <Th>Member</Th>
                    <Th>Joined</Th>
                    <Th>Source</Th>
                    <Th>Status</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {!rows && (
                    <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-dim)' }}>Loading members…</td></tr>
                  )}
                  {rows && visible.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-dim)' }}>No members match this filter.</td></tr>
                  )}
                  {visible.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <Td>
                        <div className="flex flex-col">
                          <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{r.name}</span>
                          <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>{r.email}</span>
                        </div>
                      </Td>
                      <Td>{formatDate(r.createdAt)}</Td>
                      <Td>{sourceLabel(r)}</Td>
                      <Td><AccessBadge row={r} /></Td>
                      <Td align="right">
                        <div className="flex justify-end gap-2">
                          {r.isAdmin ? (
                            <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>—</span>
                          ) : r.adminGrantedAt ? (
                            <>
                              <Button
                                variant="secondary"
                                onClick={() => setGrantingRow(r)}
                                disabled={busyEmail === r.email}
                                style={{ borderColor: 'var(--gold)', color: 'var(--gold-deep)' }}
                              >
                                Edit expiry
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => void revoke(r.email)}
                                disabled={busyEmail === r.email}
                              >
                                {busyEmail === r.email ? 'Revoking…' : 'Revoke'}
                              </Button>
                            </>
                          ) : r.hasAccess ? (
                            <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>via {r.lifetime ? 'lifetime' : 'Stripe'}</span>
                          ) : (
                            <Button
                              onClick={() => setGrantingRow(r)}
                              disabled={busyEmail === r.email}
                              style={{ background: 'var(--gold)', borderColor: 'var(--gold)' }}
                            >
                              {busyEmail === r.email ? 'Granting…' : 'Grant access'}
                            </Button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-ink-dim text-sm">
            Admins are gated by the <code>ADMIN_EMAILS</code> env var on Netlify.
            Admin grants are independent of Stripe — revoking does not cancel any
            active Stripe subscription. Wave 15.2 · grants now carry an optional
            expiry date so partner comps and partial-term mentoring engagements
            can auto-expire.
          </p>
        </div>
      </main>

      {/* ─── Wave 15.2 · grant-duration modal ──────────────────── */}
      {grantingRow && (
        <GrantDurationModal
          row={grantingRow}
          onCancel={() => setGrantingRow(null)}
          onConfirm={async (duration) => {
            await grant(grantingRow.email, duration);
            setGrantingRow(null);
          }}
          busy={busyEmail === grantingRow.email}
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

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <span className="eyebrow">{label}</span>
      <p className="font-display text-3xl text-navy mt-1">{value}</p>
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

function AccessBadge({ row }: { row: AdminUserRow }) {
  if (row.isAdmin) {
    return <Badge color="navy" label="Admin" />;
  }
  if (row.hasAccess) {
    return <Badge color="green" label="Active" />;
  }
  return <Badge color="gray" label="No access" />;
}

function Badge({ color, label }: { color: 'navy' | 'green' | 'gray'; label: string }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    navy: { bg: 'var(--navy)', fg: 'var(--cream)' },
    green: { bg: '#dcfce7', fg: '#166534' },
    gray: { bg: '#f1f5f9', fg: '#475569' },
  };
  const { bg, fg } = palette[color];
  return (
    <span style={{ padding: '3px 10px', borderRadius: 999, background: bg, color: fg, fontSize: 12, fontWeight: 500 }}>
      {label}
    </span>
  );
}

function sourceLabel(r: AdminUserRow): string {
  if (r.isAdmin) return 'Admin email';
  if (r.lifetime) return 'Lifetime purchase';
  if (r.adminGrantedAt) {
    const grantedBy = r.adminGrantedBy ? ` · ${r.adminGrantedBy}` : '';
    // Wave 15.2 · expose the expiry date inline so admins can see at a
    // glance whether a grant is indefinite or has a deadline (and how soon).
    if (r.adminGrantedUntil) {
      const expiresAt = new Date(r.adminGrantedUntil);
      const now = Date.now();
      const days = Math.round((expiresAt.getTime() - now) / 86_400_000);
      const dateStr = expiresAt.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      if (days < 0) return `Admin grant${grantedBy} · expired ${dateStr}`;
      if (days === 0) return `Admin grant${grantedBy} · expires today`;
      if (days === 1) return `Admin grant${grantedBy} · expires tomorrow · ${dateStr}`;
      return `Admin grant${grantedBy} · expires ${dateStr} · ${days}d left`;
    }
    return `Admin grant${grantedBy} · indefinite`;
  }
  if (r.subscriptionStatus === 'active' || r.subscriptionStatus === 'trialing') {
    return `Stripe · ${r.plan ?? 'sub'}`;
  }
  if (r.subscriptionStatus && r.subscriptionStatus !== 'none') {
    return `Stripe · ${r.subscriptionStatus}`;
  }
  return '—';
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

/**
 * Wave 15.2 · grant-duration modal. Lets the admin pick a duration when
 * granting (or re-granting) access. Confirms the resolved expiry date in
 * plain English before submitting so there's no surprise.
 */
function GrantDurationModal({
  row,
  onCancel,
  onConfirm,
  busy,
}: {
  row: AdminUserRow;
  onCancel: () => void;
  onConfirm: (duration: string) => Promise<void> | void;
  busy: boolean;
}) {
  // Pre-select 'indefinite' on a fresh grant; on a re-grant, try to pick the
  // closest preset that matches the current expiry, else fall back to custom.
  const initialKey: DurationKey = row.adminGrantedUntil ? 'custom' : 'indefinite';
  const initialCustomDate = row.adminGrantedUntil
    ? row.adminGrantedUntil.slice(0, 10) // YYYY-MM-DD for the date input
    : '';

  const [key, setKey] = useState<DurationKey>(initialKey);
  const [customDate, setCustomDate] = useState<string>(initialCustomDate);

  const isReGrant = Boolean(row.adminGrantedAt);
  const previewExpiry = computePreviewExpiry(key, customDate);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (key === 'indefinite') return void onConfirm('indefinite');
    if (key === 'custom') {
      if (!customDate) return;
      // The date input gives YYYY-MM-DD (local). We pin to UTC noon to avoid
      // timezone-flip surprises at midnight in either direction.
      const iso = new Date(customDate + 'T12:00:00Z').toISOString();
      return void onConfirm(iso);
    }
    return void onConfirm(key);
  }

  return (
    <div
      onClick={onCancel}
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
          maxWidth: 520,
          width: '100%',
          borderRadius: 6,
          padding: 28,
          boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
          border: '1px solid var(--line)',
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <span className="eyebrow">{isReGrant ? 'Edit grant expiry' : 'Grant access'}</span>
          <h3
            className="font-display"
            style={{ fontSize: 22, color: 'var(--navy)', margin: '6px 0 4px', fontWeight: 500 }}
          >
            {row.name}
          </h3>
          <p style={{ color: 'var(--ink-dim)', fontSize: 13, margin: 0 }}>
            {row.email}
            {isReGrant && row.adminGrantedUntil && (
              <>
                {' '}· current expiry{' '}
                <strong style={{ color: 'var(--navy)' }}>
                  {new Date(row.adminGrantedUntil).toLocaleDateString()}
                </strong>
              </>
            )}
            {isReGrant && !row.adminGrantedUntil && (
              <>
                {' '}· current grant{' '}
                <strong style={{ color: 'var(--navy)' }}>indefinite</strong>
              </>
            )}
          </p>
        </div>

        <form onSubmit={submit} noValidate>
          <fieldset
            style={{
              border: 'none',
              padding: 0,
              margin: '0 0 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <DurationOption
              label="Indefinite"
              hint="No expiry — the grant lasts until you revoke it manually."
              value="indefinite"
              selected={key === 'indefinite'}
              onSelect={() => setKey('indefinite')}
            />
            <DurationOption
              label="1 month"
              hint="Auto-expires in ~30 days."
              value="1mo"
              selected={key === '1mo'}
              onSelect={() => setKey('1mo')}
            />
            <DurationOption
              label="3 months"
              hint="Auto-expires in ~90 days."
              value="3mo"
              selected={key === '3mo'}
              onSelect={() => setKey('3mo')}
            />
            <DurationOption
              label="6 months"
              hint="Auto-expires in ~180 days."
              value="6mo"
              selected={key === '6mo'}
              onSelect={() => setKey('6mo')}
            />
            <DurationOption
              label="12 months"
              hint="Auto-expires in 1 year."
              value="12mo"
              selected={key === '12mo'}
              onSelect={() => setKey('12mo')}
            />
            <DurationOption
              label="Custom date"
              hint="Pick the exact expiry date below."
              value="custom"
              selected={key === 'custom'}
              onSelect={() => setKey('custom')}
            />
          </fieldset>

          {key === 'custom' && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label htmlFor="custom-date">Expiry date</label>
              <input
                id="custom-date"
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
                required
              />
            </div>
          )}

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 4,
              background: 'var(--gold-soft)',
              color: 'var(--ink)',
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 18,
            }}
          >
            <strong style={{ color: 'var(--navy)' }}>Result:</strong> {previewExpiry}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="secondary" type="button" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || (key === 'custom' && !customDate)}
              style={{ background: 'var(--gold)', borderColor: 'var(--gold)' }}
            >
              {busy ? 'Saving…' : isReGrant ? 'Save expiry' : 'Grant access'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DurationOption({
  label,
  hint,
  value,
  selected,
  onSelect,
}: {
  label: string;
  hint: string;
  value: DurationKey;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 12px',
        border: `1px solid ${selected ? 'var(--gold)' : 'var(--line)'}`,
        background: selected ? 'rgba(184, 148, 90, 0.06)' : '#fff',
        borderRadius: 4,
        cursor: 'pointer',
        alignItems: 'flex-start',
      }}
    >
      <input
        type="radio"
        name="duration"
        value={value}
        checked={selected}
        onChange={onSelect}
        style={{ marginTop: 3 }}
      />
      <span style={{ flex: 1 }}>
        <strong style={{ color: 'var(--navy)', fontWeight: 500 }}>{label}</strong>
        <br />
        <span style={{ color: 'var(--ink-dim)', fontSize: 13 }}>{hint}</span>
      </span>
    </label>
  );
}

/**
 * Plain-English preview of where the grant lands. Helps the admin confirm
 * before clicking Save — especially for the relative options where "3
 * months from now" might not be the date they had in mind.
 */
function computePreviewExpiry(key: DurationKey, customDate: string): string {
  if (key === 'indefinite') {
    return 'Access granted indefinitely. Member keeps access until you revoke it.';
  }
  const now = new Date();
  const target = new Date(now);
  if (key === '1mo') target.setMonth(target.getMonth() + 1);
  if (key === '3mo') target.setMonth(target.getMonth() + 3);
  if (key === '6mo') target.setMonth(target.getMonth() + 6);
  if (key === '12mo') target.setFullYear(target.getFullYear() + 1);
  if (key === 'custom') {
    if (!customDate) return 'Pick a date to see the resolved expiry.';
    const parsed = new Date(customDate + 'T12:00:00Z');
    if (Number.isNaN(parsed.getTime())) return 'Invalid date.';
    return `Access expires on ${parsed.toLocaleDateString()} (UTC noon to avoid timezone flips).`;
  }
  return `Access expires on ${target.toLocaleDateString()}.`;
}
