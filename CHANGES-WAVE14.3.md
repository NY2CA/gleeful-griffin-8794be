# Wave 14.3 — Mastery Live · Closing the loop

**Shipped:** May 7, 2026
**Scope:** The polish wave that takes the deal-submission flow from "works" to "ready for primetime." Three meaty changes: member emails on every meaningful admin action, multi-deal support on the dashboard, and per-status messaging that tells members exactly where their deal stands.

## Problem this fixes

After Wave 14.2, members had to refresh their dashboard to know if Diva or Lou had reviewed a deal. They could only see one live deal at a time even if they were tracking three. And the dashboard copy didn't distinguish between "just submitted" and "in review" — both looked identical to a member checking their workspace.

## What's new

### Member-facing emails on admin actions

Every meaningful admin action in `/admin/deals` now triggers a transactional email to the member. Five distinct templates, all using the verified `resciapropertiesmentorship.com` Resend sender:

- **`promoted_to_active`** — fires when an admin flips a deal to `active`. Subject: *"Your deal is now active in coaching · {dealName}"*. Body explains the deal's now live and includes the review notes inline (gold-bordered note pane, same as the dashboard styling).
- **`notes_updated`** — fires when an admin edits review notes on a deal that's already `active`. Subject: *"New notes on {dealName}"*. Same gold note pane, scoped down.
- **`paused_on_hold`** — fires when status flips to `on_hold`. Subject: *"Pausing {dealName}"*. Tells the member it's parked and to reach out when ready.
- **`archived_won`** — fires on `closed_won`. Subject: *"{dealName} · Closed won"*. Acknowledges the close, CTA to submit the next deal.
- **`archived_lost`** — fires on `closed_lost`. Subject: *"{dealName} · Closed"*. Honest tone — "whether you walked or it walked from you, the next one's in front of you."

Status flips that *don't* notify (deliberate): `submitted ↔ in_review`. Those are admin housekeeping and members don't care. Field-only edits (YOC, IRR, stage) without status flip or notes change also don't notify.

All emails BCC the addresses in `ADMIN_EMAILS` by default, so Diva and Lou see what got sent — useful while building member trust in the system. Replying to the email goes back to coaching (since `reply_to` resolves to the verified sender).

The send is **soft-fail**: if Resend is misconfigured or rate-limited, the deal status update still persists. The admin can retry the notification by editing again.

### "Notify member" checkbox on the admin edit modal

The edit modal in `/admin/deals` now has a notification panel above the Save button. Default ON. Three useful things:

1. **Predicts which email will fire** before the admin clicks Save. Says *"will email · 'Your deal is now active in coaching'"* (or whichever applies) so the admin knows what's about to land in the member's inbox.
2. **Says when no email will fire** — if the edit is just a field tweak, the panel says so explicitly. No ambiguity.
3. **Suppresses with one click** — uncheck the box for typo fixes or silent edits where the member doesn't need to know.

### Multi-deal support on `/dashboard`

The "Your deal" card now handles members tracking multiple LOIs at once.

- **Empty state** (no live deals) — same as before, with the "Submit a deal →" CTA
- **One live deal** — same single-card layout as Wave 14.1, with refined per-status messaging (see below)
- **Multiple live deals** — header changes to *"Your deals · 3 live"* (or however many), and each deal renders as a stacked block separated by gold dividers. Each block has its own status pill, status-appropriate fields, and review notes pane (when active).

The "Submit another deal →" link sits at the bottom regardless of count.

### Per-status dashboard messaging

Each status now gets distinct copy on the deal card:

| Status | Member sees |
|---|---|
| `submitted` | "Just submitted." Tagline: "We'll review your underwriting and respond by your next coaching call." |
| `in_review` | "In review with Diva and Lou." Tagline: "Diva and Lou are looking at this now. Notes will appear below once we promote it to active." |
| `active` | "Active in coaching." Full populated card · YOC · IRR · coaching focus · gold-bordered review notes pane. |
| `on_hold` | "On hold." Tagline: "Paused so it doesn't compete for attention. Reach out when you want to pick it back up." |

Closed deals never appear here — they're excluded by `findAllActiveDeals()` because the dashboard is for active workspace, not history.

### API changes

- **`GET /api/auth/me`** now returns `user.activeDeals: ActiveDeal[]` (array, sorted most-recent first) alongside the existing `user.activeDeal` (kept as backward-compat shim equal to `activeDeals[0] ?? null`).
- **`POST /api/admin/deals/update`** now accepts `notifyMember?: boolean` (default `true`) and returns `{ ok, deal, notified, notificationKind }` so the client can show "email sent" feedback if desired.
- **`_lib/store.ts`** now exports `findAllActiveDeals(user)` alongside the original `findActiveDeal(user)` (which now delegates).

