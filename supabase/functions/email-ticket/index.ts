/* Retired. It accepted the recipient address and every line of the email
 * from the client, which let any signed-in user send arbitrary mail through
 * our Resend account. Receipts + tickets are now built and addressed
 * server-side by send-receipt. Kept as a 410 stub so old clients fail
 * cleanly; safe to delete. */
Deno.serve(() =>
  new Response(JSON.stringify({ error: "Gone — use send-receipt" }), {
    status: 410,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  }),
);
