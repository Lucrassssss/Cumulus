# Cumulus — Architecture & Refactoring Notes

Cumulus is a **static, client-only PWA**: vanilla JS + Supabase (data) + Mapbox
(maps), served as plain files with **no build step and no server**. That single
fact drives every architectural decision below.

## Current structure

```
/
├── index.html            # slim HTML shell (markup + <link>/<script> tags only)
├── src/
│   ├── css/styles.css    # all styles (single cascade, load-ordered)
│   └── js/
│       ├── config.js     # runtime config + Supabase client (`sb`)
│       ├── services.js   # data-access + business logic (auth, ticket claims, host payouts)
│       └── app.js        # UI rendering, state, Mapbox logic
├── assets/
│   ├── clouds/           # cloud1–5.webp — drifting hero clouds
│   ├── skyline/          # skyline-light.svg / skyline-dark.svg — hero skyline
│   └── img/              # feature-card + hero illustrations
├── tests/smoke.spec.js   # Playwright smoke suite (mobile + desktop)
├── .env.example          # config reference + security guidance
└── .gitignore
```

`index.html` went from **~1.3 MB (one file)** to a **~3 KB** shell.

## Script loading & the "everything is global" contract

The UI uses **inline `onclick="fn()"` handlers throughout** (hundreds of them).
Inline handlers resolve against the **global scope**, so every handler function
must be a global. This is why the app JS is loaded as a **classic deferred
script**, not an ES module:

- `<script defer src="src/js/app.js">` — classic scripts share one global
  lexical scope, so top-level `function foo(){}` stays reachable from
  `onclick="foo()"`. `defer` makes it non-render-blocking and preserves order.
- Load order (all `defer`, executed in document order after parse):
  `supabase-js` → `config.js` (creates `sb`) → `services.js` → `mapbox-gl`
  → `qrcode` → `app.js`.
- The tiny inline theme script in `<head>` is intentionally **not** deferred —
  it must set `data-theme` before first paint to avoid a flash.

> Converting `app.js` to real ES modules (`import`/`export`) would put functions
> in module scope and **break every inline handler**. See Phase 2.

## Services layer & data flow

`services.js` is the seam between the UI and the backend. It is loaded as a
classic deferred script (same global-scope rule as above) **after** `config.js`
so it can use `sb`, and **before** `app.js` so the UI can call it.

```
 UI (app.js)                services.js                 backend
 ───────────                ───────────                 ───────
 onclick / render  ──call──▶ authSendCode/authVerifyCode ──▶ sb.auth (OTP)
                            fetchEventDetails(id)     ──▶ sb.rpc get_event_details
                            claimTicket(code)         ──▶ sb.rpc claim_ticket
                            fetchHostPayouts()        ──▶ sb.rpc get_host_payouts
                            checkInTicket(id)         ──▶ sb.rpc check_in_ticket
        ◀── structured result (never throws) ──────
```

Rules for this layer:

- **Pure / side-effect-free where possible.** No DOM, no rendering — it answers
  questions and moves data; the UI decides what to show.
- **Degrade gracefully.** A missing table or offline network returns a
  structured result (e.g. `{ valid, unverified:true }`), never an unhandled
  throw, so the app renders even with the backend unreachable.
- **`sb` is used at call-time only**, never at parse-time, so a blocked
  Supabase CDN can't break script evaluation.

Current contents: Supabase Auth email-OTP wiring (`authSendCode`/`authVerifyCode`,
`adminSendCode`/`adminVerifyCode`), event/ticket data access (`fetchEventDetails`,
`fetchEventsGeoJSON`, `fetchGuestlist`), and the frictionless-ticketing backend
calls (`claimTicket`, `fetchHostPayouts`, `checkInTicket`, `currentUserRole`).
Migrating the remaining inline `sb.from(...)` calls in `app.js` into this layer
is the incremental path in Phase 2 item 2.

**Frictionless-ticketing wiring (uses this layer):**

- Onboarding is open — anyone can sign up with just a name and email, no
  invite code or curator gate. Hosting is a single ungated form
  (`renderHostView`); admins publish instantly, everyone else's event goes to
  `pending_events` for a quick review. The velvet-rope hosting-eligibility
  checklist (age verification, check-in, 3-connections gate) and curator-code
  perk gating that used to live here were removed outright — see
  `docs/velvet-rope/README.md` for the historical design.
- Event detail is always fully visible and bookable to everyone — there is no
  locked/unlocked panel of any kind.
- Buying more than one ticket generates **Squad** claim codes
  (`event_squads`/`claim_code`, Phase A backend): each extra ticket gets a
  shareable claim link that reassigns it via `claimTicket()`/`claim_ticket()`.
