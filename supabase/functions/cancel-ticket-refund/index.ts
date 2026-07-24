/* Self-serve "I can't come anymore" — a ticket-holder returning their own
 * ticket, as opposed to cancel-event-refund's host/admin-initiated "the
 * whole event is off" flow. Refunds just this one ticket's share of its
 * payment intent (a squad purchase of N tickets shares ONE Stripe
 * PaymentIntent, so this is a PARTIAL refund by amount, not a full refund
 * of the intent — the other tickets under it are still valid), marks the
 * ticket cancelled, then offers the freed spot to the next person on that
 * event's waitlist (offer_next_waitlist_seat, SQL) — the same mechanism the
 * production-readiness audit asked for: "a returned ticket auto-offers to
 * the next person in queue... and automatic refund to the returner."
 *
 * Free tickets (total = 0) skip the Stripe call entirely — nothing to
 * refund — but still cancel the ticket and chain the waitlist offer.
 *
 * The 24h-before-event cutoff (already shown as copy on the ticket-wallet
 * cancel button) is re-enforced here server-side too, since a client could
 * otherwise call this function directly and bypass the client-side check.
 *
 * verify_jwt = true in config.toml.
 * DEPLOYED but NOT MONEY-TESTED — same caveat as create-checkout-session
 * and cancel-event-refund: this session has no live Stripe/Supabase access
 * to exercise it against a real PaymentIntent. */

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  const userId = getUserIdFromJWT(authHeader);
  if (!userId) return json({ error: "Not authenticated" }, 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad JSON body" }, 400);
  }
  const ticketId = body?.ticketId;
  if (!ticketId) return json({ error: "Missing ticketId" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const svcHeaders = {
    apikey: serviceKey!,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");

  try {
    const tRes = await fetch(
      `${supabaseUrl}/rest/v1/tickets?ticket_id=eq.${encodeURIComponent(ticketId)}&select=id,ticket_id,user_id,event_id,status,total,stripe_payment_intent_id&limit=1`,
      { headers: svcHeaders },
    );
    const tRows = await tRes.json();
    const ticket = tRows?.[0];
    if (!ticket) return json({ error: "Ticket not found" }, 404);
    if (ticket.user_id !== userId) return json({ error: "Forbidden" }, 403);
    if (ticket.status !== "active") {
      return json({ error: "This ticket isn't active." }, 409);
    }

    const evRes = await fetch(
      `${supabaseUrl}/rest/v1/events?id=eq.${ticket.event_id}&select=id,start_time`,
      { headers: svcHeaders },
    );
    const evRows = await evRes.json();
    const ev = evRows?.[0];
    if (!ev) return json({ error: "Event not found" }, 404);
    if (new Date(ev.start_time).getTime() - Date.now() < 24 * 3600000) {
      return json(
        { error: "Cancellations close 24 hours before the event." },
        422,
      );
    }

    let refund: { id: string; amount: number } | null = null;
    const amountPence = Math.round(Number(ticket.total || 0) * 100);
    if (amountPence > 0 && ticket.stripe_payment_intent_id) {
      if (!secretKey) return json({ error: "Stripe is not configured" }, 500);
      const refundRes = await fetch("https://api.stripe.com/v1/refunds", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          payment_intent: ticket.stripe_payment_intent_id,
          amount: String(amountPence),
        }).toString(),
      });
      const refundBody = await refundRes.json();
      if (!refundRes.ok) {
        return json(
          { error: refundBody?.error?.message || "Refund failed" },
          502,
        );
      }
      refund = { id: refundBody.id, amount: amountPence };
    }

    // Money moved (or there was none to move) before the ticket is marked
    // cancelled — same ordering discipline as cancel-event-refund.
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/tickets?id=eq.${ticket.id}`,
      {
        method: "PATCH",
        headers: svcHeaders,
        body: JSON.stringify({ status: "cancelled" }),
      },
    );
    if (!updateRes.ok) {
      throw new Error(await updateRes.text());
    }

    const offerRes = await fetch(
      `${supabaseUrl}/rest/v1/rpc/offer_next_waitlist_seat`,
      {
        method: "POST",
        headers: svcHeaders,
        body: JSON.stringify({ p_event_id: ticket.event_id }),
      },
    );
    const offeredWaitlistId = offerRes.ok ? await offerRes.json() : null;

    return json({
      ok: true,
      refunded: refund,
      offered_to_waitlist: !!offeredWaitlistId,
    });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
