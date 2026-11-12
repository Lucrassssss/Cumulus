-- Removes ALL stress-test data (v1: 100 events; v2 2026-11-12: +100 test
-- host accounts, +108 events, follows). Same as Admin tab → "Wipe stress
-- test" (public.admin_wipe_stress_test()).
--
-- Preview:
--   select count(*) from public.events where description like '%#cumulus-stress-test%';
--   select count(*) from public.users  where email like 'stress-host-%@cumulus-test.invalid';

delete from public.events where description like '%#cumulus-stress-test%';
delete from public.users  where email like 'stress-host-%@cumulus-test.invalid';
delete from auth.users    where email like 'stress-host-%@cumulus-test.invalid';
