-- ============================================================================
-- Cumulus — pivot to a frictionless, zero-host-fee ticketing utility
-- ----------------------------------------------------------------------------
-- Strips the "velvet rope" curator/connections gating (every event is now
-- public), adds the tables the app has been missing entirely (tickets did
-- not exist before this migration — every purchase silently failed to
-- persist), adds Squad ticket-claiming, a payout/trust-tier bookkeeping
-- system (status-tracking only — no real PSP/fund movement is wired up
-- anywhere in this codebase), and reworks the map's GeoJSON RPC onto real
-- PostGIS geography + a micro-payload.
--
-- Kept as-is, deliberately: users.role/user_role enum, is_admin()/app_role(),
-- event_attendees + check_into_event() (repurposed for the real host scanner
-- in the frontend phase), admins, pending_events + its notification trigger.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Simplify events: drop the tiered velvet-rope RLS, make every event
--    publicly readable, ownership-gated for writes.
--
-- NOTE: live DB already carried an equivalent simplified policy set from an
-- earlier manual patch not reflected in any migration file (events_read
-- select-true, events_insert_own, events_modify_own, events_delete_own,
-- events_admin_all is_admin()-for-all) — those already do exactly what a
-- fresh events_select_all/events_insert_own/etc. would, so this migration
-- only drops the old tiered policies rather than duplicating them. On a
-- from-scratch database (no manual patch applied), also run the
-- create-policy block below so the same end state is reached either way.
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists events_insert_partner    on public.events;
drop policy if exists events_insert_eventee    on public.events;
drop policy if exists events_select_public     on public.events;
drop policy if exists events_select_host       on public.events;
drop policy if exists events_select_attendee   on public.events;
drop policy if exists events_select_connections on public.events;
drop policy if exists events_modify_host       on public.events;
drop policy if exists events_delete_host       on public.events;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'events' and policyname = 'events_read') then
    create policy events_select_all on public.events
      for select to anon, authenticated using (true);
    create policy events_insert_own on public.events
      for insert to authenticated
      with check (host_id = auth.uid() or public.is_admin());
    create policy events_update_own on public.events
      for update to authenticated
      using (host_id = auth.uid() or public.is_admin())
      with check (host_id = auth.uid() or public.is_admin());
    create policy events_delete_own on public.events
      for delete to authenticated
      using (host_id = auth.uid() or public.is_admin());
  end if;
end $$;

alter table public.events drop column if exists visibility;
drop type if exists public.event_visibility;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Drop the velvet-rope/curator gating machinery entirely.
-- ─────────────────────────────────────────────────────────────────────────
drop function if exists public.validate_curator_code(text);
drop table if exists public.curator_codes cascade;

drop function if exists public.can_host_connections_event(uuid);
drop function if exists public.get_hosting_progress(uuid);
drop table if exists public.connections cascade;

drop function if exists public.claim_invite_code(text);
drop function if exists public.gen_invite_code();
drop table if exists public.invite_redemptions cascade;
drop table if exists public.invite_codes cascade;
drop type if exists public.invite_kind;
drop type if exists public.connection_status;

-- Social tab removal — friends and per-event chat.
drop table if exists public.friends cascade;
drop table if exists public.chat_messages cascade;

