/* Creates a real Stripe Checkout Session for a paid event and hands back its
 * hosted `url` for the browser to redirect to — no Stripe.js/Elements needed
 * client-side at all, which fits this repo's "no build step, no SDK" house
 * style (same reasoning as create-checkout-session's now-removed sibling,
 * the old create-verification-session).
 *
 * "Separate charges and transfers": Checkout collects the FULL amount
 * (ticket price + booking fee) onto the PLATFORM's own Stripe account. The
 * host's share is moved to their connected account later, by
 * release-payout, once event_payouts.scheduled_release_at has passed (the
 * existing 24h/48h trust-tier logic from the pivot migration). This is
 * deliberate: it matches the escrow language already in terms.html/
 * privacy.html and the event_payouts bookkeeping the pivot migration built,
 * rather than requiring every host to have a fully onboarded,
 * charges-enabled Connect account before their first ticket can even sell.
 *
 * verify_jwt = true in config.toml — the gateway has already rejected a
 * missing/expired/invalid session before this code runs.
 *
 * NOT LIVE-TESTED: no Stripe/Supabase credentials are available in the
 * sandbox this was written in. Needs STRIPE_SECRET_KEY (already configured
 * per the old create-verification-session having required it) and a real
 * checkout flow exercised against a Stripe test-mode account before this
 * can be trusted in production. */

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

function getUserIdFromJWT(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json).sub || null;
  } catch {
    return null;
  }
}

// Mirrors getCumulusFee() in src/js/app.js EXACTLY. The client's number is
// never trusted for the actual charge — this server-side copy is the only
// one that decides what Stripe collects. If the tiers ever change, both
// copies need updating together (documented at both call sites).
function cumulusFee(ticketPrice: number): number {
  if (ticketPrice <= 0) return 0;
  if (ticketPrice <= 15) return 1.5;
  if (ticketPrice <= 40) return 2.5;
  if (ticketPrice <= 71) return 3.5;
  return 4.5;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  const userId = getUserIdFromJWT(authHeader);
  if (!userId) return json({ error: "Not authenticated" }, 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad JSON body" }, 400);
  }

  const eventId = body?.eventId;
  const qty = Math.max(1, Math.min(10, Number(body?.qty) || 1));
  // Only origin is taken from the client (for the redirect URLs); every
  // price-bearing field below comes from the DB, never the request body.
  const origin =
    req.headers.get("origin") ||
    (typeof body?.origin === "string" ? body.origin : null);
  if (!eventId || !origin) {
    return json({ error: "Missing eventId or origin" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const restHeaders = {
    apikey: anonKey!,
    Authorization: authHeader!,
    "Content-Type": "application/json",
  };

  // events is publicly readable (RLS: events_select_all), so the caller's own
  // JWT is enough here — no service-role key needed just to price a ticket.
  let ev: any;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/events?id=eq.${eventId}&select=id,title,price,status,host_id`,
      { headers: restHeaders },
    );
    const rows = await res.json();
    ev = rows?.[0];
  } catch {
    return json({ error: "Could not load event" }, 500);
  }
  if (!ev) return json({ error: "Event not found" }, 404);
  if (ev.status !== "active") {
    return json({ error: "This event is no longer available" }, 400);
  }
  const price = Number(ev.price) || 0;
  if (price <= 0) {
    // Free events never touch Stripe — the client calls registerFree()
    // directly. Sending a free event here is a client bug, not a valid call.
    return json({ error: "This event is free — no checkout needed" }, 400);
  }

  const fee = cumulusFee(price);
  const unitAmountPence = Math.round((price + fee) * 100);

  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) return json({ error: "Stripe is not configured" }, 500);

  const params = new URLSearchParams({
    mode: "payment",
    "line_items[0][price_data][currency]": "gbp",
    "line_items[0][price_data][product_data][name]": ev.title || "Cumulus ticket",
    "line_items[0][price_data][unit_amount]": String(unitAmountPence),
    "line_items[0][quantity]": String(qty),
    client_reference_id: userId,
    success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancelled&event=${encodeURIComponent(eventId)}`,
    "metadata[event_id]": eventId,
    "metadata[user_id]": userId,
    "metadata[qty]": String(qty),
    "metadata[price_per_ticket]": String(price),
    "metadata[platform_fee]": String(fee),
  });

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const session = await res.json();
    if (!res.ok) throw new Error(session.error?.message || "Stripe error");
    return json({ url: session.url, id: session.id });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