### Asset class is now a dropdown · `submit-deal.tsx`

Free-text "B value-add" was inviting typos and inconsistent capitalization across submissions. Replaced with a `<select>` of the six standard tiers:

- A-Core
- A-Core Plus
- B
- B-Value-Add
- C
- C-Value-Add

Default is "Select asset class…" (empty value). Field stays optional — server-side `optionalString()` still accepts the field as undefined if the member doesn't pick one. Existing deals submitted with free-text asset classes (none yet, since this is post-Wave-14.1) keep their original string — the dropdown only constrains *new* submissions.

### Placeholder legibility fix · `globals.css` + `submit-deal.tsx`

Form placeholder text was rendering at `var(--ink-mute)` (`#8a8a92`) — about 3.4:1 contrast on white, which technically passes WCAG-AA-Large but reads as faint. Bumped to `var(--ink-dim)` (`#4a4a52`, ~9:1, AAA) for every `.form-group` input/textarea site-wide. Affects login, signup, /submit-deal property fields, and the admin edit modal.

Separately, the coaching-focus textarea on `/submit-deal` sits on a navy background with cream text — its placeholder rendered at the browser default (~50% cream opacity) which read as nearly invisible. Added a scoped `body.live-dashboard-active textarea::placeholder` override that sets it to cream at 62% opacity so it's clearly readable but still distinct from filled-in text.

### Field-label brightening on navy pages · `globals.css`

The small mono uppercase field labels ("Property name", "Address (optional)", "Units", etc.) inherit `.form-group label` styling, which defaults to `--ink-dim` (`#4a4a52`). On the navy `/submit-deal` page that sat at ~2:1 contrast — nearly invisible. Added `body.live-dashboard-active .form-group label { color: rgba(250, 247, 242, 0.72); }` so labels on Live-themed pages render in cream at 72% opacity. Distinct hierarchy from the gold section headers (FieldLabel), and the admin/deals edit modal (white background, no live-dashboard-active class) keeps its dark labels untouched.

## Files changed

```
netlify/functions/_lib/email.ts              ← 5 new email templates + sendDealUpdateEmail
netlify/functions/_lib/store.ts              ← findAllActiveDeals helper
netlify/functions/auth-me.ts                  ← returns activeDeals[] + activeDeal shim
netlify/functions/admin-update-deal.ts        ← detects update kind, fires email, accepts notifyMember
src/hooks/useAuth.tsx                         ← User.activeDeals[] type
src/pages/dashboard.tsx                       ← YourDealCard rewritten for multi-deal + per-status
src/pages/admin/deals.tsx                     ← notify-member checkbox + prediction hint
src/pages/submit-deal.tsx                     ← placeholder fix on navy textarea
src/styles/globals.css                        ← .form-group placeholder bumped from --ink-mute to --ink-dim
```

## Files unchanged

```
netlify/functions/admin-list-deals.ts          (no change · already lists everything)
netlify/functions/submit-deal.ts                (no change · email pattern already correct)
src/pages/submit-deal.tsx                       (no change · member form already works)
```

## End-to-end test plan

After deploy, run through the full coaching loop:

**Test 1 · Single deal · promote → notes**
1. Member logs in, submits a test deal (Garland-style)
2. Lou opens `/admin/deals` · sees the row at the top, "Submitted" pill
3. Lou clicks the row, sets status → `active`, types review notes, leaves checkbox ON, hits Save
4. **Member gets email** with subject *"Your deal is now active in coaching · ..."* — the review notes are inline in the gold-bordered pane
5. Member opens dashboard · "Your deal" card shows `active` state with notes
6. Lou edits the notes (status stays `active`), saves
7. **Member gets second email** with subject *"New notes on ..."* — just the new notes
8. Member opens dashboard · sees the updated notes

**Test 2 · Multi-deal**
1. Same member submits 2 more deals
2. Member dashboard now shows *"Your deals · 3 live"* with all three stacked, gold dividers between
3. Lou promotes deal #2 to `active` · member email fires for deal #2 only
4. Dashboard refresh · deal #2 shows full active card (notes pane appears since notes were added), deals #1 (already active) + #3 (still submitted) keep their previous state

