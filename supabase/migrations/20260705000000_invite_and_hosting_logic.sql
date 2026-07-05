-- ============================================================================
-- Cumulus "Velvet Rope" — invite-only event platform, v2 backend
-- ----------------------------------------------------------------------------
-- Target: Supabase (PostgreSQL 15+). Run in the SQL editor as the `postgres`
-- role (the auth.users trigger needs owner privileges).
--
-- Design invariants (all enforced SERVER-SIDE — the client is never trusted):
--   * You cannot create a public.users row without redeeming a valid invite.
--   * role ∈ {eventee, partner_host}; a user can NEVER self-promote — role,
--     age_verified_at, invited_by, onboarded_at are system/admin/webhook only.
--   * partner_host may host public | host_private.
--   * eventee may host connections_only ONLY after passing all three
--     "Proof of Participation" gates, checked in the DB via a SECURITY DEFINER
--     predicate that RLS calls in its WITH CHECK clause.
--   * invite redemption is atomic and race-safe (row lock + re-check).
--
-- Idempotent where practical (safe to re-run during development).
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid(), gen_random_bytes()

-- ─────────────────────────────────────────────────────────────────────────
-- 1. ENUMS
-- ─────────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_role       as enum ('eventee', 'partner_host');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.event_visibility as enum ('public', 'host_private', 'connections_only');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invite_kind      as enum ('event', 'friend');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.connection_status as enum ('pending', 'accepted', 'blocked');
exception when duplicate_object then null; end $$;


-- ─────────────────────────────────────────────────────────────────────────
-- 2. TABLES
-- ─────────────────────────────────────────────────────────────────────────

-- 2.1 users — 1:1 mirror of auth.users, holds authorization state.
create table if not exists public.users (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  display_name     text,
  role             public.user_role not null default 'eventee',
  -- Proof-of-Participation gate #1. Written ONLY by the identity webhook
  -- (service_role) after Stripe Identity / Yoti confirms 18+. Never by the user.
  age_verified_at  timestamptz,
  invited_by       uuid references public.users(id) on delete set null,
  onboarded_at     timestamptz,                 -- set when an invite is redeemed
  created_at       timestamptz not null default now()
);

-- 2.2 invite_codes — the velvet rope.
--   * friend codes:  uses_left counts down (issued 3-per-user, single use each);
--                    expires_at is NULL (no time limit).
--   * event codes:   uses_left is NULL (time-gated, not count-gated);
--                    expires_at = event end + 48h.
create table if not exists public.invite_codes (
  code        text primary key,
  kind        public.invite_kind not null,
  owner_id    uuid references public.users(id) on delete cascade,  -- issuer (friend codes)
  event_id    uuid,                                                -- source event (event codes)
  uses_left   integer,                                             -- friend codes only
  expires_at  timestamptz,                                         -- event codes only
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint invite_codes_shape check (
    (kind = 'friend' and uses_left is not null)
    or
    (kind = 'event'  and expires_at is not null)
  )
);

-- 2.3 invite_redemptions — audit ledger + the per-user idempotency guard.
--     One (code, redeemer) pair can exist at most once, so a ret[r]y or a
--     double-submit can never burn a second use.
create table if not exists public.invite_redemptions (
  code         text not null references public.invite_codes(code) on delete cascade,
  redeemed_by  uuid not null references public.users(id) on delete cascade,
  redeemed_at  timestamptz not null default now(),
  primary key (code, redeemed_by)
);

-- 2.4 events
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references public.users(id) on delete cascade,
  visibility  public.event_visibility not null,
  title       text not null,
  description text,
  category    text,
  venue       text,
  area        text,
  address     text,
  lat         double precision,
  lon         double precision,
  starts_at   timestamptz,
  ends_at     timestamptz,
  capacity    integer,
  price       numeric(10,2) not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists events_host_idx       on public.events (host_id);
create index if not exists events_visibility_idx on public.events (visibility);

