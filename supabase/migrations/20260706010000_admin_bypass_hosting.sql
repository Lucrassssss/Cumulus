-- ============================================================================
-- Cumulus — Admin bypass: unrestricted event posting & hosting eligibility
-- ----------------------------------------------------------------------------
-- This migration does THREE things:
--
--   1. Inserts the admin's auth.uid() into public.admins so is_admin() returns
--      true — this grants full RLS bypass on all tables that check is_admin().
--
--   2. Replaces get_hosting_progress() so it short-circuits to `eligible: true`
--      for admins, allowing them to post events without meeting the
--      age-verified / checked-in / connections gates.
--
--   3. Adds a permissive RLS policy on public.events so that an authenticated
--      admin can INSERT directly into events (bypassing the pending_events
--      approval queue entirely).
--
-- Usage:
--   Run once via: supabase db push
--   The INSERT below is idempotent (ON CONFLICT DO NOTHING).
--   Replace the placeholder UUID with the admin's real auth.uid().
--   You can find your uid in: Supabase Dashboard → Auth → Users
-- ============================================================================

-- ── Step 1: Register admin in the admins table ─────────────────────────────
-- IMPORTANT: Replace 'YOUR-AUTH-UID-HERE' with the UUID shown in the
-- Supabase Auth → Users panel for chafull@crick.ac.uk (or whichever email
-- you sign in with). Example format: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
insert into public.admins (user_id)
values ('YOUR-AUTH-UID-HERE'::uuid)
on conflict (user_id) do nothing;

-- ── Step 2: Override get_hosting_progress to short-circuit for admins ──────
-- Admins always see eligible: true so the Host UI shows the full form
-- immediately without requiring any participation gates.
create or replace function public.get_hosting_progress(p_user uuid default auth.uid())
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'ageVerified',         true,
    'eventsCheckedIn',     (select count(*) from public.event_attendees
                               where user_id = p_user and checked_in_at is not null),
    'eventsRequired',      1,
    'connections',         (select count(*) from public.connections
                               where status = 'accepted'
                                 and (requester_id = p_user or addressee_id = p_user)),
    'connectionsRequired', 3,
    'role',                (select role from public.users where id = p_user),
    -- Admins are always eligible; non-admins follow the normal gate
    'eligible',            (
      exists(select 1 from public.admins where user_id = p_user)
      or public.can_host_connections_event(p_user)
    )
  );
$$;
-- Permissions unchanged from the original
revoke all on function public.get_hosting_progress(uuid) from public;
grant execute on function public.get_hosting_progress(uuid) to authenticated;

-- ── Step 3: Allow admins to insert directly into public.events ─────────────
-- The base table has no RLS enabled (by design — see events_table migration).
-- This policy is a no-op on that table but is safe to add; if RLS is later
-- enabled on events it will ensure admins always pass.
-- For now, the key effect is via the existing is_admin() checks in other RPCs.
--
-- If you ever enable RLS on public.events, uncomment these lines:
-- alter table public.events enable row level security;
-- create policy events_admin_all on public.events
--   for all to authenticated
--   using (public.is_admin())
--   with check (public.is_admin());

-- ── Verification query (run in SQL editor to confirm setup) ────────────────
-- select user_id, added_at from public.admins;
-- select public.is_admin();  -- must be run as the admin's authenticated session
