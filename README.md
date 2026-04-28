# Multifamily Mastery · Platform

Next.js 14 + TypeScript + Tailwind CSS front end with a Netlify Functions +
Netlify Blobs back end. Authentication, course progress, the member
dashboard, password-reset email, and Stripe billing (Annual / Monthly /
Lifetime) are fully wired up — no separate server or database to run.

## What's inside

```
src/
├── components/       Button, Input, Card, Navigation, ProgressBar
├── data/             courses.ts · 12 weeks of Deep Dive / Quiz / Mistakes
├── hooks/            useAuth (AuthProvider) · useCourse (progress)
├── lib/              api.ts · fetch wrapper + token helpers
├── pages/            /, /login, /signup, /forgot-password, /reset,
│                     /dashboard, /course/[id], /pricing,
│                     /billing/success, /billing/cancel
└── styles/           globals.css · full landing-page design system

netlify/
└── functions/
    ├── _lib/         auth (JWT + bcrypt), store (Blobs), email (Resend),
    │                 response helpers
    ├── auth-signup.ts    POST /api/auth/signup
    ├── auth-login.ts     POST /api/auth/login
    ├── auth-me.ts        GET  /api/auth/me          (bearer auth)
    ├── auth-forgot.ts    POST /api/auth/forgot      (sends reset email)
    ├── auth-reset.ts     POST /api/auth/reset       (redeems reset token)
    ├── progress-get.ts   GET  /api/progress         (bearer auth)
    ├── progress-mark.ts  POST /api/progress/mark    (bearer auth)
    ├── billing-status.ts   GET  /api/billing/status   (bearer auth)
    ├── billing-checkout.ts POST /api/billing/checkout (bearer auth)
    ├── billing-portal.ts   POST /api/billing/portal   (bearer auth)
    └── billing-webhook.ts  POST /api/billing/webhook  (Stripe-signed)
```

## Quick start

```bash
cp .env.example .env.local
# Set JWT_SECRET to any random 32+ char string:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

npm install
npm run dev            # Next.js only, no functions
# – or –
npx netlify dev        # Next.js + Netlify Functions together (recommended)
```

`netlify dev` runs the functions locally at the same URLs they'll have in
production (`http://localhost:8888/api/auth/signup`, etc.), which is what the
front-end expects.

## Architecture

```
Browser  ──▶  Next.js pages  (login, signup, dashboard, course/[id])
           │
           │  fetch /api/auth/* and /api/progress/* via src/lib/api.ts
           ▼
Netlify Functions v2  (TypeScript, web-standard Request/Response)
   ├── JWT signed with HS256 · jose
   ├── Passwords hashed with bcryptjs (10 rounds)
   └── Storage: Netlify Blobs
        ├── users     (keyed by normalized email)
        └── progress  (keyed by user id)
```

Auth lifecycle:

1. Client posts to `/api/auth/signup` or `/api/auth/login`. Server returns
   `{ token, user }`. Client stores the token in `localStorage`
   (`mfm_token`) via `src/lib/api.ts`.
2. Every subsequent request attaches `Authorization: Bearer <token>`.
3. On app mount the `AuthProvider` calls `/api/auth/me` to verify the token.
   If the token is invalid the client clears it silently.
4. Protected pages (`/dashboard`, `/course/[id]`) redirect to `/login` when
   `user === null` after the auth hook finishes hydrating.

## Environment variables

| Name | Required | What it is |
| --- | --- | --- |
| `JWT_SECRET` | yes | Signing secret for session + reset tokens. Any random 32+ char string. |
| `RESEND_API_KEY` | yes (for reset emails) | Resend API key. Free tier covers 3k emails/month. |
| `RESEND_FROM` | yes (for reset emails) | Verified sender, e.g. `Rescia Properties <no-reply@mail.resciaproperties.com>`. |
| `APP_URL` | recommended | Absolute base URL (no trailing slash) used to build the reset link in outgoing email AND Stripe Checkout success/cancel URLs. Falls back to the request origin. |
| `STRIPE_SECRET_KEY` | yes (for billing) | `sk_test_…` / `sk_live_…` from Stripe → Developers → API keys. |
| `STRIPE_WEBHOOK_SECRET` | yes (for billing) | `whsec_…` from the signing secret on your webhook endpoint. |
| `STRIPE_PRICE_ANNUAL` | yes (for billing) | Stripe recurring-yearly price id. |
| `STRIPE_PRICE_MONTHLY` | yes (for billing) | Stripe recurring-monthly price id. |
| `STRIPE_PRICE_LIFETIME` | yes (for billing) | Stripe one-off price id. |
| `ADMIN_EMAILS` | yes | Comma-separated list of admin emails (controls who can grant access via `/admin/members` and who has implicit access regardless of billing). |
| `DRIP_FROM_NAME_LOU` | no | Display name shown in From for Lou-authored drip emails. Default: `Lou Lopez — Rescia Properties`. |
| `DRIP_FROM_NAME_DIVA` | no | Display name shown in From for Diva-authored drip emails. Default: `Diva Lopez — Rescia Properties`. |
| `DRIP_REPLY_TO_LOU` | no | Reply-to address for Lou-authored drip emails. Default: `lou@resciaproperties.com`. Also used as the CC when Diva is the visible sender. |
| `DRIP_REPLY_TO_DIVA` | no | Reply-to address for Diva-authored drip emails. Default: `rescia@resciaproperties.com`. Also used as the CC when Lou is the visible sender. |
| `NEXT_PUBLIC_API_BASE` | no | Different origin for the API, e.g. during dev. Defaults to same-origin. |

