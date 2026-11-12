/* Called by public.trg_notify_followers_new_event() (via pg_net) when a host
 * publishes a new event and at least one follower has notify=true on
 * host_follows. Server-to-server, no user JWT — trust is the
 * NOTIFY_WEBHOOK_SECRET bearer check, same as notify-admin-new-event
 * (verify_jwt = false in config.toml).
 *
 * Sends ONE email per follower (Resend batch API), never one email with
 * everyone in To/CC, so followers can't see each other's addresses.
 *
 * Delivery requirement: Resend's shared sender (onboarding@resend.dev) only
 * delivers to the Resend account owner. Set NOTIFY_FROM_EMAIL to an address
 * on a domain verified in Resend (e.g. "Cumulus <hello@cumulusapp.co>") for
 * these to reach followers. The in-app "New from hosts you follow" strip
 * works regardless. */

const APP_URL = (Deno.env.get("APP_URL") || "https://cumulusapp.co").replace(/\/$/, "");

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function fmtLondon(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "Europe/London",
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("NOTIFY_WEBHOOK_SECRET");
  const auth = req.headers.get("Authorization") || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secret || !provided || !safeEqual(provided, secret)) return json({ error: "Unauthorized" }, 401);

  let ev: Record<string, any>;
  try {
    ev = (await req.json())?.record;
    if (!ev?.id || !ev?.host_id) throw new Error("Missing record.id/host_id");
  } catch (err: any) {
    return json({ error: `Bad payload: ${err.message}` }, 400);
  }
  if (ev.status && ev.status !== "active") return json({ ok: true, skipped: "not active" });

  const SB_URL = Deno.env.get("SUPABASE_URL")!;
  const SR_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sbHeaders = { apikey: SR_KEY, Authorization: `Bearer ${SR_KEY}` };

  // Followers who asked to be notified (excluding the host themself).
  const fRes = await fetch(
    `${SB_URL}/rest/v1/host_follows?select=follower_id&notify=eq.true&host_id=eq.${encodeURIComponent(ev.host_id)}`,
    { headers: sbHeaders },
  );
  const follows: { follower_id: string }[] = fRes.ok ? await fRes.json() : [];
  const ids = [...new Set(follows.map((f) => f.follower_id).filter((id) => id !== ev.host_id))];
  if (!ids.length) return json({ ok: true, sent: 0 });

  const uRes = await fetch(
    `${SB_URL}/rest/v1/users?select=email,name&email_followed=eq.true&id=in.(${ids.map(encodeURIComponent).join(",")})`,
    { headers: sbHeaders },
  );
  const users: { email: string; name: string }[] = uRes.ok ? await uRes.json() : [];
  const recipients = users.filter((u) => u.email && /@/.test(u.email));
  if (!recipients.length) return json({ ok: true, sent: 0 });

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json({ error: "RESEND_API_KEY not set" }, 500);
  const from = Deno.env.get("NOTIFY_FROM_EMAIL") || "Cumulus <onboarding@resend.dev>";

  const host = ev.host_name || "A host you follow";
  const title = ev.title || "New event";
  const where = [ev.venue, ev.area].filter(Boolean).join(", ");
  const when = fmtLondon(ev.start_time);
  const price = ev.price != null && Number(ev.price) > 0 ? `From £${Number(ev.price).toFixed(2)}` : "Free";
  const link = `${APP_URL}/?event=${encodeURIComponent(ev.id)}`;

  const html = (name: string) => `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:520px;color:#0b0b0d;">
      <p style="margin:0 0 6px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#6d6b74;">New from ${escapeHtml(host)}</p>
      <h1 style="margin:0 0 14px;font-size:28px;line-height:1.05;letter-spacing:-.02em;">${escapeHtml(title)}</h1>
      <p style="margin:0 0 4px;font-size:15px;"><strong>${escapeHtml(when)}</strong></p>
      <p style="margin:0 0 4px;font-size:15px;color:#3b3a41;">${escapeHtml(where)}</p>
      <p style="margin:0 0 22px;font-size:15px;color:#3b3a41;">${escapeHtml(price)}</p>
      <a href="${link}" style="display:inline-block;background:#0b0b0d;color:#d4ff3f;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">View event →</a>
      <p style="margin:28px 0 0;font-size:12px;color:#6d6b74;">Hi ${escapeHtml(name || "there")} — you asked to hear when ${escapeHtml(host)} posts. Turn this off any time from their profile on Cumulus.</p>
    </div>`;

  let sent = 0;
  const errors: unknown[] = [];
  for (let i = 0; i < recipients.length; i += 100) {
    const batch = recipients.slice(i, i + 100).map((u) => ({
      from,
      to: [u.email],
      subject: `${host} just posted: ${title}`,
      html: html(u.name),
    }));
    try {
      const r = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) sent += batch.length;
      else errors.push(data);
    } catch (err: any) {
      errors.push(err.message);
    }
  }
  return json({ ok: errors.length === 0, sent, errors }, errors.length && !sent ? 502 : 200);
});
