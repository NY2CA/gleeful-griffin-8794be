# Wave 12.1 — Live dashboard polish hotfix

**Shipped:** May 1, 2026
**Scope:** Two visual fixes on `/live/dashboard` from Lou's first walkthrough.

## What changed

### 1. Top navigation bar repaint
**Before:** `.nav` used `rgba(250, 247, 242, 0.82)` (cream + 82% opacity + backdrop blur) — fine on cream pages, but rendered as a "murky grey" against the navy Live dashboard below it.

**Fix:** While the Live dashboard is mounted, the page adds a `live-dashboard-active` class to `<body>` and applies a scoped CSS override:

```css
body.live-dashboard-active .nav {
  background: #ffffff !important;
  border-bottom-color: rgba(184, 148, 90, 0.18) !important;
}
```

Crisp white nav with a subtle gold-tinged hairline border. No effect on `/dashboard`, `/foundations`, or any other route — the body class is added on mount and removed on unmount.

### 2. "Live exclusive" badges no longer clipped
**Before:** Badges were positioned absolutely with `top: -10px` so they "stuck out" of the top-left corner of each card. On Retina displays with the offer-card box-shadow stacking above them, the top half of the badge text was getting visually clipped — letters appeared cut off.

**Fix:** Badges are now inline-flow elements at the top of each card content. Slightly larger (font-size 10px instead of 9px), more padding, fully legible. Loses the "ribbon" aesthetic but gains reliability.

## Files changed

```
src/pages/live/dashboard.tsx     ← updated
```

That's it. One file. Pure visual polish, no logic changes, no new dependencies.

## Files unchanged

```
src/data/live.ts                 (untouched — Wave 12)
src/pages/live/index.tsx         (untouched — Wave 12)
```

## Deploy

Same git-push flow as Wave 12. See `DEPLOY-WAVE12.1.md` (this folder) for the rsync + commit + push commands.
