-- ============================================================================
-- Fix: handle_new_user() never set the required "name" column on
-- public.users, only "display_name". public.users.name is NOT NULL with no
-- default (a legacy column predating the Velvet Rope display_name column),
-- so every new signup's insert violated that constraint and raised inside
-- the AFTER INSERT trigger on auth.users -- rolling back the whole signup,
-- silently, for every single new user. Existing sessions (auth.users row
-- already present) kept working since the app doesn't re-run this trigger,
-- which is how the bug went unnoticed: an account could sign in and use a
-- cached session with no public.users row at all, only failing on features
-- that actually query it (host checklist, cards, friends, etc).
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  i int := 0;
  v_code text;
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1));

  insert into public.users (id, email, name, display_name)
  values (new.id, new.email, v_name, v_name)
  on conflict (id) do nothing;

  while i < 3 loop
    v_code := public.gen_invite_code();
    begin
      insert into public.invite_codes (code, kind, owner_id, uses_left)
      values (v_code, 'friend', new.id, 1);
      i := i + 1;
    exception when unique_violation then
      -- extremely rare code collision; just try another
      null;
    end;
  end loop;

  return new;
end;
$$;
