# Wave 15.1 — Mastery site pricing coherence + Calendly hookup

**Shipped:** May 7, 2026
**Scope:** Replace the legacy Monthly/Annual/Lifetime price grid with the real three-tier ladder (Foundations / Self-Study / Live), and wire every "Book Strategy Call" CTA on the landing page to your Calendly URL. Closes task #85.

## Problem this fixes

Two things were wrong on the Mastery marketing surface:

1. **`/pricing` showed legacy numbers** — Monthly $39, Annual $400, Lifetime $2,500 — that conflicted with the new product story (Foundations $99, Self-Study $1,997, Live by inquiry). The "One program. Three ways to join." headline was also stuck in the old single-product worldview.
2. **"Book Strategy Call" CTAs were a hidden lead leak.** Every CTA on the landing page opened a custom modal/form that POSTed to `/api/leads/strategy-call`. That Function does not exist — submissions silently 404'd. The modal showed "Submitted" anyway, so visitors thought they'd booked a call. Lou and Diva never saw the lead.

## What's new

### `/pricing` rewritten as a three-tier ladder · `src/pages/pricing.tsx`

Three cards in a single grid, each handing off to the right destination:

| Card | Price | CTA | Destination |
|---|---|---|---|
| **Foundations** (start here) | $99 one-time | Start with Foundations → | `https://foundations.resciaproperties.com` (new tab) |
| **Mastery · Self-Study** *(most popular)* | $1,997 one-time | Enroll in Self-Study → | `https://selfstudy.resciaproperties.com` (new tab) |
| **Mastery Live** (coaching tier) | By inquiry | Book a strategy call → | `https://calendly.com/mastery-live-strategy-call` (new tab) |

All external links open in a new tab so visitors keep the pricing page open.

The headline changed from *"One program. Three ways to join."* to *"Three ways to learn the multifamily game."* — accurately describes the ladder rather than implying one product.

A "Not sure which fits?" prose block under the cards explains the ladder logic in one paragraph: most people start with Foundations if multifamily is new, jump to Self-Study if they already know basics, book a strategy call for Live if they have a deal in flight or want a coach in the room.

Logged-in member nudge at the bottom: members see *"Back to your dashboard"* link; signed-out visitors see *"Already a member? Sign in"*. No more `useBilling` integration on the page (the new flow is admin-grants-access for Live, external Stripe for Foundations/Self-Study, neither of which run from this surface).

### Landing-page strategy-call CTAs now hit Calendly · `src/pages/index.tsx`

Single-line change inside `openModal()`:

```ts
function openModal(e?: MouseEvent) {
  if (e) e.preventDefault();
  if (typeof window !== 'undefined') {
    window.open(STRATEGY_CALL_URL, '_blank', 'noopener,noreferrer');
  }
}
```

Every existing CTA that calls `onClick={openModal}` (nav, hero, two mid-page buttons, footer, mobile menu) now opens `https://calendly.com/mastery-live-strategy-call` in a new tab. Calendly captures name + email at the booking step.

The legacy modal markup (form fields, "Book your free strategy call" heading, the submitForm handler) stays in the JSX as dead code, gated by `modalOpen` which is no longer ever set to true. **One line revert** restores the old custom form behavior if you ever swap Calendly out.

Both `pricing.tsx` and `index.tsx` define the same `STRATEGY_CALL_URL` constant. If you change Calendly accounts, two single-line updates and you're done.

## Files changed

```
src/pages/pricing.tsx        ← full rewrite · three-tier ladder
src/pages/index.tsx          ← openModal → Calendly redirect (1-fn change)
```

## Files unchanged

```
src/components/Navigation.tsx        (Pricing link in top nav still goes to /pricing)
netlify/functions/                   (no Function changes — Foundations/Self-Study handle their own checkout)
src/hooks/useBilling.tsx              (no change — pricing page no longer uses it)
src/data/                            (no content changes)
```

## What's no longer happening

- Monthly $39 / Annual $400 / Lifetime $2,500 cards are gone from the public surface
- The "Request access" Stripe-routed flow no longer runs from `/pricing` (members reach Stripe via Self-Study and Foundations sites instead, or via admin grant for Live)
- The custom strategy-call form modal no longer opens (still in the file as dead code)
- Lead-leak via `/api/leads/strategy-call` 404s no longer happens (the call site is unreachable)

## Deploy

```bash
cd ~/Downloads
unzip -o multifamily-platform-wave15.1.zip

rsync -av ~/Downloads/wave15-1/src/ \
          ~/Documents/multifamily-platform/src/

cp ~/Downloads/wave15-1/CHANGES-WAVE15.1.md \
   ~/Documents/multifamily-platform/

cd ~/Documents/multifamily-platform
git add src/pages/pricing.tsx src/pages/index.tsx CHANGES-WAVE15.1.md
git commit -m "Wave 15.1: Mastery pricing coherence + Calendly hookup"
git push
```

## Verification after deploy

- [ ] Hard-refresh `/pricing` (cmd+shift+R). See three cards: Foundations $99, Self-Study $1,997 (gold border, "Most popular"), Live "By inquiry"
- [ ] Click **Start with Foundations** · opens `foundations.resciaproperties.com` in a new tab (subdomain may not be live yet — that's fine, link is correct)
- [ ] Click **Enroll in Self-Study** · opens `selfstudy.resciaproperties.com` in a new tab
- [ ] Click **Book a strategy call** · opens Calendly in a new tab
- [ ] Hard-refresh landing (`/`). Click any **Book Strategy Call** button (nav, hero, mid-page, footer, mobile menu) · all open Calendly in a new tab
- [ ] Confirm the legacy form modal does NOT open (no overlay appearing on click)
- [ ] As a logged-in member, visit `/pricing` · see the "Back to your dashboard" link at bottom
- [ ] As a signed-out visitor, see "Already a member? Sign in" link at bottom

## Net result

- ❌ No more conflicting Monthly/Annual/Lifetime numbers on a public surface
- ❌ No more silently-dropped strategy-call leads
- ✅ Three clean tier cards routing visitors to the right destination
- ✅ Calendly captures every strategy-call booking
- ✅ One constant (`STRATEGY_CALL_URL`) controls the booking link site-wide

Task #85 complete. Next up: #91 (Self-Study production dashboard) per Lou's queue.
