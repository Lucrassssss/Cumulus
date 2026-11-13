-- Every signed-in account must have a public.users profile: tickets,
-- RSVPs and follows all reference it. on_auth_user_created makes it at
-- sign-up, but an account whose profile row went missing could still sign
-- in — and then every purchase failed in the Stripe webhook on
-- tickets_user_id_fkey (the app just waited on "securing your tickets").
--
-- 1) ensure_user_profile(uid): idempotently (re)creates the profile from
--    auth.users. Called by the stripe-webhook before writing tickets.
-- 2) Backfill any accounts that are missing one right now.
create or replace function public.ensure_user_profile(p_uid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_name text;
begin
  if exists (select 1 from public.users where id = p_uid) then
    return false;
  end if;
  select email, coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
    into v_email, v_name
    from auth.users where id = p_uid;
  if v_email is null then
    return false; -- no such sign-in account
  end if;
  insert into public.users (id, email, name, display_name)
  values (p_uid, v_email, v_name, v_name)
  on conflict (id) do nothing;
  return true;
end;
$$;
revoke execute on function public.ensure_user_profile(uuid) from public, anon, authenticated;

insert into public.users (id, email, name, display_name)
select a.id, a.email,
       coalesce(a.raw_user_meta_data->>'display_name', split_part(a.email, '@', 1)),
       coalesce(a.raw_user_meta_data->>'display_name', split_part(a.email, '@', 1))
  from auth.users a
 where not exists (select 1 from public.users u where u.id = a.id)
   and a.email is not null
on conflict (id) do nothing;
