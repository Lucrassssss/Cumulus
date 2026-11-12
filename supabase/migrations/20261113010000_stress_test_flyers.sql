-- Mock flyers for stress-test events: assets/flyers/<title-slug>.svg (drawn
-- by scripts/gen_flyers.py, one per title the seeder uses). "Load stress
-- test" now attaches them, so test events look like real listings.
create or replace function public._stress_apply_flyers()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_n int;
begin
  update public.events
     set photo_url = 'assets/flyers/' || trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) || '.svg'
   where description like '%#cumulus-stress-test%';
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke execute on function public._stress_apply_flyers() from public, anon, authenticated;

create or replace function public.admin_seed_stress_test()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_res jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  v_res := public._seed_stress_test();
  if v_res ? 'events' then perform public._stress_apply_flyers(); end if;
  return v_res;
end;
$$;
revoke execute on function public.admin_seed_stress_test() from public, anon;
grant execute on function public.admin_seed_stress_test() to authenticated;
