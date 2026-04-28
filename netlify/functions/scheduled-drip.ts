/**
 * Daily drip cron.
 *
 * Walks every user record in the `users` blob store, computes the drip items
 * that are due for each one, and sends them. Idempotent — a per-user
 * `dripSent` map guards against double-sends, and the scheduling key is
 * `dripAnchorAt` (set the first time access becomes active and never
 * overwritten), so churn → re-sub does not re-trigger the welcome arc.
 *
 * Configured in netlify.toml as a scheduled function. The default schedule
 * is "0 13 * * *" which is 9am ET (UTC-4 for DST or UTC-5 standard) — close
 * enough for a marketing send. Adjust the cron expression if you want a
 * different daily window.
 *
 * Failures on individual users are logged but do NOT abort the batch. The
 * unsent drip remains in `dueDrips()` and will be retried on tomorrow's tick.
 */

import type { Config } from '@netlify/functions';
import { listAllUsers, hasActiveAccess } from './_lib/store';
import { runDripForUser } from './_lib/drip';

export default async (_req: Request): Promise<Response> => {
  const startedAt = Date.now();
  let totalUsers = 0;
  let scannedActive = 0;
  let totalAttempted = 0;
  let totalSent = 0;
  let totalFailed = 0;

  try {
    const users = await listAllUsers();
    totalUsers = users.length;

    for (const user of users) {
      // Only run drip for users who currently have access. If access has
      // lapsed (canceled subscription, expired admin grant, etc.) we pause
      // the sequence — they'll resume when access is reinstated.
      if (!hasActiveAccess(user)) continue;
      // No anchor → never had access yet. Skip; the access-grant flow will
      // set the anchor and fire the welcome.
      if (!user.dripAnchorAt) continue;

      scannedActive += 1;
      try {
        const result = await runDripForUser(user);
        totalAttempted += result.attempted;
        totalSent += result.sent;
        totalFailed += result.failed;
      } catch (err) {
        // runDripForUser already catches per-item errors; this catches the
        // outer failure (e.g. blob store hiccup) and lets us continue with
        // the next user.
        console.error('[scheduled-drip] user-level error', user.email, err);
      }
    }
  } catch (err) {
    console.error('[scheduled-drip] fatal error', err);
    return new Response('error', { status: 500 });
  }

  const elapsedMs = Date.now() - startedAt;
  const summary = {
    ok: true,
    elapsedMs,
    totalUsers,
    scannedActive,
    totalAttempted,
    totalSent,
    totalFailed,
  };
  console.log('[scheduled-drip] complete', summary);
  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

export const config: Config = {
  // 13:00 UTC daily ≈ 9:00 ET (8:00 during EST, 9:00 during EDT). Adjust
  // if you want a different daily window.
  schedule: '0 13 * * *',
};