- Hosts get a **payouts panel** (`fetchHostPayouts` → `get_host_payouts`) with
  a real 24h/48h trust-tier release schedule, and an **offline-first scanner**
  (`checkInTicket` → `check_in_ticket`) for checking guests in at the door.
- A ticket-backup email (Resend edge function) and honest, visibly-disabled
  "Add to Apple/Google Wallet — Coming soon" buttons back up the QR ticket
  when there's no wallet-pass signing in place yet.
- Map (`app.js`) uses Mapbox Standard with a theme-linked `lightPreset`
  (`night`/`day`) and, on the explore map, hides commercial POI + transit
  labels (`applyMapChrome`) for the decluttered underground look. Event pins
  come from a **clustered GeoJSON source** (`buildEventsGeoJSON` +
  `attachMapLayers`); individual pins are still HTML markers synced off a
  GeoJSON hitbox — converting those to a pure symbol layer is a follow-up that
  needs live Mapbox verification (the CDN is blocked in the sandbox).

Backend tables this layer expects: `pending_events`, `event_squads`,
`event_payouts`, alongside the existing `users`, `events`, `rsvps`, `tickets`,
`host_applications`. (`curator_codes`, `chat_messages`, and `friends` were
dropped by the frictionless-ticketing pivot —
`supabase/migrations/20260720010000_pivot_frictionless_ticketing.sql`.)

**Events are real-data-only (no seed).** `app.js` no longer ships demo events —
`EVENTS` starts empty and is filled at boot from the `events` table via
`loadRealEvents()`. When there are no events (backend empty or unreachable) the
map shows a `.map-empty` overlay ("No events on the map yet" / "No events match"
when filtered) and list/calendar views show their own empty states, rather than
inventing listings. `supabase/migrations/20260704000000_events_table.sql`
guarantees the table's column shape (idempotent, additive) but deliberately does
**not** alter RLS on `events` — the live app writes events with the anon key
under the custom-users model, so strict RLS is a separate migration decision
(the hardened Supabase-Auth alternative lives in `docs/velvet-rope/`).

**Auth hardening (in progress — moving off the anon/custom-users model).**
The decision was made to harden onto real Supabase Auth + RLS. This lands in two
phases:

- **Phase 1 — SQL (done):** `supabase/migrations/20260704010000_auth_hardening.sql`
  links profiles to `auth.users` (trigger `handle_new_user`), adds a
  `role` enum (`eventee`/`partner_host`), and enables RLS on every live table
  (`users`, `events`, `rsvps`, `tickets`, `chat_messages`, `friends`,
  `host_applications`) with "read-where-appropriate / write-only-your-own"
  policies keyed on `auth.uid()`. **Ordering matters:** this migration assumes
  Phase 2 is live — applying it while the old anon signup is still deployed
  breaks writes (no `auth.uid()`), so apply it _with_ the Phase 2 deploy on a
  staging project first.
- **Phase 2 — frontend (built, on the feature branch, pending live verify):**
  sign-up/login now go through `sb.auth` email OTP. `submitGate()` emails a
  6-digit code (`authSendCode`); a new `verifyGateCode()` exchanges it for a
  session (`authVerifyCode`) and only THEN writes the profile, so RLS always
  has an `auth.uid()`. `start()` restores via
  `sb.auth.getSession()` (with a cached-snapshot fallback for offline display);
  `config.js` persists/refreshes the session. This is on
  `claude/profile-card-customization-r4nptf` ONLY — it is deliberately NOT on
  `main`, because Supabase auth can't be exercised from the sandbox. Verify it
  on the branch's Vercel preview (enable Email OTP in Supabase → Auth →
  Providers first), and apply BOTH migrations to a staging project, before
  merging to `main`.

**Admin boundary (real auth).** Event approvals are gated **server-side** by
RLS, not just the client-side owner-email check. An
`admins` table + `is_admin()` back policies that require a Supabase **Auth**
session; the owner obtains one via `promptAdminSignIn()` → `adminSendCode` /
`adminVerifyCode` (email OTP). `pending_events` allows anyone to INSERT (submit)
but only an admin to SELECT/UPDATE (review/approve). Everything falls back to the
local flow when Auth isn't configured, so the app runs before go-live. Migration:
`supabase/migrations/20260703000000_secret_club.sql`. Go-live: enable Email auth
in Supabase, apply the migration, sign in once as the owner, then add that
`auth.users` row to `public.admins`.

## Payments — Stripe Connect scaffolding (DEPLOYED, NOT MONEY-TESTED)

