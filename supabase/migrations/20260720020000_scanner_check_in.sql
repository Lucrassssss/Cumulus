-- ============================================================================
-- Cumulus — host scanner check-in RPC
-- ----------------------------------------------------------------------------
-- tickets_host_read (Phase A migration) already lets a host SELECT the
-- guestlist for their own events; there was no write path for marking a
-- ticket checked-in. This RPC is that write path: SECURITY DEFINER so it can
-- update a row the host doesn't otherwise have UPDATE rights on, but it
-- verifies the caller actually hosts the ticket's event (or is_admin())
-- before touching anything.
-- ============================================================================
create or replace function public.check_in_ticket(p_ticket_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row  public.tickets%rowtype;
  v_host uuid;
begin
  select * into v_row from public.tickets where ticket_id = p_ticket_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  select host_id into v_host from public.events where id = v_row.event_id;
  if v_host is distinct from auth.uid() and not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  update public.tickets set status = 'checked_in' where id = v_row.id;

  return jsonb_build_object(
    'ok', true,
    'ticket_id', v_row.ticket_id,
    'purchaser_name', v_row.purchaser_name
  );
end;
$$;
revoke all on function public.check_in_ticket(text) from public;
grant execute on function public.check_in_ticket(text) to authenticated;
