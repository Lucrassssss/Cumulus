-- ============================================================================
-- Fix: get_hosting_progress() hardcoded ageVerified:true for EVERY user, not
-- just admins.
--
-- 20260706010000_admin_bypass_hosting.sql redefined this function to give
-- admins eligible:true without meeting the Proof-of-Participation gates. Its
-- own doc comment says the bypass should be admin-only ("Admins are always
-- eligible; non-admins follow the normal gate"), but the ageVerified field
-- was hardcoded `true` unconditionally instead of being scoped to admins.
--
-- Effect of the bug: every user's host checklist showed step 1 ("Verify
-- you're 18 or over") as permanently done, and the "Verify with your device"
-- button never rendered — even though the real `eligible` gate underneath
-- (can_host_connections_event) still correctly checked the real
-- age_verified_at column. Non-admins could never actually complete step 1,
-- since the button to start Stripe Identity verification was hidden.
-- ============================================================================

create or replace function public.get_hosting_progress(p_user uuid default auth.uid())
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'ageVerified',         (
      exists(select 1 from public.admins where user_id = p_user)
      or (select age_verified_at is not null from public.users where id = p_user)
    ),
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
revoke all on function public.get_hosting_progress(uuid) from public;
grant execute on function public.get_hosting_progress(uuid) to authenticated;