Every "£" figure the app showed before this section existed was bookkeeping
only — the pivot migration's own comment said so plainly, and the checkout
screen literally rendered a fake card-number form that never touched Stripe.
This section adds real Stripe Connect wiring: schema
(`supabase/migrations/20260721000000_stripe_connect_scaffolding.sql`,
`20260721010000_index_unindexed_foreign_keys.sql`) plus five Edge Functions.

**Status: schema is live and all five functions are deployed and ACTIVE** on
the Supabase project (verified via `list_tables`/`list_edge_functions` once
MCP access to the live project became available mid-session — it was not
available when this section was first written, which is why the code itself
still says "not live-tested" in its own comments). What is **not** verified:
no real (even test-mode) Stripe purchase has been run through it, because
this sandbox's outbound network cannot reach the Supabase Functions HTTPS
endpoint or Stripe directly (`curl`/`fetch` to either times out here — MCP
tool calls reach Supabase through separate infrastructure that isn't
available for arbitrary HTTP). Whether `STRIPE_SECRET_KEY` is actually set
as a function secret also could not be confirmed from here (no tool exposes
secret existence, only management via the Supabase CLI). Before trusting
this with real money: run one real test-mode Checkout end to end and watch
`stripe-webhook` actually create a ticket row.

**Model: separate charges and transfers, not destination charges.** Checkout
collects the full amount (ticket price + booking fee) onto the *platform's*
Stripe account. The host's net share moves to their own Connect account
later, once `event_payouts.scheduled_release_at` has passed — the existing
24h/48h trust-tier logic from the pivot migration decides *when*; this only
adds *where*. Chosen over destination charges because a host doesn't need a
fully verified Connect account before their first ticket can sell, which
matches the "frictionless" positioning better than gating checkout on host
onboarding.

**create-checkout-session** (`verify_jwt = true`): looks up the event's
`price` server-side (the client sends only `eventId`/`qty` — price is never
trusted from the request body), computes the booking fee with a fee-tier
function that **must be kept in sync by hand** with `getCumulusFee()` in
`app.js` (£0 free / ≤£15 → £1.50 / ≤£40 → £2.50 / ≤£71 → £3.50 / else
£4.50), creates a Stripe Checkout Session, and returns its hosted `url` for
`location.href` to redirect to. No Stripe.js/Elements anywhere client-side.

**stripe-webhook** (`verify_jwt = false`, HMAC-verified like the deleted
identity-webhook was): the *only* place tickets get created for a paid
purchase — `checkout.session.completed` creates the ticket rows (+ an
`event_squads` row if `qty > 1`, mirroring the old client-side
`createSquadIfNeeded()`), which fires the existing `sync_event_payout_trg`
automatically. Idempotent on `stripe_checkout_session_id` (Stripe redelivers
webhooks). Also handles `account.updated` to flip a host's
`stripe_connect_charges_enabled`/`payouts_enabled` once Stripe actually
verifies their Connect account — `connect-onboarding` only ever *starts*
that process, it can't mark an account usable itself.

**connect-onboarding** (`verify_jwt = true`): creates a Stripe Connect
Express account for the calling member (if they don't have one) and an
Account Link, so `release-payout` has a `destination` to transfer to.

**release-payout** (`verify_jwt = false`, dual auth mode — a member JWT
processes only that host's own due payouts, or a
`RELEASE_PAYOUT_CRON_SECRET` bearer token processes every due payout across
all hosts): calls `stripe.transfers.create()` for `event_payouts` rows past
their release time, then marks them `released`. **Important consequence:**
`get_host_payouts()` (pivot migration) used to lazily flip a due row to
`released` just by being read — that's now wrong (it would mark a payout
released with no transfer having happened, and `release-payout` would then
never see that row again). The migration redefines `get_host_payouts()` as
a pure read; only `release-payout` may transition a payout's status now.
Nothing in this repo calls `release-payout` on a schedule — wiring a cron
(Supabase Cron / pg_cron / external scheduler) is still open.

