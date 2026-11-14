# Architecture

Cumulus is a **static, client-only PWA**: vanilla JavaScript, no framework,
no bundler, no app server. The browser does all the rendering. Supabase
provides auth, Postgres (with RLS), RPCs, cron and Edge Functions. Stripe
handles payments, Mapbox the map, and Resend the email.

The original decision log, with incidents and the reasoning behind odd-looking
code, is in `docs/history.md`. This file is the current map.

---

## 1. Front end

### Scripts and the global scope

`index.html` loads `config.js`, then `services.js`, then the fourteen
`src/js/app/NN-*.js` files, all as classic `defer` scripts **in numeric
order**. They share one global scope: every top-level `function`, `let` and
`const` is visible to every file. Inline handlers in template strings depend
on this, for example `onclick="openEvent('…')"`.

Rules that follow from it:

- **Name collisions are global.** Search before adding a top-level name.
- **Order matters only for code that runs at load time.** Functions can call
  anything once the page has booted. `start()` in `03` is kicked off from the
  last file, `14`.
- **Escape dynamic text** with `escapeHtml()` whenever it goes into HTML. For
  values inside an inline `onclick='…'`, also replace `'` with `&#39;`.

| File | Contains |
|---|---|
| `01-constants.js` | `state` (all UI state), `EVENTS`, map handles, category data, `uiIcon()` line icons, `eventStatus()` |
| `02-utils.js` | storage helpers, `escapeHtml`, `showToast`, `showConfirm`, `applyTheme` |
| `03-theme-boot-signin.js` | day/night theme, geocoding cache, **`start()` boot**, sign-in sheet/page (`showLpSignup`, `closeLpSignup`) |
| `04-auth-host-apply.js` | OTP verify, host application flow, `enterApp()`, `initApp()` |
| `05-data-nav-routing.js` | `loadRealEvents`, **`renderNav`** (tab bar + live-ticket badge), **navigation** (`pushNav`, `goBack`, `openEvent`, `openAccount`, `openHost`…), role checks `isApprovedHost`/`isAdminAccount` |
| `06-map-pins-cards.js` | HTML map pins/clusters (`syncPins`), pin selection, bottom card sheet |
| `07-map-setup-geocoding.js` | Mapbox init (`initLeaflet`, historical name), weather tint, host address autocomplete |
| `08-host-create-owner-finance.js` | flyer upload/compression, `submitHostEvent`, owner finance dashboard |
| `09-host-admin-render-router.js` | **`renderView()`, the view router**, event page (`renderDetail`), host profile, admin screens, promo codes, payouts panel |
| `10-account-payments.js` | Account + details, pricing helpers, `myTickets`/`bookingDraft`, **Stripe checkout** (`startStripeCheckout`, `submitStripePayment`, `finalizeStripePayment`) |
| `11-checkout-confirmation.js` | Book + Pay screens, pay overlay, "You're in" animation, confirmation/ticket view |
| `12-wallet-host-form-scanner.js` | Tickets wallet (Upcoming/Past), can't-go/transfer sheets, the Host form ("Make a night": 4 steps + live ticket preview, `hostFormChanged()`), door scanner (offline queue in IndexedDB) |
| `13-discover-feed.js` | Discover feed (date strip, day headings), the filter bar (Filters dropdown + date strip), poster art, carousel, saved events, crew, location/calendar sheets, keyboard handling |
| `14-delight.js` | Decorative motion: boot screen tips/progress + iris reveal, Home "level load" intro (once per visit), count-ups, save confetti, poster holo tilt, orb easter egg, the street wall (spray-paint background layer, `streetWallSvg()`) and `sprayLastWord()` heading swashes, the event-page ticket button's fly-in (the button itself is `ticketButtonHtml()` in `09`); **boot call** |

### Rendering model

There's no virtual DOM. `state.view` names the current page, and
`renderView()` writes that page's HTML string into `#view-container`.

- **Navigate:** set `state.view` through an `open*()` function, then call
  `renderNav()` and `renderView()`. Use `pushNav()` first if Back should
  return here.
- **Redraw in place:** call `renderView()` again. If the view didn't change,
  `#app.same-view` suppresses page entrance animations and
  `_settleEntrances()` stops rows re-animating.
- **Background refresh:** `renderViewQuiet()` redraws without moving the
  scroll position or replaying anything.
- **Back:** `goBack()` pops `navStack`. Home remembers its scroll position
  (`state._feedY`). Back navigation adds `#app.nav-back`, so pages come back
  without a fade.
- **The map:** `state.view === "browse"`. Its container sits outside
  `#view-container` and is shown or hidden rather than re-rendered.

### Data flow

- **Read paths:** `services.js` holds them, as Supabase queries and RPCs.
  Events load into the global `EVENTS` array through `loadRealEvents()`, and
  tickets into `myTickets` through `loadMyTickets()`. Both are cached in
  `localStorage` for an instant start.
- **Write paths:** RPCs or Edge Functions. The client never writes tickets.
  Ticket rows are created server-side by `stripe-webhook` for paid events,
  and by an RPC for free ones.

### CSS

There are two layers, loaded in this order:

1. `styles.css`: the older base. Variables, resets and legacy components.
2. `v2.css`: the current design system. It overrides the base using
   `html body …` selectors, often with `!important`.

Put new work in `v2.css`. Design tokens (`--bg`, `--surface`, `--text`,
`--volt`, `--hot`, `--cta-bg`, `--r-*` radii, `--spring`, `--pop`) are at
its top. Light and dark come from `[data-theme]` on `<html>`, which follows
London's day/night cycle.

Dead selectors were removed in the November 2026 audit. The two layers still
overlap, though. Folding `styles.css` into `v2.css` and dropping the
`!important`s is the biggest remaining clean-up (see §5).