Set these on Netlify at **Site settings → Environment variables**. They are
not checked into the repo — see `.env.example`.

## Deploying to Netlify

The repo ships with `netlify.toml` already configured:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

Workflow:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/multifamily-platform.git
git push -u origin main
```

Then in Netlify: **Add new site → Import from Git** → select the repo →
**Site settings → Environment variables** → add `JWT_SECRET` → **Deploy**.

Netlify Blobs is automatically provisioned on first write. No extra setup.

## Dropping into an existing Next.js repo

If you already have a live Next.js site, copy in:

1. `src/styles/globals.css` — import from your `_app.tsx`.
2. `src/hooks/`, `src/components/`, `src/data/`, `src/lib/`.
3. The five page files from `src/pages/`.
4. The entire `netlify/functions/` directory.
5. Merge `netlify.toml` (add the `[functions]` block).
6. Merge `package.json` dependencies (`@netlify/blobs`, `@netlify/functions`,
   `bcryptjs`, `jose`) and devDependencies (`@types/bcryptjs`).
7. Wrap your app in `<AuthProvider>` in `_app.tsx`.
8. Update your landing-page CTAs to `<a href="/login">Get Access</a>`.
9. Set `JWT_SECRET` on Netlify.

## Design system

All colors, typography, shadows, and motion tokens live in `:root` inside
`src/styles/globals.css`. Tailwind is wired to those variables in
`tailwind.config.js` so `bg-navy text-cream shadow-card` all work.

Reusable classes — do NOT rebuild these in Tailwind:

- `.btn-primary`, `.btn-secondary`
- `.form-group`
- `.module` (+ `.module.compact`, `.module.active`, `.module.completed`,
  `.module.in-progress`, `.module.locked`)
- `.hero-card`, `.offer-card`
- `.container`, `.section-head`
- `.progress`, `.tabs`, `.nav`

## API reference

Every endpoint returns JSON. Errors look like `{ "error": "message" }`.

### POST /api/auth/signup

```json
{ "name": "Jane Doe", "email": "jane@firm.com", "password": "at-least-8-chars" }
```

→ `201 { token, user: { id, email, name } }`
→ `409` if email already exists

### POST /api/auth/login

```json
{ "email": "jane@firm.com", "password": "..." }
```

→ `200 { token, user }`
→ `401 "Invalid email or password"` (uniform — doesn't leak existence)

### GET /api/auth/me

Requires `Authorization: Bearer <token>`.

→ `200 { user }`
→ `401` if the token is missing/invalid/expired

### POST /api/auth/forgot

```json
{ "email": "jane@firm.com" }
```

→ `200 { ok: true }` always (by design, no enumeration).

When the address matches a user, the function signs a 30-minute reset token
(JWT with `aud: "password-reset"`, bound to the current password hash) and
emails `https://APP_URL/reset?token=…` via Resend. Send failures are logged
but never surfaced to the client.

### POST /api/auth/reset

```json
{ "token": "<jwt from email>", "password": "new-password-min-8-chars" }
```

→ `200 { token, user }` &mdash; a fresh session token so the client can auto
sign-in.
→ `400 "This reset link is invalid or has expired"` if the JWT is malformed,
expired, or for an unknown user.
→ `400 "This reset link is invalid or has already been used"` if the
embedded password-hash fingerprint no longer matches the stored hash
(either because the password was already reset with this token, or because
the user changed their password via another path).

### GET /api/progress

Bearer auth. → `200 { progress: { [courseId]: { [moduleId]: true } } }`

### POST /api/progress/mark

