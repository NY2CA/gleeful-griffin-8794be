# Wave 13 — Dashboard consolidation

**Shipped:** May 1, 2026
**Scope:** Replace the old member dashboard with the new Mastery Live design — every authenticated member now lands on a single unified surface.

## What changed

### `/dashboard` is now the Live design
The cream-and-navy member dashboard from Waves 1–12 has been replaced with the navy + gold Mastery Live treatment. The new `/dashboard` includes:

- Welcome hero with gold accent + cohort progress framing
- Access-pending banner (when admin hasn't granted access yet) — restyled for the dark surface
- Billing strip ("Your plan", renewal date, Manage billing button) — restyled
- Next coaching call · centerpiece card with gold border (Live exclusive)
- AI tutor card · gold gradient (Live exclusive) — links into the resume module's AskAboutTopic surface
- Your deal workspace card (Live exclusive)
- Real curriculum from `useCourse('multifamily-mastery')` with module cards in navy/gold
- Deal memos · from the Rescia desk (Live exclusive)
- Models & templates toolkit
- Weekly reads strip · curated Tuesdays
- Admin tools shortcut (admin users only)
- 11-month upsell modal (annual subs winding down) · unchanged behavior
- Navy footer with Mastery Live branding
- White nav override via the `live-dashboard-active` body class

### `/live/dashboard` and `/live` now redirect to `/dashboard`
The standalone `/live/dashboard` route from Wave 12 is no longer needed — its design IS the dashboard. Both `/live` and `/live/dashboard` now `router.replace('/dashboard')` on mount, so saved bookmarks resolve cleanly.

## Data wiring

| Surface | State |
|---|---|
| Auth | real (`useAuth`) |
| Billing / access | real (`useBilling`) |
| Curriculum + progress | real (`useCourse('multifamily-mastery')`) |
| AI tutor button | real — links to resume module which renders `<AskAboutTopic>` |
| Templates link | real (`/templates`) |
| Admin link | real (`/admin/members`) |
| Coaching call | mock (`@/data/live` — Calendly is the next wire-up) |
| Your deal workspace | mock (deals table is the next wire-up) |
| Deal memos | mock (CMS surface is the next wire-up) |
| Weekly reads | mock (Tuesday cron output is the next wire-up) |

The four mocks all live in `src/data/live.ts` (no change to that file in this wave). Each is a single-file swap when its backend is ready.

## Files changed

```
src/pages/dashboard.tsx              ← rebuilt with Live design + real data wiring
src/pages/live/index.tsx             ← now redirects to /dashboard
src/pages/live/dashboard.tsx         ← now redirects to /dashboard
```

## Files unchanged

```
src/data/live.ts                      (mocks reused as-is)
src/components/Navigation.tsx         (Wave 12.3)
src/components/Card.tsx               (Wave 11)
src/components/Button.tsx             (Wave 11)
src/components/ProgressBar.tsx        (Wave 11)
src/components/UpsellModal.tsx        (Wave 9)
src/styles/globals.css                (Wave 12.2 nav refresh kept)
public/rescia-mark.png                (Wave 12.3)
```

## Verification checklist (post-deploy)

- [ ] Logged-in member at `/dashboard` sees the navy + gold unified dashboard
- [ ] Members WITH access see all surfaces (coaching call, AI tutor, your deal, modules unlocked, deal memos, toolkit, weekly reads)
- [ ] Members WITHOUT access see only: access-pending banner + welcome hero + curriculum preview (modules locked) — no Live exclusives leak
- [ ] `/live/dashboard` redirects to `/dashboard`
- [ ] `/live` redirects to `/dashboard`
- [ ] Existing `/course/[id]`, `/templates`, `/admin/members`, `/pricing` routes still work
- [ ] Nav repaints to white on `/dashboard` only (other pages keep cream nav)
- [ ] Resume button on hero correctly resolves to orientation / Module 1 / next incomplete module based on real progress
- [ ] 11-month upsell modal still fires for annual subs within 30 days of renewal
- [ ] Admin tools card visible only to admin users
- [ ] Module cards correctly show Complete / In progress / Available / Locked states based on real `isComplete`

## Deploy

Same git-push flow.
