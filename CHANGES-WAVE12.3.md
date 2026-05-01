# Wave 12.3 — Logo mark visual parity with wordmark

**Shipped:** May 1, 2026
**Scope:** Fix the Rescia logo so the building mark visually matches the "Rescia Properties" wordmark next to it.

## What was wrong

`rescia-logo.png` is a 1080×1080 square that contains the building mark in the upper-middle portion **and** a "RESCIA PROPERTIES" wordmark BELOW it — surrounded by significant whitespace. When sized at 52px tall in the nav:
- The visible building mark rendered at only ~20px tall (because of all the whitespace above and below)
- The wordmark text inside the image rendered at maybe ~6-8px — illegibly small
- The separate `<span>Rescia Properties</span>` next to it was redundant with the wordmark already baked into the image

Net result: the logo looked tiny and there were two "Rescia Properties" wordmarks fighting for the same space.

## What changed

### 1. New asset: `public/rescia-mark.png`
Cropped the building mark out of the full lockup, padded as a transparent PNG at 512×512. This is the bare three-tower mark with no wordmark, no whitespace bloat.

The original `rescia-logo.png` (full lockup with wordmark) is kept untouched — still useful for marketing surfaces, favicons, social cards, PDF headers.

### 2. `Navigation.tsx` updated
Switched the nav `<img>` source from `/rescia-logo.png` to `/rescia-mark.png` and reset the height to 40px. Paired with the typeset 24px wordmark next to it, the mark now reads at proper visual parity — no more dwarfed mark, no more redundant wordmark.

```diff
- src="/rescia-logo.png"
+ src="/rescia-mark.png"
- style={{ height: 52, width: 'auto', display: 'block' }}
+ style={{ height: 40, width: 'auto', display: 'block' }}
```

## Files changed

```
public/rescia-mark.png            ← NEW · cropped building mark, transparent PNG
src/components/Navigation.tsx     ← uses new asset at 40px height
```

## Files unchanged

```
public/rescia-logo.png            (full lockup, kept for non-nav uses)
src/styles/globals.css            (Wave 12.2 nav refresh stays as-is)
src/pages/live/dashboard.tsx      (Wave 12.2 polish stays as-is)
```

## Deploy

Same git-push flow.
