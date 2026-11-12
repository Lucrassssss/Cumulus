/* Self-serve "Delete my account" (UK GDPR Art. 17 right to erasure).
 *
 * verify_jwt = true: the caller is identified from their own session token
 * (GET /auth/v1/user), never from the request body.
 *
 * Refuses, with a reason the app shows, when:
 *  - they hold tickets for an upcoming event ("upcoming") — cancel or
 *    transfer first, so nobody loses a paid ticket by accident;
 *  - they have ever hosted ("host") — payout and tax records have to be
 *    kept, so hosts close their account via support.
 *
 * Otherwise deletes public.users (cascades RSVPs, check-ins, waitlist,
 * host applications; past tickets keep the row with user_id set NULL so
 * hosts' sales history stays intact but anonymous) and then the auth user
 * (cascades follows, saved events, reports, sessions). */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SB_URL = Deno.env.get("SUPABASE_URL")!;
  const SR_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY") || SR_KEY;
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Not signed in" }, 401);

  const who = await fetch(`${SB_URL}/auth/v1/user`, { headers: { Authorization: auth, apikey: ANON } });
  if (!who.ok) return json({ error: "Not signed in" }, 401);
  const uid: string = (await who.json())?.id;
  if (!uid) return json({ error: "Not signed in" }, 401);

  const h = { apikey: SR_KEY, Authorization: `Bearer ${SR_KEY}`, "Content-Type": "application/json" };

  const hosted = await fetch(`${SB_URL}/rest/v1/events?select=id&host_id=eq.${uid}&limit=1`, { headers: h });
  if (hosted.ok && (await hosted.json()).length)
    return json({ ok: false, reason: "host", error: "Hosts close their account through support so payout records are kept." }, 409);

  const tRes = await fetch(
    `${SB_URL}/rest/v1/tickets?select=event_id&status=eq.active&or=(user_id.eq.${uid},claimed_by.eq.${uid})`,
    { headers: h },
  );
  const evIds = [...new Set(((tRes.ok ? await tRes.json() : []) as any[]).map((t) => t.event_id))];
  if (evIds.length) {
    const eRes = await fetch(
      `${SB_URL}/rest/v1/events?select=id&status=eq.active&start_time=gt.${encodeURIComponent(new Date().toISOString())}&id=in.(${evIds.join(",")})`,
      { headers: h },
    );
    const upcoming = eRes.ok ? (await eRes.json()).length : 0;
    if (upcoming)
      return json({
        ok: false,
        reason: "upcoming",
        count: upcoming,
        error: `You've got tickets for ${upcoming} upcoming event${upcoming === 1 ? "" : "s"} — cancel or transfer ${upcoming === 1 ? "it" : "them"} first.`,
      }, 409);
  }

  const delProfile = await fetch(`${SB_URL}/rest/v1/users?id=eq.${uid}`, { method: "DELETE", headers: { ...h, Prefer: "return=minimal" } });
  if (!delProfile.ok) return json({ ok: false, error: "Couldn't delete your profile — contact support." }, 500);

  const delAuth = await fetch(`${SB_URL}/auth/v1/admin/users/${uid}`, { method: "DELETE", headers: h });
  if (!delAuth.ok) return json({ ok: false, error: "Profile removed, but sign-in couldn't be closed — contact support." }, 500);

  return json({ ok: true });
});
