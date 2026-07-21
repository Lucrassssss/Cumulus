/* Blueprint B2B2C flywheel: "The One-Click Blast — hosts click 'Invite Past
 * Attendees' for a new event. The backend triggers a clean, Cumulus-branded
 * email template via Resend to their entire past audience, driving them
 * back to the Cumulus map."
 *
 * The recipient list is re-derived server-side from
 * get_past_attendee_emails() (SECURITY DEFINER, checks the caller IS the
 * host) — the client only ever says "promote this event", never supplies
 * or can influence who gets emailed.
 *
 * verify_jwt = true.
 * DEPLOYED but NOT MONEY/DELIVERY-TESTED — see create-checkout-session's
 * header for the same "no live credentials in this sandbox" caveat; this
 * one also needs RESEND_API_KEY (already configured, per email-ticket and
 * notify-admin-new-event already using it) and a verified sending domain
 * to reach anyone other than the Resend account owner. */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Not authenticated" }, 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad JSON body" }, 400);
  }
  const eventId = body?.eventId;
  if (!eventId) return json({ error: "Missing eventId" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  // Caller's own JWT for both calls below — get_past_attendee_emails() and
  // the events read are both fine under the caller's own session (RLS on
  // events is public-read; the RPC checks auth.uid() = the host itself).
  const callerHeaders = {
    apikey: anonKey!,
    Authorization: authHeader,
    "Content-Type": "application/json",
  };

  try {
    const evRes = await fetch(
      `${supabaseUrl}/rest/v1/events?id=eq.${eventId}&select=id,title,host_id,start_time,venue,area`,
      { headers: callerHeaders },
    );
    const evRows = await evRes.json();
    const ev = evRows?.[0];
    if (!ev) return json({ error: "Event not found" }, 404);

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_past_attendee_emails`, {
      method: "POST",
      headers: callerHeaders,
      body: JSON.stringify({}), // defaults p_host_id to auth.uid() — this IS the authorization check
    });
    if (!rpcRes.ok) {
      const errBody = await rpcRes.text();
      // 42501 (forbidden) from the RPC means this caller isn't the host —
      // surface that plainly rather than a generic 500.
      return json({ error: `Not authorized to invite for this event: ${errBody}` }, 403);
    }
    const attendees: { email: string; display_name: string }[] = await rpcRes.json();
    if (!attendees.length) {
      return json({ ok: true, sent: 0, note: "No past attendees to invite yet" });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "RESEND_API_KEY not set" }, 500);

    const when = ev.start_time
      ? new Date(ev.start_time).toLocaleString("en-GB", {
          timeZone: "Europe/London",
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Details on the app";
    const eventUrl = `https://cumulusapp.co/?event=${encodeURIComponent(eventId)}`;

    const html = (name: string) => `
      <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:480px;">
        <h2 style="margin:0 0 12px;">You're invited back 👋</h2>
        <p style="color:#333;font-size:14px;">Hey ${escapeHtml(name || "there")} — the host of an event you went to on Cumulus just put on something new:</p>
        <div style="background:#f7f6f2;border-radius:12px;padding:16px;margin:16px 0;">
          <div style="font-weight:700;font-size:16px;">${escapeHtml(ev.title)}</div>
          <div style="color:#666;font-size:13px;margin-top:4px;">${when}${ev.venue ? ` · ${escapeHtml(ev.venue)}` : ""}${ev.area ? `, ${escapeHtml(ev.area)}` : ""}</div>
        </div>
        <a href="${eventUrl}" style="display:inline-block;background:#c08a00;color:#0a0a0a;text-decoration:none;font-weight:700;padding:11px 24px;border-radius:999px;font-size:14px;">View on Cumulus →</a>
        <p style="color:#999;font-size:11px;margin-top:24px;">You're getting this because you've attended an event from this host before on Cumulus.</p>
      </div>`;

    // Resend's batch endpoint — one HTTP call for the whole list rather
    // than looping a request per recipient.
    const batch = attendees.map((a) => ({
      from: "Cumulus <onboarding@resend.dev>",
      to: [a.email],
      subject: `${ev.title} — from a host you've seen before`,
      html: html(a.display_name),
    }));

    const sendRes = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });
    const sendData = await sendRes.json();
    if (!sendRes.ok) {
      return json({ error: sendData?.message || "Resend error", data: sendData }, sendRes.status);
    }

    return json({ ok: true, sent: attendees.length });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
