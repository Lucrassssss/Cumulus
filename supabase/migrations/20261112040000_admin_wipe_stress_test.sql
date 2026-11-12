-- One-tap cleanup for stress tests, callable only by an admin (is_admin()).
-- Removes every "#cumulus-stress-test" event (tickets, RSVPs, waitlist,
-- squads, reports, saves cascade) and every stress-host-*@cumulus-test.invalid
-- account (profile + login; follows cascade). Touches nothing else.
create or replace function public.admin_wipe_stress_test()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_events int; v_users int;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.events where description like '%#cumulus-stress-test%';
  get diagnostics v_events = row_count;
  delete from public.users where email like 'stress-host-%@cumulus-test.invalid';
  delete from auth.users where email like 'stress-host-%@cumulus-test.invalid';
  get diagnostics v_users = row_count;
  return jsonb_build_object('events', v_events, 'hosts', v_users);
end;
$$;
revoke execute on function public.admin_wipe_stress_test() from public, anon;
grant execute on function public.admin_wipe_stress_test() to authenticated;

-- Read-only counts for the Admin card.
create or replace function public.admin_stress_test_counts()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_admin() then jsonb_build_object(
    'events', (select count(*) from public.events where description like '%#cumulus-stress-test%'),
    'hosts', (select count(*) from public.users where email like 'stress-host-%@cumulus-test.invalid'))
  else null end
$$;
revoke execute on function public.admin_stress_test_counts() from public, anon;
grant execute on function public.admin_stress_test_counts() to authenticated;
