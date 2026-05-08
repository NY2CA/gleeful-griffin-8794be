# Wave 14.1 — Mastery Live · "Your deal" submission flow

**Shipped:** May 7, 2026
**Scope:** Replace the hardcoded Garland mock data with a real per-user deal submission flow. Members submit deals via `/submit-deal`, the function captures and emails Diva and Lou via Resend, the dashboard reads each member's own deal record. No more shared fake "Garland 142-unit" on every login.

## Problem this fixes

The Mastery Live dashboard had `mockDeal` hardcoded with "Garland · 142-unit Class B" data. **Every** student saw the same fake deal. Lou's call: ship the real thing.

## What's new

### Schema additions · `netlify/functions/_lib/store.ts`

- New `DealStatus` type · `'submitted' | 'in_review' | 'active' | 'on_hold' | 'closed_won' | 'closed_lost'`
- New `Deal` interface · property fields, underwriting fields, admin annotations
- `UserRecord` extended with optional `deals: Deal[]`
- New helper `newDealId()` · stable id generator
- New helper `findActiveDeal(user)` · returns the most recently updated live deal (excludes closed)

### New Netlify Function · `netlify/functions/submit-deal.ts`

`POST /api/submit-deal` — auth-gated, captures the form payload, validates, appends to user's deals array, persists, then emails Diva and Lou via Resend with the submission details (subject + HTML table + plain-text fallback).

Soft-fails the email step (logs + continues) so the deal is always saved even if Resend is misconfigured. Admin can still review via `/admin/deals` (Wave 14.2).

### `auth-me.ts` returns the active deal

The dashboard reads `user.activeDeal` from the auth response. The endpoint now pulls the user record, finds the active deal via `findActiveDeal()`, and returns it inline with the user object. `null` when none exists.

### Frontend type extension · `src/hooks/useAuth.tsx`

- New `ActiveDeal` interface mirroring the server-side `Deal`
- `User` extended with optional `activeDeal: ActiveDeal | null`
- All existing auth flows (login, signup, session restore) carry the field through the type system

### New page · `src/pages/submit-deal.tsx`

Member-facing form, navy dashboard skin, fields:

- **Property** · name (required), address, units, asset class, asking price
- **Stage** · pre-LOI / in LOI / in DD / PSA dropdown
- **Underwriting** · NOI, YOC, target IRR
- **Coaching focus** · multi-line textarea with prompt copy

POST to `/api/submit-deal` → success state with "Submitted · in review" confirmation card and a "Back to dashboard" CTA.

### Dashboard `Your deal` card · three-state render

Replaced the hardcoded card with a new `YourDealCard` component that handles three states based on `user.activeDeal`:

1. **`null` (no deal yet)** · Empty state. Headline: "No active deal yet." Body explains the flow. Gold "Submit a deal →" CTA links to `/submit-deal`.
2. **`submitted` / `in_review`** · Submitted card. Shows deal name, status pill, stage, units, asking price. Hint copy: "Diva and Lou will review and respond by your next coaching call." Plus a "Submit another deal" link.
3. **`active` / `on_hold`** · Full populated card. Status, YOC, target IRR, coaching focus, plus a gold-bordered note pane for "Notes from Diva and Lou" when admin has added review notes.

### `mockDeal` removed from dashboard imports

The mock data still lives in `src/data/live.ts` (used by the standalone `/live` legacy preview if anyone navigates there), but the unified `/dashboard` no longer imports it.

## Files changed

```
netlify/functions/_lib/store.ts        ← Deal type, deals[] field, helpers
netlify/functions/auth-me.ts            ← returns user.activeDeal from store
netlify/functions/submit-deal.ts        ← NEW · capture + Resend notification
src/hooks/useAuth.tsx                   ← ActiveDeal type, User.activeDeal
src/pages/dashboard.tsx                 ← YourDealCard component, 3-state render
src/pages/submit-deal.tsx               ← NEW · member submission form
```

## Files unchanged

```
src/data/live.ts                  (mockDeal kept but no longer used by dashboard)
all other auth/billing/admin files
```

## How it works end-to-end

1. **Lou logs in** (admin email) · `auth-me` returns `activeDeal: null` (no deals submitted yet)
2. **Dashboard renders empty state** with "Submit a deal" CTA
3. **Lou clicks CTA** → `/submit-deal` form
4. **Lou fills out form for Garland 142-unit** · property name, address, units, asking, stage, NOI/YOC/IRR, coaching focus
5. **Submits** → `POST /api/submit-deal`
   - Function validates auth, validates body
   - Appends Deal to `user.deals` with status `submitted`
   - Persists via `saveUser`
   - Emails Diva + Lou via Resend with deal details
   - Returns `{ ok: true, deal }`
6. **Lou sees "Submitted · in review"** confirmation card
7. **Returns to dashboard** · `auth-me` now returns the new deal as `activeDeal`
8. **Dashboard "Your deal" card** shows submitted state with deal name, stage, units, asking
9. **Lou (or Diva) opens admin** at `/admin/deals` *(Wave 14.2)*
10. **Promotes to `active`** · adds review notes, YOC/IRR if member didn't fill them
11. **Dashboard now renders full card** with review notes from Diva and Lou

## Wave 14.2 still ahead

- `/admin/deals` page · list all submitted deals across users
- Edit modal: status, YOC, IRR, coaching focus, review notes
- Promote/archive buttons
- Status email notifications (optional, Wave 14.3)

## Deploy

Standard git push to the Mastery Live repo:

```bash
cd ~/Downloads
unzip -o multifamily-platform-wave14.1.zip

rsync -av ~/Downloads/wave14-1/netlify/ \
          ~/Documents/multifamily-platform/netlify/

rsync -av ~/Downloads/wave14-1/src/ \
          ~/Documents/multifamily-platform/src/

cp ~/Downloads/wave14-1/CHANGES-WAVE14.1.md \
   ~/Documents/multifamily-platform/

cd ~/Documents/multifamily-platform
git add netlify/functions/_lib/store.ts netlify/functions/auth-me.ts \
        netlify/functions/submit-deal.ts \
        src/hooks/useAuth.tsx src/pages/dashboard.tsx src/pages/submit-deal.tsx \
        CHANGES-WAVE14.1.md
git commit -m "Wave 14.1: Mastery Live · real deal submission flow (Garland mock removed)"
git push
```

## Verification after deploy

- [ ] Log in to Live dashboard · "Your deal" card shows empty state with "Submit a deal →" CTA (not Garland)
- [ ] Click CTA · land on `/submit-deal` form
- [ ] Submit a test deal · success state appears
- [ ] Check `lou@resciaproperties.com` inbox · email arrived from Resend with deal details
- [ ] Return to `/dashboard` · "Your deal" card now shows submitted state with the deal name
- [ ] Re-login (forces fresh `/api/auth/me` call) · still shows the submitted deal
- [ ] No more "Garland 142-unit" on the dashboard for any user

## Net result

- ❌ No more shared fake Garland deal across all student logins
- ✅ Real per-user submission and tracking
- ✅ Diva and Lou get an email when a member submits
- ✅ Members see honest status (submitted → active → notes from coaches)
- ⏭ Admin review surface comes in Wave 14.2 (next build)
