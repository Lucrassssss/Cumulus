-- Drop the leftover fully-permissive "public" policies that predate the auth
-- hardening. RLS OR-combines permissive policies, so a single WITH CHECK (true)
-- / USING (true) policy on {public} reopened each table to anon and defeated the
-- hardened {authenticated} policies. Remove them so only the scoped ones remain.

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
--  • is_admin stays callable by authenticated (used inside policies), not anon
--  • validate_curator_code stays anon-callable BY DESIGN (invite validation)
revoke all on function public.handle_new_user()   from public, anon, authenticated;
revoke all on function public.protect_user_role()  from public, anon, authenticated;
revoke all on function public.app_role(uuid)       from public, anon, authenticated;
revoke execute on function public.is_admin()       from public, anon;
grant  execute on function public.is_admin()       to authenticated;;
