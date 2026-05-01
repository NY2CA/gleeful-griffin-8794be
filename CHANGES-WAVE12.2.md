# Wave 12.2 — Live dashboard polish + global nav refresh

**Shipped:** May 1, 2026
**Scope:** Three fixes from Lou's second walkthrough.

## What changed

### 1. "Live exclusive" badge no longer crowds the eyebrow text
**Before:** Badge was `display: inline-block` followed directly by an inline `<span class="eyebrow">` on the Deal Memos card — the two rendered side-by-side on the same line, with no breathing room.

**Fix:** Badge is now `display: block; width: fit-content` so it sits on its own line above the eyebrow. `marginBottom: 14` now actually creates vertical space between the badge and the heading below.

`src/pages/live/dashboard.tsx`

### 2. Curriculum copy updated
**Before:** "Work them in sequence or jump ahead. Diva and Lou track your progress and bring it into coaching."

**After:** "Work them in sequence; the preferred course progression — or jump ahead. Diva and Lou track your progress and bring it into coaching."

`src/pages/live/dashboard.tsx`

### 3. Global nav banner refresh
**Before:**
- Logo height: 40px
- Brand text "Rescia Properties": 20px
- Dashboard link: 14px, ink-dim grey, weight 400 — visually outclassed by the Sign out button next to it

**After:**
- Logo height: **52px** (+30%)
- Brand text: **24px** (+20%)
- Logo gap: 10px → 12px (proportional to size bump)
- Dashboard link: **15px, navy, weight 500** — balanced visual weight against the Sign out button
- Hover color: navy → `gold-deep` (clearer affordance signal)
- Sign out button: weight 500 (matches Dashboard link's weight)

These nav changes are global — they apply to every authenticated page (`/dashboard`, `/foundations`, `/live/dashboard`, `/templates`, `/admin/members`, etc.), not just `/live/dashboard`. The nav reads as a more deliberate, more institutional brand on every member-facing surface.

`src/components/Navigation.tsx` and `src/styles/globals.css`

## Files changed

```
src/pages/live/dashboard.tsx     ← badge style + curriculum copy
src/components/Navigation.tsx    ← logo height
src/styles/globals.css           ← brand text size, link size, link color, weights
```

## Files unchanged

```
src/data/live.ts
src/pages/live/index.tsx
```

## Impact on other pages

The nav refresh affects every page using `<Navigation />`. The visual change is:
- Slightly larger, more present logo + brand wordmark
- Nav links are navy instead of grey (more readable, more confident)

If you don't like the nav-refresh on the existing Mastery course pages and want to scope it to Live only, let me know and I'll re-issue with the nav changes wrapped in the same `body.live-dashboard-active` selector pattern used for the white nav background in Wave 12.1.

## Deploy

Same git-push flow. See deploy commands in this folder.
