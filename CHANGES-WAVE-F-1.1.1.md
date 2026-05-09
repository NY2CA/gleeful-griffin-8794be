# Wave F-1.1.1 — Pricing accuracy hotfix

**Shipped:** May 8, 2026
**Scope:** Two pricing surfaces had inaccurate access terms and (on Self-Study) a full legacy layout that referenced Mastery Live throughout. Both fixed in companion bundles.

## Mastery /pricing access-term fix · `src/pages/pricing.tsx`

The bullet lists on the Multifamily 101 and Self-Study cards were saying "lifetime access" when the actual products carry term limits. Updated to match the canonical terms on the Self-Study landing page:

**Multifamily 101 card:**
- Was: "Self-paced, lifetime access"
- Now: "Self-paced · 1 year of access"

**Self-Study card:**
- Was bullets included "Lifetime access · all future updates included"
- Now: "12 months of access" + "Tuition credits toward Mastery Live" (matches the LadderCard description)
- First bullet also rewritten to match Self-Study's actual structure: "Eight modules · 60 topics · submarket through property management" (was "Twelve modules · ~60 hours" — twelve was the Mastery legacy count, Self-Study is eight)
- Second bullet adds "DD checklists" alongside the existing models/templates list

## Files changed (Mastery)

```
src/pages/pricing.tsx     ← bullet accuracy on Multifamily 101 + Self-Study cards
```

## Self-Study /pricing rewrite · companion bundle

`multifamily-selfstudy-wave-f-1.1.1.zip` (separate zip) ships a full rewrite of Self-Study's `/pricing` page. Was the legacy Monthly $39 / Annual $400 / Lifetime $2,500 Mastery layout — never updated when Self-Study became its own product. References to "Multifamily Mastery program" and "Quarterly live Q&A" had stuck around.

Now the Self-Study `/pricing` mirrors the Mastery `/pricing` three-tier ladder, but with **Self-Study highlighted** as "You are here":

- **Multifamily 101 card** — same as Mastery's, links to Multifamily 101 site
- **Mastery Self-Study card** — highlighted gold, label "You are here", CTA routes to `/dashboard` for logged-in members or `/signup` for visitors
- **Mastery Live card** — same as Mastery's, opens Calendly via the existing `openCalendly` helper

Bullets on the Self-Study card match the LadderCard description on Self-Study's landing page. "Already a Self-Study member?" sign-in nudge at the bottom for returning members.

See the Self-Study companion bundle for deploy instructions.

## Deploy (Mastery)

```bash
cd ~/Downloads
unzip -o multifamily-platform-wave-f-1.1.1.zip

rsync -av ~/Downloads/wave-f-1.1.1/src/ \
          ~/Documents/multifamily-platform/src/

cp ~/Downloads/wave-f-1.1.1/CHANGES-WAVE-F-1.1.1.md \
   ~/Documents/multifamily-platform/

cd ~/Documents/multifamily-platform
git add src/pages/pricing.tsx CHANGES-WAVE-F-1.1.1.md
git commit -m "Wave F-1.1.1: Mastery /pricing access-term accuracy"
git push
```

## Verification

- [ ] Hard-refresh `resciapropertiesmentorship.com/pricing` (private window)
- [ ] First card (Multifamily 101) bullet says "Self-paced · 1 year of access" (not "lifetime")
- [ ] Second card (Mastery · Self-Study) bullets say "12 months of access" and "Tuition credits toward Mastery Live"
- [ ] Self-Study deploy companion lands cleanly — `selfstudy.resciapropertiesmentorship.com/pricing` shows the three-tier ladder with Self-Study highlighted as "You are here"
