# Wave 15.4 — Mastery Live · Coaching call card · evergreen Calendly CTA

**Shipped:** May 8, 2026
**Scope:** Replace the mock "Next coaching call · Tuesday, May 5" centerpiece card with an evergreen Calendly-linked CTA. Same gold-bordered centerpiece position; no more fake date or Garland-themed pre-brief content.

## Problem this fixes

Lou flagged: the top-of-dashboard "Next coaching call" centerpiece was still rendering `mockCoachingCall.whenHuman` ("Tuesday, May 5") and a Garland-themed pre-brief to every Live member regardless of their actual schedule. Same mock-content pattern we fixed for deal memos and weekly reads in Wave 15.2, but on a different surface.

## What's new · `src/pages/dashboard.tsx`

The card stays in the same prominent position right after the welcome hero, with the same gold-bordered navy gradient chrome. Content swap:

**Was:**

```
NEXT COACHING CALL
Tuesday, May 5
with Diva and Lou — focus: Garland 142-unit Class B underwriting...
[Add to calendar]  [Submit a question]
```

**Now:**

```
COACHING
Schedule your next coaching call.
Ongoing monthly coaching with Diva and Lou. Book a slot when you have a deal in flight or a question you want pressure-tested.
[Book coaching call]
```

Single CTA opens `https://calendly.com/mastery-live-strategy-call` in a new tab — same Calendly URL used for Mastery Live strategy calls. If you set up a separate Calendly event type for ongoing coaching (vs initial strategy calls), swap the URL on this card and on `pricing.tsx` / `index.tsx` constants.

Removed UI hooks: "Add to calendar" (mockCoachingCall.icsHref pointed to `#`) and "Submit a question" (mockCoachingCall.questionHref also `#`) — those were always non-functional placeholders.

## Files changed

```
src/pages/dashboard.tsx     ← Coaching call centerpiece swapped to evergreen Calendly CTA
```

The `mockCoachingCall` import + the data file (`src/data/live.ts`) stay in place. The single dashboard reference is gone, but if anything else in the codebase references the data, it still resolves. Cleanup-of-the-unused-import is a future polish item.

## Future · what would replace this with real data

When you're ready, the next step is admin-curated coaching schedule:

- Schema: `nextCoachingCall?: { whenIso, focus, preBrief, calendarUrl }` on UserRecord
- Admin surface at `/admin/coaching` to set the next call per-member or globally
- Dashboard reads it; falls back to the evergreen Calendly CTA when not set

That's a bigger lift (~1 wave). For now, evergreen CTA is the right balance between honesty and member utility.

## Deploy

```bash
cd ~/Downloads
unzip -o multifamily-platform-wave15.4.zip

rsync -av ~/Downloads/wave15-4/src/ \
          ~/Documents/multifamily-platform/src/

cp ~/Downloads/wave15-4/CHANGES-WAVE15.4.md \
   ~/Documents/multifamily-platform/

cd ~/Documents/multifamily-platform
git add src/pages/dashboard.tsx CHANGES-WAVE15.4.md
git commit -m "Wave 15.4: Mastery dashboard · replace mock coaching call with Calendly CTA"
git push
```

## Verification

- [ ] Hard-refresh `/dashboard` as a Live member · top centerpiece reads "Schedule your next coaching call" (no May 5 date, no Garland reference)
- [ ] Click **Book coaching call** · opens Calendly in a new tab at `mastery-live-strategy-call`
- [ ] Old "Add to calendar" + "Submit a question" buttons are gone
- [ ] All other dashboard surfaces (AI banner, Your deal, curriculum, Toolkit + Admin) still render correctly
