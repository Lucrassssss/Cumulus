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
│       └── app/           # UI rendering, state, Mapbox logic — 12 classic
│           ├── 01-core-constants.js    #   scripts loaded in this numeric
│           ├── 02-core-storage.js      #   order (see below); all still
│           ├── 03-core-theme.js        #   share ONE global scope, same
│           ├── 04-auth-onboarding.js   #   inline-onclick contract as the
│           ├── 05-data-loaders.js      #   single app.js this replaced —
│           ├── 06-map-animations.js    #   this is a file-count split for
│           ├── 07-discovery-map.js     #   readability, not the ES-module
│           ├── 08-event-creator.js     #   Phase 2 rewrite described below.
│           ├── 09-host-analytics.js    #   Note: the split's naming isn't
│           ├── 10-badges.js            #   perfectly scoped — e.g. Stripe
│           ├── 11-event-checkout.js    #   checkout logic (startStripe-
│           └── 12-ticket-wallet.js     #   Checkout) landed in 10-badges.js,
│                                       #   not 11-event-checkout.js.
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

- `<script defer src="src/js/app/01-core-constants.js">` (and the 11 files
  after it) — classic scripts share one global lexical scope, so top-level
  `function foo(){}` in ANY of the 12 files stays reachable from
  `onclick="foo()"` anywhere else. `defer` makes each non-render-blocking
  and preserves execution order across all of them.
- Load order (all `defer`, executed in document order after parse):
  `supabase-js` → `stripe-js` → `config.js` (creates `sb`) → `services.js` →
  `mapbox-gl` → `qrcode` → `src/js/app/01-core-constants.js` through
  `12-ticket-wallet.js`, in that numeric order.
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
`src/js/app/*.js` (£0 free / ≤£15 → £1.50 / ≤£40 → £2.50 / ≤£71 → £3.50 /
else £4.50), creates a Stripe Checkout Session in **embedded** mode
(`ui_mode: "embedded"`), and returns its `client_secret`. See "Embedded
Checkout" below — this used to return a hosted `url` for `location.href` to
redirect to; it doesn't anymore.

### Embedded Checkout outage (2026-07-21) — Stripe's own breaking change

Every real checkout attempt was returning a silent 500 from the moment
Embedded Checkout was first deployed until this fix: Stripe shipped a
breaking change in API version `2026-03-25` ("dahlia") that renamed the
`ui_mode` enum — `"embedded"` (and `"hosted"`/`"custom"`) now fail outright
with an invalid-parameter error instead of being accepted; the in-page mode
is `"embedded_page"` going forward, and `stripe.initEmbeddedCheckout()` was
renamed to `stripe.createEmbeddedCheckoutPage()` (the old name now throws
`IntegrationError`). `create-checkout-session` was still sending the old
`ui_mode: "embedded"`, so from the account's perspective every request was
simply malformed — this shipped invisibly because the failure only
surfaces on a real, authenticated, price-bearing request, which nothing in
this repo's CI/Playwright suite exercises (Stripe/Supabase network calls
are blocked in every sandboxed test run here by design).

Symptom as the user experienced it: clicking "Continue to Payment" landed
on a payment screen with its own separate "Pay with card" button that,
when clicked, did nothing visible — the mount attempt failed inside a
`catch` block whose only feedback was a toast easy to miss, so it read as
a dead button rather than an error.

Fixed two things together:
1. **The actual bug**: `create-checkout-session` now sends
   `ui_mode: "embedded_page"`, pins an explicit `Stripe-Version:
   2026-03-25` header (rather than trusting the account's
   dashboard-configured default, which is what silently changed
   underneath this integration in the first place), and
   `console.error`s the raw Stripe error before wrapping it in a 500 — so
   a future Stripe-side rejection is diagnosable straight from
   `get_logs`/`supabase functions logs` instead of requiring the same
   research-from-first-principles this took. `startStripeCheckout()`
   (`src/js/app/10-badges.js`) now calls
   `stripe.createEmbeddedCheckoutPage()`, falling back to
   `initEmbeddedCheckout()` only if the loaded Stripe.js predates the
   rename (cheap insurance since `js.stripe.com/v3/` is unversioned).
2. **The UX gap that made the bug look worse than it was**: the payment
   screen required a second manual tap ("Pay with card") after "Continue
   to Payment" before the Stripe iframe even started loading — visually a
   redundant extra step, and one that hid the actual failure behind a
   button that looked clickable but wasn't doing anything useful.
   `renderCheckout()` no longer renders that button at all;
   `afterRenderCheckout()` (wired into `renderView()`'s `"checkout"`
   branch, same `setTimeout`-after-innerHTML pattern as
   `afterRenderConfirmed()`) calls `startStripeCheckout()` the instant the
   screen mounts, showing a spinner in its place. "Continue to Payment"
   is now one action, not two. On failure, the spinner is replaced by the
   real error message plus a "Try again" button — visible, not silent.

### Embedded Checkout outage, round 2 — the version pin itself was malformed

The `ui_mode: "embedded_page"` fix above was necessary but not sufficient:
the very next real invocation (visible directly in Supabase's edge-function
logs) still returned 500. Two compounding bugs, found together:

1. **`Stripe-Version: "2026-03-25"` is itself an invalid version string.**
   Stripe's newer "named" API versions use the format
   `YYYY-MM-DD.codename` (e.g. `2025-04-30.basil`) — the codename isn't
   cosmetic, it's part of the literal header value Stripe expects. The
   correct pin is `"2026-03-25.dahlia"`. Sending the bare date alone is
   itself a malformed/unrecognized version, which Stripe rejects — so the
   very header meant to fix the `ui_mode` problem was causing its own
   separate failure.
2. **The failure was invisible from the app itself.** `createCheckoutSession()`
   (`src/js/services.js`) used `sb.functions.invoke()`, whose thrown error
   on any non-2xx response has a fixed, generic `.message`: *"Edge Function
   returned a non-2xx status code"* — completely discarding whatever our
   own function actually returned in the response body (which, since the
   first round of this fix, included the real Stripe error text via
   `console.error` server-side, but that only reaches Supabase's logs, not
   the user). The real per-request detail lives on `error.context`, the
   raw unconsumed `Response` object — `createCheckoutSession()` now awaits
   `error.context.json()` and surfaces that message instead, so the next
   time anything about this integration breaks, the actual reason shows up
   in the toast/status UI directly instead of requiring a repeat of this
   investigation.

Deployed as edge function version 6. Same caveat as before: this session's
sandbox cannot exercise a real Stripe call to confirm success end-to-end —
confidence here comes from Stripe's own documented version-string format
plus the (now-fixed) error surfacing, which will make any further failure
self-diagnosing from the app itself.

### Embedded Checkout — the buyer never leaves cumulus

