/* ─────────────────────────────────────────────────────────────
 * Cumulus — services layer (data access + business logic)
 *
 * This is the seam between the UI (app.js) and the backend (Supabase).
 * It is a **classic deferred script**, exactly like config.js and app.js,
 * so its top-level declarations stay on the shared global scope — the
 * inline-onclick contract the whole app depends on keeps working, and
 * app.js can call these functions directly.
 *
 * Load order (see index.html): supabase CDN → config.js (defines `sb`)
 * → services.js (this file) → app.js. Everything here references `sb`
 * only at call-time, never at parse-time, so it is safe even when the
 * Supabase CDN is unreachable.
 *
 * Design rules:
 *   • Pure where possible — no DOM, no rendering. The UI decides what to
 *     show; these functions just answer questions and move data.
 *   • Degrade gracefully — a missing table or offline network returns a
 *     structured result, never an unhandled throw.
 * ───────────────────────────────────────────────────────────── */

/* ── Curator / referral codes ──────────────────────────────────
 * A curator code is issued by a venue or host and unlocks *perks*
 * (guestlists, complimentary drinks) for the bearer. This is the
 * validation entry point. Format: CUR-XXXX-XXXX.
 * Validation is format-first, then a server check via the SECURITY DEFINER
 * RPC `validate_curator_code` (so the `curator_codes` table is never exposed
 * to the anon key). If that function doesn't exist yet or the network is down,
 * it returns `unverified:true` rather than failing, so the caller (onboarding
 * UI) can decide how strict to be. See supabase/migrations/. */
const CURATOR_CODE_RE = /^CUR-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

async function validateCuratorCode(rawCode) {
  const code = (rawCode || "").trim().toUpperCase();
  if (!CURATOR_CODE_RE.test(code)) {
    return { valid: false, reason: "format", code };
  }
  // Server check via a SECURITY DEFINER RPC so the `curator_codes` table is
  // NOT exposed to the anon key (no dumping valid codes). The function returns
  // the curator row only for an active code, and nothing otherwise.
  //   • rows returned  → valid
  //   • ran, no rows   → unknown/inactive code → reject
  //   • call errored (function absent / offline) → lenient format-only fallback
  try {
    const { data, error } = await sb.rpc("validate_curator_code", {
      p_code: code,
    });
    if (!error && data !== null && data !== undefined) {
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        return {
          valid: true,
          reason: "ok",
          code,
          curator: row.curator_name || null,
          tier: row.tier || "standard",
        };
      }
      return { valid: false, reason: "unknown", code };
    }
  } catch (e) {
    /* offline / function absent — fall through to format-only */
  }
  return {
    valid: true,
    reason: "format-only",
    code,
    curator: null,
    tier: "standard",
    unverified: true,
  };
}

/* ── Perk gating (WCAG-safe by construction) ───────────────────
 * Event pins and details are ALWAYS visible — nothing here hides content.
 * Only *perks* are gated: a reward stays locked until the user proves
 * access, either with a validated curator code or a geolocated check-in
 * at the venue. These are pure predicates; the UI calls them to decide
 * whether to show a perk as unlocked. */
function isPerkUnlocked(state) {
  const s = state || {};
  return !!(s.curatorVerified || s.checkedInEventId);
}

/* Great-circle distance in metres between two {lat, lon} points. */
function distanceMeters(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371000,
    toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat),
    dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* True when the user is within `radiusM` of the venue — the basis for a
 * geolocated check-in that unlocks perks without ever hiding the event. */
function canCheckInAt(userLatLon, venueLatLon, radiusM) {
  return distanceMeters(userLatLon, venueLatLon) <= (radiusM || 150);
}

/* ── Admin auth (option B — real server-side boundary) ─────────
 * Owner-only. Supabase Auth email OTP yields a JWT; RLS then enforces
 * admin-only reads/writes on pending_events and curator_codes via is_admin().
 * The owner must be listed in public.admins (see the migration). Everything
 * degrades gracefully if Auth isn't configured yet, so the app still runs. */