-- handle_new_user() minted 3 friend invite codes on signup; the invite system
-- is gone, so it now only creates the public.users mirror row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Squad ticketing: event_squads + tickets (tickets did not exist before
--    this migration — every purchase previously failed to persist).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.event_squads (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  buyer_user_id uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table if not exists public.tickets (
  id                uuid primary key default gen_random_uuid(),
  ticket_id         text unique not null,
  booking_id        text,
  seat_num          integer,
  total_seats       integer,
  event_id          uuid not null references public.events(id) on delete cascade,
  user_id           uuid references public.users(id) on delete set null,
  ticket_type       text,
  type_label        text,
  price_per_ticket  numeric(10,2) not null default 0,
  platform_fee      numeric(10,2) not null default 0,
  total             numeric(10,2) not null default 0,
  purchaser_name    text,
  purchased_at      timestamptz not null default now(),
  status            text not null default 'active' check (status in ('active','cancelled','checked_in')),
  squad_id          uuid references public.event_squads(id) on delete set null,
  claim_code        text unique,
  claimed_by        uuid references public.users(id) on delete set null,
  claimed_at        timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists tickets_event_idx on public.tickets(event_id);
create index if not exists tickets_user_idx  on public.tickets(user_id);

alter table public.event_squads enable row level security;
create policy event_squads_buyer_insert on public.event_squads
  for insert to authenticated with check (buyer_user_id = auth.uid());
create policy event_squads_member_read on public.event_squads
  for select to authenticated using (
    buyer_user_id = auth.uid()
    or exists (
      select 1 from public.tickets t
      where t.squad_id = event_squads.id
        and (t.user_id = auth.uid() or t.claimed_by = auth.uid())
    )
    or public.is_admin()
  );

alter table public.tickets enable row level security;
create policy tickets_buyer_read on public.tickets
  for select to authenticated
  using (user_id = auth.uid() or claimed_by = auth.uid() or public.is_admin());
create policy tickets_host_read on public.tickets
  for select to authenticated
  using (exists (select 1 from public.events e where e.id = tickets.event_id and e.host_id = auth.uid()));
create policy tickets_buyer_insert on public.tickets
  for insert to authenticated with check (user_id = auth.uid());
create policy tickets_buyer_delete on public.tickets
  for delete to authenticated using (user_id = auth.uid());

-- Race-safe claim (row-lock-then-reassign), same pattern as the removed
-- claim_invite_code(). Reassigns an unclaimed ticket to whoever opens the
-- shared claim link.
create or replace function public.claim_ticket(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.tickets%rowtype;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_row from public.tickets where claim_code = p_code for update;
  if not found then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;
  if v_row.claimed_by is not null then
    raise exception 'already_claimed' using errcode = 'P0001';
  end if;

  update public.tickets
  set claimed_by = v_uid, claimed_at = now(), user_id = v_uid
  where id = v_row.id;

  return jsonb_build_object(
    'ok', true,
    'event_id', v_row.event_id,
    'squad_id', v_row.squad_id,
    'ticket_id', v_row.ticket_id
  );
end;
$$;
revoke all on function public.claim_ticket(text) from public;
grant execute on function public.claim_ticket(text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Payout/escrow bookkeeping (status-tracking only — there is no Stripe
--    Connect or any other PSP payout integration in this codebase; this
--    models WHEN and to WHOM a payout would release, ready to wire to a
--    real processor later, but it does not move real money).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.event_payouts (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null unique references public.events(id) on delete cascade,
  host_id             uuid references public.users(id) on delete set null,
  gross_amount        numeric(10,2) not null default 0,
  fee_amount          numeric(10,2) not null default 0,
  net_amount          numeric(10,2) not null default 0,
  status              text not null default 'pending' check (status in ('pending','released','disputed')),
  scheduled_release_at timestamptz,
  released_at         timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.event_payouts enable row level security;
create policy event_payouts_host_read on public.event_payouts
  for select to authenticated using (host_id = auth.uid() or public.is_admin());
-- No insert/update/delete policy for clients at all — every write here goes
-- through the SECURITY DEFINER triggers/RPC below.

-- A host is "trusted" once they have 3+ released payouts and none disputed.
create or replace function public.is_trusted_host(p_host uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.event_payouts where host_id = p_host and status = 'released') >= 3
    and not exists (select 1 from public.event_payouts where host_id = p_host and status = 'disputed');
$$;

-- Sets the release schedule once, when a payout row is first created:
-- event end + 24h for a trusted host, +48h otherwise (chargeback-fraud buffer).
create or replace function public.set_payout_schedule()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_event_end timestamptz;
begin
  select end_time into v_event_end from public.events where id = new.event_id;
  new.scheduled_release_at := coalesce(v_event_end, now()) +
    (case when public.is_trusted_host(new.host_id) then interval '24 hours' else interval '48 hours' end);
  return new;
end;
$$;
drop trigger if exists set_payout_schedule_trg on public.event_payouts;
create trigger set_payout_schedule_trg
  before insert on public.event_payouts
  for each row execute function public.set_payout_schedule();

-- Every ticket sale rolls up into its event's single payout row (created on
-- the first sale, accumulated after).
create or replace function public.sync_event_payout()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_host_id uuid;
begin
  select host_id into v_host_id from public.events where id = new.event_id;
  if v_host_id is null then return new; end if;

  insert into public.event_payouts (event_id, host_id, gross_amount, fee_amount, net_amount, status)
  values (new.event_id, v_host_id, new.total, new.platform_fee, new.total - new.platform_fee, 'pending')
  on conflict (event_id) do update
    set gross_amount = public.event_payouts.gross_amount + excluded.gross_amount,
        fee_amount   = public.event_payouts.fee_amount   + excluded.fee_amount,
        net_amount   = public.event_payouts.net_amount   + excluded.net_amount;
  return new;
end;
$$;
drop trigger if exists sync_event_payout_trg on public.tickets;
create trigger sync_event_payout_trg
  after insert on public.tickets
  for each row execute function public.sync_event_payout();

-- Canonical read path for a host's payouts panel: flips any payout whose
-- scheduled time has passed to 'released' (lazily, on read — no pg_cron
-- dependency needed for a test-stage feature), then returns the current list.
create or replace function public.get_host_payouts(p_host uuid default auth.uid())
returns setof public.event_payouts
language plpgsql security definer set search_path = public as $$
begin
  update public.event_payouts
  set status = 'released', released_at = now()
  where host_id = p_host and status = 'pending' and now() >= scheduled_release_at;

  return query select * from public.event_payouts where host_id = p_host order by created_at desc;
end;
$$;
revoke all on function public.get_host_payouts(uuid) from public;
grant execute on function public.get_host_payouts(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Mapbox/PostGIS rework: real geography column + GiST index, and a
--    micro-payload GeoJSON RPC using the PostGIS 3.0+ ST_AsGeoJSON(record)
--    form (avoids per-row jsonb_build_object serialisation overhead).
-- ─────────────────────────────────────────────────────────────────────────
create extension if not exists postgis;

alter table public.events add column if not exists coordinates geography(Point, 4326);
update public.events
set coordinates = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
where coordinates is null and lat is not null and lon is not null;
create index if not exists events_coordinates_gist_idx on public.events using gist (coordinates);

-- Keep coordinates in sync automatically — app.js still writes lat/lon
-- directly, so this trigger derives the geography column without any
-- change needed to the events-insert code path.
create or replace function public.sync_event_coordinates()
returns trigger language plpgsql as $$
begin
  if new.lat is not null and new.lon is not null then
    new.coordinates := ST_SetSRID(ST_MakePoint(new.lon, new.lat), 4326)::geography;
  end if;
  return new;
end;
$$;
drop trigger if exists sync_event_coordinates_trg on public.events;
create trigger sync_event_coordinates_trg
  before insert or update of lat, lon on public.events
  for each row execute function public.sync_event_coordinates();

-- Micro-payload: only id/category/start_time travel with the pin. Full
-- details are fetched on tap via get_event_details() below.
create or replace function public.get_events_geojson(
  min_lng double precision,
  min_lat double precision,
  max_lng double precision,
  max_lat double precision
)
returns jsonb
language plpgsql
stable
security invoker
as $$
declare
  v_result jsonb;
begin
  -- Lets Supabase/PostgREST's edge cache the response when called via GET
  -- (see fetchEventsGeoJSON() in services.js) — no external CDN required.
  perform set_config('response.headers',
    '[{"Cache-Control":"public, max-age=60, s-maxage=60"}]', true);

  select jsonb_build_object(
    'type', 'FeatureCollection',
    'features', coalesce(jsonb_agg(ST_AsGeoJSON(t, 'geom')::jsonb), '[]'::jsonb)
  )
  into v_result
  from (
    select e.id, e.category, e.start_time, e.coordinates as geom
    from public.events e
    where e.coordinates is not null
      and ST_Intersects(e.coordinates, ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography)
  ) t;

  return v_result;
end;
$$;
grant execute on function public.get_events_geojson(
  double precision, double precision, double precision, double precision
) to anon, authenticated;

-- Full row, fetched only when a specific pin is tapped.
create or replace function public.get_event_details(p_id uuid)
returns setof public.events
language sql stable security invoker
as $$
  select * from public.events where id = p_id;
$$;
grant execute on function public.get_event_details(uuid) to anon, authenticated;
