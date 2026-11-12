-- Account extras: email preferences + shareable "my plans" link.

-- 1. Email preferences (honoured by remind-upcoming and
--    notify-followers-new-event). Default on — both are emails people asked
--    for by booking / tapping the bell; Account lets them switch either off.
alter table public.users add column if not exists email_reminders boolean not null default true;
alter table public.users add column if not exists email_followed  boolean not null default true;

-- 2. Shareable plans. A random token, NOT the user id (host ids are public),
--    minted only when the user taps "Share my plans" and revocable by
--    resetting it. Anyone holding the link sees first name + upcoming events.
alter table public.users add column if not exists plans_token text unique;

create or replace function public.ensure_plans_token(p_reset boolean default false)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_tok text;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select plans_token into v_tok from public.users where id = v_uid;
  if v_tok is null or p_reset then
    v_tok := replace(gen_random_uuid()::text, '-', '');
    update public.users set plans_token = v_tok where id = v_uid;
  end if;
  return v_tok;
end;
$$;
revoke execute on function public.ensure_plans_token(boolean) from public, anon;
grant execute on function public.ensure_plans_token(boolean) to authenticated;

create or replace function public.shared_plans(p_token text)
returns table (owner_name text, event_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(u.display_name, ''), split_part(u.name, ' ', 1)), t.event_id
    from public.users u
    join public.tickets t on coalesce(t.claimed_by, t.user_id) = u.id
    join public.events e on e.id = t.event_id
   where length(coalesce(p_token, '')) >= 24
     and u.plans_token = p_token
     and t.status in ('active', 'checked_in')
     and e.status = 'active'
     and e.start_time > now() - interval '6 hours'
  union
  select coalesce(nullif(u.display_name, ''), split_part(u.name, ' ', 1)), null::uuid
    from public.users u
   where length(coalesce(p_token, '')) >= 24 and u.plans_token = p_token
$$;
grant execute on function public.shared_plans(text) to anon, authenticated;
