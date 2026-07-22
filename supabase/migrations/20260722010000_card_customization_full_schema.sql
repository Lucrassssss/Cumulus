-- Remaining fields for the full card-customization redesign. card_theme
-- (existing) becomes the background-style key, card_bio becomes the
-- motto/tagline, card_interests becomes the area/interest tags (comma-
-- joined, matching its existing text type) — repurposed rather than
-- duplicated, since a fresh design still reuses columns that already fit.
-- Two genuinely new fields: an accent-color key (parallel to card_theme/
-- card_border/card_layout/card_font) and the up-to-3 featured badge ids,
-- array-typed to match the existing special_badges column's own convention.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS card_accent text NOT NULL DEFAULT 'gold',
  ADD COLUMN IF NOT EXISTS card_featured_badges text[] NOT NULL DEFAULT '{}';

-- CREATE OR REPLACE VIEW can only append columns at the end, not reorder
-- them, so drop and recreate rather than fight that constraint.
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
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
