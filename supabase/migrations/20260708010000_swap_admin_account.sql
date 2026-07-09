-- ============================================================================
-- Cumulus — Swap admin account
-- ----------------------------------------------------------------------------
-- chafull@crick.ac.uk was a work email used to set up admin access during
-- development. Replace it with the real owner account before live testing.
-- ============================================================================

delete from public.admins
where user_id = (select id from auth.users where email = 'chafull@crick.ac.uk');

insert into public.admins (user_id)
select id from auth.users where email = 'gondoxml@gmail.com'
on conflict (user_id) do nothing;
