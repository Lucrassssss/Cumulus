# Cumulus — Architecture & Refactoring Notes

Cumulus is a **static, client-only PWA**: vanilla JS + Supabase (data) + Mapbox
(maps), served as plain files with **no build step and no server**. That single
fact drives every architectural decision below.

## Current structure (after Phase 1)

```
/
├── index.html            # slim HTML shell (markup + <link>/<script> tags only)
├── src/
│   ├── css/styles.css    # all styles (single cascade, load-ordered)
│   └── js/
│       ├── config.js     # runtime config + Supabase client (`sb`)
│       └── app.js         # all application logic
├── assets/
│   └── cloud.png         # cloud image (extracted from a 670 KB base64 blob)
├── .env.example          # config reference + security guidance
└── .gitignore
```

`index.html` went from **~1.3 MB (one file)** to **~4 KB**; the 670 KB inline
base64 cloud is now a cacheable 492 KB static asset.

## Script loading & the "everything is global" contract

The UI uses **inline `onclick="fn()"` handlers throughout** (hundreds of them).
Inline handlers resolve against the **global scope**, so every handler function
must be a global. This is why the app JS is loaded as a **classic deferred
script**, not an ES module:

- `<script defer src="src/js/app.js">` — classic scripts share one global
  lexical scope, so top-level `function foo(){}` stays reachable from
  `onclick="foo()"`. `defer` makes it non-render-blocking and preserves order.
- Load order (all `defer`, executed in document order after parse):
  `supabase-js` → `config.js` (creates `sb`) → `mapbox-gl` → `qrcode` → `app.js`.
- The tiny inline theme script in `<head>` is intentionally **not** deferred —
  it must set `data-theme` before first paint to avoid a flash.

> Converting `app.js` to real ES modules (`import`/`export`) would put functions
> in module scope and **break every inline handler**. See Phase 2.

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

5. **Testing.** Add Playwright smoke tests for the core flows (boot, sign-up,
   log-in, RSVP, pass) so the refactors above can be done safely.
