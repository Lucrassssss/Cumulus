/* Called by the public.trg_notify_admin_new_event() Postgres trigger (via
 * pg_net) whenever a host submits a new event into pending_events. There is
 * no signed-in member behind this request — it's server-to-server, exactly
 * like identity-webhook — so trust is established by comparing the
 * Authorization header against NOTIFY_WEBHOOK_SECRET rather than a user JWT
 * (see verify_jwt = false in config.toml). */

const PROJECT_REF = "xyzrvgbdnevllwvxqcka";

// Constant-time compare so a mismatched secret can't be timed byte-by-byte.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function studioSqlLink(sql: string): string {
  return `https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new?content=${encodeURIComponent(sql)}`;
}

function fmtLondon(iso: string | null): string {
  if (!iso) return "Not set";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "Europe/London",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const webhookSecret = Deno.env.get("NOTIFY_WEBHOOK_SECRET");
  const authHeader = req.headers.get("Authorization") || "";
  const provided = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";
  if (!webhookSecret || !provided || !safeEqual(provided, webhookSecret)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let record: Record<string, any>;
  try {
    const body = await req.json();
    record = body?.record;
    if (!record?.id) throw new Error("Missing record.id");
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Bad payload: ${err.message}` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const id = record.id as string;
  const reviewSql = `select * from pending_events where id = '${id}';`;
  const approveSql = `update pending_events set status = 'approved' where id = '${id}';`;
  const rejectSql = `update pending_events set status = 'rejected' where id = '${id}';`;

  const title = record.title || "(untitled event)";
  const host = record.host_name || "(unknown host)";
  const venue = [record.venue, record.area].filter(Boolean).join(", ") || "—";
  const category = record.category || "—";
  const price =
    record.price != null && Number(record.price) > 0
      ? `£${Number(record.price).toFixed(2)}`
      : "Free";
  const starts = fmtLondon(record.start_time);

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:520px;">
      <h2 style="margin:0 0 12px;">New event awaiting review</h2>
      <table style="border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Event</td><td><strong>${escapeHtml(title)}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Host</td><td>${escapeHtml(host)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Category</td><td>${escapeHtml(category)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Venue</td><td>${escapeHtml(venue)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Starts</td><td>${escapeHtml(starts)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Price</td><td>${escapeHtml(price)}</td></tr>
      </table>
      <p style="margin:20px 0 8px;color:#666;font-size:13px;">
        These links open Supabase's SQL editor pre-filled with the statement —
        review it, then click Run to confirm.
      </p>
      <p style="margin:0;">
        <a href="${studioSqlLink(reviewSql)}" style="margin-right:16px;">Review row</a>
        <a href="${studioSqlLink(approveSql)}" style="margin-right:16px;color:#147136;">Approve</a>
        <a href="${studioSqlLink(rejectSql)}" style="color:#b3261e;">Reject</a>
      </p>
    </div>`;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const adminEmail = Deno.env.get("ADMIN_NOTIFY_EMAIL");
  if (!resendKey || !adminEmail) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY or ADMIN_NOTIFY_EMAIL not set" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Resend's shared sandbox sender — works with zero DNS setup.
        // Swap for a verified sending domain once one exists, e.g.
        // "Cumulus Admin <notifications@cumulusapp.co>".
        from: "Cumulus Admin <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `New event pending review: ${title}`,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data?.message || "Resend error", data }),
        { status: res.status, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
