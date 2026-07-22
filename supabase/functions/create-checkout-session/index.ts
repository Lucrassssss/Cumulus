/* Creates a real Stripe PaymentIntent for a paid event and hands back its
 * `client_secret` for the browser to mount a Stripe Payment Element against
 * (see startStripeCheckout() in src/js/app/10-badges.js) — the buyer never
 * leaves cumulus's own origin, and the payment form itself (card fields,
 * wallet buttons) is fully themeable via Stripe.js's Appearance API, unlike
 * the pre-built Checkout Session form this replaces.
 *
 * WHY PaymentIntents INSTEAD OF Checkout Sessions: this function used to
 * create a Checkout Session (ui_mode: "embedded_page"). That pre-built form
 * hard-codes its own input-card surface to always render light, regardless
 * of branding_settings — a genuine Stripe design constraint for that
 * product, not a bug in this repo's integration of it (confirmed against
 * Stripe's own docs and community reports after branding_settings correctly
 * themed the header/button but left the card white). Full theming control
 * needs the raw PaymentIntent + Payment Element API instead — the oldest,
 * most stable part of Stripe's payments surface (automatic_payment_methods
 * has been GA since 2023-08-16), deliberately chosen over the newer
 * "Elements with Checkout Sessions" (ui_mode: "elements"/"custom") feature,
 * which ships behind a distinct versioned Stripe.js preview build and is
 * less proven — not a trade worth making again after three live breakages
 * from newer/less-mature Stripe surfaces earlier this session.
 *
 * "Separate charges and transfers": collects the FULL amount (ticket price
 * + booking fee) onto the PLATFORM's own Stripe account. The host's share
 * is moved to their connected account later, by release-payout, once
 * event_payouts.scheduled_release_at has passed (the existing 24h/48h
 * trust-tier logic from the pivot migration). This is deliberate: it
 * matches the escrow language already in terms.html/privacy.html and the
 * event_payouts bookkeeping the pivot migration built, rather than
 * requiring every host to have a fully onboarded, charges-enabled Connect
 * account before their first ticket can even sell.
 *
 * verify_jwt = true in config.toml — the gateway has already rejected a
 * missing/expired/invalid session before this code runs.
 *
 * IMPORTANT DEPLOY STEP: stripe-webhook must be subscribed to
 * `payment_intent.succeeded` in the Stripe Dashboard (Developers → Webhooks
 * → this endpoint) — it was previously only subscribed to
 * `checkout.session.completed`/`account.updated`. Without that
 * subscription, payments will succeed but no ticket will ever be created,
 * since the webhook is the only place ticket rows get written. */

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

// Mirrors activeTicketTier()/eventPrice() in src/js/app.js EXACTLY — same
// "first tier whose cutoff hasn't passed, else the last tier" rule. The
// client's displayed price is cosmetic only; this is what actually prices
// the PaymentIntent.
function activeTierPrice(ev: { price?: number; price_tiers?: any }): number {
  const tiers = Array.isArray(ev.price_tiers) ? ev.price_tiers : null;
  if (!tiers || !tiers.length) return Number(ev.price) || 0;
  const now = Date.now();
  const sorted = [...tiers].sort(
    (a, b) => new Date(a.cutoff || 0).getTime() - new Date(b.cutoff || 0).getTime(),
  );
  const active = sorted.find((t) => !t.cutoff || new Date(t.cutoff).getTime() > now);
  return Number((active || sorted[sorted.length - 1]).price) || 0;
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
  const marketingOptIn = body?.marketingOptIn === true;
  if (!eventId) {
    return json({ error: "Missing eventId" }, 400);
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
      `${supabaseUrl}/rest/v1/events?id=eq.${eventId}&select=id,title,price,price_tiers,status,host_id`,
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
  const price = activeTierPrice(ev);
  if (price <= 0) {
    // Free events never touch Stripe — the client calls registerFree()
    // directly. Sending a free event here is a client bug, not a valid call.
    return json({ error: "This event is free — no checkout needed" }, 400);
  }

  const fee = cumulusFee(price);
  const unitAmountPence = Math.round((price + fee) * qty * 100);

  // Best-effort receipt email — the app already knows this from the signed-in
  // session, so Payment Element never needs to ask the buyer for it again
  // (unlike the pre-built Checkout Session form this replaces).
  let receiptEmail: string | null = null;
  try {
    const uRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=email`,
      { headers: restHeaders },
    );
    const uRows = await uRes.json();
    receiptEmail = uRows?.[0]?.email || null;
  } catch {
    /* cosmetic — a lookup failure shouldn't block payment */
  }

  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) return json({ error: "Stripe is not configured" }, 500);

  const params = new URLSearchParams({
    amount: String(unitAmountPence),
    currency: "gbp",
    "automatic_payment_methods[enabled]": "true",
    "metadata[event_id]": eventId,
    "metadata[user_id]": userId,
    "metadata[qty]": String(qty),
    "metadata[price_per_ticket]": String(price),
    "metadata[platform_fee]": String(fee),
    "metadata[marketing_opt_in]": marketingOptIn ? "true" : "false",
    description: ev.title || "Cumulus ticket",
  });
  if (receiptEmail) params.append("receipt_email", receiptEmail);
  // Card/Apple Pay/Google Pay/PayPal/Link only — explicitly exclude BNPL
  // methods at the API level so "no Klarna" is a code fact, not a Dashboard
  // toggle someone can silently flip back on. automatic_payment_methods still
  // decides availability among what's left (currency/country eligible +
  // enabled in the Dashboard), this just removes these three from that set
  // regardless of Dashboard state. Apple Pay/Google Pay/Link can't be
  // excluded this way (Stripe blocks it) — they're not in this list because
  // we want them, not because the exclusion would fail.
  for (const t of ["klarna", "afterpay_clearpay", "affirm"]) {
    params.append("excluded_payment_method_types[]", t);
  }

  try {
    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": "2026-03-25.dahlia",
      },
      body: params.toString(),
    });
    const intent = await res.json();
    if (!res.ok) {
      console.error("Stripe PaymentIntent creation failed:", intent.error);
      throw new Error(intent.error?.message || "Stripe error");
    }
    return json({ clientSecret: intent.client_secret, id: intent.id });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
