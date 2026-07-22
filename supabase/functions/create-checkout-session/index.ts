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
    "metadata[event_id]": eventId,
    "metadata[user_id]": userId,
    "metadata[qty]": String(qty),
    "metadata[price_per_ticket]": String(price),
    "metadata[platform_fee]": String(fee),
    "metadata[marketing_opt_in]": marketingOptIn ? "true" : "false",
    description: ev.title || "Cumulus ticket",
  });
  if (receiptEmail) params.append("receipt_email", receiptEmail);
  // Hard allow-list. The Stripe account has ~15 other wallets/redirects
  // toggled on in the Dashboard (Amazon Pay, Revolut Pay, Cartes Bancaires,
  // Kakao Pay, Pix, Bancontact, BLIK, EPS, etc.) that automatic_payment_
  // methods would happily surface for a GBP PaymentIntent since they're
  // Dashboard-eligible. allowed_payment_method_types and automatic_payment_
  // methods are MUTUALLY EXCLUSIVE on PaymentIntent create — Stripe rejects
  // the request with a multi_exclusive_parameters error if both are present
  // (verified live via a real test PaymentIntent in the sandbox's Workbench
  // Shell after the first attempt combining both failed with exactly that
  // error). allowed_payment_method_types works standalone with no automatic_
  // payment_methods flag at all — confirmed the same way: a bare
  // allowed_payment_method_types=[card,paypal] request returned
  // payment_method_types:["card","paypal"] on the created PaymentIntent.
  // "card" + "paypal" is the actual full set we want: Apple Pay and Google
  // Pay aren't separate payment_method_types, they're wallet detection
  // layered onto "card" by the Payment Element itself (domain verification +
  // device support), so this pair alone is card + Apple Pay + Google Pay +
  // PayPal and nothing else, regardless of Dashboard state. Trade-off: Link
  // no longer appears — the email prefill in startStripeCheckout()
  // (10-badges.js) is now inert for Link recognition specifically, though it
  // still harmlessly prefills the card form's billing email.
  params.append("allowed_payment_method_types[]", "card");
  params.append("allowed_payment_method_types[]", "paypal");

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
