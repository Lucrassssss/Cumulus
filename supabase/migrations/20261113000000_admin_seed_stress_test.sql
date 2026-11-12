-- One-tap stress-test data, the counterpart of admin_wipe_stress_test().
-- Admin tab → "Load stress test" calls admin_seed_stress_test():
--   * 100 test host accounts (stress-host-NNN@cumulus-test.invalid — can't
--     receive mail, no password, can't be signed into)
--   * 216 "#cumulus-stress-test" events at real, verified London venues:
--     4 weekly series (6 weeks each), 12 live right now, the rest spread
--     over the next 4 weeks; several venues carry multiple events
--   * ~300 follows between test hosts (notify = false → no emails)
-- Dates are relative to now(), so a fresh load is always current.
create or replace function public._seed_stress_test()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venues text[] := array[
    'Village Underground|54 Holywell Ln, London EC2A 3NT|Shoreditch|51.52360628|-0.07852919',
    'Strongroom Venue|120-124 Curtain Rd, London EC2A 3PJ|Shoreditch|51.52597892|-0.08014197',
    'Hoxton Underbelly|11 Hoxton Square, London N1 6NU|Shoreditch|51.5280109|-0.08170077',
    'The Reliance|336 Old St, London EC1V 9DR|Shoreditch|51.52670874|-0.08141879',
    'Autograph|1 Rivington Place, London EC2A 3AY|Shoreditch|51.52628761|-0.07935507',
    'Curzon Soho|99 Shaftesbury Ave, London W1D 5DJ|Soho|51.51266588|-0.13056777',
    'Prince Charles Cinema|7 Leicester Pl, London WC2H 7BY|Soho|51.51148674|-0.130276',
    'The Sun and 13 Cantons|21 Great Pulteney St, London W1F 9NF|Soho|51.51270923|-0.13655041',
    'Rio Cinema|107 Kingsland High St, London E8 2PB|Dalston|51.54967094|-0.07551303',
    'Newcomer Wines Dalston|5 Dalston Ln, London E8 3DF|Dalston|51.54630684|-0.07481301',
    'Antro|30 Acre Ln, London SW2 5SG|Brixton|51.46076718|-0.11842674',
    'The Copper Tap|190-193 Peckham High St, London SE15 5EG|Peckham|51.47384028|-0.06405293',
    'Ash|48 Peckham High St, London SE15 5EF|Peckham|51.47239961|-0.06688293',
    'Camden Town Brewery Beer Hall|55-59 Wilkin St Mews, London NW5 3LN|Kentish Town|51.54687165|-0.14684189',
    'Hypha Gallery Kentish Town|2 Prince of Wales Rd, London NW5 2JU|Kentish Town|51.54663167|-0.14217016',
    'Notes Coffee Roasters & Bar|1 Pancras Sq, London N1C 4BU|King''s Cross|51.53297663|-0.12556006',
    'Everyman Hampstead|5 Holly Bush Vale, London NW3 6UA|Hampstead|51.55641945|-0.17891338',
    'Everyman Baker Street|96-98 Baker St, London W1U 6TJ|Marylebone|51.52048211|-0.15663652',
    'The Florist Arms|255 Globe Rd, London E2 0JD|Bethnal Green|51.52859494|-0.05137407',
    'The Wentworth Arms|127 Eric St, London E3 4SR|Mile End|51.52456694|-0.03366895',
    'Gloves Off|210 Ponsford St, London E9 6LH|Hackney|51.54705159|-0.04807398',
    'Clissold Park|Stoke Newington Church St, London N16 9JH|Stoke Newington|51.56083715|-0.08517035',
    'Esters|55 Kynaston Rd, London N16 0ED|Stoke Newington|51.56011243|-0.07805371',
    'The Prince|59 Kynaston Rd, London N16 0EB|Stoke Newington|51.56007768|-0.07843474',
    'Bernie Grant Arts Centre|Town Hall Approach Rd, London N15 4RX|Tottenham|51.58757919|-0.07325239',
    'Walthamstow Town Square Gardens|198A High St, London E17 7JH|Walthamstow|51.58371831|-0.02152851',
    'ARC Stratford|180 High St, London E15 2FF|Stratford|51.53567812|-0.00544309',
    'Humble Grape|20 Mackenzie Walk, London E14 5EH|Canary Wharf|51.504278|-0.021096',
    'Dabangg Kitchen|14 West Ln, London SE16 4NY|Bermondsey|51.49914878|-0.06027004',
    'The Enterprise Hub|1 Tiverton St, London SE1 6NT|Elephant & Castle|51.49656246|-0.0989422',
    'Garden Café|New Covent Garden Flower Market, London SW8 5PH|Vauxhall|51.48321488|-0.12752264',
    'The Clapham Tap|128 Clapham Manor St, London SW4 6ED|Clapham|51.46433072|-0.13535378',
    'Battersea Park Playground|Battersea Park, London SW11 4NJ|Battersea|51.47621677|-0.16124596',
    'Aragon House|247 New Kings Rd, London SW6 3BL|Fulham|51.47249118|-0.2005319',
    'Sphinx Fine Art|125 Kensington Church St, London W8 7LP|Notting Hill|51.50719096|-0.19474023',
    'White Horse|31 Uxbridge Rd, London W12 8LH|Shepherd''s Bush|51.50570432|-0.22790479',
    'The Stonemasons Arms|54 Cambridge Grove, London W6 0LA|Hammersmith|51.49437058|-0.23020982',
    'The Railway Tavern|28-29 The Quadrant, Richmond TW9 1DN|Richmond|51.46258911|-0.30251952',
    'BeatBox Bar Wembley|Unit 15 Boxpark, Olympic Way, Wembley HA9 0JT|Wembley|51.56042234|-0.27995045',
    'Fox and Firkin|316a Lewisham High St, London SE13 6JZ|Lewisham|51.45684002|-0.01419131',
    'Allpress Espresso|Belvedere Road, London SE19 2HP|Crystal Palace|51.415585|-0.076716',
    'Turf Projects|Unit 46-47 Trinity Court, Croydon CR0 1UQ|Croydon|51.37624584|-0.0991611'
  ];
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
  v_series text[] := array['Thursday Jazz Club|Live Music', 'Sunday Run Club|Wellness & Outdoors', 'Monday Board Games|Board Games', 'Wednesday Supper Club|Food & Drink'];
  v_i int; v_k int; v_n int; v_uid uuid; v_name text; v_ids uuid[] := array[]::uuid[];
  v_v text[]; v_c text; v_title text; v_start timestamptz; v_end timestamptz; v_events int := 0;
  v_nv int := array_length(v_venues, 1);
begin
  if exists (select 1 from public.events where description like '%#cumulus-stress-test%')
     or exists (select 1 from auth.users where email like 'stress-host-%@cumulus-test.invalid') then
    return jsonb_build_object('skipped', 'stress-test data already loaded — wipe it first');
  end if;

  for v_i in 1..100 loop
    v_name := v_pre[1 + (v_i - 1) % 18] || ' ' || v_suf[1 + ((v_i - 1) / 18 + (v_i - 1) % 18) % 12];
    v_uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
            format('stress-host-%s@cumulus-test.invalid', lpad(v_i::text, 3, '0')), '', now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('display_name', v_name, 'stress_test', true),
            now() - (random() * interval '200 days'), now(), '', '', '', '');
    v_ids := v_ids || v_uid;

    v_n := case when v_i <= 4 then 6 else 2 end;
    for v_k in 1..v_n loop
      -- weekly series keep one venue; everyone else moves around
      v_v := string_to_array(v_venues[1 + (case when v_i <= 4 then v_i * 5 else v_i * 3 + v_k * 7 end) % v_nv], '|');
      if v_i <= 4 then
        v_title := split_part(v_series[v_i], '|', 1);
        v_c := split_part(v_series[v_i], '|', 2);
        v_start := date_trunc('day', now()) + make_interval(days => v_i + 7 * (v_k - 1), hours => 19);
        v_end := v_start + interval '3 hours';
      else
        v_c := v_cat[1 + floor(random() * 9)::int];
        v_title := v_titles -> v_c ->> floor(random() * 4)::int;
        if v_i <= 16 and v_k = 1 then            -- 12 events live right now
          v_start := now() - make_interval(mins => 30 + floor(random() * 50)::int);
          v_end := now() + make_interval(mins => 90 + floor(random() * 90)::int);
        else
          v_start := date_trunc('day', now()) + make_interval(days => floor(random() * 28)::int, hours => 17 + floor(random() * 5)::int);
          if v_start < now() + interval '20 minutes' then v_start := v_start + interval '1 day'; end if;
          v_end := v_start + interval '3 hours';
        end if;
      end if;
      insert into public.events (title, category, host_id, host_name, venue, area, address, lat, lon,
                                 start_time, end_time, starts_at, ends_at, description, capacity, price, status)
      values (v_title, v_c, v_uid, v_name, v_v[1], v_v[3], v_v[2], v_v[4]::float8, v_v[5]::float8,
              v_start, v_end, v_start, v_end,
              format('%s at %s, %s. Stress-test listing, safe to delete. #cumulus-stress-test',
                     case when v_i <= 4 then 'Every week' else v_title || ' with ' || v_name end, v_v[1], v_v[3]),
              (array[30, 40, 60, 80, 120, 200])[1 + floor(random() * 6)::int],
              (array[0, 0, 5, 8, 10, 12, 15, 20])[1 + floor(random() * 8)::int], 'active');
      v_events := v_events + 1;
    end loop;
  end loop;

  insert into public.host_follows (follower_id, host_id, notify)
  select distinct on (f, h) f, h, false
    from (select v_ids[1 + floor(random() * 100)::int] f, v_ids[1 + floor(random() * 100)::int] h
            from generate_series(1, 340)) x
   where f <> h
  on conflict do nothing;

  return jsonb_build_object('events', v_events, 'hosts', 100);
end;
$$;
revoke execute on function public._seed_stress_test() from public, anon, authenticated;

create or replace function public.admin_seed_stress_test()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return public._seed_stress_test();
end;
$$;
revoke execute on function public.admin_seed_stress_test() from public, anon;
grant execute on function public.admin_seed_stress_test() to authenticated;
