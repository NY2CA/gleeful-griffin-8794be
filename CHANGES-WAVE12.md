# Wave 12 — Mastery Live dashboard integration

**Shipped:** May 1, 2026
**Scope:** Add the `/live/dashboard` route to the multifamily-platform codebase. Course-specific surface for Mastery Live cohort members, independent of the existing `/dashboard` route which serves the Multifamily Mastery course.

## What's new

### New route
- `/live` → redirects to `/live/dashboard`
- `/live/dashboard` → the Mastery Live cohort dashboard

### New files
```
src/data/live.ts                    Live curriculum (12 modules) + mock cohort/coaching/deal/memo/reads data
src/pages/live/index.tsx            Redirect to /live/dashboard
src/pages/live/dashboard.tsx        The full Live dashboard
```

### Existing files modified
None. Wave 12 is purely additive.

## Visual treatment

Uses the existing Mastery palette verbatim — `--navy`, `--gold`, `--cream` from `src/styles/globals.css`. No new CSS variables or fonts. Mastery brand at full intensity (vs Self-Study which will be Mastery brand at low intensity in a later wave).

Key surfaces:
1. **Welcome hero** · navy gradient with cohort + month progress
2. **Next coaching call** · centerpiece card, gold-bordered, "Live exclusive" badge
3. **AI tutor** · gold-gradient first-class card, "Live exclusive" badge
4. **Your deal** workspace · status / YOC / IRR / coaching focus, "Live exclusive" badge
5. **Curriculum** · all 12 modules unlocked, color-coded by status (complete / in-progress / available)
6. **Deal memos** · from the Rescia desk, "Live exclusive" badge
7. **Toolkit** · cross-link to existing `/templates` page
8. **Weekly reads** · curated Tuesdays, populated by the `tuesday-multifamily-articles` scheduled task in a future wave

## Access gating

Initial preview wave is gated to `user.isAdmin` users only:

```ts
if (!user.isAdmin) {
  router.replace('/dashboard');
}
```

This means Lou (admin) can preview the dashboard at the live URL before any cohort members exist. Self-Study and Foundations buyers are routed to their own dashboards (Self-Study lands on `/dashboard` for now, Foundations on `/foundations` once that ships).

**TODO for next wave:** add a `cohort: 'live' | 'self-study' | null` field to the user record in `netlify/functions/lib/store.ts`, switch the gate to `user.cohort === 'live'`, and add an `/admin/cohorts` UI for granting Live cohort access.

## Data wiring (current vs target)

| Surface | Today | Target |
|---|---|---|
| Cohort progress | hard-coded `mockCohortState` | per-user state from `/api/live/state` |
| Coaching call | hard-coded `mockCoachingCall` | Calendly integration |
| Deal workspace | hard-coded `mockDeal` | new `deals` table + Netlify Function |
| Deal memos | hard-coded `mockMemos` | Notion / CMS surface |
| Weekly reads | hard-coded `mockWeeklyReads` | `tuesday-multifamily-articles` cron output |

All of these are isolated in `src/data/live.ts` so the wiring swap is a single-file change per surface.

## Deploy

Standard Wave deploy:
1. Unzip into the deploy environment
2. `npm install`
3. `npm run build`
4. Push to Netlify (git remote or manual upload — same flow as Waves 1–11)

No new env vars required. No database migration. No Stripe changes.

## Verification checklist (post-deploy)

- [ ] `/live` redirects to `/live/dashboard`
- [ ] Logged-out user visiting `/live/dashboard` is redirected to `/login`
- [ ] Logged-in non-admin user is redirected to `/dashboard`
- [ ] Logged-in admin sees the full Live dashboard
- [ ] All 12 modules render with correct status badges
- [ ] Coaching call, AI tutor, Deal, Memos, Weekly reads all render with "Live exclusive" pills
- [ ] Existing `/dashboard` route still works for Multifamily Mastery course members
- [ ] Existing `/foundations` route still works
- [ ] No console errors in the browser

## Known gaps · ship anyway

- Coaching call "Add to calendar" anchor is `href="#"` — Calendly wiring is the next deliverable
- AI tutor "Open AI tutor" button doesn't link anywhere yet — needs the AI tutor sub-route in a later wave
- Module cards are not yet clickable — module pages for Live (separate from `/course/[id]`) come in a later wave
- Toolkit link points to existing `/templates` page (which works for admins) — Live-specific toolkit comes later

These are deliberate. Get the dashboard shape on the live site, get Lou's eyes on it, refine before wiring the deeper surfaces.
