# Wave F-1.1 — Multifamily 101 · Module 1 (Pilot)

**Shipped:** May 8, 2026
**Scope:** Pilot wave for the Multifamily 101 course (formerly Multifamily Foundations). Full Module 1 content authoring + Module 1 takeaway PDF + customer-facing rename across the Mastery site. Sign off on voice and depth here, then we batch Modules 2–6 in subsequent waves.

## What's new

### Course renamed · Multifamily Foundations → Multifamily 101

Customer-facing only per your direction. Internal symbols (`FoundationsCourse`, `FoundationsModule`, `FOUNDATIONS_COURSE`, file name `foundations.ts`, route slug, sub-domain) all stay as-is. URL/sub-domain decision deferred.

Updated surfaces:

- `src/data/foundations.ts` · course title, module 1 intro greeting, all in-prose mentions of "Foundations" as the course name, both mailto subject lines, the post-completion takeaway blurb
- `src/pages/pricing.tsx` · the "Foundations" pricing card on the Mastery site is now "Multifamily 101" (label, CTA "Start with Multifamily 101 →", and the "Not sure which fits?" prose at the bottom)

### Module 1 fully written (Topics 2–5 + sidebars + quiz + takeaway)

**Topics 1 was already calibrated** (the voice sample). This wave finishes the rest:

- **Topic 2 · Where multifamily's edge actually comes from.** Diva walks through the value = NOI ÷ cap rate formula in plain English with a worked example ($300K NOI → $360K NOI at a 6% cap rate produces a $1M value lift). Two Lou sidebars: one on the operator's "where is the lift?" question, one on cap rate movement risk. ~700 words of body + sidebars.
- **Topic 3 · Where multifamily loses.** The honest-list topic. Illiquidity, operator dependence, personal-guarantee risk on debt, the LP "passive" myth, no real-time scoreboard. One Lou sidebar with a personal-guarantee anecdote from his first close. ~800 words.
- **Topic 4 · The 10-year math.** Side-by-side numbers on $200K invested in single-family rental vs. LP multifamily vs. operating one's own. Markdown table at the end summarizing the comparison. One Lou sidebar on the operator-path variance and why mentorship matters for first-time operators. ~1,000 words.
- **Topic 5 · Who multifamily is right for, who it isn't.** Four lenses (capital, time horizon, risk tolerance, operator inclination). Five distinct reader-state outcomes with a recommended response for each — including "pause, wrong fit right now," which is unusual for a paid course to say honestly. One Lou sidebar on testing your operator inclination by noticing what your mind does when you read a real deal. ~900 words.

Total new prose this wave: roughly **3,400 words of body + ~600 words of Lou sidebars**.

### Module 1 quiz · 5 multiple-choice items

Following the Mastery quiz pattern: each item has 4 choices, a `correctIndex`, a `why` explanation, and (for items where the trap is sharp) a `trap` note pointing at the wrong-answer reasoning. Difficulties are tagged `foundation` or `application`. Topics covered:

1. Vehicle-fit recommendation given a reader profile (foundation, m1-t1)
2. Why multifamily returns can be operator-controlled (foundation, m1-t2)
3. Numeric NOI/cap rate value-lift calculation (application, m1-t2)
4. Which reader profile multifamily is NOT a fit for (foundation, m1-t3)
5. Co-GP path identification given operator-curious reader with limited time (application, m1-t5)

### Module 1 takeaway PDF · "The Four Wealth Vehicles, Compared"

One page, brand-matched (cream background, navy ink, gold accents, gold ribbon at the top, navy header band on the table). Side-by-side table comparing all four vehicles across five dimensions: capital floor, time required, control, tax efficiency, and 10-year wealth math. Includes the "shape of the choice" callout and a Module 2 next-step prompt. Built with reportlab — script is included in the bundle as `build_m1_pdf.py` for re-runs / edits.

The PDF is at `wave-f-1.1/foundations-takeaways/m1-four-vehicles.pdf`. The course data references it at the path `/foundations/takeaways/m1-four-vehicles.pdf` — drop it into the Foundations site's `public/foundations/takeaways/` folder once the site is stood up (#79).

## Files changed

```
src/data/foundations.ts                              ← Module 1 fully populated · course renamed · 941 → 1,026 lines
src/pages/pricing.tsx                                 ← Foundations card renamed to Multifamily 101
foundations-takeaways/m1-four-vehicles.pdf           ← NEW · Module 1 branded one-pager (~4.5 KB)
build_m1_pdf.py                                       ← NEW · the script that produced the PDF (kept for re-runs)
```