**Test 3 · Silent edit**
1. Lou opens an active deal in `/admin/deals`
2. Fixes a typo in the YOC field, **unchecks "Notify member"**, saves
3. **No email fires** (notification panel said as much)
4. Member dashboard reflects the new YOC on next load

**Test 4 · Archive**
1. Lou opens an active deal, status → `closed_lost`, leaves checkbox ON, saves
2. **Member gets email** with subject *"... · Closed"* — honest acknowledgment copy
3. Member dashboard · the deal disappears from the live stack (closed deals excluded)
4. If member had multiple live deals, the count drops by one

**Test 5 · Header re-check**
1. Confirm BCC works · Lou's inbox should have a copy of the member-facing email
2. Confirm reply-to · replying to the member email goes to the configured `RESEND_FROM` address (or the member's email if `reply_to` was set — currently it's the from address since these are outbound)

## Wave 14.4 backlog (optional polish)

- **Member preference: opt-out of notification emails** — currently transactional, no opt-out. If/when members complain about the volume, add a preference flag.
- **Per-deal email digest** — instead of one email per change, batch updates to a member into a daily digest at 8am their local time. (Would require timezone capture at signup.)
- **Coaching-call agenda PDF** — generate a one-pager for the next call from all of a member's live deals + recent review notes.
- **Bulk admin actions** — multi-select rows in `/admin/deals` and batch-promote.
- **Deal history view** — separate `/my-deals/history` page for closed deals (currently no UI surfaces them).

None of these are loop-closing for the launch — they're growth-stage polish.

## Deploy

Same rsync pattern as 14.1 / 14.2:

```bash
cd ~/Downloads
unzip -o multifamily-platform-wave14.3.zip

rsync -av ~/Downloads/wave14-3/netlify/ \
          ~/Documents/multifamily-platform/netlify/

rsync -av ~/Downloads/wave14-3/src/ \
          ~/Documents/multifamily-platform/src/

cp ~/Downloads/wave14-3/CHANGES-WAVE14.3.md \
   ~/Documents/multifamily-platform/

cd ~/Documents/multifamily-platform
git add netlify/functions/_lib/email.ts \
        netlify/functions/_lib/store.ts \
        netlify/functions/auth-me.ts \
        netlify/functions/admin-update-deal.ts \
        src/hooks/useAuth.tsx \
        src/pages/dashboard.tsx \
        src/pages/admin/deals.tsx \
        src/pages/submit-deal.tsx \
        src/styles/globals.css \
        CHANGES-WAVE14.3.md
git commit -m "Wave 14.3: Mastery Live · member emails + multi-deal + per-status messaging"
git push
```

**No new env vars.** Reuses the existing `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_EMAILS`, `APP_URL`.

**No DNS changes.** The `resciapropertiesmentorship.com` sender that you verified earlier today handles all five email kinds.

## Verification after deploy

- [ ] Member submits a test deal · receives no email yet (correct — submitting is silent to the member, only Diva/Lou get notified)
- [ ] Lou opens `/admin/deals` · clicks the row · the modal shows the **Notify member** panel, default ON, says *"will email · ..."* once status is set to active
- [ ] Lou flips status to active, types review notes, saves · member receives email with subject *"Your deal is now active in coaching · ..."* + notes inline + Lou bcc'd
- [ ] Member opens `/dashboard` · "Your deal" card shows active state + gold-bordered notes pane
- [ ] Lou edits notes, saves · member receives *"New notes on ..."* email · Lou bcc'd
- [ ] Lou archives the deal as `closed_lost` · member receives *"... · Closed"* email
- [ ] Member dashboard · deal disappears from "Your deal" card (back to empty state if it was the only one)
- [ ] Member with multiple active deals · dashboard header reads *"Your deals · 2 live"* (or N) and stacks them with gold dividers
- [ ] Per-status copy: a `submitted` deal shows *"We'll review by your next coaching call"*; an `in_review` deal shows *"Diva and Lou are looking at this now"* — distinct messaging
- [ ] Silent edit: Lou unchecks the notify box, fixes a YOC typo, saves · no email fires, but member dashboard reflects the new value

## Net result

- ❌ Members no longer have to refresh their dashboard to know what's happening
- ❌ Members no longer see a single deal when they're tracking multiple
- ❌ "Submitted" and "In review" no longer look identical on the dashboard
- ✅ Five clean transactional emails on every meaningful admin action
- ✅ Multi-deal stack with status-specific messaging
- ✅ Admin sees the predicted email in the modal before saving
- ✅ Admin can suppress notifications for typo fixes and trivial edits
- ✅ Loop closed · the course is ready for primetime
