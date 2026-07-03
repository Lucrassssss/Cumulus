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

## Security model (important)

There is no server to hide keys behind, so the keys in `config.js` are the
**publishable** ones and are expected to be in client code:

- **Supabase anon key** — public; the real boundary is **Row Level Security**.
  Keep RLS policies tight. A `service_role` key must **never** appear in client
  code (verified absent).
- **Mapbox token** — public; restrict by URL in the Mapbox dashboard.

`.env.example` documents these and how to inject per-environment values via
`window.CUMULUS_CONFIG` (or a future build step) without editing source.

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
