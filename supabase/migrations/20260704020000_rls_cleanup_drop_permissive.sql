-- ============================================================================
-- Cumulus — drop leftover permissive RLS policies (security fix)
-- ----------------------------------------------------------------------------
-- The project carried wide-open "{public}" policies from its ORIGINAL setup
-- (predating the auth-hardening migration and not tracked in this repo). RLS
-- OR-combines permissive policies, so a single `WITH CHECK (true)` / `USING
-- (true)` policy on {public} silently reopened each table to the anon key and
-- defeated the hardened {authenticated} policies. The Supabase security advisor
-- flagged them (rls_policy_always_true). Worst offenders:
--   • public read users   → anyone could read every user's email
--   • public update users  → anyone could edit any profile
--   • public insert events → bypassed the host_id = auth.uid() check
--   • same on rsvps / friends / chat_messages
-- This migration removes all of them, tightens the event-submission queue to
-- signed-in users, and locks down the SECURITY DEFINER helper functions exposed
-- over /rest/v1/rpc. Already applied to production on 2026-07-04; kept here so
-- the repo stays the source of truth. Idempotent.
-- ============================================================================

drop policy if exists "public insert chat"    on public.chat_messages;
drop policy if exists "public read chat"      on public.chat_messages;

drop policy if exists "public insert events"  on public.events;
drop policy if exists "public read events"    on public.events;

drop policy if exists "public delete friends" on public.friends;
drop policy if exists "public insert friends" on public.friends;
drop policy if exists "public read friends"   on public.friends;

drop policy if exists "public delete rsvps"   on public.rsvps;
drop policy if exists "public insert rsvps"   on public.rsvps;
drop policy if exists "public read rsvps"     on public.rsvps;

drop policy if exists "public insert users"   on public.users;
drop policy if exists "public read users"     on public.users;
drop policy if exists "public update users"   on public.users;

-- Event submissions to the review queue require a signed-in user (was anon+auth).
drop policy if exists pending_events_insert on public.pending_events;
create policy pending_events_insert on public.pending_events
  for insert to authenticated with check (true);

-- Lock down SECURITY DEFINER helpers exposed over /rest/v1/rpc:
--  • trigger functions must never be RPC-callable
--  • app_role is internal-only (no active policy uses it yet)
--  • is_admin stays callable by authenticated (RLS policies call it), not anon
--  • validate_curator_code stays anon-callable BY DESIGN (invite validation)
revoke all     on function public.handle_new_user()  from public, anon, authenticated;
revoke all     on function public.protect_user_role() from public, anon, authenticated;
revoke all     on function public.app_role(uuid)      from public, anon, authenticated;
revoke execute on function public.is_admin()          from public, anon;
grant  execute on function public.is_admin()          to authenticated;
