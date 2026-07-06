-- Create a SECURITY DEFINER helper to check if a user is the host of an event.
-- This bypasses RLS on the events table to break the mutual recursion loop between
-- events_select_attendee and attendees_self_read policies.
create or replace function public.is_event_host(p_event_id uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id and e.host_id = p_user
  );
$$;

revoke all on function public.is_event_host(uuid, uuid) from public, anon;
grant execute on function public.is_event_host(uuid, uuid) to authenticated;

-- Recreate the attendees_self_read policy using the is_event_host helper
drop policy if exists attendees_self_read on public.event_attendees;
create policy attendees_self_read on public.event_attendees
  for select to authenticated using (
    user_id = auth.uid()
    or is_admin()
    or public.is_event_host(event_id, auth.uid())
  );
