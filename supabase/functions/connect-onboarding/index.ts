/* Starts (or resumes) Stripe Connect Express onboarding for the calling
 * member, so they have somewhere for release-payout to actually send money.
 * Returns a one-time hosted onboarding URL to redirect the browser to.
 *
 * This only ever CREATES the account and hands back a link — it does not
 * and cannot mark the account as usable. charges_enabled/payouts_enabled
 * are flipped true later by stripe-webhook's `account.updated` handler,
 * once Stripe has actually verified the account, never here. Client code
 * must poll/re-fetch the user's own row to see that flip; there is no
 * synchronous "done" signal from this endpoint.
 *
 * verify_jwt = true in config.toml.
 * NOT LIVE-TESTED — see create-checkout-session's header for the same
 * caveat. Additionally requires Connect to be enabled on the platform's
 * Stripe account (Dashboard → Connect → Get started) before account
 * creation will succeed at all. */

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

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* body is optional — origin can also come from the Origin header */
  }
  const origin = req.headers.get("origin") || body?.origin;
  if (!origin) return json({ error: "Missing origin" }, 400);

  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) return json({ error: "Stripe is not configured" }, 500);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const svcHeaders = {
    apikey: serviceKey!,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    // Look up (or lazily create) this member's connected account. Uses the
    // service-role key because stripe_connect_account_id is one of the
    // columns protect_user_columns() blocks the member from writing
    // themselves — this function is the one trusted place that's allowed to.
    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=email,display_name,stripe_connect_account_id`,
      { headers: svcHeaders },
    );
    const userRows = await userRes.json();
    const user = userRows?.[0];
    if (!user) return json({ error: "User not found" }, 404);

    let accountId: string | null = user.stripe_connect_account_id || null;

    if (!accountId) {
      const acctRes = await fetch("https://api.stripe.com/v1/accounts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          type: "express",
          country: "GB",
          email: user.email || "",
          "capabilities[card_payments][requested]": "true",
          "capabilities[transfers][requested]": "true",
          "business_type": "individual",
        }).toString(),
      });
      const account = await acctRes.json();
      if (!acctRes.ok) throw new Error(account.error?.message || "Stripe error creating account");
      accountId = account.id;

      await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: svcHeaders,
        body: JSON.stringify({ stripe_connect_account_id: accountId }),
      });
    }

    const linkRes = await fetch("https://api.stripe.com/v1/account_links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        account: accountId!,
        refresh_url: `${origin}/?connect=refresh`,
        return_url: `${origin}/?connect=return`,
        type: "account_onboarding",
      }).toString(),
    });
    const link = await linkRes.json();
    if (!linkRes.ok) throw new Error(link.error?.message || "Stripe error creating link");

    return json({ url: link.url });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