## Files unchanged

```
foundations design doc · src/styles · all other Mastery pages
Modules 2-6 · still PENDING_VOICE in foundations.ts (next waves)
```

## Voice review checklist

When you read Module 1 end-to-end, here's what to look for:

- [ ] **Diva's voice in Topics 2-5** — does it sound like the Topic 1 calibration sample? Warm, second-person, narrative, willing to slow down. Not pitchy. Not lectur-y.
- [ ] **Lou's sidebars** — do they sound like Lou? Direct, operator-grounded, willing to disagree (gently) with Diva, never preachy, never makes Diva wrong.
- [ ] **Honesty calibration in Topic 3** — the personal-guarantee paragraph is the most legally-sensitive moment in the module. Read it carefully and tell me if you want any of it softened, sharpened, or removed.
- [ ] **Numbers in Topic 4** — the 7% / 10% / 13–16% bands and the $200K → $395K / $520K / $700–900K outputs. Are these numbers honest enough to ship? If you'd like the bands tightened or the assumptions documented inline, easy.
- [ ] **Module 6 setup in Topic 5** — references "Module 6 has a full scored self-assessment." Make sure that's still the plan when we get to Module 6.
- [ ] **Quiz items** — do the questions feel like they teach rather than test? The "why" explanations and traps are the actual teaching moment for a beginner; quiz items shouldn't try to trick the reader.
- [ ] **Takeaway PDF** — does the brand chrome read right? Numbers in the table line up with Topic 4? "Multifamily 101" course name reads right in the eyebrow?

## Deploy

Standard rsync deploy. The pricing.tsx change is live on the Mastery site; the foundations.ts change is data-only (not currently imported anywhere in the Mastery dashboard) but lives in the same repo for now until #79 stands up the Foundations site:

```bash
cd ~/Downloads
unzip -o multifamily-101-wave-f-1.1.zip

rsync -av ~/Downloads/wave-f-1.1/src/ \
          ~/Documents/multifamily-platform/src/

cp ~/Downloads/wave-f-1.1/CHANGES-WAVE-F-1.1.md \
   ~/Documents/multifamily-platform/

cd ~/Documents/multifamily-platform
git add src/data/foundations.ts \
        src/pages/pricing.tsx \
        CHANGES-WAVE-F-1.1.md
git commit -m "Wave F-1.1: Multifamily 101 Module 1 pilot · rename + Module 1 prose + PDF"
git push
```

The PDF and the build script ride along outside the rsync — keep them in `~/Downloads/wave-f-1.1/` for now. When the Foundations site is stood up (#79), move `m1-four-vehicles.pdf` into that site's `public/foundations/takeaways/` folder.

## Verification

- [ ] Hard-refresh `/pricing` on the Mastery site · the first card now reads **Multifamily 101** (not Foundations) with "Start with Multifamily 101 →" CTA. The "Not sure which fits?" paragraph below the cards mentions Multifamily 101.
- [ ] Open the PDF: confirm cream + navy + gold reads right, table is legible, the "shape of the choice" callout is visible, the footer disclaimer line reads.
- [ ] Diff `src/data/foundations.ts` to read the Module 1 prose end-to-end. Track the calibration checklist above.

## Next waves

When you've signed off on Module 1, the queue is:

- **Wave F-1.2** · Module 2 (composite $5M deal walkthrough — capital stack, Year 1, Year 3, projected exit) + Module 2 takeaway PDF "Anatomy of a $5M Deal."
- **Wave F-1.3** · Module 3 (the four ways to participate) + decision-tree PDF.
- **Wave F-1.4** · Module 4 (reading the market) + free-sources cheat sheet PDF.
- **Wave F-1.5** · Module 5 (underwriting basics — the five numbers) + vocabulary card PDF.
- **Wave F-1.6** · Module 6 (your next step + self-assessment) + personalized-path PDF.

If voice/depth/length are right on Module 1, Modules 2–6 ship faster because the calibration is locked.

## Net result

- ✅ Course officially renamed to Multifamily 101 (customer-facing)
- ✅ Module 1 prose complete, ~3,400 words of new Diva-voiced body + ~600 words of Lou sidebars
- ✅ Module 1 quiz fully authored with explanations and traps
- ✅ Module 1 takeaway PDF produced and brand-matched
- ⏭ Voice sign-off + Modules 2-6 in subsequent waves
