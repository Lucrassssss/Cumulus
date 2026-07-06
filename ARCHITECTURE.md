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
│       ├── services.js   # data-access + business logic (referral codes, perk gating)
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
 onclick / render  ──call──▶ validateCuratorCode()  ──▶ sb → curator_codes
                            isPerkUnlocked(state)         (Supabase / RLS)
                            canCheckInAt(a,b,r)      ──▶ geolocation math
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

Current contents: curator/referral-code validation (`validateCuratorCode`) and
WCAG-safe **perk gating** (`isPerkUnlocked`, `distanceMeters`, `canCheckInAt`) —
perks lock/unlock, but event pins and details are never hidden. Migrating the
~40 inline `sb.from(...)` calls in `app.js` into this layer is the incremental
path in Phase 2 item 2.

**Secret Social Club wiring (uses this layer):**

- Onboarding is invite-only — `submitGate()` requires a valid curator code
  before creating a new attendee (`validateCuratorCode`); hosts and returning
  members are unaffected.
- Event detail shows a **Members' perks** panel: locked until the member is
  curator-verified (`promptCuratorUnlock`) or has a geolocated check-in at the
  venue (`checkInToEvent` → `canCheckInAt`). The event itself is always visible.
- Map (`app.js`) uses Mapbox Standard with a theme-linked `lightPreset`
  (`night`/`day`) and, on the explore map, hides commercial POI + transit
  labels (`applyMapChrome`) for the decluttered underground look. Event pins
  come from a **clustered GeoJSON source** (`buildEventsGeoJSON` +
  `attachMapLayers`); individual pins are still HTML markers synced off a
  GeoJSON hitbox — converting those to a pure symbol layer is a follow-up that
  needs live Mapbox verification (the CDN is blocked in the sandbox).

Backend tables this layer expects (degrade gracefully to localStorage / format-
only checks until they exist): `curator_codes` (code, curator_name, tier,
active), `pending_events`, alongside the existing `users`, `events`, `rsvps`,
`tickets`, `chat_messages`, `friends`, `host_applications`.

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
  session (`authVerifyCode`) and only THEN runs the curator gate + writes the
  profile, so RLS always has an `auth.uid()`. `start()` restores via
  `sb.auth.getSession()` (with a cached-snapshot fallback for offline display);
  `config.js` persists/refreshes the session. This is on
  `claude/profile-card-customization-r4nptf` ONLY — it is deliberately NOT on
  `main`, because Supabase auth can't be exercised from the sandbox. Verify it
  on the branch's Vercel preview (enable Email OTP in Supabase → Auth →
  Providers first), and apply BOTH migrations to a staging project, before
  merging to `main`.

**Admin boundary (real auth).** Event approvals and curator-code management are
gated **server-side** by RLS, not just the client-side owner-email check. An
`admins` table + `is_admin()` back policies that require a Supabase **Auth**
session; the owner obtains one via `promptAdminSignIn()` → `adminSendCode` /
`adminVerifyCode` (email OTP). `pending_events` allows anyone to INSERT (submit)
but only an admin to SELECT/UPDATE (review/approve). Everything falls back to the
local flow when Auth isn't configured, so the app runs before go-live. Migration:
`supabase/migrations/20260703000000_secret_club.sql`. Go-live: enable Email auth
in Supabase, apply the migration, sign in once as the owner, then add that
`auth.users` row to `public.admins`.

## Security model (important)

There is no server to hide keys behind, so the keys in `config.js` are the
**publishable** ones and are expected to be in client code:

- **Supabase anon key** — public; the real boundary is **Row Level Security**.
  Keep RLS policies tight. A `service_role` key must **never** appear in client
  code (verified absent).
- **Mapbox token** — public; restrict by URL in the Mapbox dashboard.

`.env.example` documents these and how to inject per-environment values via
`window.CUMULUS_CONFIG` (or a future build step) without editing source.

**Known gap — RLS on the pre-existing tables.** This repo's migration history only
covers `admins`, `curator_codes`, and `pending_events` (see above). The tables that
predate this repo's migrations — `users`, `events`, `rsvps`, `tickets`,
`chat_messages`, `friends`, `host_applications` — have no migration file here, so
their Row Level Security policies aren't tracked or verifiable from the codebase.
**Before going live, audit these in the Supabase dashboard** (Database → Tables →
each table's RLS toggle + policies) and confirm the anon key can't read data it
shouldn't (e.g. other users' emails, private chat messages, another attendee's
ticket QR). Once confirmed, add a migration file capturing that state so it's
tracked going forward.

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
   (`getEvents`, `saveRsvp`, `loadFriends`, …) so render code never calls
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
