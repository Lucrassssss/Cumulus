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

/* ── Admin auth (option B — real server-side boundary) ─────────
 * Owner-only. Supabase Auth email OTP yields a JWT; RLS then enforces
 * admin-only reads/writes on pending_events via is_admin().
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

/* Am I signed in as a real, server-verified partner_host? Used to gate the
 * host scanner route — the actual security boundary is RLS on tickets/events
 * (host_id = auth.uid()), this just decides whether to show the entry point. */
async function currentUserRole() {
  try {
    const { data, error } = await sb.rpc("app_role");
    if (error) return "eventee";
    return data || "eventee";
  } catch (e) {
    return "eventee";
  }
}

/* ── PostGIS GeoJSON bounding-box fetch ────────────────────────────────────
 * Calls the `get_events_geojson` Postgres RPC, which returns a micro-payload
 * FeatureCollection (id/category/start_time per pin only — full details are
 * fetched on tap via fetchEventDetails()). Called via GET (not supabase-js's
 * default POST for .rpc()) so the RPC's own `response.headers` Cache-Control
 * setting can actually be honoured by Supabase's edge — a POST body can't be
 * cached the same way. Falls back to the local buildEventsGeoJSON() (app.js)
 * on error/offline, same as before.
 *
 * Parameters come straight from lmap.getBounds() in app.js.
 * Returns null on error/offline so the caller can keep its current data.      */
async function fetchEventsGeoJSON({ min_lng, min_lat, max_lng, max_lat }) {
  if (typeof sb === "undefined") return null;
  try {
    const { data, error } = await sb.rpc(
      "get_events_geojson",
      { min_lng, min_lat, max_lng, max_lat },
      { get: true },
    );
    if (error) {
      return null;
    }
    return data; // Already a GeoJSON FeatureCollection object (jsonb → JS object)
  } catch (e) {
    return null;
  }
}

/* Full event row, fetched only when a specific pin/card is opened — the map
 * itself only ever holds the micro-payload above. */
async function fetchEventDetails(id) {
  if (typeof sb === "undefined" || !id) return null;
  try {
    const { data, error } = await sb.rpc("get_event_details", { p_id: id });
    if (error || !data) return null;
    return Array.isArray(data) ? data[0] || null : data;
  } catch (e) {
    return null;
  }
}

/* Claims a Squad ticket share link. Race-safe server-side (see claim_ticket()
 * in the migration) — reassigns the ticket to whoever's session calls this. */
async function claimTicket(code) {
  try {
    const { data, error } = await sb.rpc("claim_ticket", { p_code: code });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: "unavailable" };
  }
}

/* A host's payout rows — get_host_payouts() also lazily flips any row whose
 * scheduled_release_at has passed to 'released' before returning. */
async function fetchHostPayouts() {
  try {
    const { data, error } = await sb.rpc("get_host_payouts");
    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
}

/* Fetches the guestlist for one of the caller's own events. RLS
 * (tickets_host_read) only returns rows for events the caller hosts, so an
 * empty/error result here just means "not your event" rather than needing
 * a separate authorisation check client-side. */
async function fetchGuestlist(eventId) {
  try {
    const { data, error } = await sb
      .from("tickets")
      .select("ticket_id,purchaser_name,seat_num,total_seats,ticket_type,type_label,status")
      .eq("event_id", eventId);
    if (error) return null;
    return data || [];
  } catch (e) {
    return null;
  }
}

/* Marks one ticket checked-in via the check_in_ticket() RPC, which verifies
 * server-side that the caller actually hosts that ticket's event. */
async function checkInTicket(ticketId) {
  try {
    const { data, error } = await sb.rpc("check_in_ticket", { p_ticket_id: ticketId });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: "unavailable" };
  }
}
