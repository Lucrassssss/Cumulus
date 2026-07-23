-- Reverting the moderate-image-upload edge function + Google Cloud Vision
-- SafeSearch gate added in 20260723000000_moderated_avatar_and_cover_
-- uploads.sql. Per-upload AI moderation is a real ongoing cost and a
-- server round-trip this app doesn't need: hosts already pass a real
-- identity check before they can publish anything (Twilio SMS OTP +
-- Stripe Connect — see the host-application/Connect-onboarding flow), and
-- that friction is the actual anti-abuse gate. A troll doesn't link a
-- real phone number and bank account just to upload one bad flyer.
-- Anything that slips through gets caught by the community instead — see
-- the event_reports table + auto-hide trigger added alongside this
-- migration, which cost £0 and don't slow down the publish flow.
--
-- Avatars/covers go back to direct client uploads, scoped to the caller's
-- own storage folder — the exact same pattern already used for every
-- other bucket in this app (event-flyers etc), and what avatars used
-- before the moderation detour.
--
-- The moderate-image-upload edge function itself is left deployed (there's
-- no migration-managed way to undeploy a function) but nothing calls it
-- after this change; delete it from the Supabase dashboard's Edge
-- Functions list if you want it gone entirely — harmless either way since
-- it's now unreachable dead code, same as this app leaves other
-- superseded pieces in place rather than force a destructive cleanup.

CREATE POLICY avatars_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY avatars_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY avatars_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY covers_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY covers_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY covers_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
