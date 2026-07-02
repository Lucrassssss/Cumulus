/* ===========================================================================
   CUMULUS - config.js  (environment & configuration layer)

   Loads runtime environment from window.__CUMULUS_ENV__, which is produced
   by `node scripts/build-env.mjs` into src/js/env.js (gitignored).

   NO credentials may ever be hardcoded in this file or anywhere else in
   source. If env.js is absent the app boots in degraded "demo" mode:
   seed events render, the map and backend features disable gracefully.

   Security model (see ARCHITECTURE.md for the full write-up):
   - Supabase anon key + Mapbox pk token are PUBLISHABLE credentials.
     Real enforcement = Supabase RLS policies + Mapbox token URL scoping.
   - Keeping them out of git means rotation never requires a code change.
   =========================================================================== */

const CONFIG = (function buildConfig() {
  const env = window.__CUMULUS_ENV__ || {};

  const cfg = {
    supabaseUrl: (env.SUPABASE_URL || '').trim(),
    supabaseAnonKey: (env.SUPABASE_ANON_KEY || '').trim(),
    mapboxToken: (env.MAPBOX_ACCESS_TOKEN || '').trim(),

    // Map identity: one Mapbox Standard style, themed at runtime via
    // setConfigProperty (no style reload on theme toggle).
    mapStyleUrl: 'mapbox://styles/mapbox/standard',
    mapTheme: 'monochrome',                    // muted, editorial basemap
    mapLightPreset: { light: 'day', dark: 'night' },

    londonCenter: { lat: 51.5072, lon: -0.1276 },
  };

  if (!window.__CUMULUS_ENV__) {
    console.warn(
      '[Cumulus] src/js/env.js not found - running without backend credentials.\n' +
      '  Fix: copy .env.example to .env, fill in values, then run:  node scripts/build-env.mjs'
    );
  }

  return Object.freeze(cfg);
})();

/* Compatibility globals - the codebase predates the config layer and reads
   these directly. New code should read CONFIG.* instead. */
let MAPBOX_TOKEN = CONFIG.mapboxToken;
function mapboxConfigured() { return !!(MAPBOX_TOKEN && MAPBOX_TOKEN.trim()); }
function mapboxStyleUrl() { return CONFIG.mapStyleUrl; }
