/* verify_jwt=true (set in config.toml) means the Supabase edge gateway has
 * already validated this token's signature and expiry before our handler
 * runs — decoding it here just reads the `sub` claim, it does not itself
 * establish trust. */
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

/* Creates a Stripe Identity VerificationSession for the calling member and
 * hands back its client_secret so the browser can launch Stripe.js's hosted
 * verification modal. Nothing about age-verified status is decided here —
 * that only ever happens in identity-webhook once Stripe confirms a real
 * `verified` event, signed and delivered server-to-server. */
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = getUserIdFromJWT(req.headers.get("Authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) {
    return new Response(
      JSON.stringify({ error: "Stripe is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const res = await fetch(
      "https://api.stripe.com/v1/identity/verification_sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          type: "document",
          client_reference_id: userId,
          "options[document][require_matching_selfie]": "true",
        }).toString(),
      },
    );
    const session = await res.json();
    if (!res.ok) {
      throw new Error(session.error?.message || "Stripe error");
    }
    return new Response(
      JSON.stringify({ client_secret: session.client_secret }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
