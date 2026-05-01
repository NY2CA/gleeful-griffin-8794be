# Wave 13.1 — Login session UX polish

**Shipped:** May 1, 2026
**Scope:** Close the two UX gaps that made already-authenticated members look at a "Sign In" affordance and wonder if they needed to re-login. The actual auth flow was already secure — these are presentation fixes that make the secure-by-default state legible to the user.

## What changed

### Fix 1 · Landing page nav now reflects auth state
**File:** `src/pages/index.tsx`

The marketing nav on `/` was hardcoded to show a `Sign In` link regardless of whether the visitor had a valid JWT in localStorage. Now it reads `useAuth()` and swaps the link based on auth state:

```tsx
{user ? (
  <Link href="/dashboard" className="nav-signin">Dashboard</Link>
) : (
  <Link href="/login" className="nav-signin">Sign In</Link>
)}
```

So a logged-in member who bounces from `/dashboard` back to `/` now sees a "Dashboard" link in the same nav slot — no more cognitive friction about whether they're still authenticated.

### Fix 2 · `/login` defensively redirects authenticated visitors
**File:** `src/pages/login.tsx`

If an already-authenticated user lands on `/login` (e.g. they typed the URL directly, clicked an old bookmark, or hit "Sign In" from somewhere stale), the page now redirects them straight to `/dashboard` instead of showing the form:

```tsx
useEffect(() => {
  if (!loading && user) {
    router.replace('/dashboard');
  }
}, [loading, user, router]);
```

The `loading` guard prevents a flash of the form during the initial `/api/auth/me` verification on mount.

## What stays exactly the same

The actual login security model is untouched:
- 7-day JWT (HS256, signed with `JWT_SECRET` env var, server-verified on every protected endpoint)
- localStorage-backed token persistence (key: `mfm_token`)
- Auto-clear on 401 (token expired or invalidated)
- Network-blip tolerance (cached token preserved when `/api/auth/me` fails on transient errors)
- 30-minute reset tokens with password-fingerprint replay protection

## Files changed

```
src/pages/index.tsx     ← imports useAuth, conditionally renders Dashboard / Sign In nav link
src/pages/login.tsx     ← defensive redirect to /dashboard when already authenticated
```

## Verification checklist (post-deploy)

- [ ] Logged-in member visits `/` → sees "Dashboard" link in marketing nav
- [ ] Logged-out visitor visits `/` → sees "Sign In" link in marketing nav (unchanged behavior)
- [ ] Logged-in member visits `/login` directly → instantly redirected to `/dashboard`
- [ ] Logged-out visitor visits `/login` → sees the login form (unchanged)
- [ ] Sign out from `/dashboard` → returns to `/`, marketing nav shows "Sign In" again
- [ ] No flash of login form during initial mount (loading guard works)

## Deploy

Same git-push flow.
