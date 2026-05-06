# Wave 13.2 — Mastery Live · clickable weekly reads (parity with Self-Study)

**Shipped:** May 6, 2026
**Scope:** Mirror the Self-Study Wave SS-2.6 fix on the Mastery Live dashboard. Weekly reads cards on `/dashboard` were rendering without anchor tags; now they're clickable.

## What changed

### `src/data/live.ts`

The `WeeklyRead` interface already had an optional `href` field. The 3 mock entries now have it populated pointing at the source publications:

- CBRE → https://www.cbre.com/insights
- Multifamily Executive → https://www.multifamilyexecutive.com/
- Bisnow Multifamily → https://www.bisnow.com/multifamily

When the Tuesday article curation cron starts feeding real articles into the dashboard (downstream wave), each will have its own real URL. The infrastructure is now in place to receive them.

### `src/pages/dashboard.tsx`

The weekly reads grid renders each card as either an `<a>` (when href is present) or a plain `<div>` (when href is missing — backwards compatible). Anchor cards:

- `target="_blank" rel="noopener noreferrer"` so click opens in a new tab
- Small gold "↗" indicator next to the title, signaling clickability
- Hover state: border brightens, background lifts to `#102240`
- Same visual treatment otherwise — no design change

## Files changed

```
src/data/live.ts            ← href populated on mockWeeklyReads entries
src/pages/dashboard.tsx     ← weekly reads grid maps to anchor or div based on href
```

## Files unchanged

```
Everything else — no other surfaces touched.
```

## Deploy (Mastery Live repo · git push)

```bash
cd ~/Downloads
unzip -o multifamily-platform-wave13.2-hotfix.zip

rsync -av ~/Downloads/wave13-2-hotfix/src/data/live.ts \
          ~/Documents/multifamily-platform/src/data/live.ts

rsync -av ~/Downloads/wave13-2-hotfix/src/pages/dashboard.tsx \
          ~/Documents/multifamily-platform/src/pages/dashboard.tsx

cp ~/Downloads/wave13-2-hotfix/CHANGES-WAVE13.2.md \
   ~/Documents/multifamily-platform/

cd ~/Documents/multifamily-platform
git add src/data/live.ts src/pages/dashboard.tsx CHANGES-WAVE13.2.md
git commit -m "Wave 13.2: Live dashboard weekly reads cards now clickable (parity with Self-Study)"
git push
```

This is the **Mastery Live repo** (`gleeful-griffin-8794be`) — different from the Self-Study repo. Push goes to your existing Live deploy. Netlify rebuilds automatically.

## Verification after deploy

1. Log into `/dashboard` on the Live site (the existing Mastery course)
2. Scroll to the "This week's reads · curated Tuesdays" card
3. Hover over each of the three article cards — border should brighten, background lifts
4. Click any card — should open the source publication's site in a new tab
5. Confirm the gold "↗" indicator next to each article title

Same fix landed concurrently on Self-Study (Wave SS-2.6) — both products have parity now.