Bearer auth.

```json
{ "courseId": "multifamily-mastery", "moduleId": "w1-msa", "completed": true }
```

→ `200 { progress }` (full updated map)

## Password reset flow (end-to-end)

1. User submits email at `/forgot-password` → `POST /api/auth/forgot`.
2. Server looks up the user. If found, it signs a 30-min JWT
   (`aud: "password-reset"`) containing `{ sub, email, pwd }`, where `pwd` is
   the first 24 chars of the stored bcrypt hash (replay protection).
3. Server emails `${APP_URL}/reset?token=...` via Resend using the templated
   HTML in `netlify/functions/_lib/email.ts`.
4. User clicks the link → `src/pages/reset.tsx` reads the `?token` param and
   shows two password inputs.
5. On submit → `POST /api/auth/reset { token, password }`. Server verifies
   the JWT, confirms the hash fingerprint still matches, writes the new hash,
   and returns a fresh session token.
6. Frontend stashes the session token via `useAuth().setSession(…)` and
   redirects to `/dashboard`.

Because the token is hash-bound, redeeming it rotates the hash and
automatically invalidates the link (and any other outstanding reset links
for the same account). There is no server-side nonce table to maintain.

### Setting up Resend (5 minutes)

1. Create an account at [resend.com](https://resend.com) and an API key.
2. Add and verify a sending domain (e.g. `mail.resciaproperties.com`). Resend
   walks you through the DNS records (SPF/DKIM).
3. Set the three env vars on Netlify → Site settings → Environment variables:
   - `RESEND_API_KEY=re_…`
   - `RESEND_FROM=Rescia Properties <no-reply@mail.resciaproperties.com>`
   - `APP_URL=https://members.resciaproperties.com`
4. Redeploy. Test with `POST /api/auth/forgot { "email": "your@email" }`.

## Lifecycle drip (12-week member onboarding)

When a member first gets access — either via Stripe checkout or an admin
grant — `dripAnchorAt` is stamped on their record and the welcome email
fires immediately. From then on, a daily cron (`scheduled-drip.ts`,
configured for `0 13 * * *` UTC ≈ 9am ET) walks every active member and
ships any drip whose `dueDay` has passed.

The 14-email arc lives in `netlify/functions/_lib/drip.ts`:

| ID | Day | Subject (abridged) | From |
| --- | ---:| --- | --- |
| `welcome`  |  0 | Welcome — start here | Lou |
| `w1`  |  7 | Week 1 · MSA & Market Selection | Diva |
| `w2`  | 14 | Week 2 · Submarket Intelligence | Lou |
| `w3`  | 21 | Week 3 · Deal Sourcing | Diva |
| `w4`  | 28 | Week 4 · Underwriting | Lou |
| `w5`  | 35 | Week 5 · Stress Testing & CapEx | Diva |
| `w6`  | 42 | Week 6 · Debt Sourcing | Lou |
| `w7`  | 49 | Week 7 · LOI | Diva |
| `w8`  | 56 | Week 8 · Capital Raising | Lou |
| `w9`  | 63 | Week 9 · PPM & Legal | Diva |
| `w10` | 70 | Week 10 · PSA & Due Diligence | Lou |
| `w11` | 77 | Week 11 · Property Management | Diva |
| `w12` | 84 | Week 12 · Exit & Reporting | Lou |
| `capstone` | 98 | You finished the program | Diva |

Lou and Diva alternate on the From line; the partner who is *not* sending
that week is automatically CC'd on every send so both have inbox visibility
and either can reply to a member. Configure display names and reply-to
addresses via the `DRIP_FROM_NAME_*` and `DRIP_REPLY_TO_*` env vars (table
above) — defaults are sensible if you set nothing.

Idempotency: each user has a `dripSent` map keyed by drip-id. If the cron
crashes mid-batch or re-fires, members will not receive duplicates. The
anchor (`dripAnchorAt`) is set once and never overwritten — a member who
churns and re-subscribes does NOT re-receive the welcome arc. To restart
the sequence for a specific member, manually clear their `dripAnchorAt`
and `dripSent` fields in the `users` blob store.

Pause logic: the cron skips members whose access has lapsed (`hasActiveAccess()`
returns false). When access is reinstated they pick up where they left off.

## Billing (Stripe Checkout + Billing Portal)

Three plans, paywall after signup: Monthly, Annual, Lifetime. Subscriptions use
`mode: 'subscription'`; Lifetime uses `mode: 'payment'` (one-off). No plan
details are hard-coded — Stripe is the source of truth for price, currency,
and billing cadence.

### Flow

```
Signup  ──▶  Dashboard (paywall banner)  ──▶  /pricing
                                                 │
                                                 ▼
                                POST /api/billing/checkout { plan }
                                                 │
                                                 ▼
                                     Stripe Checkout page
                               ┌─────────────┼──────────────┐
                               │             │              │
                             Paid         Cancelled       Closed tab
                               │             │              │
                               ▼             ▼              ▼
                /billing/success      /billing/cancel    (no-op)
                     ▲                                       │
                     └──── webhook flips hasAccess ◀─── /api/billing/webhook
```

### Billing endpoints

`GET /api/billing/status` — `{ hasAccess, plan, subscriptionStatus, currentPeriodEnd, cancelAtPeriodEnd, lifetime, hasBillingAccount }`. The frontend calls this on dashboard mount to decide whether to show the paywall.

`POST /api/billing/checkout` — body `{ plan: 'annual' | 'monthly' | 'lifetime' }`. Creates (or reuses) the Stripe customer, starts a Checkout Session, returns `{ url }`. The frontend redirects to that URL.

`POST /api/billing/portal` — starts a Billing Portal session so the member can update their card, change plans, or cancel. Requires an existing customer id.

`POST /api/billing/webhook` — Stripe → us. Handles `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`. The raw request body is passed through verbatim to `stripe.webhooks.constructEventAsync(...)` so Stripe's signature can be verified.

### Access rule

```ts
hasActiveAccess(user) =
  Boolean(user.lifetimePurchasedAt) ||
  user.subscriptionStatus === 'active' ||
  user.subscriptionStatus === 'trialing'
```

- Lifetime never expires.
- Past-due subscriptions still show in the portal but don't grant access.
- When a user cancels, `cancel_at_period_end` is set; access continues until
  the period end, then `customer.subscription.deleted` flips `subscriptionStatus` to `canceled`.

### Setting up Stripe (10 minutes)

1. **Create products & prices** in Stripe → Products:
   - "Multifamily Mastery · Monthly" — recurring monthly price.
   - "Multifamily Mastery · Annual" — recurring yearly price.
   - "Multifamily Mastery · Lifetime" — one-time price (no recurring).

   Copy each `price_…` id.

2. **Grab the API key** from Stripe → Developers → API keys (use the test key
   first). Copy `sk_test_…`.

3. **Create the webhook endpoint** at Stripe → Developers → Webhooks →
   *Add endpoint*:
   - URL: `https://<your-netlify-site>/api/billing/webhook`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Copy the signing secret (`whsec_…`).

4. **Set env vars on Netlify** (Site settings → Environment variables):

   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ANNUAL=price_...
   STRIPE_PRICE_MONTHLY=price_...
   STRIPE_PRICE_LIFETIME=price_...
   APP_URL=https://members.resciaproperties.com

   # Admin tools — comma-separated emails that can access /admin/members
   ADMIN_EMAILS=lou@resciaproperties.com

   # In-course AI assistant (claude-haiku-4-5). Optional — without this set,
   # the "Ask about this topic" box returns 503.
   ANTHROPIC_API_KEY=sk-ant-...
   ```

5. **Enable the Billing Portal** at Stripe → Settings → Billing → Customer portal:
   allow customers to update payment methods, switch between Monthly and
   Annual, and cancel. Save.

6. **Test end-to-end** with a Stripe test card (`4242 4242 4242 4242`, any future
   date, any CVC):
   - Sign up → you land on the dashboard with a paywall banner.
   - Hit *See plans* → pick one → complete checkout.
   - `/billing/success` polls `/api/billing/status` until the webhook flips
     `hasAccess` to `true`, then redirects to the dashboard.

### Local dev

```bash
# In one terminal
npx netlify dev

# In another — forward Stripe events to the local function
stripe listen --forward-to http://localhost:8888/api/billing/webhook
```

`stripe listen` prints a `whsec_…` that's different from the hosted one. Put
it in `.env.local` as `STRIPE_WEBHOOK_SECRET` while developing.

## Next steps you might want

- Role-based access: add a `role` claim to the JWT, gate the `/dashboard`
  server-side using `getServerSideProps` + `verifySession`.
- Video hosting: replace the `16:9` placeholder in `src/pages/course/[id].tsx`
  with a Mux / Bunny / Cloudflare Stream embed keyed off `Module.videoUrl`.
- Annual-plan downgrade → Monthly: Stripe's Billing Portal handles it for
  you once you enable plan switching in the portal settings.

## Licence

© 2026 Rescia Properties, LLC. All rights reserved. Private &amp; Confidential.
