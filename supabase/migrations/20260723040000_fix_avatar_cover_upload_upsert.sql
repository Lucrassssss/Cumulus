-- Root cause of "photo upload isn't working": avatar/cover uploads use
-- upload(..., { upsert: true }) (one slot per user, overwritten on
-- re-upload), which — unlike the plain upsert:false insert
-- uploadHostFlyer() uses — requires Storage's server-side upsert logic to
-- first check whether an object already exists at that path before
-- deciding insert vs. update. That existence check needs a SELECT RLS
-- policy on storage.objects; the migration that restored direct client
-- uploads (20260723010000_revert_image_moderation.sql) only added INSERT/
-- UPDATE/DELETE, following the same "public buckets don't need a SELECT
-- policy" precedent as event-flyers — true for a plain insert, not true
-- for an upsert. Every avatar/cover upload attempt has been failing with
-- a 400 from the Storage API since that migration (confirmed live via
-- storage logs: 0 rows ever landed in either bucket, vs 7 successful
-- event-flyers uploads in the same window). Scoped to the caller's own
-- folder, same as every other policy on these buckets — this does not
-- expose object rows to other users; public read still goes through the
-- bucket's public CDN path, unrelated to this authenticated-role check.
CREATE POLICY avatars_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY covers_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
