/* Hourly (pg_cron → pg_net, see migration 20261112000000) "it's tomorrow"
 * reminder: every active ticket whose event starts 20–26 hours from now and
 * hasn't been reminded yet gets ONE email per holder per event, then
 * tickets.reminded_at is stamped so the next hourly run skips it.
 *
 * Server-to-server: trust is the NOTIFY_WEBHOOK_SECRET bearer, same as
 * notify-followers-new-event (verify_jwt = false in config.toml). Delivery
 * needs NOTIFY_FROM_EMAIL on a Resend-verified domain — until then Resend
 * only delivers to the account owner. The in-app "Up next" card on Discover
 * covers the same moment regardless. */

const APP_URL = (Deno.env.get("APP_URL") || "https://cumulusapp.co").replace(/\/$/, "");

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}
function esc(s: string): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
function fmtLondon(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "Europe/London",
      weekday: "long",
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

  const SB_URL = Deno.env.get("SUPABASE_URL")!;
  const SR_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const h = { apikey: SR_KEY, Authorization: `Bearer ${SR_KEY}`, "Content-Type": "application/json" };

  const from = new Date(Date.now() + 20 * 3600e3).toISOString();
  const to = new Date(Date.now() + 26 * 3600e3).toISOString();
  const evRes = await fetch(
    `${SB_URL}/rest/v1/events?select=id,title,venue,area,address,start_time&status=eq.active` +
      `&start_time=gte.${encodeURIComponent(from)}&start_time=lt.${encodeURIComponent(to)}`,
    { headers: h },
  );
  const events: any[] = evRes.ok ? await evRes.json() : [];
  if (!events.length) return json({ ok: true, events: 0, sent: 0 });

  const tRes = await fetch(
    `${SB_URL}/rest/v1/tickets?select=id,event_id,user_id,claimed_by&status=eq.active&reminded_at=is.null` +
      `&event_id=in.(${events.map((e) => e.id).join(",")})`,
    { headers: h },
  );
  const tickets: any[] = tRes.ok ? await tRes.json() : [];
  if (!tickets.length) return json({ ok: true, events: events.length, sent: 0 });

  // One email per (holder, event), however many seats they hold.
  const pairs = new Map<string, { userId: string; eventId: string; ticketIds: string[] }>();
  for (const t of tickets) {
    const uid = t.claimed_by || t.user_id;
    if (!uid) continue;
    const k = `${uid}:${t.event_id}`;
    if (!pairs.has(k)) pairs.set(k, { userId: uid, eventId: t.event_id, ticketIds: [] });
    pairs.get(k)!.ticketIds.push(t.id);
  }
  const userIds = [...new Set([...pairs.values()].map((p) => p.userId))];
  const uRes = await fetch(`${SB_URL}/rest/v1/users?select=id,email,name&id=in.(${userIds.join(",")})`, {
    headers: h,
  });
  const users = new Map<string, any>((uRes.ok ? await uRes.json() : []).map((u: any) => [u.id, u]));
  const evById = new Map(events.map((e) => [e.id, e]));

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json({ error: "RESEND_API_KEY not set" }, 500);
  const sender = Deno.env.get("NOTIFY_FROM_EMAIL") || "Cumulus <onboarding@resend.dev>";

  const jobs = [...pairs.values()].filter((p) => /@/.test(users.get(p.userId)?.email || ""));
  let sent = 0;
  const done: string[] = [];
  const errors: unknown[] = [];
  for (let i = 0; i < jobs.length; i += 100) {
    const chunk = jobs.slice(i, i + 100);
    const batch = chunk.map((p) => {
      const ev = evById.get(p.eventId)!;
      const u = users.get(p.userId)!;
      const where = [ev.venue, ev.area].filter(Boolean).join(", ");
      const link = `${APP_URL}/?event=${encodeURIComponent(ev.id)}`;
      return {
        from: sender,
        to: [u.email],
        subject: `Tomorrow: ${ev.title}`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:520px;color:#0b0b0d;">
  <p style="margin:0 0 6px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#6d6b74;">You're going tomorrow</p>
  <h1 style="margin:0 0 14px;font-size:28px;line-height:1.05;letter-spacing:-.02em;">${esc(ev.title)}</h1>
  <p style="margin:0 0 4px;font-size:15px;"><strong>${esc(fmtLondon(ev.start_time))}</strong></p>
  <p style="margin:0 0 22px;font-size:15px;color:#3b3a41;">${esc(where)}</p>
  <a href="${link}" style="display:inline-block;background:#0b0b0d;color:#d4ff3f;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">Your ticket &amp; directions →</a>
  <p style="margin:28px 0 0;font-size:12px;color:#6d6b74;">Hi ${esc(u.name || "there")} — can't make it any more? Send your ticket to a friend from your Cumulus wallet.</p>
</div>`,
      };
    });
    try {
      const r = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        sent += batch.length;
        chunk.forEach((p) => done.push(...p.ticketIds));
      } else errors.push(data);
    } catch (err: any) {
      errors.push(err.message);
    }
  }
  if (done.length) {
    await fetch(`${SB_URL}/rest/v1/tickets?id=in.(${done.join(",")})`, {
      method: "PATCH",
      headers: { ...h, Prefer: "return=minimal" },
      body: JSON.stringify({ reminded_at: new Date().toISOString() }),
    });
  }
  return json({ ok: errors.length === 0, events: events.length, sent, errors }, errors.length && !sent ? 502 : 200);
});
