-- Stress test v2 (2026-11-12): 100 REAL test host accounts.
--   * 46 of them take over the existing 100 "#cumulus-stress-test" events
--     (matched on host_name, so weekly series stay with one host).
--   * The other 54 each host 2 new events at the same verified real London
--     venues → 208 stress events in total.
--   * ~300 follows between test hosts (notify = false, so no emails).
-- Every account: email stress-host-NNN@cumulus-test.invalid (.invalid can
-- never receive mail), confirmed, NO password — nobody can sign in as them.
-- Wipe it all: Admin tab → "Wipe stress test", or wipe_stress_test.sql.

do $$
declare
  v_names text[];
  v_new text[] := array[]::text[];
  v_pre text[] := array['Velvet','Neon','Copper','Saffron','Harbour','Willow','Paper','Cobalt','Static','Golden','Hidden','Wild','Lantern','Signal','Northern','Rooftop','Basement','Marigold'];
  v_suf text[] := array['Hall','Rooms','Assembly','Supper Club','Collective','Sessions','Society','Social','Works','House','Club','Presents'];
  v_cat text[] := array['Board Games','Creative','Food & Drink','Gaming','Live Music','Meetups','Movie Nights','Tech & Talks','Wellness & Outdoors'];
  v_titles jsonb := '{
    "Board Games":["Strategy Night","Cosy Co-op Games","Big Box Sunday","Deduction Club"],
    "Creative":["Life Drawing","Zine Workshop","Clay & Wine","Print Club"],
    "Food & Drink":["Supper Club","Natural Wine Tasting","Dumpling Workshop","Street Food Social"],
    "Gaming":["Retro Arcade Night","Mario Kart Cup","Indie Games Showcase","Speedrun Social"],
    "Live Music":["Late Night Jazz","Indie Showcase","Soul Sessions","Folk in the Round"],
    "Meetups":["Founders & Friends","New in London Social","Run & Brunch","Language Exchange"],
    "Movie Nights":["Cult Classics","Rooftop Cinema","Double Bill","Short Film Night"],
    "Tech & Talks":["AI After Hours","Design Crit","Lightning Talks","Hack Night"],
    "Wellness & Outdoors":["Sunrise Yoga","Sound Bath","Park Run Social","Breathwork"]
  }';
  v_inst uuid := '00000000-0000-0000-0000-000000000000';
  v_i int;
  v_name text;
  v_uid uuid;
  v_ids uuid[] := array[]::uuid[];
  v_venue record;
  v_c text;
  v_start timestamptz;
begin
  select array_agg(distinct host_name order by host_name) into v_names
    from public.events where description like '%#cumulus-stress-test%';

  -- 54 new, unique host names
  foreach v_name in array v_pre loop
    for v_i in 1..array_length(v_suf, 1) loop
      exit when array_length(v_new, 1) >= 100 - array_length(v_names, 1);
      if not (v_name || ' ' || v_suf[v_i]) = any(v_names) and (v_i + length(v_name)) % 4 = 0 then
        v_new := v_new || (v_name || ' ' || v_suf[v_i]);
      end if;
    end loop;
  end loop;
  v_i := 0;
  while array_length(v_new, 1) < 100 - array_length(v_names, 1) loop
    v_i := v_i + 1;
    v_name := v_pre[1 + (v_i % array_length(v_pre, 1))] || ' ' || v_suf[1 + ((v_i * 7) % array_length(v_suf, 1))];
    if not v_name = any(v_names || v_new) then v_new := v_new || v_name; end if;
  end loop;
  v_names := v_names || v_new;

  -- 100 accounts (the on_auth_user_created trigger makes public.users rows)
  for v_i in 1..100 loop
    v_uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, recovery_token, email_change_token_new, email_change)
    values (v_inst, v_uid, 'authenticated', 'authenticated',
            format('stress-host-%s@cumulus-test.invalid', lpad(v_i::text, 3, '0')), '', now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('display_name', v_names[v_i], 'stress_test', true),
            now() - (random() * interval '200 days'), now(), '', '', '', '');
    v_ids := v_ids || v_uid;
  end loop;

  -- existing stress events → their host's account
  update public.events e set host_id = u.id
    from public.users u
   where e.description like '%#cumulus-stress-test%'
     and u.email like 'stress-host-%@cumulus-test.invalid'
     and u.display_name = e.host_name;

  -- 2 new events for each of the 54 new hosts, at real verified venues
  for v_i in (array_length(v_names, 1) - array_length(v_new, 1) + 1)..100 loop
    for v_venue in
      select distinct on (venue) venue, address, area, lat, lon
        from public.events where description like '%#cumulus-stress-test%'
       order by venue, random() limit 2 offset (v_i * 3) % 60
    loop
      v_c := v_cat[1 + floor(random() * array_length(v_cat, 1))::int];
      v_start := date_trunc('day', now()) + make_interval(days => floor(random() * 28)::int, hours => 17 + floor(random() * 5)::int);
      if v_start < now() then v_start := v_start + interval '1 day'; end if;
      insert into public.events (title, category, host_id, host_name, venue, area, address, lat, lon,
                                 start_time, end_time, starts_at, ends_at, description, capacity, price, status)
      values (v_titles -> v_c ->> floor(random() * 4)::int, v_c, v_ids[v_i], v_names[v_i],
              v_venue.venue, v_venue.area, v_venue.address, v_venue.lat, v_venue.lon,
              v_start, v_start + interval '3 hours', v_start, v_start + interval '3 hours',
              format('Hosted by %s at %s. Stress-test listing, safe to delete. #cumulus-stress-test', v_names[v_i], v_venue.venue),
              (array[30, 40, 60, 80, 120, 200])[1 + floor(random() * 6)::int],
              (array[0, 0, 5, 8, 10, 12, 15, 20])[1 + floor(random() * 8)::int], 'active');
    end loop;
  end loop;

  -- ~300 follows between test hosts, no notifications
  insert into public.host_follows (follower_id, host_id, notify)
  select distinct on (f, h) f, h, false
    from (select v_ids[1 + floor(random() * 100)::int] f, v_ids[1 + floor(random() * 100)::int] h
            from generate_series(1, 340)) x
   where f <> h
  on conflict do nothing;
end $$;
