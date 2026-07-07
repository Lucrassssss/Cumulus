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

// The browser calls this function directly from the app origin (unlike
// identity-webhook, which Stripe calls server-to-server and never needs
// CORS for). Sending an Authorization header makes the browser send a CORS
// preflight OPTIONS request first; without these headers on every response
// — including the preflight — the browser blocks the real POST before it's
// even sent, surfacing as "Could not start verification" client-side with
// no server error to explain why. Allow-Headers must list every header the
// caller sends: the app calls this via supabase-js's functions.invoke(),
// which adds `apikey` and `x-client-info` on top of `authorization` and
// `content-type` — a raw fetch() with fewer headers can pass preflight
// while the real supabase-js call still gets blocked if any are missing.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* Creates a Stripe Identity VerificationSession for the calling member and
 * hands back its client_secret so the browser can launch Stripe.js's hosted
 * verification modal. Nothing about age-verified status is decided here —
 * that only ever happens in identity-webhook once Stripe confirms a real
 * `verified` event, signed and delivered server-to-server. */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const userId = getUserIdFromJWT(req.headers.get("Authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) {
    return new Response(
      JSON.stringify({ error: "Stripe is not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
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
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