**cancel-event-refund** (`verify_jwt = true`, host-of-event or admin only):
refunds every *unique* Stripe payment intent behind an event's active
tickets (grouped, not per-ticket — a Squad purchase shares one intent), then
calls `finalize_event_cancellation()` (SQL, `service_role`-only) to mark the
event/tickets cancelled and zero out any still-`pending` payout. A payout
already `released` means the transfer to the host already happened — clawing
that back needs a *separate* reverse-transfer call this function does not
make; out of scope for this pass. Partial refund failures don't block
finalization (the event isn't happening either way) — the response's
`warning`/`refunds` fields tell the caller what needs manual follow-up.

**Self-serve ticket transfer**: `start_ticket_transfer(p_ticket_code text)`
generalises the Squad claim-code mechanism to any ticket a member owns —
puts a fresh, unclaimed `claim_code` on it; the existing `claim_ticket()` RPC
needs no changes since it already reassigns `user_id` on redemption. Takes
the human-readable `ticket_id` (text), not the UUID primary key, because
that's what the frontend already carries everywhere.

**Not built in this pass**: real Apple/Google Wallet passes (still an
honest "Coming soon" — no signing credentials exist for this project; see
the confirmation-screen comment in `app.js`), and any automated *scheduled*
trigger for `release-payout` (it works today, but only when a host's own
JWT calls it or something external hits it with the cron secret).

## Security model (important)

There is no server to hide keys behind, so the keys in `config.js` are the
**publishable** ones and are expected to be in client code:

- **Supabase anon key** — public; the real boundary is **Row Level Security**.
  Keep RLS policies tight. A `service_role` key must **never** appear in client
  code (verified absent).
- **Mapbox token** — public; restrict by URL in the Mapbox dashboard.

`.env.example` documents these and how to inject per-environment values via
`window.CUMULUS_CONFIG` (or a future build step) without editing source.

**RLS audit — resolved.** This was previously an open gap (pre-existing tables
without a tracked migration). It has since been closed: RLS is hardened on
every live table (`users`, `events`, `rsvps`, `tickets`, `host_applications`,
`pending_events`, `admins`) and 13 leftover permissive `{public}` policies
were found and dropped — see `GO-LIVE.md`. (`curator_codes`, `chat_messages`,
and `friends` no longer exist; they were dropped by the frictionless-ticketing
pivot.)

## Production readiness — app & website

- **PWA**: `manifest.json` + real icons (`assets/icons/`) replace an earlier
  runtime-generated blob-URL manifest, which is unreliable for install prompts
  (Chrome's installability checks want a stable, fetchable manifest URL, not one
  regenerated fresh — and possibly differently — on every page load).
- **Service worker**: exactly one registration (`sw.js`, static file). An
  in-JS duplicate registration (leftover from before the sw.js extraction) has
  been removed — it raced the real one and used a stale cache-name scheme.
- **SEO / sharing**: `robots.txt`, `sitemap.xml`, canonical link, and Open
  Graph/Twitter Card tags (`assets/og-image.png`) so shared links render a real
  preview instead of a bare URL. These use `https://cumulusapp.co` as a
  placeholder canonical domain — **update if the real production domain differs.**
- **Legal**: `privacy.html` / `terms.html` are real pages now (the footer links
  previously 404'd). Content is accurate to what the app actually does and
  collects, but **hasn't had legal review** — treat as a first draft, not final
  copy, especially for UK GDPR specifics before real user data is at stake.
- **Security headers**: `vercel.json` sets `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, and a `Permissions-Policy` that allows
  geolocation (used by check-in/map) but blocks camera/mic/payment/usb/midi.
  Deliberately **no CSP** — the inline-`onclick` architecture (see above) needs
  `script-src 'unsafe-inline'` to function, which defeats most of a CSP's
  purpose; getting this right needs a dedicated pass, not a bolt-on.

---

## Phase 2 roadmap (deliberately deferred)

These are valuable but **higher-risk** on a large codebase with **no automated
tests**. They should be done incrementally, with visual/behaviour verification
per step, rather than in one mechanical sweep.

1. **Add a build step (Vite) + ES modules.** Prerequisite for real modules.
   Migrate inline `onclick` → delegated `addEventListener` (or expose an
   explicit `window.actions` namespace), then split `app.js` into
   `services/` (Supabase data access), `state.js`, `ui/` (render functions),
   `theme.js`, `map.js`, `cards.js`. Env vars come from `import.meta.env`.

2. **Decouple data from DOM.** Introduce a `services/supabase.js` layer
   (`getEvents`, `saveRsvp`, `claimTicket`, …) so render code never calls
   `sb.from(...)` directly. ~40 call sites — migrate a feature at a time.

3. **Consolidate CSS / remove `!important`.** `styles.css` still contains
   several stacked "Redesign N.0" override layers whose ordering is currently
   load-bearing. Flatten them into one token-driven system and delete the
   `!important` crutches **once** a visual-regression harness exists to catch
   breakage.

4. **Naming standardisation.** Enforce `camelCase` (JS) / `kebab-case` (CSS)
   repo-wide with a linter/formatter (ESLint + Stylelint + Prettier) so it is
   mechanical and reviewable, not hand-done.

5. **Testing.** ✅ Done — `tests/smoke.spec.js` runs a Playwright smoke suite
   (mobile + desktop) over the core flows (boot, landing, sign-up/log-in
   toggle, 4-tab nav, core views, Cumulus Pass, theme toggle, local assets).
   Extend it as the refactors above land.