async function adminSendCode(email) {
  try {
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { ok: !error, error: error ? error.message : null };
  } catch (e) {
    return { ok: false, error: "unavailable" };
  }
}
async function adminVerifyCode(email, token) {
  try {
    const { error } = await sb.auth.verifyOtp({ email, token, type: "email" });
    if (error) return { ok: false, error: error.message };
    return { ok: true, isAdmin: await isAdminSession() };
  } catch (e) {
    return { ok: false, error: "unavailable" };
  }
}
/* Is the CURRENT Supabase Auth session an admin? RLS-backed, so it can't be
 * spoofed client-side. Returns false when unauthenticated or unconfigured. */
async function isAdminSession() {
  try {
    const { data, error } = await sb.rpc("is_admin");
    if (!error) return !!data;
  } catch (e) {}
  return false;
}

/* ── Member auth (Phase 2 — everyone signs in via Supabase Auth) ────────────
 * Email one-time-code (OTP): authSendCode() mails a 6-digit code and creates
 * the auth.users row on first use (a DB trigger mirrors it into public.users);
 * authVerifyCode() exchanges the code for a real session (JWT). RLS then keys
 * every read/write off that session's auth.uid(). All degrade to a structured
 * error rather than throwing, so a blocked/unconfigured backend never crashes
 * the gate. `meta` (e.g. { name }) rides along as user_metadata for the trigger. */
async function authSendCode(email, meta) {
  try {
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: meta || {} },
    });
    return { ok: !error, error: error ? error.message : null };
  } catch (e) {
    return { ok: false, error: "unavailable" };
  }
}
async function authVerifyCode(email, token) {
  try {
    const { data, error } = await sb.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, userId: (data && data.user && data.user.id) || null };
  } catch (e) {
    return { ok: false, error: "unavailable" };
  }
}
/* The current signed-in auth user (or null). Reads the persisted session, so it
 * works offline until the stored token expires. */
async function authCurrentUser() {
  try {
    const { data } = await sb.auth.getSession();
    return (data && data.session && data.session.user) || null;
  } catch (e) {
    return null;
  }
}
/* Load a member's profile row (public.users) by id. Null on error/offline. */
async function loadUserProfile(userId) {
  if (!userId) return null;
  try {
    const { data } = await sb
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    return data || null;
  } catch (e) {
    return null;
  }
}

async function getHostingProgress() {
  const user = await authCurrentUser();
  if (!user)
    return {
      eligible: false,
      ageVerified: false,
      eventsCheckedIn: 0,
      eventsRequired: 3,
      connections: 0,
      connectionsRequired: 3,
    };

  try {
    const { data, error } = await sb.rpc("get_hosting_progress");
    if (error) throw error;

    return {
      ageVerified: data.ageVerified,
      eventsCheckedIn: data.eventsCheckedIn,
      eventsRequired: data.eventsRequired,
      connections: data.connections,
      connectionsRequired: data.connectionsRequired,
      role: data.role || "eventee",
      eligible: data.eligible,
    };
  } catch (e) {
    return {
      eligible: false,
      ageVerified: false,
      eventsCheckedIn: 0,
      eventsRequired: 3,
      connections: 0,
      connectionsRequired: 3,
      role: "eventee",
    };
  }
}

/* ── PostGIS GeoJSON bounding-box fetch ────────────────────────────────────
 * Calls the `get_events_geojson` Postgres RPC which builds a fully-formed
 * GeoJSON FeatureCollection server-side. This offloads JSON serialisation
 * from the mobile device to Postgres and filters to only the visible map
 * viewport, avoiding the cost of fetching + mapping the entire events table.
 *
 * Parameters come straight from lmap.getBounds() in app.js.
 * Returns null on error/offline so the caller can keep its current data.      */
async function fetchEventsGeoJSON({ min_lng, min_lat, max_lng, max_lat }) {
  if (typeof sb === "undefined") return null;
  try {
    const { data, error } = await sb.rpc("get_events_geojson", {
      min_lng,
      min_lat,
      max_lng,
      max_lat,
    });
    if (error) {
      return null;
    }
    return data; // Already a GeoJSON FeatureCollection object (jsonb → JS object)
  } catch (e) {
    return null;
  }
}