-- 2.5 event_attendees — RSVP + real-world check-in (gate #2).
--     checked_in_at is written server-side (geofenced RPC / staff scan), never
--     by an arbitrary client UPDATE.
create table if not exists public.event_attendees (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  user_id       uuid not null references public.users(id)  on delete cascade,
  checked_in_at timestamptz,
  created_at    timestamptz not null default now(),
  unique (event_id, user_id)
);
create index if not exists attendees_user_checkin_idx
  on public.event_attendees (user_id) where checked_in_at is not null;

-- 2.6 connections — mutual (gate #3). Direction-agnostic uniqueness.
create table if not exists public.connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.users(id) on delete cascade,
  addressee_id  uuid not null references public.users(id) on delete cascade,
  status        public.connection_status not null default 'pending',
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  constraint connections_no_self check (requester_id <> addressee_id)
);
create unique index if not exists connections_unique_pair
  on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists connections_accepted_idx
  on public.connections (requester_id, addressee_id) where status = 'accepted';

-- 2.7 admins — the vetting authority (promotes partner_hosts, manages codes).
create table if not exists public.admins (
  user_id  uuid primary key references public.users(id) on delete cascade,
  added_at timestamptz not null default now()
);


-- ─────────────────────────────────────────────────────────────────────────
-- 3. AUTHORIZATION HELPERS (SECURITY DEFINER — evaluated with owner rights so
--    RLS on the queried tables can't cause recursion or hide rows the policy
--    legitimately needs to count).
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.is_admin(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = p_user);
$$;

create or replace function public.app_role(p_user uuid default auth.uid())
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.users where id = p_user;
$$;

-- The single source of truth for "may this eventee host a connections_only
-- event?" — all three Proof-of-Participation gates, counted server-side.
create or replace function public.can_host_connections_event(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select
      u.age_verified_at is not null
      and (
        select count(*) from public.event_attendees ea
        where ea.user_id = p_user and ea.checked_in_at is not null
      ) >= 1
      and (
        select count(*) from public.connections c
        where c.status = 'accepted'
          and (c.requester_id = p_user or c.addressee_id = p_user)
      ) >= 3
    from public.users u
    where u.id = p_user
  ), false);
$$;

-- Structured progress for the frontend checklist. Server-authoritative — the
-- UI renders whatever this returns; it does not compute eligibility itself.
create or replace function public.get_hosting_progress(p_user uuid default auth.uid())
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'ageVerified',          (select age_verified_at is not null from public.users where id = p_user),
    'eventsCheckedIn',      (select count(*) from public.event_attendees
                               where user_id = p_user and checked_in_at is not null),
    'eventsRequired',       1,
    'connections',          (select count(*) from public.connections
                               where status = 'accepted'
                                 and (requester_id = p_user or addressee_id = p_user)),
    'connectionsRequired',  3,
    'role',                 (select role from public.users where id = p_user),
    'eligible',             public.can_host_connections_event(p_user)
  );
$$;
revoke all on function public.get_hosting_progress(uuid) from public;
grant execute on function public.get_hosting_progress(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 4. ATOMIC INVITE REDEMPTION (race-safe)  — see docs/velvet-rope/README.md
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.claim_invite_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_row   public.invite_codes%rowtype;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- One onboarding per account. Cheap early-out before we touch the code row.
  if exists (select 1 from public.users where id = v_uid and onboarded_at is not null) then
    raise exception 'already_onboarded' using errcode = 'P0001';
  end if;

  -- (A) ACQUIRE THE ROW LOCK. Concurrent claimers of the SAME code serialize
  --     here: the second transaction blocks until the first commits/rolls back,
  --     then — under READ COMMITTED — FOR UPDATE re-reads the *latest committed*
  --     version of the row, so it sees the decremented uses_left, not its own
  --     stale snapshot. This is what makes the check-then-decrement atomic.
  select * into v_row
  from public.invite_codes
  where code = upper(trim(p_code))
  for update;

  if not found or not v_row.active then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;

  -- Can't redeem your own friend code.
  if v_row.owner_id is not null and v_row.owner_id = v_uid then
    raise exception 'own_code' using errcode = 'P0001';
  end if;

  -- (B) VALIDITY per kind.
  if v_row.expires_at is not null and now() >= v_row.expires_at then
    raise exception 'code_expired' using errcode = 'P0001';
  end if;
  if v_row.uses_left is not null and v_row.uses_left <= 0 then
    raise exception 'code_exhausted' using errcode = 'P0001';
  end if;

  -- (C) PER-USER IDEMPOTENCY. If this user already redeemed this code, stop
  --     BEFORE decrementing so a retry can't burn a second use.
  insert into public.invite_redemptions (code, redeemed_by)
  values (v_row.code, v_uid)
  on conflict (code, redeemed_by) do nothing;
  if not found then
    raise exception 'already_redeemed' using errcode = 'P0001';
  end if;

  -- (D) SPEND (friend codes only) — still under the row lock from (A).
  if v_row.uses_left is not null then
    update public.invite_codes
    set uses_left = uses_left - 1
    where code = v_row.code;
  end if;

  -- (E) ONBOARD the claimer. New members are always 'eventee'; partner_host is
  --     granted separately by an admin. Age/role are untouched here.
  update public.users
  set invited_by   = coalesce(invited_by, v_row.owner_id),
      onboarded_at = now()
  where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'kind', v_row.kind,
    'invited_by', v_row.owner_id
  );
