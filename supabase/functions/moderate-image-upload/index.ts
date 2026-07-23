// Uploads a user's avatar or host-profile cover ("banner") photo — after
// checking it against Google Cloud Vision's SafeSearch Detection first.
// This is the sole write path for both the `avatars` and `covers` storage
// buckets (see migration 20260723000000_moderated_avatar_and_cover_
// uploads.sql, which drops the old client-writable storage policies): the
// client never writes to either bucket directly, so nothing reaches a
// public URL without passing through this check first.
//
// Requires an edge function secret: GOOGLE_VISION_API_KEY (Project
// Settings → Edge Functions → Secrets in the Supabase dashboard — no tool
// here can set it, same as STRIPE_SECRET_KEY before it). Fails closed
// (rejects the upload) if that secret isn't set, rather than silently
// publishing unmoderated images.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_VISION_API_KEY = Deno.env.get("GOOGLE_VISION_API_KEY");

const MAX_BYTES = 8 * 1024 * 1024;
const REJECT_LEVELS = new Set(["LIKELY", "VERY_LIKELY"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const kind = req.headers.get("x-upload-kind");
  if (kind !== "avatar" && kind !== "cover") {
    return json({ error: "Invalid upload kind" }, 400);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Sign in required" }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Sign in required" }, 401);
  const userId = userData.user.id;

  const bytes = new Uint8Array(await req.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_BYTES) {
    return json({ error: "Invalid image" }, 400);
  }

  if (!GOOGLE_VISION_API_KEY) {
    return json(
      {
        error:
          "Photo uploads are temporarily unavailable — try again shortly.",
      },
      503,
    );
  }

  let safe: Record<string, string> | null = null;
  try {
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: bytesToBase64(bytes) },
              features: [{ type: "SAFE_SEARCH_DETECTION" }],
            },
          ],
        }),
      },
    );
    if (!visionRes.ok) throw new Error(`Vision API ${visionRes.status}`);
    const visionData: any = await visionRes.json();
    safe = visionData?.responses?.[0]?.safeSearchAnnotation ?? null;
  } catch (_e) {
    return json({ error: "Couldn't check that photo — try again." }, 502);
  }
  if (!safe) return json({ error: "Couldn't check that photo — try again." }, 502);

  const flagged = ["adult", "violence", "racy"].some((k) =>
    REJECT_LEVELS.has(safe![k]),
  );
  if (flagged) {
    return json(
      {
        error:
          "That photo doesn't meet our content guidelines — try a different one.",
      },
      422,
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const bucket = kind === "avatar" ? "avatars" : "covers";
  const path = `${userId}/${kind}.jpg`;
  const { error: uploadErr } = await admin.storage
    .from(bucket)
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
  if (uploadErr) return json({ error: "Upload failed — try again." }, 500);

  const { data: pub } = admin.storage.from(bucket).getPublicUrl(path);
  if (!pub?.publicUrl) return json({ error: "Upload failed — try again." }, 500);
  // Cache-bust: same path every time (upsert), so the browser/CDN would
  // otherwise keep showing the old photo after a re-upload.
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  const column = kind === "avatar" ? "avatar_url" : "cover_url";
  await admin.from("users").update({ [column]: url }).eq("id", userId);

  return json({ url });
});
