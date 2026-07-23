-- Root cause of "can't create new events": handle_new_user() was already
-- fixed once (20260708000000_fix_handle_new_user_missing_name.sql) for
-- silently omitting public.users.name (NOT NULL, no default) on every new
-- signup, which aborted the whole AFTER INSERT trigger transaction on
-- auth.users. The pivot migration
-- (20260720010000_pivot_frictionless_ticketing.sql) redefined
-- handle_new_user() to drop the invite-code minting logic and, in the
-- process, silently regressed the exact same bug — the simplified version
-- went back to inserting only (id, email, display_name). Every signup
-- since that pivot has been failing to create its public.users mirror row.
-- Re-applying the 2026-07-08 fix here, on top of the current (invite-free)
-- version.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1));
  insert into public.users (id, email, name, display_name)
  values (new.id, new.email, v_name, v_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Data repair: the site owner's own public.users row was separately wiped
-- by the "Clear all users" admin action (deletes every row in public.users
-- with no exclusion for the calling admin's own account) — auth.users and
-- public.admins were untouched, so is_admin() still passed, but any insert
-- needing host_id to satisfy events_host_id_fkey (references public.users)
-- failed. Backfills the missing row for every existing auth.users account
-- that has none, using the same shape handle_new_user() would have used.
insert into public.users (id, email, name, display_name)
select u.id, u.email,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email,'@',1)),
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email,'@',1))
from auth.users u
left join public.users pu on pu.id = u.id
where pu.id is null;
