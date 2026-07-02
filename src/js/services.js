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
 * Validation is format-first, then an optional Supabase lookup against a
 * `curator_codes` table; if that table doesn't exist yet or the network
 * is down, it returns `unverified:true` rather than failing, so the
 * caller (onboarding UI) can decide how strict to be. */
const CURATOR_CODE_RE = /^CUR-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

async function validateCuratorCode(rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!CURATOR_CODE_RE.test(code)) {
    return { valid: false, reason: 'format', code };
  }
  // Optional server check. The table may not exist yet — treat any failure
  // as "format valid but unverified" instead of throwing.
  try {
    const { data, error } = await sb
      .from('curator_codes')
      .select('code,curator_name,tier,active')
      .eq('code', code)
      .single();
    if (!error && data) {
      return {
        valid: !!data.active,
        reason: data.active ? 'ok' : 'inactive',
        code,
        curator: data.curator_name || null,
        tier: data.tier || 'standard',
      };
    }
  } catch (e) { /* offline / table absent — fall through to format-only */ }
  return { valid: true, reason: 'format-only', code, curator: null, tier: 'standard', unverified: true };
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
  const R = 6371000, toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* True when the user is within `radiusM` of the venue — the basis for a
 * geolocated check-in that unlocks perks without ever hiding the event. */
function canCheckInAt(userLatLon, venueLatLon, radiusM) {
  return distanceMeters(userLatLon, venueLatLon) <= (radiusM || 150);
}
