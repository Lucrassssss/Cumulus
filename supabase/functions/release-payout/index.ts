/* Moves REAL money for the first time in this codebase: calls
 * stripe.transfers.create() for every event_payouts row that's due
 * (status='pending' and scheduled_release_at has passed — the existing
 * 24h/48h trust-tier logic from the pivot migration decides WHEN, this
 * function is what actually DOES it) to the host's connected account.
 *
 * get_host_payouts() (pivot migration) still exists and still lazily flips
 * a due row's status to 'released' when a host's payouts panel reads it —
 * that is now WRONG on its own (it marks a payout released without any
 * transfer happening) and is superseded by this function. This function
 * does the real transfer THEN marks it released; get_host_payouts() should
 * be treated as a read path only going forward, not a release mechanism.
 * (Left as-is rather than migrated away in this pass — see the ARCHITECTURE.md
 * note for the follow-up.)
 *
 * Two ways to call this, both supported here because there is no pg_cron
 * wiring in this codebase yet (mirrors notify-admin-new-event's
 * secret-based trust for the machine-to-machine path):
 *   - A signed-in host's own JWT → processes only that host's own due
 *     payouts. Safe to wire to a "Check for released payouts" button in the
 *     payouts panel; no cron needed for this to be useful today.
 *   - Authorization: Bearer <RELEASE_PAYOUT_CRON_SECRET> → processes every
 *     due payout for every host. Intended for a scheduled trigger (Supabase
 *     Cron / pg_cron http request / external scheduler) hitting this
 *     endpoint every few minutes in production; nothing in this repo
 *     currently calls it that way.
 *
 * verify_jwt = false in config.toml — this function checks the header
 * itself so it can accept EITHER auth mode above; the gateway can't do that.
 * DEPLOYED but NOT MONEY-TESTED — see create-checkout-session's header for
 * the same caveat. */

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const cronSecret = Deno.env.get("RELEASE_PAYOUT_CRON_SECRET");
  const isCron = !!cronSecret && safeEqual(provided, cronSecret);
  const callerUserId = isCron ? null : getUserIdFromJWT(authHeader);

  if (!isCron && !callerUserId) {
    return json({ error: "Not authenticated" }, 401);
  }

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
    const nowIso = new Date().toISOString();
    const hostFilter = isCron ? "" : `&host_id=eq.${callerUserId}`;
    // Embeds the host's Connect status via PostgREST's FK-based embed
    // (event_payouts.host_id -> users.id) so this is one round trip instead
    // of one due-payouts query plus a per-row host lookup (N+1) — matters
    // once a cron run is processing every due payout across every host.
    const dueRes = await fetch(
      `${supabaseUrl}/rest/v1/event_payouts?status=eq.pending&scheduled_release_at=lte.${encodeURIComponent(nowIso)}${hostFilter}&select=id,event_id,host_id,net_amount,users(stripe_connect_account_id,stripe_connect_payouts_enabled)`,
      { headers: svcHeaders },
    );
    const due = await dueRes.json();
    if (!Array.isArray(due) || due.length === 0) {
      return json({ ok: true, released: 0, skipped: 0 });
    }

    let released = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const payout of due) {
      const host = payout.users;

      if (!host?.stripe_connect_account_id || !host?.stripe_connect_payouts_enabled) {
        // Host hasn't finished Connect onboarding yet — leave 'pending' and
        // move on. A production build should alert the host here; out of
        // scope for this pass.
        skipped++;
        results.push({ event_id: payout.event_id, skipped: "connect_not_ready" });
        continue;
      }
      if (Number(payout.net_amount) <= 0) {
        skipped++;
        continue;
      }

      const transferRes = await fetch("https://api.stripe.com/v1/transfers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          amount: String(Math.round(Number(payout.net_amount) * 100)),
          currency: "gbp",
          destination: host.stripe_connect_account_id,
          transfer_group: payout.event_id,
        }).toString(),
      });
      const transfer = await transferRes.json();
      if (!transferRes.ok) {
        results.push({ event_id: payout.event_id, error: transfer.error?.message });
        continue;
      }

      await fetch(`${supabaseUrl}/rest/v1/event_payouts?id=eq.${payout.id}`, {
        method: "PATCH",
        headers: svcHeaders,
        body: JSON.stringify({
          status: "released",
          released_at: new Date().toISOString(),
          stripe_transfer_id: transfer.id,
        }),
      });
      released++;
      results.push({ event_id: payout.event_id, transfer_id: transfer.id });
    }

    return json({ ok: true, released, skipped, results });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
