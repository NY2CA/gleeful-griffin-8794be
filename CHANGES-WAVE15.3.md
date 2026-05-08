# Wave 15.3 — Mastery Live dashboard layout rebalance

**Shipped:** May 7, 2026
**Scope:** Three layout moves on `/dashboard` to fix proportions you flagged: AI tutor box was too tall for its content, side-by-side with the Your-deal card created awkward height-matching when deal count varied (1 deal vs 3), and the Toolkit / Coaching-workspace-admin tiles weren't visually uniform.

## What changed

### 1. AI tutor → full-width horizontal banner

Was a half-width 2-col card paired with Your deal. Restructured to mirror the existing "Next coaching call" pattern that sits above it: full-width with copy on the left and CTA button on the right. Roughly half the previous vertical height.

Same gold-gradient palette, same content. Just laid out sideways.

### 2. Your deal(s) → its own full-width row

Pulled out of the 2-col grid. Now sits below the AI banner as its own full-width Card. Two practical wins:

- **Scales cleanly with deal count.** 1, 3, or 5 deals all stack vertically inside the card without the AI banner having to grow to match.
- **No more empty space** when only 1 deal is live — the card hugs its content.

### 3. Toolkit + Coaching workspace admin → 2-col grid (admins) / Toolkit alone (members)

The `/admin/deals` + `/admin/members` shortcut tile used to sit at the very bottom of the page as a separate full-width section. Pulled it up to sit next to **Models & templates** (Toolkit) so the two utility tiles match in size and density. Both render in a 2-col grid for admins.

For non-admin members, only Toolkit shows — full-width, same as today.

## New top-to-bottom structure

```
Hero · welcome message
Stats strip
Billing strip (when applicable)
─── Next coaching call ── full-width banner (existing)
─── AI tutor ────────── full-width banner (NEW · Wave 15.3)
─── Your deal(s) ─────── full-width row (NEW · Wave 15.3)
─── Curriculum ─────────
─── Deal memos ───────── full-width row (when SHOW_MOCK_FEEDS, hidden today)
─── Toolkit + Admin ──── 2-col grid (admins) / Toolkit alone (members)
─── Weekly reads ─────── full-width row (when SHOW_MOCK_FEEDS, hidden today)
Footer
```

The two horizontal banners (Next coaching call + AI tutor) at the top create a visual rhythm — each is its own focal point at low height. Then Your deal takes whatever vertical space it needs based on deal count. Curriculum dominates the middle. Toolkit + Admin pair up uniformly at the bottom.

## Files changed

```
src/pages/dashboard.tsx    ← three layout edits + admin tile pulled up from bottom
```

## Files unchanged

```
All Functions, hooks, components, data files — purely a JSX restructure.
```

## Deploy

```bash
cd ~/Downloads
unzip -o multifamily-platform-wave15.3.zip

rsync -av ~/Downloads/wave15-3/src/ \
          ~/Documents/multifamily-platform/src/

cp ~/Downloads/wave15-3/CHANGES-WAVE15.3.md \
   ~/Documents/multifamily-platform/

cd ~/Documents/multifamily-platform
git add src/pages/dashboard.tsx CHANGES-WAVE15.3.md
git commit -m "Wave 15.3: dashboard layout rebalance (AI banner, deals row, uniform admin tiles)"
git push
```

## Verification after deploy

- [ ] Hard-refresh `/dashboard` as admin (Lou)
- [ ] Top of page: Next coaching call banner, AI tutor banner — both horizontal, similar height
- [ ] AI tutor button "Open AI tutor" sits on the right edge of its banner (not below the copy)
- [ ] Your deal card sits below the AI banner, full-width
- [ ] Submit 2 more test deals to bring it to 3 live · the card stacks all 3 deals vertically with gold dividers, AI banner stays the same height
- [ ] Scroll down past curriculum · "Models & templates" (Toolkit) and "Coaching workspace · admin" sit side-by-side at matching density
- [ ] Old admin tile at the very bottom of the page is gone (was duplicated previously? No — it moved cleanly)
- [ ] Log in as a non-admin member (Diva or a test account if one exists). Toolkit renders alone full-width; no admin tile visible

If proportions still feel off, the easiest knob to turn is the AI banner's max-width on the body copy (currently `maxWidth: 640`). Drop to 520 to shrink the banner, raise to 720 to expand. One number to change.

## Net result

- ❌ AI tile no longer dominates the top half of the dashboard
- ❌ No more side-by-side height pressure when deal count varies
- ✅ Two horizontal banners (Coaching + AI) create a visual rhythm
- ✅ Your deal card scales to N deals naturally
- ✅ Toolkit + Admin tiles are uniform at matching density
- ✅ Single-file change, no Function or schema impact
