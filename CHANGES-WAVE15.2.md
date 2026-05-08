# Wave 15.2 — Mock-content cleanup + time-flexible admin grants

**Shipped:** May 7, 2026
**Scope:** Two orthogonal changes bundled. (a) Hide the two remaining mock-content cards on the Mastery Live dashboard until real wire-ups exist. (b) Let admins grant access with an optional expiry — for partner comps, partial-term mentoring engagements, or onboarding a student who has X months of mentoring left from a prior agreement.

## Problem this fixes

**Lou flagged:** the "Deal memos · from the Rescia desk" card on the Mastery Live dashboard was showing fake placeholder content (Plano 88-unit, West Valley Phoenix, property-management contract). Same risk as the Garland mock data we killed in Wave 14.1 — students see fake content on every login and get confused. While we were there, the "Weekly reads" card had the same issue (fake CBRE/MFE/Bisnow article cards).

**Lou's onboarding need:** A student is several months into mentoring under a prior agreement and is now logging into the platform. Time on Lou's side is finite — he wants the access to expire when the contract was supposed to end, not run forever.

## What's new

### (a) Mock-content cards hidden behind a flag · `src/pages/dashboard.tsx`

Single module-scope flag at the top:

```ts
const SHOW_MOCK_FEEDS = false;
```

Two surfaces are gated by it:

- **Deal memos · from the Rescia desk** — gated. The Toolkit card (real surface) was paired with it in a 2-col grid, so when memos are hidden the grid wrapper renders Toolkit at full width gracefully.
- **Weekly reads · curated Tuesdays** — gated. Hidden until the Tuesday-articles cron is wired into a real CMS.

Flip `SHOW_MOCK_FEEDS = true` to bring them back instantly. They'll come back for real when an admin-curated memo system + Tuesday CMS land in a future wave.

### (b) Time-flexible admin grants · 4 files

**Schema · `netlify/functions/_lib/store.ts`**

New optional field on `UserRecord`:

```ts
adminGrantedUntil?: string;  // ISO date · absent = indefinite
```

`hasActiveAccess()` updated: if `adminGrantedUntil` is set and has passed, the admin grant no longer counts. Other access rules (lifetime, Stripe sub, ADMIN_EMAILS env) still apply.

**Function · `netlify/functions/admin-grant-access.ts`**

`POST /api/admin/grant-access` now accepts a `duration` body parameter:

| Value | Result |
|---|---|
| omitted / `'indefinite'` | No expiry (default — preserves prior behavior) |
| `'1mo'`, `'3mo'`, `'6mo'`, `'12mo'` | Expires N months from "now" |
| ISO date string (`'2026-12-31'`) | Custom expiry · must be in the future |
| anything else | Rejects with 400 |

Re-granting overwrites the previous expiry. Server-side validation rejects past dates so admins can't accidentally lock out a member.

**Function · `netlify/functions/admin-revoke-access.ts`**

Now also clears `adminGrantedUntil` on revoke. Without this, a future re-grant could accidentally inherit a stale expiry.

**Function · `netlify/functions/admin-list-users.ts`**

Returns `adminGrantedUntil` in the projection so the table can display the expiry.

**UI · `src/pages/admin/members.tsx`**

Three changes:

1. **Grant button now opens a modal** instead of immediately granting. The modal lets the admin pick: Indefinite / 1 month / 3 months / 6 months / 12 months / Custom date. A live "Result:" preview shows where the expiry lands in plain English ("Access expires on Aug 7, 2026") before they click Save.
2. **Granted rows now show "Edit expiry" + "Revoke"** — admins can change the expiry on an already-granted member without first revoking. Re-grant flow uses the same modal pre-populated with the current expiry.
3. **Source label shows expiry inline** — instead of just "Admin grant · diva@…" the label now reads `Admin grant · diva@… · expires Aug 7, 2026 · 92d left` (or `· indefinite` if no expiry, `· expired Apr 3, 2026` if already past).

## Files changed

```
src/pages/dashboard.tsx                    ← SHOW_MOCK_FEEDS flag · gate two cards
src/pages/admin/members.tsx                 ← duration modal + Edit-expiry button + expiry display
netlify/functions/_lib/store.ts             ← adminGrantedUntil field + hasActiveAccess check
netlify/functions/admin-grant-access.ts     ← accept duration param, resolve to ISO expiry
netlify/functions/admin-revoke-access.ts    ← also clear adminGrantedUntil
netlify/functions/admin-list-users.ts       ← return adminGrantedUntil in projection
```

## Migration notes

Existing admin-granted users have `adminGrantedAt` but no `adminGrantedUntil` — they remain indefinite, no behavior change. Lifetime purchases and Stripe subs are unaffected by either change.

## Deploy

```bash
cd ~/Downloads
unzip -o multifamily-platform-wave15.2.zip

rsync -av ~/Downloads/wave15-2/netlify/ ~/Documents/multifamily-platform/netlify/
rsync -av ~/Downloads/wave15-2/src/     ~/Documents/multifamily-platform/src/
cp     ~/Downloads/wave15-2/CHANGES-WAVE15.2.md ~/Documents/multifamily-platform/

cd ~/Documents/multifamily-platform
git add netlify/functions/_lib/store.ts \
        netlify/functions/admin-grant-access.ts \
        netlify/functions/admin-revoke-access.ts \
        netlify/functions/admin-list-users.ts \
        src/pages/dashboard.tsx \
        src/pages/admin/members.tsx \
        CHANGES-WAVE15.2.md
git commit -m "Wave 15.2: hide mock content + time-flexible admin grants"
git push
```

## Verification after deploy

**Mock cleanup:**

- [ ] Hard-refresh `/dashboard` as a Live member · "Deal memos · from the Rescia desk" card is gone, "What we're reading this week" card is gone
- [ ] Toolkit card still renders (full width now that memos doesn't share its grid row)
- [ ] All other dashboard surfaces (Your deal, curriculum, AI tutor, coaching call, admin shortcut) still render normally

**Time-flexible grants:**

- [ ] Open `/admin/members` as Lou
- [ ] Find your existing student. If they're not granted, click **Grant access** · modal opens
- [ ] Pick **3 months** · the "Result:" preview should read e.g. *"Access expires on Aug 7, 2026."* · click Grant access
- [ ] Table refreshes · the Source column reads *"Admin grant · lou@… · expires Aug 7, 2026 · 92d left"*
- [ ] Click **Edit expiry** on the same row · modal reopens · pre-populated with the custom date
- [ ] Switch to **Indefinite** · Save · row updates to *"Admin grant · lou@… · indefinite"*
- [ ] Click **Revoke** · grant cleared, row goes back to "Grant access" pending state
- [ ] Re-grant with **Custom date** · pick a date 4 months out · confirm the resolved date matches the picker

For the actual student onboarding: pick **Custom date** and enter the date their original mentoring agreement was set to end. Member loses access automatically at that date.

## Net result

- ❌ No more fake "Plano 88-unit" / "West Valley" memo cards confusing students
- ❌ No more fake CBRE/MFE/Bisnow article cards
- ❌ No more "indefinite or nothing" admin grants
- ✅ Two flag flips bring the mock surfaces back when real CMS arrives
- ✅ Five preset durations + custom date covers every grant scenario
- ✅ Live preview before saving prevents date mistakes
- ✅ Source label tells you at a glance how much time each grant has left

Wave 15.3 not currently planned. Ready to move to #91 (Self-Study production dashboard) when this verifies green.