Checkout used to redirect the whole tab to a Stripe-hosted payment page.
It's now Stripe's **Embedded Checkout**: `create-checkout-session` passes
`ui_mode: "embedded"` and a `return_url` (this app's own origin, with a
`{CHECKOUT_SESSION_ID}` placeholder Stripe fills in) instead of
`success_url`/`cancel_url`, and returns `client_secret` instead of `url`.
`startStripeCheckout()` (`src/js/app/10-badges.js`) loads `Stripe.js`
(`https://js.stripe.com/v3/`, the one exception to this repo's "no SDK for
anything" rule — Embedded Checkout's iframe can only be mounted and driven
by that library), calls `stripe.initEmbeddedCheckout({ clientSecret })`,
and mounts it into `#stripe-checkout-embedded` right on the existing
checkout screen (`renderCheckout()`, `src/js/app/11-event-checkout.js`) —
same look as Eventbrite's in-page checkout, no new tab, no new domain in
the address bar. On completion Stripe navigates back to `return_url`
(`/?checkout=return&session_id=...`), which is still this app's own page;
`checkStripeCheckoutReturn()` (boot-time, `10-badges.js`) reads that,
polls `fetchTicketsBySession()` until `stripe-webhook` has finished
creating the ticket rows (same webhook, same ticket-creation path as
before — embedded vs. hosted only changes where the *card form* renders,
not how a ticket gets created), and shows the confirmation screen. No
Stripe Elements/PaymentIntent hand-rolling was needed to get this — Stripe
owns the whole payment form (card, wallets, Link) inside the mounted
iframe, same PCI scope as before, just presented in-page instead of on a
separate domain.

**Payment methods (Apple Pay / Google Pay / PayPal).** `create-checkout-
session` never sets `payment_method_types`, which is deliberate — Stripe
Checkout's default behavior without that param is "dynamic payment
methods": it shows whatever's enabled in the Stripe Dashboard (Settings →
Payment methods), filtered to what's eligible for the buyer's browser/
currency. Apple Pay and Google Pay are wallet buttons that piggyback on
the card method and need no code change here — Stripe handles Apple Pay
domain verification itself for Checkout (unlike a hand-rolled Payment
Request Button integration). PayPal is a distinct method that needs
explicit enabling in the Dashboard (country/currency-eligibility gated)
and is redirect-based even inside the embedded iframe — clicking it
briefly leaves to authenticate on PayPal's own domain before returning,
which is inherent to PayPal, not a Cumulus limitation. None of this is
toggleable from this repo's tooling; it's a Dashboard action for whoever
holds the Stripe account.

**Theming — attempt #1 (client-side `appearance`) broke checkout live and
was reverted**: passing an `appearance`/`fonts` object into the client
`initEmbeddedCheckout()` call threw `Invalid initEmbeddedCheckout(options)
parameter: appearance is not an accepted parameter` on first real use.
`createEmbeddedCheckoutPage` (the name Stripe's changelog says
`initEmbeddedCheckout` was renamed to) turned out not to actually be
present on the currently-loaded `js.stripe.com/v3/` script — the fallback
to the old `initEmbeddedCheckout` is what really fires, and that method
validates its options strictly rather than ignoring unknown keys.

**Theming — attempt #2 (server-side `branding_settings`), current
state.** Checkout Sessions support a documented `branding_settings`
parameter (Stripe changelog: "checkout-sessions-branding-settings") set
at session-*creation* time — a different mechanism from the client-side
Appearance API attempt #1 used, and one that's actually allowed for
`ui_mode: "embedded_page"` (the docs explicitly disallow it only for
`ui_mode: "elements"`). `create-checkout-session` now sends
`branding_settings[background_color]`/`branding_settings[button_color]`
matching the app's light/dark `--surface`/`--accent`, selected by a
`theme` field the client now sends (`createCheckoutSession()`,
`src/js/services.js`, reading `document.documentElement.dataset.theme`).

Given `ui_mode` and the `Stripe-Version` header format were BOTH
confidently-wrong guesses that broke live checkout earlier this session,
this attempt is built to **fail safe rather than fail closed**: the
session is first requested WITH `branding_settings`; if Stripe rejects
that request, `postStripeSession()` immediately retries the identical
session WITHOUT those fields and logs the rejection via `console.error`
(visible in `get_logs`/`supabase functions logs`). So if the exact field
names turn out to be wrong too, the outcome is "checkout works, just
unthemed" — never a fourth outage. Verify by watching for a "branding_settings
rejected, retrying without theming" log line after a real checkout
attempt; its absence (or a themed-looking payment form) means it worked.

`stripeAppearanceForCurrentTheme()` (`src/js/app/10-badges.js`) is still
unused/uncalled from attempt #1 — left in place as a correctly-computed
reference for the color values, not wired back into the client init call
(that specific surface is confirmed to reject unknown options).

**Known follow-up, not yet done**: Stripe's `clientSecret` param to
`initEmbeddedCheckout()` is documented elsewhere as deprecated in favor of
a `fetchClientSecret` callback — given the `createEmbeddedCheckoutPage`
rename claim turned out not to reflect what's actually live, treat that
deprecation claim with the same skepticism until independently confirmed
against the real, currently-loaded Stripe.js before acting on it.

**Superseded** by the "Payment Element migration" section directly below —
theming attempt #2 got the header/button themed but hit a hard wall on the
input card itself, which is what finally justified the bigger rebuild.

### Payment Element migration (2026-07-21) — full theming needs the raw Elements API, not Checkout Sessions

Attempt #2 above (`branding_settings`) DID theme the Checkout Session's
header/summary background and the "Pay" button — confirmed against a real
screenshot of the live checkout. But the payment-method-selection card
(email field, card/wallet list) stayed on a fixed white surface no matter
what. Researched against Stripe's own docs/community reports and confirmed
this is a genuine, deliberate Stripe product constraint: the pre-built
Checkout Session form always renders its input card on a fixed light
surface for legibility/trust, and there is no parameter — Appearance API or
`branding_settings` — that reaches it. This isn't a bug to keep patching;
no further server-side field-name guessing would ever fix it.

The only way to theme the input card itself is to stop using Stripe's
pre-built Checkout Session form and build the payment form directly with
Stripe's **Elements** API instead — full Appearance API control over every
surface, because the form's DOM is no longer Stripe's own hosted page/
iframe, it's `Element`s mounted directly into this app's own page. Given
this session's track record of three prior live breakages from newer/
less-proven Stripe surfaces (the `ui_mode` rename, the malformed
`Stripe-Version` header, the `appearance` param rejection above), the
migration deliberately targets Stripe's **oldest, most stable** payments
primitive — raw **PaymentIntent + Payment Element**
(`automatic_payment_methods` has been GA since 2023-08-16) — rather than
the newer "Elements with Checkout Sessions" feature (`ui_mode: "elements"`
+ `initCheckout`), which ships behind a distinct versioned Stripe.js
preview build and looked like a strong candidate for a fifth outage.

