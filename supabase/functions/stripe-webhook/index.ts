/* Stripe calls this server-to-server once a Checkout Session (created by
 * create-checkout-session) completes — there is no user JWT on this request,
 * so trust is established the same way identity-webhook already does it: a
 * from-scratch HMAC verification of the `stripe-signature` header against
 * the RAW request body (verify_jwt = false in config.toml).
 *
 * IMPORTANT: this needs its OWN webhook signing secret, distinct from the
 * old identity-webhook's STRIPE_WEBHOOK_SECRET — Stripe issues one signing
 * secret per webhook endpoint URL, not one per Stripe account. Configure a
 * new endpoint in the Stripe dashboard pointing at this function's URL,
 * subscribed to `checkout.session.completed`, and put the "whsec_..." it
 * gives you into STRIPE_CHECKOUT_WEBHOOK_SECRET.
 *
 * Ticket creation happens HERE, not in the frontend, on purpose: the old
 * fake checkout flow (processPayment() in app.js) inserted ticket rows
 * client-side before any payment existed. A ticket must only ever exist
 * once Stripe confirms money actually moved.
 *
 * DEPLOYED but NOT MONEY-TESTED — see create-checkout-session's header for
 * the same caveat. */

async function verifyStripeSignature(
  rawBody: string,
  sigHeader: string,
  secret: string,
  toleranceSeconds = 300,
): Promise<boolean> {
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.split("=") as [string, string]),
  );
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > toleranceSeconds) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected.length !== v1.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  }
  return mismatch === 0;
}

function genTicketId(): string {
  return "CU-" + crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
}
function genClaimCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 14);
}

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_CHECKOUT_WEBHOOK_SECRET");
  if (!signature || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();
  const valid = await verifyStripeSignature(rawBody, signature, webhookSecret);
  if (!valid) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const svcHeaders = {
    apikey: serviceKey!,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    const event = JSON.parse(rawBody);

    // A host's connected account flips charges/payouts-enabled only once
    // Stripe has actually verified it — connect-onboarding merely starts
    // that process, this is where it's confirmed. Requires this same
    // endpoint to also be subscribed to `account.updated` in the Stripe
    // dashboard (Connect webhooks are account-scoped, separate from the
    // checkout.session.completed subscription above).
    if (event.type === "account.updated") {
      const account = event.data?.object;
      if (account?.id) {
        await fetch(
          `${supabaseUrl}/rest/v1/users?stripe_connect_account_id=eq.${account.id}`,
          {
            method: "PATCH",
            headers: svcHeaders,
            body: JSON.stringify({
              stripe_connect_charges_enabled: !!account.charges_enabled,
              stripe_connect_payouts_enabled: !!account.payouts_enabled,
            }),
          },
        );
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (event.type !== "checkout.session.completed") {
      // charge.refunded / payment_intent.payment_failed / anything else
      // we're subscribed to — acknowledged so Stripe stops retrying, but out
      // of scope for this scaffolding pass (refunds in this app are always
      // host/admin-initiated via cancel-event-refund, not out-of-band).
      return new Response(JSON.stringify({ ok: true, ignored: event.type }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = event.data?.object;
    if (session?.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ ok: true, ignored: "not paid yet" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const sessionId: string = session.id;
    const eventId: string = session.metadata?.event_id;
    const userId: string = session.metadata?.user_id || session.client_reference_id;
    const qty = Math.max(1, Math.min(10, Number(session.metadata?.qty) || 1));
    const pricePerTicket = Number(session.metadata?.price_per_ticket) || 0;
    const platformFee = Number(session.metadata?.platform_fee) || 0;
    const paymentIntentId: string | null = session.payment_intent || null;

    if (!eventId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing event_id/user_id in metadata" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Idempotency: Stripe can and does redeliver the same event. If tickets
    // for this checkout session already exist, this is a retry — ack without
    // creating duplicates.
    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/tickets?stripe_checkout_session_id=eq.${sessionId}&select=id&limit=1`,
      { headers: svcHeaders },
    );
    const existing = await existingRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return new Response(JSON.stringify({ ok: true, already_processed: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Purchaser display name for the ticket record (cosmetic only).
    let purchaserName = "";
    try {
      const uRes = await fetch(
        `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=display_name`,
        { headers: svcHeaders },
      );
      const uRows = await uRes.json();
      purchaserName = uRows?.[0]?.display_name || "";
    } catch {
      /* cosmetic field — a lookup failure shouldn't block ticket creation */
    }

    // A Squad is created once per multi-ticket purchase, same as the old
    // client-side createSquadIfNeeded() — the buyer keeps ticket #1, every
    // other ticket gets a claim_code for the "share with your squad" link.
    let squadId: string | null = null;
    if (qty > 1) {
      const squadRes = await fetch(`${supabaseUrl}/rest/v1/event_squads`, {
        method: "POST",
        headers: { ...svcHeaders, Prefer: "return=representation" },
        body: JSON.stringify({ event_id: eventId, buyer_user_id: userId }),
      });
      const squadRows = await squadRes.json();
      squadId = squadRows?.[0]?.id || null;
    }

    const bookingId = genTicketId();
    const total = pricePerTicket + platformFee;
    const rows = Array.from({ length: qty }, (_, i) => ({
      ticket_id: qty > 1 ? `${bookingId}-${String(i + 1).padStart(2, "0")}` : bookingId,
      booking_id: bookingId,
      seat_num: qty > 1 ? i + 1 : null,
      total_seats: qty > 1 ? qty : null,
      event_id: eventId,
      // Matches the old client-side _insertTickets(): the buyer owns every
      // ticket from their purchase until claim_ticket() reassigns a specific
      // one to whoever opens its claim_code link.
      user_id: userId,
      ticket_type: "general",
      type_label: "General Admission",
      price_per_ticket: pricePerTicket,
      platform_fee: platformFee,
      total,
      purchaser_name: purchaserName,
      purchased_at: new Date().toISOString(),
      squad_id: squadId,
      claim_code: i > 0 ? genClaimCode() : null,
      status: "active",
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: sessionId,
    }));

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/tickets`, {
      method: "POST",
      headers: { ...svcHeaders, Prefer: "return=representation" },
      body: JSON.stringify(rows),
    });
    if (!insertRes.ok) {
      const errBody = await insertRes.text();
      throw new Error(`Ticket insert failed: ${errBody}`);
    }
    // sync_event_payout_trg (pivot migration) fires automatically on this
    // insert and rolls the sale into event_payouts — nothing else to do here.

    // Mirrors the old client-side flow's rsvps insert (attendee-list count).
    // Best-effort: a failure here shouldn't fail a webhook whose ticket
    // already exists, since Stripe would otherwise keep retrying delivery
    // for an already-successful purchase.
    try {
      const rsvpCheck = await fetch(
        `${supabaseUrl}/rest/v1/rsvps?event_id=eq.${eventId}&user_id=eq.${userId}&select=id&limit=1`,
        { headers: svcHeaders },
      );
      const rsvpRows = await rsvpCheck.json();
      if (!Array.isArray(rsvpRows) || rsvpRows.length === 0) {
        await fetch(`${supabaseUrl}/rest/v1/rsvps`, {
          method: "POST",
          headers: svcHeaders,
          body: JSON.stringify({
            event_id: eventId,
            user_id: userId,
            user_name: purchaserName,
          }),
        });
      }
    } catch {
      /* non-critical — see comment above */
    }

    return new Response(
      JSON.stringify({ ok: true, event_id: eventId, tickets_created: qty }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
