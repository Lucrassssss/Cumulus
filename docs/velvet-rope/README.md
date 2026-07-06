# Velvet Rope — invite-only backend + hosting gate

A **greenfield v2 blueprint** for Cumulus's "Velvet Rope" growth model. This is
a design deliverable, not wired into the current static PWA (which today uses
`curator_codes` + `pending_events`). It targets a Next.js App Router + Supabase
stack.

Files:

- `schema.sql` — tables, enums, RPCs, provisioning triggers, and RLS.
- `HostChecklist.tsx` — the eventee's "Host a Private Event" tab (WCAG 2.2 AA).

## How `claim_invite_code()` prevents race conditions

The exploit it defends against: two requests redeem the **last** use of a friend
code (`uses_left = 1`) at the same instant, and both succeed — a double-spend.

The fix is one line: `SELECT … FOR UPDATE`. The math:

1. **Row lock = mutual exclusion.** `FOR UPDATE` takes a row-level _exclusive_
   lock on the `invite_codes` row. Postgres allows at most one transaction to
   hold it. So for a given code, the read→check→decrement sequence is
   **serialized**: transaction T₂ physically blocks at the `SELECT … FOR UPDATE`
   until T₁ commits or rolls back.

2. **The subtle part — snapshot vs. lock re-read.** Under the default
   `READ COMMITTED` isolation level, a plain `SELECT` sees the snapshot taken at
   statement start. That alone would _not_ save us: both transactions could
   snapshot `uses_left = 1`. But `FOR UPDATE` changes the semantics — when a
   blocked row lock is finally granted, Postgres **re-reads the latest committed
   version** of that row (an `EvalPlanQual` re-check), not the stale snapshot.
   So after T₁ commits `uses_left = 0`, T₂ acquires the lock and its `SELECT …
FOR UPDATE` returns `uses_left = 0`. The `uses_left <= 0` guard fires and T₂
   raises `code_exhausted`. Exactly one use is ever spent.

   ```
   time →        T1                              T2
   ─────────────────────────────────────────────────────────────
   t0   SELECT … FOR UPDATE  (locks row,
                             reads uses_left = 1)
   t1                                     SELECT … FOR UPDATE  ── blocks ──┐
   t2   UPDATE uses_left = 0                                               │
   t3   COMMIT  (releases lock)                                           │
   t4                                     ◄── lock granted, RE-READS row ─┘
                                          reads uses_left = 0
   t5                                     RAISE code_exhausted  (no spend)
   ```

3. **Idempotency is separate from the counter.** The row lock stops _different_
   users from oversubscribing the counter. A _single_ user retrying (double-tap,
   network retry) is stopped by the `invite_redemptions` primary key
   `(code, redeemed_by)`: the `INSERT … ON CONFLICT DO NOTHING` returns no row on
   a repeat, and we raise `already_redeemed` **before** decrementing — so a retry
   can never burn a second use either.

4. **Atomic all-or-nothing.** Everything runs in the function's single implicit
   transaction. Any `RAISE` rolls back the redemption insert _and_ the
   decrement _and_ the user update together, and releases the lock. There is no
   window where the counter is spent but onboarding didn't record, or vice versa.

Event codes take the same path but are gated by `now() >= expires_at` instead of
the counter (they're time-boxed, not count-boxed), so the 48-hour window is the
only ceiling.

## Why the frontend can't be trusted for the hosting gate

`HostChecklist.tsx` renders `progress.eligible`, but that value is advisory. The
real gate is the RLS policy `events_insert_eventee`, whose `WITH CHECK` calls
`can_host_connections_event(auth.uid())` — a `SECURITY DEFINER` predicate that
counts checked-in events and accepted connections and reads `age_verified_at`
directly from the DB. A forged client that flips `eligible` to `true` and POSTs
an event still fails the INSERT at the database boundary.

Three columns are similarly untrusted from the client: `role`,
`age_verified_at`, `invited_by`, `onboarded_at`. RLS can gate _which rows_ a
user updates but not _which columns_, so a `BEFORE UPDATE` trigger
(`protect_user_columns`) rejects any change to them unless the caller is
`service_role` (the identity webhook) or an admin.

## Wiring notes

- **Age webhook:** a Supabase Edge Function receives the Stripe Identity / Yoti
  callback, verifies the provider signature, then calls
  `mark_age_verified(user_id)` with the service-role key.
- **Check-in:** `check_into_event(event_id)` is the trusted write for
  `checked_in_at`; front it with your geofence/QR logic. Members can RSVP
  themselves but the `attendees_self_rsvp` policy forces `checked_in_at IS NULL`,
  so they can't self-certify attendance.
- **Progress:** the component takes `progress` as a prop; fetch it server-side
  with `supabase.rpc('get_hosting_progress')` and pass it down, refetching via
  the `onRefresh` prop after the identity modal closes.
- **Deps:** `@radix-ui/react-dialog`, `lucide-react`, Tailwind.

## Accessibility summary (WCAG 2.2 AA)

| SC                              | Where                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1.4.1 Use of Color              | icon (🔒 `Lock` / ✅ `CheckCircle2`) + "Done"/"x / y" text + strikethrough — never colour alone |
| 1.4.3 Contrast                  | all text ≥ 4.5:1 on `zinc-900`; ratios noted inline per class                                   |
| 2.4.7 Focus Visible             | `focus-visible:ring-2` on every control; no bare `outline-none`                                 |
| 2.4.11 Focus Not Obscured       | `scroll-mt-24` on each row                                                                      |
| 2.5.8 Target Size               | every button `min-h-11` (44px)                                                                  |
| 3.3.8 Accessible Authentication | device/biometric copy; no password or puzzle                                                    |
| 4.1.3 Status Messages           | `aria-live="polite"` progress region; `role="progressbar"` meter                                |

Focus management on modal close is handled by Radix (restores focus to the
trigger) and made explicit via `ageTriggerRef` + `requestAnimationFrame` in
`handleOpenChange`, so it survives re-renders that could swap the trigger node.
