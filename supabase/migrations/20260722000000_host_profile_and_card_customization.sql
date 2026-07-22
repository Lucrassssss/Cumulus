-- Host profile avatars + expanded Cumulus Pass card customization.
--
-- New columns on users: avatar_url (real uploaded photo, see the "avatars"
-- storage bucket below) plus card_border/card_layout/card_font alongside
-- the existing card_theme — together these four drive the expanded card
-- customization system (theme/color, border+material, layout, typography).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS card_border text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS card_layout text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS card_font text NOT NULL DEFAULT 'inter';

-- Public-safe cross-user profile view. users_self_read (existing RLS) only
-- allows a row's own owner (or an admin) to read it, which is correct for
-- email/stripe_connect_* but blocks the host-profile page and card previews
-- from ever reading another user's name/avatar/card/badges at all. Rather
-- than loosen the base table's RLS (which would also expose email and
-- Stripe Connect fields to anyone), expose only the fields meant to be
-- public through a dedicated view. security_invoker=false (the default,
-- named explicitly here for clarity) means this view reads through with the
-- view owner's privileges rather than the querying user's RLS — the
-- standard Postgres/Supabase pattern for a safe public-profile subset.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  id,
  name,
  display_name,
  avatar_url,
  card_theme,
  card_border,
  card_layout,
  card_font,
  card_bio,
  card_interests,
  card_fact,
  special_badges,
  created_at
FROM public.users;

-- New views in this schema pick up broad default privileges (INSERT/UPDATE/
-- DELETE/etc.) to anon/authenticated, not just SELECT — confirmed live after
-- the first version of this migration ran, and a real problem given
-- security_invoker=false above (a write through this view could otherwise
-- bypass users' own row-level security entirely). Revoke everything first,
-- then grant only what's actually intended.
REVOKE ALL ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Avatars bucket — same pattern as the existing event-flyers bucket: public
-- read (bucket-level, no storage.objects SELECT policy needed), writes
-- scoped to the caller's own folder (path prefixed by their auth.uid()).
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY avatars_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY avatars_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY avatars_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
