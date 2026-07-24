-- ============================================================================
-- Guest browsing: let a signed-out visitor see the map/list/calendar/event
-- detail pages. "No gate should stand between a visitor and the map" is a
-- stated product principle (PRODUCT.md), and every ticketing competitor this
-- app is benchmarked against (Eventbrite, DICE, Skiddle, Fatsoma, Resident
-- Advisor) allows free browsing, gating only at checkout. Booking, following
-- a host, and the account page still correctly require sign-up — this is
-- read-only.
--
-- Why this migration exists despite events already having a SELECT policy:
-- the events table's RLS history is genuinely ambiguous from the migration
-- log alone. 20260704010000_auth_hardening.sql created a policy named
-- `events_read` scoped `for select to authenticated using (true)` — no anon.
-- 20260720010000_pivot_frictionless_ticketing.sql later tried to widen this
-- to anon+authenticated under a *different* name (events_select_all), but
-- only inside `if not exists (... policyname = 'events_read')` — i.e. it
-- deliberately skips creating the wider policy whenever `events_read` is
-- still present, on the theory an even-earlier undocumented manual Dashboard
-- patch might already cover it. 20260721060000_advisor_remediation.sql then
-- dropped the separate events_admin_all policy, explicitly relying on
-- `events_read (qual true)` as the sole reason admins (and, as a side
-- effect, literally any authenticated user) could still see hidden/
-- cancelled events. Net effect: the live database almost certainly still
-- only grants SELECT to `authenticated` (no anon at all), AND that one
-- policy is unconditional — any signed-in user can currently see every
-- other host's hidden/cancelled events too, not just their own.
--
-- Rather than lean on that ambiguous history further, this migration
-- deterministically drops every SELECT-policy name this table has carried
-- and creates three narrower, explicit replacements:
--   1. events_select_public — anon + authenticated, active events only.
--      This is the new guest-browsing surface.
--   2. events_select_own_host — authenticated, a host's own events
--      regardless of status (needed for the "My hosted events" cancel
--      panel and seeing your own event after it's auto-hidden pending
--      review — this previously worked only as an accidental side effect
--      of the blanket `using (true)` policy).
--   3. events_select_admin — authenticated admins, every event regardless
--      of status (Admin panel's reported-events review).
-- The combined effect matches what the blanket policy accidentally allowed
-- for hosts/admins, while no longer leaking every other host's hidden
-- events to any random signed-in user.
drop policy if exists events_read           on public.events;
drop policy if exists events_select_all     on public.events;
drop policy if exists events_select_public  on public.events;
drop policy if exists events_select_host    on public.events;
drop policy if exists events_select_attendee    on public.events;
drop policy if exists events_select_connections on public.events;
drop policy if exists events_select_own_host on public.events;
drop policy if exists events_select_admin    on public.events;

create policy events_select_public on public.events
  for select to anon, authenticated
  using (status = 'active');

create policy events_select_own_host on public.events
  for select to authenticated
  using (host_id = auth.uid());

create policy events_select_admin on public.events
  for select to authenticated
  using (public.is_admin());

-- rsvps: the "N going" count shown in the pin tooltip and event detail page
-- reads this table (loadAllRsvps/attendeesFor). Same ambiguity as above —
-- 20260704010000_auth_hardening.sql's `rsvps_read` policy is authenticated-
-- only, so a guest currently sees "no one yet" on every event regardless of
-- real RSVPs. Widen read-only to anon for the same reason as events: RSVP
-- counts are public social proof shown on a public event page, same as any
-- competitor's attendee count.
drop policy if exists rsvps_read on public.rsvps;
create policy rsvps_read on public.rsvps
  for select to anon, authenticated
  using (true);
