-- Banner (cover) photos for the host profile page, and moderation on both
-- avatar and cover uploads. Adds a new `covers` bucket alongside the
-- existing `avatars` one, and — critically — drops the direct
-- client-writable storage policies on avatars, since uploads now route
-- exclusively through the moderate-image-upload edge function (which uses
-- the service-role key, bypassing RLS entirely). Without dropping these,
-- an authenticated user could still write straight to storage and skip
-- moderation altogether.

DROP POLICY IF EXISTS avatars_insert ON storage.objects;
DROP POLICY IF EXISTS avatars_update ON storage.objects;
DROP POLICY IF EXISTS avatars_delete ON storage.objects;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;
-- No client-write policies on `covers` either — same reasoning as above.
-- Both buckets stay publicly readable (bucket-level `public = true`),
-- just not publicly *writable* outside the moderation gate.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS cover_url text;

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  id,
  name,
  display_name,
  avatar_url,
  cover_url,
  card_theme,
  card_border,
  card_layout,
  card_font,
  card_accent,
  card_bio,
  card_interests,
  card_fact,
  card_featured_badges,
  special_badges,
  created_at
FROM public.users;

REVOKE ALL ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