**What changed:**

- `create-checkout-session` no longer creates a Checkout Session at all —
  it creates a **PaymentIntent** (`POST /v1/payment_intents`) for the full
  charge amount (ticket price + booking fee, × quantity — PaymentIntents
  have no line-items/quantity concept, so the server multiplies once
  up front) and returns its `client_secret`. Also looks up the buyer's
  email from `public.users` and passes it as `receipt_email`, so the new
  form never needs to ask for an email the app already has (unlike the
  old Checkout form's own Email field).
  **Update (product decision, post-launch-prep):** `automatic_payment_
  methods` is still enabled (Stripe's dynamic-eligibility engine), but
  it's now paired with `allowed_payment_method_types: ["card", "paypal"]`
  — a hard allow-list rather than "whatever's eligible." The Stripe
  account has ~15 other wallets/redirects toggled on in the Dashboard
  (Amazon Pay, Revolut Pay, Cartes Bancaires, Kakao Pay, Pix, Bancontact,
  BLIK, EPS, etc.) that unconstrained automatic_payment_methods would
  happily surface for a GBP charge; card + PayPal is the actual full set
  wanted (Apple Pay/Google Pay ride on "card," they aren't separate
  types), and an allow-list survives Dashboard changes an exclude-list
  wouldn't. Confirmed against the live API reference for this pinned
  Stripe-Version that `allowed_payment_method_types` is the correct
  create-time parameter — the bare `payment_method_types` array is
  response-only on this API version. Trade-off: Link no longer appears
  as its own payment method (the `receiptEmail`/`billingDetails.email`
  default in `startStripeCheckout()` now only prefills the card form's
  email field, not Link's one-tap recognition).
- `startStripeCheckout()` (`src/js/app/10-badges.js`) now calls
  `stripe.elements({ clientSecret, appearance, fonts })` (the SAME
  `stripeAppearanceForCurrentTheme()` color/font values computed for the
  abandoned attempt #1 — they finally apply for real now) and mounts a
  single `payment` Element into `#payment-element`
  (`renderCheckout()`, `src/js/app/11-event-checkout.js`). A `#pay-btn`
  button stays hidden until the Element fires `'ready'`, then triggers
  `submitStripePayment()` on click.
- `submitStripePayment()` calls
  `stripe.confirmPayment({ elements, confirmParams: { return_url }, redirect: "if_required" })`.
  Most cards confirm **synchronously with no redirect at all** — the
  promise resolves with `{ paymentIntent }` directly, and
  `finalizeStripePayment()` is called inline. Some methods (certain bank
  debits/wallets) genuinely navigate away and back via `return_url`;
  `checkStripeCheckoutReturn()` (boot-time) now reads Stripe's own
  appended `?payment_intent=...&redirect_status=...` params (replacing the
  old `session_id`/`checkout` params) and calls the same
  `finalizeStripePayment()` for that path — one shared
  polling/confirmation-screen implementation for both completion routes.
- `stripe-webhook`'s trigger event changed from `checkout.session.completed`
  to **`payment_intent.succeeded`**, and its idempotency/ticket-linking
  column changed from `stripe_checkout_session_id` to
  `stripe_payment_intent_id` (both columns already existed on `tickets`
  from the original Connect-scaffolding migration — no new migration
  needed). **This requires a manual Stripe Dashboard change** — the
  webhook endpoint must be resubscribed from `checkout.session.completed`
  to `payment_intent.succeeded`, or payments will succeed with no ticket
  ever created. See GO-LIVE.md → "REQUIRED — Stripe Dashboard webhook
  resubscription" for the exact steps; no tool available to this session
  can change a webhook's subscribed events itself.
- `fetchTicketsBySession()`/`stripe_checkout_session_id`-based lookups were
  replaced outright by `fetchTicketsByPaymentIntent()` (`src/js/services.js`)
  — no dead code left behind, since nothing else referenced the old
  session-based path once the redirect-return handler was rewritten.

**stripe-webhook** (`verify_jwt = false`, HMAC-verified like the deleted
identity-webhook was): the *only* place tickets get created for a paid
purchase — `payment_intent.succeeded` creates the ticket rows (+ an
`event_squads` row if `qty > 1`, mirroring the old client-side
`createSquadIfNeeded()`), which fires the existing `sync_event_payout_trg`
automatically. Idempotent on `stripe_payment_intent_id` (Stripe redelivers
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

## Growth features — the founding Master Blueprint

A business/product document ("Cumulus Master Blueprint") specified a set of
concrete, buildable features on top of the pivot above. This section covers
what was built from it — schema
(`supabase/migrations/20260721020000_blueprint_growth_features.sql`) plus one
new Edge Function — and, separately, what the blueprint describes that is
**deliberately not code** because it's a business process, not a product
surface (see the end of this section).

**Viral Acquisition Engine — WhatsApp Magic Link group claim.** The
blueprint's spec is: buy N tickets → get ONE shareable link → a friend opens
it, enters their email, gets an OTP, and their ticket is silently claimed
under a freshly created account. This reuses the pre-existing `event_squads`
table (`tickets.squad_id` + `tickets.claim_code` marking an unclaimed extra
seat + `tickets.claimed_by`) rather than adding the blueprint's literal
`purchase_group_id`/`owner_id` columns — the existing Squad structure already
*is* a purchase group, so no new columns were needed, only a new RPC:
`claim_group_ticket(p_squad_id uuid)` (SECURITY DEFINER, race-safe via
`FOR UPDATE SKIP LOCKED`, uses `auth.uid()` internally rather than a
client-supplied owner id — the blueprint's own pseudocode takes an explicit
`p_new_owner_id` param, which would let any caller claim a seat on someone
else's behalf; deliberately not copied). `shareSquadGroupLink()` builds a
`?squad=<event_squads.id>` URL; `checkSquadGroupClaim()` (in `initApp()`)
claims it once `state.userId` exists. The unauthenticated-friend case needs
no separate stashing of intent across the signup flow: this is a
client-only SPA, so `location.search` simply survives untouched through the
whole OTP sign-up round-trip, and `checkSquadGroupClaim()` re-runs
naturally once `initApp()` re-fires after auth. `nudgeGateForSquadClaim()`
auto-opens the signup modal with claim-specific copy when `?squad=` is
present and no session exists yet.

**Tiered ticketing with time-based auto-flip.** New `price_tiers` jsonb
column on `events`/`pending_events`: an array of `{label, price, cutoff}`.
`activeTicketTier()` (client, `app.js`) picks the first tier (sorted by
cutoff ascending) whose cutoff hasn't passed yet, or the last tier if all
have — both `eventPrice()` and `ticketTypes()` read through it, and the host
form gets an opt-in "tiered pricing" toggle (collapsed by default, to keep
the blueprint's own 60-second-publish goal intact for hosts who don't need
it) revealing three optional price+cutoff rows (Early Bird/General/Final).
Price authority is still 100% server-side: `create-checkout-session` got its
own `activeTierPrice()` that mirrors the client logic exactly and must be
kept in sync by hand with it, same pattern as the existing booking-fee
function. **Deliberately not built**: capacity-based tier flipping (the
blueprint mentions both time and capacity triggers; only time-cutoff exists
here — doing capacity right needs a per-tier sold-count that the current
schema doesn't track and would need real design, not a quick add).

**CSV / audience data export.** A "table stakes" item from the blueprint's
competitive matrix. `exportGuestlistCsv()` is pure client-side (Blob + object
URL + a synthetic `<a download>` click) — no new backend, since
`fetchGuestlist()` already returns everything a host is allowed to see under
the existing `tickets_host_read` RLS policy. Lives next to the scanner's
search box.

**Starting-Next-2-Hours spontaneity filter.** The blueprint's flagship
"whitespace" differentiator. `isStartingSoon(ev)` / `toggleStartingSoonOnly()`
add a map filter chip, mutually exclusive with the existing Live/Hot chips,
using only data already on the event object — no schema change.

**One-Click Blast — invite past attendees.** New Edge Function
`invite-past-attendees` (`verify_jwt = true`) plus RPC
`get_past_attendee_emails(p_host_id uuid default auth.uid())` (SECURITY
DEFINER; checks the caller **is** the host or an admin — the client only
ever says "promote this event", it can't supply or influence the recipient
list). The function re-derives the recipient list server-side from the RPC,
then sends a batch of Cumulus-branded emails via Resend's
`/emails/batch` endpoint (same `RESEND_API_KEY` already configured for
`email-ticket`/`notify-admin-new-event`). Wired to a host-only "📣 Invite
past attendees" button on the event detail view. **Status: schema and
function are both live on the Supabase project** (see the end of this
section for verification); **not delivery-tested** — sending to anyone other
than the Resend account owner needs a verified sending domain, which this
sandbox can't configure or confirm.

**Behavioral sales-timing analytics.** A lightweight read of the blueprint's
"sales lift in the 48 hours before doors open" idea: `lastMinuteSalesStat()`
computes, client-side from data the scanner view already loads, what
percentage of an event's tickets sold within 48 hours of start time (shown
only once ≥3 sales exist, to avoid a noisy stat on a near-empty guestlist).
No new backend — this is existing `purchased_at`/`start_time` data the host
already has access to, read differently.

**SEO-crawlable event URLs — partial.** The blueprint calls for full
server-rendered, crawlable individual event pages. This app has no server or
build step (see "Current structure" above) — real SSR is out of scope
without a genuine architecture change, not something to fake. What *was*
built: `?event=<id>` deep links (`updateEventUrlAndMeta()`/
`checkEventDeepLink()`/`resetEventUrlAndMeta()`) that update `document.title`
and the existing `<meta name="description">` tag via `history.replaceState`
as a user navigates, and restore an event from a shared link on load. This
makes links shareable and gives *client-side* renderers a real title/
description; it does not make event pages independently crawlable by a
search engine that doesn't execute JavaScript. Labeled here as partial
rather than claimed as done.

**Deliberately not code — business process, not a product surface.** The
blueprint's Experiential Sponsorship Moat (matching brands like a brewery to
sponsor a night's drinks) and go-to-market plan (a "City Director" per
region, a specific London launch corridor, a 100-event launch target) are
sales/ops processes with no technical spec attached — building UI or schema
for them here would be inventing a feature the document doesn't actually ask
for. See `PRODUCT.md` → "Business Model" for how this is framed for the
brand/product side.

## Host onboarding — applications and the Host tab gate

Two related bugs meant "apply to host" and "review a submitted event" looked
like they worked but didn't: `public.host_applications` never existed on the
live project — every application silently fell back to a browser-local
`localStorage` array (the code's own error-fallback path), so an admin on a
different device would never see it. And `loadAndRenderEventApprovals()` had
a dead conditional (`if (error) if (!error && data) …` — the inner branch is
never reachable, since `error` and `!error` can't both be true) that meant
the admin Event Approvals queue always rendered "All clear" regardless of
what was actually pending. Both fixed in
`supabase/migrations/20260721030000_host_applications_and_review_fixes.sql`
plus the corresponding one-line JS fix.

That same migration also closes a real privilege-escalation gap: the
original `pending_events_select`/`pending_events_update` policies (from the
2026-07-03 migration) were `using (true)` for both — fully open reads *and
writes* on every row to any authenticated (or even anonymous) caller.
Combined with `events_insert_own`'s `host_id = auth.uid()` check, any
signed-in user could call `decideEvent(<their own pending_events id>,
'approved')` directly (e.g. from devtools) and self-publish, bypassing
admin review entirely — the admin-only UI was cosmetic, not a real boundary.
Now scoped to `host_id = auth.uid() or is_admin()` for select and
`is_admin()`-only for update.

**The Host tab is no longer shown to every signed-in user.** Previously any
account could open it and submit an event straight into the `pending_events`
review queue with zero hosting privileges — the request that prompted this
section put it plainly: "every user can just spam the host button when they
don't have privileges to host." `isApprovedHost()` (`app.js`) now gates it:
true for admins, or for an account carrying the `verified-host`
`special_badges` entry that `reviewHost()` grants on host_applications
approval. `renderNav()` only includes the Host tab when that's true, and
`openHost()` redirects a non-approved caller into the apply flow instead of
the event-creation form (defense in depth against a stale nav DOM or a
direct call). Non-approved signed-in users apply via a new in-app flow —
Profile → "Become a host" → `openHostApply()`/`renderHostApplyView()` —
which shares its DB-write logic (`_saveHostApplicationRow()`) with the
original landing-page "Become a host" signup path rather than duplicating
it. `getMyHostApplicationStatus()` (services.js) loads the caller's latest
application status during `initApp()` so Profile can show "Become a host"
(never applied / rejected), "Application pending" (disabled), or nothing
(already approved — the Host tab covers it). The actual security boundary
remains server-side RLS (`events_insert_own`, the two policies above) — this
gating is about not offering a dead-end UI to accounts with no privileges,
not the enforcement itself.

## Account & Admin — the gamified card/badge system removal (2026-07-22)

Cumulus briefly grew a full "Cumulus Pass" member card system — a
customizable ID card (background style, accent color, border, layout,
typography, patterns, curated "Signature Look" presets, front/back flip),
a milestone/category/special-badge achievement system with levels, an
About Me section (bio, interest tags, "London spots"), and an achievements
page — all reachable from a Profile tab. It was explicitly cut: "we need to
scrap the card design and all this profile bloat along with achievements
and everything, the ticket tab is all we really need." The directive
covered *only* this member-facing gamification layer — host-profile pages
(viewing another user's public host page) and account-level host
customization were explicitly kept out of scope ("host profiles can be
customised but a full revamp of that system is needed... we will revamp
this into the site once this full audit removal is done").

**What replaced it — a lean Account tab.** `renderAccount()`
(`10-badges.js`) is now just: My Tickets (the actual cards, via
`myTicketsCardsHtml()`, `12-ticket-wallet.js` — tickets used to live on two
separate near-duplicate screens; there's one implementation now, embedded
directly here rather than behind its own nav destination), then a settings
list — edit name/email (`accountEditFormHtml()`/`saveAccountDetails()`,
a genuinely working implementation; the pre-removal `editProfile()` set
`state.editingProfile = true` but nothing ever consumed the flag, so the
button was a silent no-op), scan tickets (host-scanner entry point, gated
by `canAccessScanner()`), become a host / application status, help &
support, sign out. No card, no badges, no levels, no about-me.

**Admin got its own tab instead of living inside Profile.** `openAdmin()` /
`renderAdmin()` (`09-host-analytics.js`) is a separate, owner-only
(`isAdminAccount()`) nav entry — Admin sign-in, Finances, Host
applications, Event approvals, and the test-data-wipe utilities that used
to be a buried section at the bottom of the old Profile screen, past the
entire card/achievements layout.

**What was deleted, in full:** every `CARD_*` constant (`01-core-
constants.js`) and the `cardDraft`/`myCard` state; `resolveCardColors()`/
`getBgStyle()`/`getTheme()` (`02-core-storage.js`); the card_theme/
card_bio/card_interests/card_fact/card_border/card_layout/card_font/
card_accent/card_featured_badges/avatar_url read+write in
`persistProfile()`/`_restoreUserFromRow()` (`03-core-theme.js` — the DB
columns and the `public_profiles` view stay; the app just stops touching
them); the entire card editor (`04-auth-onboarding.js`, ~900 lines,
`openCardEditor()`→`closeCardEditor()`, plus its welcome-step wiring in
`enterApp()`); `CARD_FIELD_TO_COLUMN`/`saveMyCardFields()`/
`uploadAvatarPhoto()`/`fetchPublicProfile()` (`services.js`); the whole
badge/achievement system (`getAllBadges`, `getBadgeById`,
`openExpandedCard`, `openBadgePicker`, `openAchievements`,
`renderAchievements`, medallion/trophy/badge-cell renderers); About Me
(`updateAboutCounter`/`saveProfileAbout`/`toggleProfileInterest`); and
roughly 320 now-dead CSS rules across two passes (the card editor's tabs/
swatches/pattern pickers, the Cumulus Pass card faces and flip animation,
badges/trophies/levels, the About Me layout, the old ID-card display) —
including compound selectors like `.badge-cell.earned:hover .trophy-coin`
that survive a naive "is this class used" sweep because the modifier half
(`.earned`, `.active`, `.locked`, `.flipped`) is too generic to blacklist
outright; those needed verifying by hand that the *root* class no longer
renders anywhere.

**What was deliberately preserved.** `special_badges` / the
`"verified-host"` string is untouched end to end (DB column,
`persistProfile()`'s write, `reviewHost()`'s write, `isApprovedHost()`'s
read) — it looks like it lives in the same neighborhood as the badge
display system, but it's the actual mechanism gating the Host nav tab, not
cosmetic. `almostFullBadgeHtml()` (an unrelated "spaces running low" event
pill) survived despite the name collision with the badge system. The host-
profile page (`openHostProfile()`/`renderHostProfile()`,
`09-host-analytics.js` — cover band, name, "Reviewed" badge, stats,
upcoming-event cards, Follow button) stays, but was stripped back to its
original card-system-independent form: a plain two-letter monogram avatar,
no bio paragraph, no featured-badges row — it had briefly picked up
`avatar_url`/`card_accent`/`card_bio`/`card_featured_badges` dependencies
via `fetchPublicProfile()`, which is now gone along with them.

## Account details, avatar upload, and real host follows (2026-07-23)

A follow-up audit after the removal above: an "Edit name & email" row
that swapped in place inline wasn't enough — industry norm (Eventbrite,
Luma, most consumer apps) is a dedicated "Account details" page covering
name/email/phone/photo, and both attendees and hosts needed a way to set
a profile photo now that the card system's avatar upload went with it.

`openAccountDetails()`/`renderAccountDetails()` (`10-badges.js`) replace
the old inline `editProfile()`/`accountEditFormHtml()` pair with a real
full-page view (`state.view = "account-details"`) — avatar upload zone,
name, email, phone (new `phone_number` column, optional, lenient
`PHONE_PATTERN`), one Save button. Approved hosts also see a "Host banner"
upload zone above the avatar (`cover_url`, shown on their public host
profile page — see below). `accountAvatarHtml()` renders a real photo
when set, a plain initials monogram otherwise, shared between the Account
header and this page.

**Uploads are trust-gated, not AI-moderated.** A same-day follow-up
(`20260723010000_revert_image_moderation.sql`) undid an earlier detour
through a `moderate-image-upload` edge function that scanned every avatar/
banner with Google Cloud Vision's SafeSearch Detection before publishing
it. That cost real money per upload and added a server round-trip for a
risk this app already gates elsewhere: hosts can't publish anything
without first passing a real identity check (Twilio SMS OTP + Stripe
Connect), and that friction — not a per-image AI scan — is what actually
keeps a troll from bothering to upload something bad in the first place.
`uploadAvatarPhoto()`/`uploadCoverPhoto()` (`services.js`) went back to
uploading straight to the caller's own folder in the `avatars`/`covers`
bucket (`compressImageFile()` first, same as before), RLS-scoped to
`auth.uid()` — the same pattern every other storage bucket in this app
uses. Anything that slips through is handled after the fact by the
community, not screened before the fact by a vendor API — see "Community
event reporting" below.

### Community event reporting (2026-07-23)

Zero-cost replacement for the reverted per-upload AI moderation, aimed
squarely at *not* slowing down the app's core loop: a host should be able
to publish in under a minute, not wait on a review queue. Any signed-in
user can flag an event they think is inappropriate, spam, or misleading
(`openReportEventModal()`/`submitEventReport()`, `09-host-analytics.js` —
a small reason-picker modal reusing the admin sign-in modal's chrome,
rather than `window.prompt()`, which gets silently dismissed on a tab
switch). Reports land in `public.event_reports` (`reporter_id`, `event_id`,
`reason`, PK on the pair — one row per person per event, which is also
exactly what the report count needs). A trigger, `handle_event_report()`
(`SECURITY DEFINER`, so it can act regardless of who's calling), flips the
event's `status` to `'hidden'` the moment a 3rd unique reporter lands —
counted server-side, not trusted to client code. `getFilteredEvents()`
excludes `'hidden'` events from the map/browse/search the same way it
already excluded `'cancelled'` ones; `renderDetail()` shows a "reported,
under review" notice instead of a book button, and existing
tickets/bookings are left untouched (unlike a cancellation, a report might
turn out to be unfounded).

Closing the obvious loophole mattered as much as building the feature:
without it, a reported host could just run their own `UPDATE` (e.g. from
devtools) the instant their event got auto-hidden and flip `status` right
back to `'active'`, since the pre-existing `events_modify_own`/
`events_delete_own` RLS policies only checked `host_id = auth.uid()` with
no awareness of status. Both policies now additionally require
`status <> 'hidden'` for a non-admin — once reported, only an admin can
touch the event at all, which is what "goes to the admin panel for manual
review" has to mean for the report system to be worth anything.

Admin review lives at **Admin → Reported events**
(`openReportedEvents()`/`renderReportedEvents()`, same review-card layout
as Event approvals): each hidden event lists its report count and reasons,
with **Restore** (deletes the event's `event_reports` rows and flips
`status` back to `'active'` — rows are actually deleted, not just
ignored, since the trigger counts *all* rows for an event and would
otherwise re-hide it the instant any future report landed) or **Delete
permanently** (reuses the existing `deleteEvent()`).

**Host follows became real.** The host-profile page's own comment used to
say the exact opposite of what it now does: "No follower count (following
is a local-device bookmark)... showing one would be a fabricated trust
signal." A new `public.host_follows` table (`follower_id`, `host_id`, both
`uuid` FKs to `auth.users`, public SELECT so any visitor's client can
compute a count, INSERT/DELETE scoped to `follower_id = auth.uid()`)
replaces the old `localStorage` bookmark. `isFollowingHost()` still has to
be synchronous — the event-detail byline renders synchronously and can't
await mid-render — so it reads an in-memory cache (`state.followedHostIds`)
loaded once at boot (`loadMyFollows()`, called from `initApp()`);
`toggleFollowHost()` updates that cache optimistically and fires the real
write in the background, rolling back on failure. The Follow button itself
only renders for reviewed hosts (a real linked account) in both the byline
and the profile page, since `host_follows.host_id` has a real FK — there's
nothing valid to follow for a legacy events-only host string.

Host profile page: real avatar photo and banner when set
(`fetchHostProfileExtras()`, `public.public_profiles` — avatar_url,
cover_url, created_at, nothing card-related), a "Member since" line, and a
three-stat row (events hosted / attendees / followers). Both photos are
edited exclusively from Account details, not from this page directly —
one editing surface, not two to keep in sync. Fixed a genuine layout bug
surfaced while
testing with a realistic two-word host name: the avatar and the name/
Follow row previously shared one flex container pulled up over the cover
band, so a name that wrapped to two lines could paint its second line
directly on top of the gold banner (unreadable at the color-boundary).
The avatar now overlaps the banner in its own isolated row
(`.host-profile-avatar-wrap`); the name/Follow row sits fully below it and
can never intrude on the banner regardless of name length.

### Fixed: admin accounts had no way to reach admin mode (2026-07-23)

A real lockout, not just a rough edge: the Admin nav tab only renders when
`isAdminAccount()` (`state.isAdmin`) is already true, but the *only* place
that ever set `state.isAdmin = true` was the "Admin sign-in" OTP modal —
which lives **inside** the Admin tab. An account genuinely listed in
`public.admins` (confirmed live for the site's own owner account) had no
path in the UI to ever reach that modal after a normal sign-in; the tab
that contains the unlock button was itself hidden until the button had
already been pressed.

`initApp()` (`04-auth-onboarding.js`) now calls the existing
`isAdminSession()` (`services.js` — `sb.rpc("is_admin")`, unchanged, still
the real server-side check against `public.admins`) automatically for any
signed-in session, and sets `state.isAdmin`/`state._verifiedAdmin` before
calling `renderNav()` again so the tab appears without any manual step —
admin status is just on by default for an actual admin account, the same
way `isApprovedHost()`'s badge is read automatically rather than requiring
a second re-verification click. The manual "Admin sign-in" row inside
`renderAdmin()` is now hidden once `state._verifiedAdmin` is already true
(it would otherwise read as "you're not really signed in as admin" to
someone looking at a screen they could only reach by already being one) —
left in place, unhidden, as a fallback for the rare case the automatic
check didn't run this session (e.g. a transient network error at boot).

### Fixed: "can't create new events" — a regressed trigger + a footgun admin button (2026-07-23)

Two stacked bugs, found live while investigating the report above.

**1. `handle_new_user()` regressed a bug that was already fixed once.**
`20260708000000_fix_handle_new_user_missing_name.sql` fixed this trigger
for never setting `public.users.name` (`NOT NULL`, no default — a legacy
column predating `display_name`), which raised inside the `AFTER INSERT`
trigger on `auth.users` and silently rolled back the *entire signup* for
every new account. `20260720010000_pivot_frictionless_ticketing.sql`
later redefined the same function to drop its invite-code-minting logic
(invites were removed in the pivot) and, in simplifying it, reintroduced
the exact same bug — back down to inserting only `(id, email,
display_name)`. Every signup since that pivot has been failing to create
its `public.users` mirror row. Re-fixed in
`20260723030000_fix_handle_new_user_regression_and_restore_data.sql`,
reapplying the 2026-07-08 fix on top of the current (invite-free) version.

**2. "Clear all users" deleted the calling admin's own row too.** The
Admin panel's "Clear all users" button (`clearAllUsers()`,
`08-event-creator.js`) ran `DELETE FROM users` with no `WHERE` excluding
the caller — a real, in-production trigger for exactly this incident: the
site owner's own `public.users` row got deleted, which (since
`events.host_id` FKs to `public.users(id)`) made every event-creation
attempt fail with a foreign-key violation, even though `auth.users` and
`public.admins` were untouched (so sign-in and `is_admin()` still worked
fine — the account just couldn't do anything requiring its own profile
row: create events, follow hosts, etc). `clearAllUsers()` now excludes
`state.userId` from the delete (`.neq("id", state.userId)`) and no longer
force-signs-out the caller afterward, since their own account is left
intact; the confirm copy and Admin-panel row label were updated to say
"every OTHER account" instead of "every account".

The same migration also backfills a `public.users` row for any
`auth.users` account currently missing one (using the same
`id`/`email`/`name`/`display_name` shape `handle_new_user()` would have
used), which is how the site owner's own row was restored. Any per-account
state that lived only in the deleted row (Stripe Connect status, special
badges, card customization, etc.) was **not** recoverable — it started
over at column defaults, same as a brand-new signup.

## The "Master Development Codex" reconciliation

A second founder-supplied document (a 7-page "Master Development Codex")
was checked line-by-line against what's actually in this repo. Most of it
already matched the Master Blueprint pass above almost exactly (the map,
tiered ticketing, the Magic Link claim, host analytics basics, offline
scanning, admin approvals) — this section covers only what changed:
genuinely new pieces the Codex specified that weren't built yet, real gaps
it caught, and what was deliberately declined.

**GDPR marketing opt-in (Codex Page 2/4).** A per-ticket
`marketing_opt_in` boolean, off by default, with a checkbox at checkout
("Allow [Host] to email me about future local events"). Threaded through
both purchase paths: `registerFree()` reads the checkbox directly;
`startStripeCheckout()` stashes it on `bookingDraft` before navigating away
from the booking screen (the checkbox's DOM is gone by the time
`create-checkout-session` actually runs) and passes it through as Stripe
Checkout metadata for `stripe-webhook` to write onto the created ticket
rows. The enforcement point is `get_past_attendee_emails()` — the guestlist
CSV export never carried email addresses in the first place, so consent
only matters where an email address actually leaves the building.

**WhatsApp-first ticket sharing.** The Codex frames WhatsApp specifically
as "the core viral acquisition engine," not sharing in general. The three
ticket-link share functions (squad group link, squad ticket claim, ticket
transfer) were consolidated into one `shareTicketLink()` helper that opens
`wa.me` first (works cross-platform, unlike the app-only `whatsapp://`
scheme) and falls back to the native share sheet, then clipboard. The
generic "share this event" button on the detail page is untouched — that's
organic discovery, not the ticket-sharing growth loop the Codex means.

**Master "Valid for N Entries" QR + group scan.** Squad/group purchases now
also get one combined QR (`SQUAD:<squad_id>`) alongside the existing
per-ticket ones, shown first on the confirmation screen. Scanning it calls
`check_in_squad_ticket()`, which checks in the next still-active seat in
that squad (`FOR UPDATE SKIP LOCKED`, same pattern as `claim_group_ticket`)
and reports how many remain — **one scan per person arriving**, not one
scan admitting the whole group at once. The Codex's own wording ("instantly
logs N entries") reads as the latter; that was deliberately not built,
since letting one phone screen wave an entire group through with no
headcount check undercuts the same anti-fraud intent the rest of the
document cares about (rotating QR, 1:1 licensing compliance). This needs a
live connection every scan (no offline queueing) — unlike a known
`ticket_id`, there's no safe client-side way to guess which seat in a group
is still free.

**Full-screen door-scanner feedback.** The scanner's check-in result was a
small toast; the Codex asks for "Binary Feedback: Full Green screen (Valid),
Full Red screen (Invalid)" — a bouncer needs to read it at a glance in a
dark venue. `flashScannerResult()` adds a reused, `pointer-events:none`
full-viewport flash (green/red), retriggered cleanly on every scan the same
remove-reflow-add way the map's pin-hover bounce works, with a
`prefers-reduced-motion` fallback that skips the animation for a plain flash.

**Ghost pins for free events.** The Codex's pin taxonomy (Standard/Ghost/
Sponsored) was only partly buildable: free events now render as a visually
distinct, desaturated grey pin (still showing the category glyph) instead
of the category colour — real, cheap, and already wired through
`buildEventsGeoJSON()`'s `free` property into the WebGL symbol layer's
`icon-image` expression. **Sponsored pins were not built** — there is no
brand/sponsorship data model anywhere in this schema (no `sponsor_id`
column, nothing to attach a brand to), and drawing a glowing pin for a
feature that doesn't exist would be UI for nothing. This matches
`PRODUCT.md`'s existing stance that the Experiential Sponsorship Moat is a
manual sales process, not a product surface.

**Host analytics: three new reads, no new charting library.** Spontaneity
ratio (% booked within 4h of doors vs earlier — a two-way split rather than
the Codex's own three-way wording, which leaves a 4-24h band undefined) and
drop-off rate (tickets sold vs actually scanned, past events only) are both
derived client-side from data the scanner guestlist already carries — no
new backend. Repeat-attendee tracking needs cross-event history the
guestlist doesn't carry, so it's a new RPC, `get_repeat_attendee_count()`,
lazy-loaded the same way the guestlist itself is. **Not built**: the
Codex's purchasing-time heatmap (would need Recharts or an equivalent
charting library — see the stack note below).

**Real event flyer upload.** Events previously always fell back to a
category stock photo (`catImg()`); hosts can now upload a real flyer,
compressed client-side (canvas re-encode to JPEG, no library) before
landing in a new `event-flyers` Supabase Storage bucket. Storage RLS scopes
writes to the uploader's own folder (`<user_id>/...`) so one host can never
overwrite another's flyer; reads are the bucket's own public-URL serving,
not a `storage.objects` SELECT policy — a first pass *did* add one, which
Supabase's advisor immediately flagged (`public_bucket_allows_listing`): a
public bucket already serves object URLs without consulting
`storage.objects` RLS at all, so a SELECT policy there only adds the
ability to enumerate every uploaded file path, for no benefit. Fixed by
dropping it. `events.photo_url`/`pending_events.photo_url` carry the
uploaded URL through the same admin-direct/pending-review paths as
`price_tiers`; the card/detail hero prefer it over the stock photo.

**Declined outright — stack mismatch, not a gap.** The Codex specs a
Next.js/React/Recharts/React-Map-GL stack throughout ("Stack: Mapbox GL JS
+ React Map GL", "Integrate charting libraries (e.g., Recharts)", `/events/
[slug]` file-based routing). This app is deliberately static with no build
step (see "Current structure" above) — adopting a component framework or a
charting library would be an architecture change, not a feature, so every
Codex ask was re-read for its *intent* and rebuilt in vanilla JS against
this app's existing map/services layer rather than attempted literally.

**Declined outright — no credentials or infrastructure exist for these,
same posture as the wallet-passes gap already documented above.** Twilio
SMS OTP as a host anti-spam gate (Page 5) — this app already has an
arguably stronger anti-spam gate for the same problem: the host-application
approval system (see "Host onboarding" above) requires a human admin
decision before an account gets the Host tab at all, which a bot can't
automate its way past the way an SMS OTP challenge alone could.

**Declined outright — business process, not a product surface, same
reasoning as the Master Blueprint's sponsorship section.** The Sponsorship
Matchmaker UI and the Ghost Pin Injector (Page 7 — a tool to bulk-import
"scraped" events from other platforms to pad out map density in new
cities). The former has no data model to attach to (see above); the latter
was not built on principle, not just scope — building a scraper/importer
for other platforms' event listings is a business decision with real legal
and ethical weight (most listing sites' own terms prohibit it) that
shouldn't be made unilaterally by writing the code for it.

**Left as-is, not revisited.** The Codex's cancellation-engine nuance
("converts the £2 platform fee to platform credit to cover Stripe gateway
reversal penalties") is a specific accounting policy on top of the
already-built `cancel-event-refund` function. It was not implemented
because it can't be verified without a live Stripe test-mode run (this
sandbox has no outbound network to Stripe), and guessing at exact money-
handling behavior that can't be tested is worse than leaving the existing,
already-documented full-refund behavior in place.

## Security model (important)

There is no server to hide keys behind, so the keys in `config.js` are the
**publishable** ones and are expected to be in client code:

- **Supabase anon key** — public; the real boundary is **Row Level Security**.
  Keep RLS policies tight. A `service_role` key must **never** appear in client
  code (verified absent).
- **Mapbox token** — public; restrict by URL in the Mapbox dashboard.

`.env.example` documents these and how to inject per-environment values via
`window.CUMULUS_CONFIG` (or a future build step) without editing source.

**RLS audit — resolved for every application table.** This was previously an
open gap (pre-existing tables without a tracked migration). It has since been
closed: RLS is hardened on every live table this app owns (`users`, `events`,
`rsvps`, `tickets`, `host_applications`, `pending_events`, `admins`) and 13
leftover permissive `{public}` policies were found and dropped — see
`GO-LIVE.md`. (`curator_codes`, `chat_messages`, and `friends` no longer
exist; they were dropped by the frictionless-ticketing pivot.)

**`public.spatial_ref_sys` — RLS cannot be enabled from here; accepted as a
known PostGIS/Supabase limitation, not an open app-security gap.** This
table (and the `postgis` extension itself) is owned by `supabase_admin`, a
Supabase-internal role — confirmed by querying `pg_tables`/`pg_extension`
directly. The project's own `postgres` role (what every migration in this
repo, including this session's, runs as) gets `must be owner of table
spatial_ref_sys` on `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, so no
migration in this repo can close it — this needs either Supabase's own
tooling/support to act as `supabase_admin`, or moving the whole `postgis`
extension out of `public` into a dedicated schema (a materially bigger,
separate change touching `events.coordinates` and every geography
RPC/index, not attempted here). Practically low-risk regardless: the table
holds ~8500 rows of public EPSG/SRID coordinate-system definitions, byte-for-
byte identical on every PostGIS install on earth — there is no app or user
data in it, and "RLS disabled" here means at most someone can read reference
data that's already public in the PostGIS source itself.

**`extension_in_public` (`postgis`, `pg_net`) — same limitation, same
verdict.** Both extensions are installed in the `public` schema, which
Supabase's advisor flags on general security-hygiene grounds (a compromised
function in an extension sharing a schema with app tables has a shorter
path to them). Checked ownership the same way as `spatial_ref_sys`: both
extensions are owned by `supabase_admin`, not `postgres` — `ALTER EXTENSION
... SET SCHEMA` requires ownership this repo's tooling doesn't have. The
real fix (moving both into a dedicated `extensions` schema) is a Dashboard
Extensions-UI action, and for `postgis` specifically it's a bigger change
than it looks (every geography column, GIST index, and `ST_*` call in
`get_events_geojson`/`sync_event_coordinates` would need re-pointing) —
tracked, not attempted here.

### Advisor remediation pass (2026-07-21)

A full `get_advisors` sweep (security + performance), prompted by the
volume of warnings the user was seeing directly in the Supabase dashboard.
`supabase/migrations/20260721060000_advisor_remediation.sql` fixed
everything that was actually fixable from this repo's tooling:

- **Two real vulnerabilities, not just lint noise.** `app_role(p_user uuid
  default auth.uid())` and `get_host_payouts(p_host uuid default
  auth.uid())` are both `SECURITY DEFINER` (so they bypass RLS entirely)
  and both let the *caller* override the default with anyone else's UUID,
  with no check that the override actually belonged to them. Neither the
  app itself nor any migration ever called them with an override — the
  app's own use (check my own role; read my own payouts) always looked
  correct — but as exposed PostgREST RPCs, anyone with the public anon key
  could call `app_role(p_user := '<any-uuid>')` and learn whether an
  arbitrary account is an admin, or `get_host_payouts(p_host :=
  '<any-uuid>')` and read another host's entire payout ledger (gross/fee/
  net amounts, dispute status) — completely bypassing the
  `event_payouts_host_read` RLS policy that looks like it protects that
  table. Fixed by adding the same "self, or `is_admin()`" check every other
  parameterized RPC in this codebase already uses.
- **`function_search_path_mutable`** — `get_events_geojson`,
  `get_event_details`, `sync_event_coordinates` were missing a pinned
  `search_path`; added `set search_path = public, pg_temp` to all three,
  bodies unchanged.
- **Unnecessary RPC exposure on trigger-only functions** —
  `protect_user_columns`, `set_payout_schedule`, `sync_event_payout`,
  `sync_event_coordinates`, and `is_trusted_host` only ever run as
  triggers or as internal calls from inside another trigger (confirmed via
  `pg_trigger`); Postgres fires a trigger as the function's owner
  regardless of the invoking role's own `EXECUTE` grant, so revoking
  `anon`/`authenticated` access removes a public `/rest/v1/rpc/...` entry
  point with zero effect on the triggers themselves.
- **`auth_rls_initplan`** (23 policies across `admins`, `event_attendees`,
  `event_payouts`, `event_squads`, `events`, `host_applications`,
  `pending_events`, `rsvps`, `tickets`, `users`) — every direct
  `auth.uid()` call written inline in a policy was re-evaluating per row;
  wrapped each in `(select auth.uid())` so Postgres caches it once per
  statement.
- **`multiple_permissive_policies`** — several tables had a blanket
  `*_admin_all` (or duplicate `*_admin`) policy layered on top of
  already-`is_admin()`-aware per-action policies (Postgres evaluates every
  permissive policy that applies, so two policies for the same
  role+action is pure overhead). Folded each blanket policy's `is_admin()`
  branch into the specific policy(ies) that needed it and dropped the
  blanket one — same authorization outcome, fewer policies evaluated per
  query. Also found and dropped two policies that were byte-for-byte
  duplicates of another policy already on the same table/action
  (`users_self_write` ≡ `users_self_update`, `pending_events_update_admin`
  ≡ `pending_events_update`), and one that was a strict subset of another
  (`pending_events_select_admin` ⊂ `pending_events_select`).
- **`unused_index`** (INFO) — five indexes Postgres stats say have never
  been used. Left alone: this project has no real production traffic yet,
  so "unused" means "not yet exercised," not "useless" — each backs a real
  query pattern (`tickets_stripe_pi_idx`/`tickets_stripe_session_idx` for
  `fetchTicketsBySession()`, etc.). Revisit once there's real usage data.
- **`auth_leaked_password_protection`** — Supabase Auth setting, not a
  migration; see `GO-LIVE.md`.

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
   toggle, bottom nav incl. Host/Admin gating, core views, day/night theme,
   local assets). Extend it as the refactors above land.
