# Wave F-1.1.3 — Module 1 prose edits per Lou's review

**Shipped:** May 12, 2026
**Scope:** Two targeted edits to Module 1 prose based on Lou's feedback after reading the draft end-to-end. Refreshes the takeaway PDF to match.

## Topic 3 · DSCR loans + soft course segue

Original Topic 3 covered illiquidity, operator dependence, personal-guarantee risk, LP not being fully passive, and no real-time scoreboard. The personal-guarantee paragraph was sharp but left the reader without an alternative — and missed a natural opportunity to point at where the *next step* of learning lives.

This edit slots in two new paragraphs after the personal-guarantee section:

1. **DSCR loans as the alternative.** Honest framing: no personal guarantee, but tighter LTV (~65-70% vs. 75-80%), higher rates (~50-100bp above agency), shorter fixed-rate terms (3-5 yr vs. 7-10 yr). The trade is real, and choosing well is one of the highest-stakes decisions a first-time operator makes.

2. **Soft segue to Mastery + bespoke 1:1.** Single paragraph acknowledging that debt structure is exactly the kind of decision Mastery's debt-sourcing module covers in depth, and the kind of choice bespoke 1:1 coaching is built around. Closes with "We'll point you to those paths cleanly in Module 6 if it's the right fit" — sets up Module 6 as the destination for the conversion conversation rather than pitching here.

The rest of Topic 3 — illiquidity, no-real-time-scoreboard, LP work-not-zero — stays as it was. Lou's "From Lou's chair" sidebar at the end (the first-deal personal-guarantee anecdote) also stays.

## Topic 4 · GP path calibration

Lou flagged the operator-path numbers as needing to be "down the middle" — verifiable, not optimistic-leaning. Pull from 13–16% / $700K–$900K to 12–15% / $650K–$850K across three places:

- **The narrative**: "reasonably modeled to grow to $650,000–$850,000... roughly 12–15% annualized"
- **The "operating badly" example**: "$850,000 if executed well could produce $400,000 if executed badly" (was $900K)
- **The side-by-side table** at the end of the topic
- **Lou's sidebar**: "Diva put a 12–15% range" (was 13–16%), plus a new line acknowledging operators above 15% exist but represent a specific playbook on a specific kind of deal — *not* the underwriting case to build a beginner's expectations around

The SFR (~7%) and LP (~10%) numbers stay. Both are already at the defensible center.

Updated `m1-four-vehicles.pdf` takeaway one-pager — table now reads "~$650K-$850K · 12-15% annualized" on the GP column. Same brand chrome, same layout, just the GP cell rewritten.

## Files changed

```
src/data/foundations.ts                      ← Topic 3 DSCR additions + Topic 4 calibration (3 places)
foundations-takeaways/m1-four-vehicles.pdf   ← regenerated with updated GP band
build_m1_pdf.py                              ← updated script (for re-runs)
```

## Deploy

```bash
cd ~/Downloads
unzip -o multifamily-101-wave-f-1.1.3.zip

rsync -av ~/Downloads/wave-f-1.1.3/src/ \
          ~/Documents/multifamily-platform/src/

cp ~/Downloads/wave-f-1.1.3/CHANGES-WAVE-F-1.1.3.md \
   ~/Documents/multifamily-platform/

cd ~/Documents/multifamily-platform
git add src/data/foundations.ts CHANGES-WAVE-F-1.1.3.md
git commit -m "Wave F-1.1.3: Module 1 prose edits (Topic 3 DSCR + Topic 4 calibration)"
git push
```

PDF + build script ride along outside the rsync — keep them in `~/Downloads/wave-f-1.1.3/` for when the Foundations site is stood up (#79).

## Net result

- ✅ Topic 3 now names DSCR loans as the no-PG alternative with honest trade-offs
- ✅ Soft segue to Mastery + bespoke 1:1 lands inside the educational flow, not as a sales pitch
- ✅ Topic 4 GP band tightened from 13-16% to 12-15% — verifiable, down-the-middle
- ✅ All three GP references in the topic (narrative, table, Lou sidebar) updated consistently
- ✅ Takeaway PDF regenerated with the new band
- ⏭ Voice sign-off + Module 2 next when these edits read right
