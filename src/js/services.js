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

/* Compresses (center-cropped to a square for an avatar — renders circular
 * everywhere, so a square source avoids a stretched preview; a wide crop
 * for a cover/banner) and uploads straight to the caller's own folder in
 * the avatars/covers bucket — same RLS-scoped-by-auth.uid() pattern as
 * uploadHostFlyer() (08-event-creator.js). No moderation gate: the
 * identity-verified host-onboarding flow (Twilio SMS OTP + Stripe Connect)
 * is this app's actual anti-abuse check, and public.event_reports handles
 * anything that slips through after the fact — see the migration that
 * reverted the earlier Google Cloud Vision SafeSearch detour. upsert:true
 * since each photo is a single slot per user, not a new file every time.
 * Returns { url } on success or { error } with a message safe to show. */
async function _uploadPhoto(file, kind) {
  if (!file || !state.userId) return { error: "Nothing to upload." };
  try {
    const square = kind === "avatar";
    const bucket = kind === "avatar" ? "avatars" : "covers";
    const blob = await compressImageFile(file, square ? 480 : 1280, 0.85, {
      square,
    });
    const path = `${state.userId}/${kind}.jpg`;
    const { error } = await sb.storage
      .from(bucket)
      .upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (error) return { error: "Couldn't upload that photo — try again." };
    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) {
      return { error: "Couldn't upload that photo — try again." };
    }
    // Cache-bust: same path every time (upsert), so the browser/CDN would
    // otherwise keep showing the old photo after a re-upload.
    return { url: `${data.publicUrl}?v=${Date.now()}` };
  } catch (e) {
    return { error: "Couldn't upload that photo — try again." };
  }
}
async function uploadAvatarPhoto(file) {
  return _uploadPhoto(file, "avatar");
}
async function uploadCoverPhoto(file) {
  return _uploadPhoto(file, "cover");
}

/* Real cross-user follow edges (public.host_follows) — replaces the old
 * localStorage-only "follow" bookmark, which lived on one device and could
 * never tell a host how many people actually follow them. */
async function followHost(hostId) {
  if (!hostId || !state.userId) return false;
  try {
    const { error } = await sb
      .from("host_follows")
      .insert({ follower_id: state.userId, host_id: hostId });
    return !error;
  } catch (e) {
    return false;
  }
}
async function unfollowHost(hostId) {
  if (!hostId || !state.userId) return false;
  try {
    const { error } = await sb
      .from("host_follows")
      .delete()
      .eq("follower_id", state.userId)
      .eq("host_id", hostId);
    return !error;
  } catch (e) {
    return false;
  }
}
/* Total follower count for a host's profile page — public, resolves for a
 * signed-out visitor too. "Am I following" is answered separately by the
 * synchronous isFollowingHost() cache (state.followedHostIds), not here. */
