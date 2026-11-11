-- Removes the 100 map stress-test events (inserted 2026-11-11).
-- Every one carries the marker "#cumulus-stress-test" in its description;
-- nothing else does. Any tickets / RSVPs / waitlist / squads / reports /
-- promo codes / payouts on them go too (all FKs are ON DELETE CASCADE).
--
-- Preview first (should say 100):
--   select count(*) from public.events where description like '%#cumulus-stress-test%';

delete from public.events
where description like '%#cumulus-stress-test%';
