/* Order receipt + ticket email. Called by the app right after a purchase /
 * free registration ({ bookingId, auto: true } — sent once, idempotent via
 * tickets.receipt_sent_at) and from the ticket's Receipt section ("Email me
 * this receipt", auto: false — always resends).
 *
 * Replaces email-ticket, which accepted the recipient address and every
 * line of content from the client (an open relay for any signed-in user).
 * Here the caller is identified from their own session token, the tickets
 * are read server-side and must belong to them, and the email only ever
 * goes to the address on their own account. QR codes are rendered here and
 * attached as PNGs (Gmail/Outlook strip inline data: images).
 *
 * verify_jwt = true. Delivery to other people needs NOTIFY_FROM_EMAIL on a
 * Resend-verified domain (until then Resend only delivers to the owner). */
import QRCode from "npm:qrcode@1.5.4";

const APP_URL = (Deno.env.get("APP_URL") || "https://cumulusapp.co").replace(/\/$/, "");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...corsHeaders } });
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const gbp = (n: number) => (n > 0 ? `£${n.toFixed(2)}` : "Free");
const london = (iso: string, opts: Intl.DateTimeFormatOptions) => {
  try {
    return new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/London", ...opts });
  } catch {
    return iso;
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SB = Deno.env.get("SUPABASE_URL")!;
  const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY") || SR;
  const auth = req.headers.get("Authorization") || "";
  const who = await fetch(`${SB}/auth/v1/user`, { headers: { Authorization: auth, apikey: ANON } });
  if (!who.ok) return json({ error: "Not signed in" }, 401);
  const uid: string = (await who.json())?.id;
  if (!uid) return json({ error: "Not signed in" }, 401);

  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const bookingId = String(body?.bookingId || "").slice(0, 80);
  const auto = !!body?.auto;
  if (!bookingId) return json({ error: "Missing bookingId" }, 400);

  const h = { apikey: SR, Authorization: `Bearer ${SR}`, "Content-Type": "application/json" };
  const tRes = await fetch(`${SB}/rest/v1/tickets?select=*&booking_id=eq.${encodeURIComponent(bookingId)}&order=seat_num.asc.nullsfirst`, { headers: h });
  const all: any[] = tRes.ok ? await tRes.json() : [];
  if (!all.length) return json({ error: "Booking not found" }, 404);

  // The buyer sees the whole order; anyone who claimed a seat sees only theirs.
  let isBuyer = false;
  const squadId = all.find((t) => t.squad_id)?.squad_id;
  if (squadId) {
    const sRes = await fetch(`${SB}/rest/v1/event_squads?select=buyer_user_id&id=eq.${squadId}`, { headers: h });
    const sq = sRes.ok ? (await sRes.json())[0] : null;
    isBuyer = sq?.buyer_user_id === uid;
  } else {
    isBuyer = all.every((t) => t.user_id === uid);
  }
  const tickets = isBuyer ? all : all.filter((t) => t.user_id === uid || t.claimed_by === uid);
  if (!tickets.length) return json({ error: "Not your booking" }, 403);
  if (auto && tickets.every((t) => t.receipt_sent_at)) return json({ ok: true, skipped: "already sent" });

  const [uRes, eRes] = await Promise.all([
    fetch(`${SB}/rest/v1/users?select=email,name&id=eq.${uid}`, { headers: h }),
    fetch(`${SB}/rest/v1/events?select=id,title,venue,area,address,start_time,end_time,host_name&id=eq.${tickets[0].event_id}`, { headers: h }),
  ]);
  const user = uRes.ok ? (await uRes.json())[0] : null;
  const ev = eRes.ok ? (await eRes.json())[0] : null;
  if (!user?.email) return json({ error: "No email on your account" }, 400);
  if (!ev) return json({ error: "Event not found" }, 404);

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json({ error: "Email isn't set up yet" }, 500);
  const from = Deno.env.get("NOTIFY_FROM_EMAIL") || "Huddle Tickets <onboarding@resend.dev>";

  // Money: price_per_ticket + platform_fee = total, per seat.
  const sub = tickets.reduce((s, t) => s + Number(t.price_per_ticket || 0), 0);
  const fees = tickets.reduce((s, t) => s + Math.max(0, Number(t.total || 0) - Number(t.price_per_ticket || 0)), 0);
  const total = tickets.reduce((s, t) => s + Number(t.total || 0), 0);
  const byType = new Map<string, { n: number; each: number }>();
  tickets.forEach((t) => {
    const k = t.type_label || "General";
    const cur = byType.get(k) || { n: 0, each: Number(t.price_per_ticket || 0) };
    cur.n += 1;
    byType.set(k, cur);
  });
  const paidAt = tickets[0].purchased_at || tickets[0].created_at;
  const when = london(ev.start_time, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const where = [ev.venue, ev.address || ev.area].filter(Boolean).join(", ");
  const link = `${APP_URL}/?event=${encodeURIComponent(ev.id)}`;

  const attachments: { filename: string; content: string }[] = [];
  for (const t of tickets.slice(0, 20)) {
    const dataUrl: string = await QRCode.toDataURL(String(t.ticket_id), { width: 360, margin: 2, errorCorrectionLevel: "M" });
    attachments.push({ filename: `ticket-${t.ticket_id}.png`, content: dataUrl.split(",")[1] });
  }
  if (isBuyer && squadId && tickets.length > 1) {
    const d: string = await QRCode.toDataURL(`SQUAD:${squadId}`, { width: 360, margin: 2, errorCorrectionLevel: "M" });
    attachments.unshift({ filename: `group-pass-${tickets.length}-entries.png`, content: d.split(",")[1] });
  }

  const row = (l: string, r: string, strong = false) =>
    `<tr><td style="padding:6px 0;color:${strong ? "#0b0b0d" : "#5f5d66"};font-size:14px;${strong ? "font-weight:700;" : ""}">${l}</td><td style="padding:6px 0;text-align:right;font-size:14px;${strong ? "font-weight:800;" : "color:#0b0b0d;"}">${r}</td></tr>`;
  const html = `<div style="background:#f3f1ec;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #e6e2d9;">
    <div style="background:#0b0b0d;padding:24px 24px 22px;color:#ffffff;">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#d4ff3f;font-weight:700;">You're in</div>
      <div style="font-size:28px;line-height:1.05;font-weight:800;letter-spacing:-.02em;margin-top:8px;">${esc(ev.title)}</div>
      <div style="font-size:15px;margin-top:10px;color:#e8e6ef;">${esc(when)}</div>
      <div style="font-size:14px;margin-top:2px;color:#a9a6b2;">${esc(where)}</div>
    </div>
    <div style="padding:20px 24px 6px;">
      <div style="font-size:14px;color:#3b3a41;line-height:1.5;">Hi ${esc((user.name || "there").split(" ")[0])} — your ${tickets.length > 1 ? `${tickets.length} tickets are` : "ticket is"} attached as QR code${tickets.length > 1 ? "s" : ""}. Show ${tickets.length > 1 ? "them" : "it"} at the door, or open the app any time.</div>
      <div style="margin:18px 0 6px;"><a href="${link}" style="display:inline-block;background:#d4ff3f;color:#0b0b0d;text-decoration:none;font-weight:800;padding:13px 20px;border-radius:999px;font-size:15px;">Open my ticket →</a></div>
    </div>
    <div style="padding:8px 24px 22px;">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8a8792;font-weight:700;margin:14px 0 4px;">Receipt</div>
      <table style="width:100%;border-collapse:collapse;">
        ${row("Order", `<span style="font-family:ui-monospace,Menlo,monospace;">${esc(bookingId)}</span>`)}
        ${row("Paid", esc(london(paidAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })))}
        ${[...byType.entries()].map(([k, v]) => row(`${esc(k)} × ${v.n}`, gbp(v.each * v.n))).join("")}
        ${total > 0 ? row("Booking fee", gbp(fees)) : ""}
        <tr><td colspan="2" style="border-top:1px solid #e6e2d9;padding:0;"></td></tr>
        ${row("Total", total > 0 ? gbp(total) : "Free", true)}
        ${total > 0 ? row("Payment", "Card · processed securely by Stripe") : ""}
      </table>
      <div style="font-size:12px;color:#8a8792;margin-top:14px;line-height:1.5;">Tickets: ${tickets.map((t) => `<span style="font-family:ui-monospace,Menlo,monospace;">${esc(t.ticket_id)}</span>`).join(", ")}<br/>Can't make it? Send your ticket to a friend, or return it for a refund up to 24 hours before — all from your Huddle wallet. If you send a ticket on, any refund still comes back to the card you paid with.</div>
    </div>
  </div>
  <div style="max-width:520px;margin:12px auto 0;text-align:center;font-size:11px;color:#8a8792;">Huddle · London · Prices include all fees — no surprises.</div>
</div>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [user.email],
      subject: `Your tickets: ${ev.title} · ${london(ev.start_time, { weekday: "short", day: "numeric", month: "short" })}`,
      html,
      attachments,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return json({ ok: false, error: data?.message || "Couldn't send the email" }, 502);

  await fetch(`${SB}/rest/v1/tickets?id=in.(${tickets.map((t) => t.id).join(",")})`, {
    method: "PATCH",
    headers: { ...h, Prefer: "return=minimal" },
    body: JSON.stringify({ receipt_sent_at: new Date().toISOString() }),
  });
  const [name, dom] = String(user.email).split("@");
  return json({ ok: true, to: `${name.slice(0, 2)}${"•".repeat(Math.max(1, name.length - 2))}@${dom}` });
});
