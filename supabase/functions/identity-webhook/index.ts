import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

/* Verify a Stripe webhook signature from scratch (no Stripe SDK dependency
 * in this Deno runtime). Header format: "t=<unix ts>,v1=<hex hmac>". The
 * signed payload is "<timestamp>.<raw body>" — this MUST run against the
 * raw request bytes, never a re-serialized JSON.parse/stringify round trip,
 * or the signature will never match. */
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

export default {
  // auth: "none" -- Stripe calls this endpoint with no Supabase credentials
  // (it can't; it doesn't know our apikey), so requiring "publishable" or
  // "secret" rejects every single delivery at the wrapper level with a 401
  // before our own code -- including the Stripe signature check below, which
  // is the actual authentication for this endpoint -- ever runs.
  // ctx.supabaseAdmin (service role, bypasses RLS) is still available.
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Read the raw body ONCE, before any parsing, and verify against that
    // exact byte stream — this is what makes the signature check meaningful.
    const rawBody = await req.text();
    const valid = await verifyStripeSignature(
      rawBody,
      signature,
      webhookSecret,
    );
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const event = JSON.parse(rawBody);
      const session = event.data?.object;
      const userId = session?.client_reference_id;

      // Only a *verified* Identity session may ever mark a user as age
      // verified. Every other subscribed event is acknowledged (so Stripe
      // stops retrying) but never touches mark_age_verified.
      if (event.type === "identity.verification_session.verified") {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Missing client_reference_id" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const { error } = await ctx.supabaseAdmin.rpc("mark_age_verified", {
          p_user: userId,
        });
        if (error) throw new Error(error.message);

        return new Response(JSON.stringify({ ok: true, user: userId }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // identity.verification_session.requires_input / .canceled / anything
      // else we're subscribed to — nothing to do server-side; the client
      // polls get_hosting_progress() and shows its own retry state.
      return new Response(
        JSON.stringify({ ok: true, ignored: event.type }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
};
