/* Called by a signed-in member from the confirmation/My Tickets screen
 * (see emailMyTicket() in app.js) to email themselves a backup copy of a
 * ticket — the real fallback while Apple/Google Wallet passes are still a
 * "Coming soon" button (no wallet-pass signing credentials exist for this
 * project yet). verify_jwt = true in config.toml, so the gateway has
 * already rejected a missing/expired/invalid session before this runs.
 *
 * The QR image is generated client-side (the app already renders it onto
 * the confirmation screen with the same QRCode library) and sent here as a
 * data URL, then re-attached as a real email attachment rather than an
 * inline data: URI <img> — most mail clients (Gmail, Outlook) strip or
 * refuse to render data: URIs inline, so an attachment is the only
 * reliable way to get the QR into the recipient's inbox. */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Bad JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const {
    recipientEmail,
    ticketId,
    eventTitle,
    eventDate,
    venue,
    qrDataUrl,
  } = body || {};

  if (!recipientEmail || !ticketId || !eventTitle || !qrDataUrl) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Strip the "data:image/png;base64," prefix — Resend wants raw base64.
  const base64Match = /^data:image\/(png|jpeg);base64,(.+)$/.exec(qrDataUrl);
  if (!base64Match) {
    return new Response(JSON.stringify({ error: "Invalid QR image data" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  const qrBase64 = base64Match[2];

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:480px;">
      <h2 style="margin:0 0 12px;">Your Cumulus ticket</h2>
      <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Event</td><td><strong>${escapeHtml(eventTitle)}</strong></td></tr>
        ${eventDate ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">When</td><td>${escapeHtml(eventDate)}</td></tr>` : ""}
        ${venue ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Venue</td><td>${escapeHtml(venue)}</td></tr>` : ""}
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Ticket</td><td style="font-family:monospace;">${escapeHtml(ticketId)}</td></tr>
      </table>
      <p style="color:#666;font-size:13px;">Your QR code is attached — show it at the door, or open the app any time from My Tickets.</p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cumulus Tickets <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `Your ticket: ${eventTitle}`,
        html,
        attachments: [
          {
            filename: `${ticketId}.png`,
            content: qrBase64,
          },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data?.message || "Resend error", data }),
        { status: res.status, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