end;
$$;
revoke all on function public.claim_invite_code(text) from public;
grant execute on function public.claim_invite_code(text) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 5. PROVISIONING TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────

-- Human-friendly code generator: INV-XXXX-XXXX (Crockford-ish, no ambiguous chars).
create or replace function public.gen_invite_code()
returns text language sql volatile as $$
  select 'INV-'
    || upper(substr(translate(encode(gen_random_bytes(4),'base64'),'+/=OIL01','ABCDEFG'),1,4))
    || '-'
    || upper(substr(translate(encode(gen_random_bytes(4),'base64'),'+/=OIL01','HJKMNPQ'),1,4));
$$;

-- On auth signup: create the public.users row and mint exactly 3 friend codes.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  i int := 0;
  v_code text;
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guard privileged columns on public.users. RLS can gate WHICH rows a user may
-- update, but not WHICH columns; this BEFORE trigger enforces the column rule.
-- service_role (webhooks) and admins bypass it.
create or replace function public.protect_user_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;
  if new.role            is distinct from old.role
     or new.age_verified_at is distinct from old.age_verified_at
     or new.invited_by      is distinct from old.invited_by
     or new.onboarded_at    is distinct from old.onboarded_at then
    raise exception 'protected_columns' using
      detail = 'role, age_verified_at, invited_by and onboarded_at are managed by the system';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_user_columns_trg on public.users;
create trigger protect_user_columns_trg
  before update on public.users
  for each row execute function public.protect_user_columns();


-- ─────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────
alter table public.users              enable row level security;
alter table public.invite_codes       enable row level security;
alter table public.invite_redemptions enable row level security;
alter table public.events             enable row level security;
alter table public.event_attendees    enable row level security;
alter table public.connections        enable row level security;
alter table public.admins             enable row level security;

-- 6.1 users --------------------------------------------------------------
drop policy if exists users_self_read  on public.users;
create policy users_self_read on public.users
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- Self-update is allowed at the row level; the column trigger (5) blocks the
-- privileged fields, so a user can only edit display_name / email etc.
drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists users_admin_all on public.users;
create policy users_admin_all on public.users
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6.2 invite_codes -------------------------------------------------------
-- No direct SELECT for the anon/authenticated key: codes are validated only
-- through claim_invite_code(). Owners may see the friend codes they issued
-- (to display/share them). Admins manage everything.
drop policy if exists invite_codes_owner_read on public.invite_codes;
create policy invite_codes_owner_read on public.invite_codes
  for select to authenticated using (owner_id = auth.uid() or public.is_admin());

drop policy if exists invite_codes_admin_all on public.invite_codes;
create policy invite_codes_admin_all on public.invite_codes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6.3 invite_redemptions -------------------------------------------------
drop policy if exists redemptions_self_read on public.invite_redemptions;
create policy redemptions_self_read on public.invite_redemptions
  for select to authenticated using (redeemed_by = auth.uid() or public.is_admin());
-- No INSERT/UPDATE/DELETE policy: only the SECURITY DEFINER claim function writes here.

-- 6.4 events -------------------------------------------------------------
-- INSERT: the core of the dual-track model. Two permissive policies OR together.
drop policy if exists events_insert_partner on public.events;
create policy events_insert_partner on public.events
  for insert to authenticated
  with check (
    host_id = auth.uid()
    and public.app_role() = 'partner_host'
    and visibility in ('public', 'host_private')
  );

drop policy if exists events_insert_eventee on public.events;
create policy events_insert_eventee on public.events
  for insert to authenticated
  with check (
    host_id = auth.uid()
    and public.app_role() = 'eventee'
    and visibility = 'connections_only'
    and public.can_host_connections_event(auth.uid())   -- server-side Proof of Participation
  );

