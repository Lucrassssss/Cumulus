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

  const authHeader = req.headers.get("Authorization");
  const userId = getUserIdFromJWT(authHeader);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Throttle: each call spins up a real (~$1-1.50) Stripe Identity session,
  // so guard against spam-clicking or scripted abuse. Reads/writes go through
  // PostgREST using the caller's own JWT, so RLS (id = auth.uid()) is what
  // actually enforces "only your own row" — no service-role key needed here.
  const COOLDOWN_MS = 5 * 60 * 1000;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const restHeaders = {
    apikey: anonKey!,
    Authorization: authHeader!,
    "Content-Type": "application/json",
  };

  try {
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=age_verified_at,last_verification_attempt_at`,
      { headers: restHeaders },
    );
    const rows = await checkRes.json();
    const row = rows?.[0];
    if (row?.age_verified_at) {
      return new Response(
        JSON.stringify({ error: "Already age-verified" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
    if (row?.last_verification_attempt_at) {
      const elapsed = Date.now() - new Date(row.last_verification_attempt_at).getTime();
      if (elapsed < COOLDOWN_MS) {
        const waitSec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        return new Response(
          JSON.stringify({ error: `Please wait ${waitSec}s before trying again` }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
    }
    // Record the attempt before calling Stripe, closing the race window
    // between two rapid clicks both passing the check above.
    await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
      method: "PATCH",
      headers: restHeaders,
      body: JSON.stringify({ last_verification_attempt_at: new Date().toISOString() }),
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Could not verify eligibility" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
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