Motion conventions:
- Page entrances use `animation-fill-mode: backwards`, never `both`. A
  leftover transform would trap `position:fixed` children like the Pay bar.
- `--spring` settles with almost no overshoot. `--pop` is only for
  deliberate taps.
- Everything respects `prefers-reduced-motion`.

### Service worker

`sw.js` precaches the shell, scripts, styles and icons. **Bump `CACHE` on
every release**, otherwise installed users keep stale files. `npm run check`
fails if a precached file is missing.

---

## 2. Server

### Database (`supabase/migrations/`)

Migrations are applied in filename order and are the source of truth for
the schema. Some tables created in early migrations were later dropped, so
check the live schema rather than trusting the earliest files.

Core tables:

| Area | Tables |
|---|---|
| Events | `events` |
| People | `users` (app profile; 1:1 with `auth.users`), `admins`, `host_applications`, `host_follows`, `saved_events` |
| Tickets | `tickets`, `event_squads` (group bookings), `event_waitlist` |
| Money | `promo_codes`, `event_payouts` |
| Moderation | `event_reports` |

Security:
- RLS is on everywhere.
- Privileged operations are `SECURITY DEFINER` functions that check
  `is_admin()` or ownership themselves.
- `ensure_user_profile(uid)` recreates a missing profile row. The payment
  webhook calls it, so an orphaned account can't break purchases.

Scheduled and triggered work uses `pg_cron` and `pg_net`:
- An hourly job calls `remind-upcoming`.
- Triggers call `notify-admin-new-event` and `notify-followers-new-event`,
  authenticated by the `NOTIFY_WEBHOOK_SECRET` stored in Vault.

### Edge Functions (`supabase/functions/`, Deno)

| Function | Called by | Purpose |
|---|---|---|
| `create-checkout-session` | app (Pay) | Creates a Stripe PaymentIntent; returns `client_secret` |
| `stripe-webhook` | Stripe | On `payment_intent.succeeded`, writes ticket rows (idempotent). On `account.updated`, syncs Connect status |
| `send-receipt` | app | Receipt + QR email; only to the caller's own address |
| `cancel-ticket-refund` | app | Ticket holder returns a ticket (refund) |
| `cancel-event-refund` | host/admin | Cancels an event and refunds everyone |
| `connect-onboarding` | host | Stripe Connect Express onboarding |
| `release-payout` | cron | Transfers due payouts to hosts |
| `invite-past-attendees` | host | Emails past attendees about a new event |
| `notify-admin-new-event` / `notify-followers-new-event` | DB triggers | Notification emails |
| `remind-upcoming` | cron (hourly) | "It's tomorrow" reminders |
| `delete-account` | app | GDPR self-serve deletion (refuses hosts and upcoming tickets) |
| `email-ticket` | none | Retired stub (410); safe to delete |

Deployed in the project but **not in this repo**:
- `identity-webhook` and `create-verification-session` (Stripe Identity).
- `moderate-image-upload`.
- `issue-test-login` and `load-probe`, both retired stubs that return 410.

Pull the first three into the repo or delete them.

Secrets (Supabase → Edge Functions → Secrets):
- **Supabase:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_ANON_KEY`.
- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_CHECKOUT_WEBHOOK_SECRET`.
- **Email:** `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL`, `ADMIN_NOTIFY_EMAIL`.
- **Other:** `APP_URL`, `NOTIFY_WEBHOOK_SECRET`,
  `RELEASE_PAYOUT_CRON_SECRET`.

---

## 3. Payments: end to end

1. **Book:** pick a ticket type and quantity, optionally a promo code.
2. **Pay:** `startStripeCheckout()` calls `create-checkout-session`, then
   mounts Stripe's Payment Element (accordion layout) and Express Checkout.
3. **Confirm:** `submitStripePayment()` calls `stripe.confirmPayment` with
   `redirect: "if_required"`. Redirect methods like PayPal come back through
   `checkStripeCheckoutReturn()`.
4. **Webhook:** Stripe sends `payment_intent.succeeded` to `stripe-webhook`,
   which writes the ticket rows.
5. **Finalise:** `finalizeStripePayment()` polls for those rows, for up to
   about 20 seconds. Then the "You're in" animation plays and the user lands
   in Tickets, and `send-receipt` emails the receipt.

Pricing: the buyer pays face value plus a booking fee, and the host keeps
100% of face value. See `getCumulusFee()` / `eventAllInPrice()` in `10`.

---

## 4. Native apps (`native/`)

Capacitor shells for iOS and Android. They load `https://cumulusapp.co` live,
so web deploys reach testers without an app rebuild.

- **Android:** GitHub Actions builds a debug APK, plus a signed AAB once
  keystore secrets are set.
- **iOS:** a manual workflow uploads to TestFlight, using an App Store
  Connect API key.

Setup steps are in `native/README.md`.

---

## 5. Known gaps and suggested next steps

Most valuable first:

1. **CSS consolidation.** Merge `styles.css` into `v2.css` and remove the
   `html body …!important` override pattern. This is mechanical but large.
   Pixel-diff the screens before and after; the audit used a Playwright
   screenshot harness of about 50 views, which is worth adding to CI.
2. **ES modules.** Convert the 14 global-scope scripts to modules, which
   needs a bundler such as Vite. Inline `onclick` handlers would move to event
   delegation. That's the step that unlocks TypeScript and tree-shaking.
3. **Inline styles in templates.** Mainly the admin and owner-finance
   screens. Move them to classes.
4. **Edge Functions not in the repo.** Add them or delete them (see §2).
5. **Email sending.** Resend is still in test mode. Verify a sending domain
   so mail reaches people other than the owner.
6. **The repository is public.** Docs and migrations name the owner account.
   Consider making the repo private before onboarding outside contributors.