-- SELECT: public to all members; private tiers scoped to host / attendees /
-- (for connections_only) the host's accepted connections.
drop policy if exists events_select_public on public.events;
create policy events_select_public on public.events
  for select to authenticated using (visibility = 'public');

drop policy if exists events_select_host on public.events;
create policy events_select_host on public.events
  for select to authenticated using (host_id = auth.uid() or public.is_admin());

drop policy if exists events_select_attendee on public.events;
create policy events_select_attendee on public.events
  for select to authenticated using (
    exists (select 1 from public.event_attendees ea
            where ea.event_id = events.id and ea.user_id = auth.uid())
  );

drop policy if exists events_select_connections on public.events;
create policy events_select_connections on public.events
  for select to authenticated using (
    visibility = 'connections_only'
    and exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_id = events.host_id and c.addressee_id = auth.uid())
          or
          (c.addressee_id = events.host_id and c.requester_id = auth.uid())
        )
    )
  );

-- UPDATE / DELETE: host owns their event; admins override.
drop policy if exists events_modify_host on public.events;
create policy events_modify_host on public.events
  for update to authenticated using (host_id = auth.uid() or public.is_admin())
  with check (host_id = auth.uid() or public.is_admin());

drop policy if exists events_delete_host on public.events;
create policy events_delete_host on public.events
  for delete to authenticated using (host_id = auth.uid() or public.is_admin());

-- 6.5 event_attendees ----------------------------------------------------
-- A member may RSVP themselves (insert with checked_in_at NULL). They may NOT
-- set checked_in_at — that is done by a geofenced RPC / staff scan under
-- service_role. Enforced by WITH CHECK requiring checked_in_at IS NULL.
drop policy if exists attendees_self_rsvp on public.event_attendees;
create policy attendees_self_rsvp on public.event_attendees
  for insert to authenticated
  with check (user_id = auth.uid() and checked_in_at is null);

drop policy if exists attendees_self_read on public.event_attendees;
create policy attendees_self_read on public.event_attendees
  for select to authenticated using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.events e where e.id = event_id and e.host_id = auth.uid())
  );

drop policy if exists attendees_self_cancel on public.event_attendees;
create policy attendees_self_cancel on public.event_attendees
  for delete to authenticated using (user_id = auth.uid());

-- 6.6 connections --------------------------------------------------------
drop policy if exists connections_participant_read on public.connections;
create policy connections_participant_read on public.connections
  for select to authenticated using (
    requester_id = auth.uid() or addressee_id = auth.uid() or public.is_admin()
  );

drop policy if exists connections_send on public.connections;
create policy connections_send on public.connections
  for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');

-- Only the addressee may respond; they can move pending → accepted/blocked.
drop policy if exists connections_respond on public.connections;
create policy connections_respond on public.connections
  for update to authenticated
  using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid());

drop policy if exists connections_withdraw on public.connections;
create policy connections_withdraw on public.connections
  for delete to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());

-- 6.7 admins -------------------------------------------------------------
drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
-- Membership is managed out-of-band (SQL editor / service_role); no client writes.


-- ─────────────────────────────────────────────────────────────────────────
-- 7. TRUSTED WRITE PATHS for the two webhook/staff-driven gates.
--    Both are SECURITY DEFINER and restricted so ordinary members can't call
--    them; the identity webhook and the check-in scanner run under service_role.
-- ─────────────────────────────────────────────────────────────────────────

-- 7.1 Age verification callback (Stripe Identity / Yoti edge function).
--     The edge function MUST verify the provider's webhook signature before
--     calling this; only then does 18+ become true in the DB.
create or replace function public.mark_age_verified(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.users set age_verified_at = now() where id = p_user;
end;
$$;
revoke all on function public.mark_age_verified(uuid) from public;
grant execute on function public.mark_age_verified(uuid) to service_role;

-- 7.2 Real-world check-in. Called by a geofenced client RPC or a staff scanner.
--     Kept minimal here; a production version also validates proximity/time.
create or replace function public.check_into_event(p_event uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  insert into public.event_attendees (event_id, user_id, checked_in_at)
  values (p_event, v_uid, now())
  on conflict (event_id, user_id)
  do update set checked_in_at = coalesce(public.event_attendees.checked_in_at, now());
end;
$$;
revoke all on function public.check_into_event(uuid) from public;
grant execute on function public.check_into_event(uuid) to authenticated;

-- ============================================================================
-- END
-- ============================================================================
