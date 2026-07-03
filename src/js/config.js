/* ─────────────────────────────────────────────────────────────
 * Cumulus — runtime configuration
 *
 * IMPORTANT (read before "hiding" these):
 *   This is a static, client-only PWA. Anything the browser runs is shipped
 *   to the browser — there is no server or build step to hide values behind.
 *   The keys below are the PUBLISHABLE ones and are safe to expose:
 *     • SUPABASE_ANON_KEY  → public anon key; access is gated by Supabase
 *       Row Level Security (RLS), NOT by keeping this secret.
 *     • MAPBOX_TOKEN       → public token; restrict it by URL in the Mapbox
 *       dashboard.
 *   NEVER put a Supabase service_role key or any private secret in this file.
 *
 * To override per-environment (e.g. a future build step or a gitignored
 * config.local.js loaded before this file), set window.CUMULUS_CONFIG first.
 * See .env.example.
 * ───────────────────────────────────────────────────────────── */
window.CUMULUS_CONFIG = Object.assign({
  SUPABASE_URL:      'https://xyzrvgbdnevllwvxqcka.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5enJ2Z2JkbmV2bGx3dnhxY2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NDM0NTAsImV4cCI6MjA5NzQxOTQ1MH0.jfSmMobPUV1tTg2cmyAvTGuRmAyd9C5r-pooMVpSV6E',
  MAPBOX_TOKEN:      'pk.eyJ1IjoibHVjcmFzc3Nzc3MiLCJhIjoiY21xam1pcTJ4MGt0dTJzcXhobnQyZ3owMiJ9.RpRNYuS-zJnNdZ3wOGl61g'
}, window.CUMULUS_CONFIG || {});

const SUPABASE_URL      = window.CUMULUS_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.CUMULUS_CONFIG.SUPABASE_ANON_KEY;
export const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
