-- Backfill public.users for any auth.users row that has no profile.
--
-- Accounts created before on_auth_user_created/handle_new_user existed (or
-- whose profile was lost in 20260723030000's restore) authenticate fine but
-- have no public.users row. start() then can't load a profile and drops a
-- perfectly valid session into guest mode, so the person looks logged out.
-- Same defaults handle_new_user() uses; idempotent.
insert into public.users (id, email, name, display_name)
select u.id,
       u.email,
       coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
       coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
from auth.users u
where u.email is not null
  and not exists (select 1 from public.users p where p.id = u.id)
on conflict (id) do nothing;
