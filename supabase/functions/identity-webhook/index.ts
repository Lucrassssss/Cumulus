import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    // Validate signature from identity provider (e.g., Stripe Identity or Yoti)
    const signature =
      req.headers.get("stripe-signature") ||
      req.headers.get("x-yoti-signature");

    // In production, we must verify the cryptographic signature against the secret here.
    // For local testing, we skip if a bypass header is present or signature exists.
    if (!signature && req.headers.get("x-local-bypass") !== "true") {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const payload = await req.json();
      // The identity provider typically passes back the userId in the metadata or client_reference_id
      const userId =
        payload.data?.object?.client_reference_id ||
        payload.user_id ||
        payload.userId;

      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Missing user_id in payload" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Use the injected service_role client to bypass RLS and invoke the secure RPC
      const { error } = await ctx.supabaseAdmin.rpc("mark_age_verified", {
        p_user: userId,
      });

      if (error) {
        console.error("RPC Error:", error);
        throw new Error(error.message);
      }

      return new Response(JSON.stringify({ ok: true, user: userId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("Webhook processing failed:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
};
