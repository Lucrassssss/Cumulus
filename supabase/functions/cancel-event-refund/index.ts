/* Host- or admin-triggered "this event is legally cancelled, claw back every
 * ticket" flow. Refunds every unique Stripe payment intent behind the
 * event's active tickets FIRST, and only marks anything cancelled in the DB
 * (via finalize_event_cancellation, SQL) once refunds have been attempted —
 * money moves before bookkeeping claims it moved, same ordering discipline
 * as the rest of this scaffolding.
 *
 * Refunds are grouped by payment_intent, not issued per-ticket: a Squad
 * purchase of N tickets shares ONE payment intent, and a full refund of
 * that intent covers all N tickets at once — issuing N separate partial
 * refunds against the same intent would be both wrong (double-refunding)
 * and unnecessary.
 *
 * KNOWN LIMITATION (documented rather than silently glossed over): if one
 * of several intents fails to refund, this still finalizes the cancellation
 * in the DB (the event genuinely isn't happening either way) but reports
 * which intents failed so an admin can retry/resolve them manually in the
 * Stripe dashboard. A production build would want a retry queue instead.
 *
 * verify_jwt = true in config.toml.
 * DEPLOYED but NOT MONEY-TESTED — see create-checkout-session's header for
 * the same caveat. */

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
  const eventId = body?.eventId;
  if (!eventId) return json({ error: "Missing eventId" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const svcHeaders = {
    apikey: serviceKey!,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) return json({ error: "Stripe is not configured" }, 500);

  try {
    // Authorization: caller must be the event's own host, or an admin.
    // Uses service-role reads throughout so RLS never gets in the way of a
    // legitimate cancellation — the authorization check below IS the
    // security boundary for this whole function.
    const evRes = await fetch(
      `${supabaseUrl}/rest/v1/events?id=eq.${eventId}&select=id,host_id,status`,
      { headers: svcHeaders },
    );
    const evRows = await evRes.json();
    const ev = evRows?.[0];
    if (!ev) return json({ error: "Event not found" }, 404);
    if (ev.status === "cancelled") {
      return json({ ok: true, already_cancelled: true });
    }

    let isAuthorized = ev.host_id === userId;
    if (!isAuthorized) {
      const adminRes = await fetch(
        `${supabaseUrl}/rest/v1/admins?user_id=eq.${userId}&select=user_id&limit=1`,
        { headers: svcHeaders },
      );
      const adminRows = await adminRes.json();
      isAuthorized = Array.isArray(adminRows) && adminRows.length > 0;
    }
    if (!isAuthorized) return json({ error: "Forbidden" }, 403);

    // Every unique payment intent behind this event's still-active tickets.
    const ticketsRes = await fetch(
      `${supabaseUrl}/rest/v1/tickets?event_id=eq.${eventId}&status=eq.active&select=stripe_payment_intent_id`,
      { headers: svcHeaders },
    );
    const tickets = await ticketsRes.json();
    const intentIds = [
      ...new Set(
        (Array.isArray(tickets) ? tickets : [])
          .map((t: any) => t.stripe_payment_intent_id)
          .filter(Boolean),
      ),
    ] as string[];

    const refundResults: any[] = [];
    for (const intentId of intentIds) {
      const res = await fetch("https://api.stripe.com/v1/refunds", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ payment_intent: intentId }).toString(),
      });
      const refund = await res.json();
      refundResults.push(
        res.ok
          ? { payment_intent: intentId, refund_id: refund.id, ok: true }
          : { payment_intent: intentId, ok: false, error: refund.error?.message },
      );
    }

    // Finalize regardless of individual refund outcomes above — the event
    // is not happening either way; see the KNOWN LIMITATION note at the top
    // of this file for why partial refund failures don't block this step.
    const finalizeRes = await fetch(`${supabaseUrl}/rest/v1/rpc/finalize_event_cancellation`, {
      method: "POST",
      headers: svcHeaders,
      body: JSON.stringify({ p_event_id: eventId }),
    });
    const finalize = await finalizeRes.json();
    if (!finalizeRes.ok) throw new Error(finalize?.message || "finalize_event_cancellation failed");

    const anyRefundFailed = refundResults.some((r) => !r.ok);
    return json({
      ok: true,
      event_id: eventId,
      refunds: refundResults,
      tickets_cancelled: finalize?.tickets_cancelled ?? null,
      warning: anyRefundFailed
        ? "One or more refunds failed — see `refunds` and resolve manually in the Stripe dashboard."
        : undefined,
    });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