async function getHostFollowerCount(hostId) {
  if (!hostId) return 0;
  try {
    const res = await sb
      .from("host_follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("host_id", hostId);
    return res.count || 0;
  } catch (e) {
    return 0;
  }
}
/* Every host id the current user follows, loaded once (initApp()) so
 * isFollowingHost() can stay a synchronous cache read everywhere it's
 * used — the event-detail byline renders synchronously, so an async DB
 * call can't live inside that check. */
async function loadMyFollows() {
  if (!state.userId) return [];
  try {
    const { data, error } = await sb
      .from("host_follows")
      .select("host_id")
      .eq("follower_id", state.userId);
    if (error || !data) return [];
    return data.map((r) => r.host_id);
  } catch (e) {
    return [];
  }
}
/* Another user's public avatar, banner, and member-since date, for the
 * host profile page (public.public_profiles — never the private users
 * table directly). Null on error/offline/not-found. */
async function fetchHostProfileExtras(hostId) {
  if (!hostId) return null;
  try {
    const { data } = await sb
      .from("public_profiles")
      .select("avatar_url, cover_url, created_at")
      .eq("id", hostId)
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

/* Blueprint "Magic Link" flow: ONE shareable group link per purchase
 * (event_squads.id) rather than a code per ticket. Race-safe via
 * FOR UPDATE SKIP LOCKED (claim_group_ticket() in the migration) — grabs
 * whichever unclaimed seat in the group is still free. */
async function claimGroupTicket(squadId) {
  try {
    const { data, error } = await sb.rpc("claim_group_ticket", {
      p_squad_id: squadId,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: "unavailable" };
  }
}

/* The caller's most recent host_applications status ("pending"/"approved"/
 * "rejected"), or null if they've never applied. Drives whether Profile
 * shows "Become a host" vs "Application pending" — the Host tab itself is
 * gated on the verified-host special_badges entry (set server-side on
 * approval), not on this value directly. */
async function getMyHostApplicationStatus(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await sb
      .from("host_applications")
      .select("status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data && data.status) || null;
  } catch (e) {
    return null;
  }
}

/* A host's own past-attendee emails (deduped across every event they've
 * hosted), for the "Invite Past Attendees" one-click blast. */
async function getPastAttendeeEmails() {
  try {
    const { data, error } = await sb.rpc("get_past_attendee_emails");
    if (error) return null;
    return data || [];
  } catch (e) {
    return null;
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
      .select(
        "ticket_id,purchaser_name,seat_num,total_seats,ticket_type,type_label,status,purchased_at,squad_id",
      )
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

/* Checks in the next still-active ticket in a squad via the master "Valid
 * for N Entries" QR — check_in_squad_ticket() picks whichever unchecked
 * seat is free (FOR UPDATE SKIP LOCKED) and reports how many remain. */
async function checkInSquadTicket(squadId) {
  try {
    const { data, error } = await sb.rpc("check_in_squad_ticket", {
      p_squad_id: squadId,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: "unavailable" };
  }
}

/* How many of this event's attendees have also been to a past event by the
 * same host — the "Repeat Attendees" loyalty stat. Null on error/offline. */
async function getRepeatAttendeeCount(eventId) {
  try {
    const { data, error } = await sb.rpc("get_repeat_attendee_count", {
      p_event_id: eventId,
    });
    if (error) return null;
    return data;
  } catch (e) {
    return null;
  }
}

/* ── Stripe Connect scaffolding ─────────────────────────────────────────
 * NOT LIVE-TESTED — see create-checkout-session's own header comment. These
 * are thin wrappers; all the real logic (price computed server-side, JWT
 * checked by the gateway, Stripe calls) lives in the edge functions
 * themselves, same division of responsibility as the rest of this file. */

/* Creates a real Stripe PaymentIntent for a paid event and returns its
 * client_secret for startStripeCheckout() (10-badges.js) to mount a Payment
 * Element against. Free events never call this — registerFree() (app.js)
 * handles those with no Stripe involvement at all. */
async function createCheckoutSession(eventId, qty, marketingOptIn) {
  try {
    const { data, error } = await sb.functions.invoke("create-checkout-session", {
      body: {
        eventId,
        qty,
        marketingOptIn: !!marketingOptIn,
      },
    });
    if (error) {
      // supabase-js's FunctionsHttpError.message is always the generic
      // "Edge Function returned a non-2xx status code" — the actual error
      // text our function sent back (e.g. a real Stripe rejection message)
      // only lives on error.context, the raw Response object. Without this,
      // every real failure looks identical from the UI no matter what
      // actually went wrong server-side.
      let detail = null;
      try {
        const body = await error.context?.json();
        detail = body?.error;
      } catch (_) {}
      return { error: detail || error.message || "Could not start checkout" };
    }
    return data;
  } catch (e) {
    return { error: "unavailable" };
  }
}

/* Fetches the tickets a just-completed PaymentIntent created, for the
 * confirmation screen — polled by finalizeStripePayment() (10-badges.js)
 * since stripe-webhook creates these rows asynchronously. Relies on
 * tickets_buyer_read RLS (user_id = auth.uid()) — this never needs a
 * service-role key client-side. */
async function fetchTicketsByPaymentIntent(paymentIntentId) {
  try {
    const { data, error } = await sb
      .from("tickets")
      .select("*")
      .eq("stripe_payment_intent_id", paymentIntentId);
    if (error) return null;
    return data || [];
  } catch (e) {
    return null;
  }
}

/* The caller's own Connect account status, for the payouts panel's
 * connect/pending/connected display. Null on error/offline — same
 * degrade-gracefully contract as every other function in this file, so a
 * blocked/unconfigured Supabase client never breaks rendering. */
async function fetchMyConnectStatus(userId) {
  if (typeof sb === "undefined" || !userId) return null;
  try {
    const { data, error } = await sb
      .from("users")
      .select(
        "stripe_connect_account_id,stripe_connect_charges_enabled,stripe_connect_payouts_enabled",
      )
      .eq("id", userId)
      .single();
    if (error) return null;
    return data || null;
  } catch (e) {
    return null;
  }
}

/* Starts (or resumes) Stripe Connect Express onboarding for the calling
 * host and returns a one-time hosted URL to redirect to. */
async function startConnectOnboarding() {
  try {
    const { data, error } = await sb.functions.invoke("connect-onboarding", {
      body: { origin: location.origin },
    });
    if (error) return { error: error.message || "Could not start onboarding" };
    return data;
  } catch (e) {
    return { error: "unavailable" };
  }
}

/* Asks release-payout to check for (and actually move) any of the caller's
 * own due payouts. Safe to call from the payouts panel — no-ops if nothing
 * is due yet or the host hasn't finished Connect onboarding. */
async function checkMyPayoutReleases() {
  try {
    const { data, error } = await sb.functions.invoke("release-payout", { body: {} });
    if (error) return { error: error.message || "unavailable" };
    return data;
  } catch (e) {
    return { error: "unavailable" };
  }
}

/* Generalised Squad-claim-code mechanism (see start_ticket_transfer() in the
 * migration): puts a fresh, unclaimed code on a ticket the caller owns, for
 * a self-serve "transfer this ticket to someone else" share link. */
async function startTicketTransfer(ticketCode) {
  try {
    const { data, error } = await sb.rpc("start_ticket_transfer", {
      p_ticket_code: ticketCode,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: "unavailable" };
  }
}

/* Host/admin: cancels an event and refunds every active ticket's Stripe
 * payment intent. See cancel-event-refund's own header for the ordering
 * guarantee (refunds attempted before DB state claims "refunded"). */
async function cancelEventRefund(eventId) {
  try {
    const { data, error } = await sb.functions.invoke("cancel-event-refund", {
      body: { eventId },
    });
    if (error) return { ok: false, error: error.message || "Could not cancel event" };
    return data;
  } catch (e) {
    return { ok: false, error: "unavailable" };
  }
}

/* Blueprint B2B2C flywheel: "Invite Past Attendees" one-click blast. Server
 * re-derives the recipient list itself from get_past_attendee_emails() —
 * the client only tells it which new event to promote. */
async function invitePastAttendees(eventId) {
  try {
    const { data, error } = await sb.functions.invoke("invite-past-attendees", {
      body: { eventId },
    });
    if (error) return { ok: false, error: error.message || "Could not send invites" };
    return data;
  } catch (e) {
    return { ok: false, error: "unavailable" };
  }
}

/* Community-driven moderation — flags an event as unsuitable. One row per
 * (reporter, event) in public.event_reports; the primary key alone blocks
 * a user reporting the same event twice, so a 23505 conflict here just
 * means "already reported", not a real failure. A DB trigger
 * (handle_event_report()) auto-hides the event once 3 different people
 * have reported it, pending admin review — see the migration that
 * replaced per-upload AI moderation with this. */
async function reportEvent(eventId, reason) {
  if (!eventId || !state.userId) {
    return { ok: false, error: "Sign in to report an event." };
  }
  try {
    const { error } = await sb.from("event_reports").insert({
      reporter_id: state.userId,
      event_id: eventId,
      reason: reason || null,
    });
    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "You've already reported this event." };
      }
      return { ok: false, error: "Couldn't submit your report — try again." };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Couldn't submit your report — try again." };
  }
}
