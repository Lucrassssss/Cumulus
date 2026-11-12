-- Public tickets-sold count per event (no names, no buyers — just a number),
-- so "N going" / "X of Y left" / sold-out reflect paid tickets too. Before
-- this the app counted RSVP rows, which only free registrations create, so
-- buying a ticket never moved the counter. tickets RLS keeps rows private
-- to their owners; this SECURITY DEFINER aggregate exposes counts only.
create or replace function public.event_ticket_counts(p_event uuid default null)
returns table (event_id uuid, sold integer)
language sql
stable
security definer
set search_path = public
as $$
  select t.event_id, count(*)::int
    from public.tickets t
   where t.status in ('active', 'checked_in')
     and (p_event is null or t.event_id = p_event)
   group by t.event_id
$$;
grant execute on function public.event_ticket_counts(uuid) to anon, authenticated;
