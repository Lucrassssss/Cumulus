-- ============================================================================
-- Cumulus — Secret Social Club backend
-- Adds the two tables the recent work introduced:
--   • curator_codes  — invite/referral codes that unlock membership + perks
--   • pending_events — public events queued for owner approval
-- plus a SECURITY DEFINER RPC so curator codes are validated WITHOUT exposing
-- the codes table to the public anon key.
--
-- Idempotent (safe to re-run). Does NOT touch the existing tables
-- (users, events, rsvps, tickets, friends, chat_messages, host_applications) —
-- their reference shape is documented at the bottom for verification only.
-- ============================================================================

-- ── admin identity (real auth boundary) ─────────────────────────────────────
-- Owners sign in via Supabase Auth; their auth.users.id is added here to grant
-- admin rights. is_admin() is the single check every admin-only policy uses.
create table if not exists public.admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  email    text,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;

drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
  for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- After the owner signs in once (Supabase Auth), promote them by email:
--   insert into public.admins (user_id, email)
--   select id, email from auth.users where email = 'gondoxml@gmail.com'
--   on conflict (user_id) do nothing;


-- ── curator_codes ──────────────────────────────────────────────────────────
create table if not exists public.curator_codes (
  code         text primary key,                    -- e.g. CUR-AB12-CD34 (upper)
  curator_name text,                                -- who issued it (venue/host)
  tier         text        not null default 'standard',
  active       boolean     not null default true,
  created_at   timestamptz not null default now()
);

alter table public.curator_codes enable row level security;

-- No anon read policy: the anon key must NOT be able to read this table
-- directly (that would let anyone dump valid codes). Validation flows only
-- through validate_curator_code() below. Admins (see is_admin()) may manage
-- codes with their authenticated session.
drop policy if exists curator_codes_admin_all on public.curator_codes;
create policy curator_codes_admin_all on public.curator_codes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Validate a code without exposing the table. Returns the curator row only for
-- an ACTIVE code; returns no rows otherwise. Client calls:
--   sb.rpc('validate_curator_code', { p_code: 'CUR-AB12-CD34' })
create or replace function public.validate_curator_code(p_code text)
returns table (curator_name text, tier text)
language sql
security definer
set search_path = public
as $$
  select c.curator_name, c.tier
  from public.curator_codes c
  where c.code = upper(trim(p_code))
    and c.active = true
  limit 1;
$$;

revoke all on function public.validate_curator_code(text) from public;
grant execute on function public.validate_curator_code(text) to anon, authenticated;

-- Seed a couple of codes so the flow is testable immediately (edit/remove):
insert into public.curator_codes (code, curator_name, tier) values
  ('CUR-CMLS-0001', 'Cumulus HQ', 'founder'),
  ('CUR-SOHO-2049', 'The Soho Room', 'standard')
on conflict (code) do nothing;


-- ── pending_events ─────────────────────────────────────────────────────────
create table if not exists public.pending_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text,
  host_id     uuid,
  host_name   text,
  host_email  text,
  venue       text,
  area        text,
  address     text,
  lat         double precision,
  lon         double precision,
  start_time  timestamptz,
  end_time    timestamptz,
  description text,
  capacity    integer,
  price       numeric(10,2) default 0,
  status      text not null default 'pending',        -- pending | approved | rejected
  created_at  timestamptz not null default now()
);

alter table public.pending_events enable row level security;

-- Hardened (option B): anyone may SUBMIT a public event, but only an
-- authenticated ADMIN can read the queue or approve/reject. This is enforced
-- server-side by RLS — the client-side owner-email check is now just UX.
drop policy if exists pending_events_insert on public.pending_events;
create policy pending_events_insert on public.pending_events
  for insert to anon, authenticated with check (true);

drop policy if exists pending_events_select on public.pending_events;      -- remove any old permissive policy
drop policy if exists pending_events_select_admin on public.pending_events;
create policy pending_events_select_admin on public.pending_events
  for select to authenticated using (public.is_admin());

drop policy if exists pending_events_update on public.pending_events;       -- remove any old permissive policy
drop policy if exists pending_events_update_admin on public.pending_events;
create policy pending_events_update_admin on public.pending_events
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- REFERENCE ONLY — shape the client already expects for existing tables.
-- Do NOT run these blindly against a populated DB; they are here so you can
-- verify columns match. Uncomment selectively if a column is missing.
-- ============================================================================
-- users            (id uuid pk, email text unique, name text, profile_id text,
--                   special_badges jsonb/text[], theme text, card_theme text,
--                   card_bio text, card_interests text, card_fact text)
-- events           (id, title, category, host_id, host_name, venue, area,
--                   address, lat, lon, start_time, end_time, description,
--                   capacity, price)
-- rsvps            (id, event_id, user_id, user_name)
-- tickets          (id, ticket_id, booking_id, seat_num, total_seats, event_id,
--                   user_id, ticket_type, type_label, price_per_ticket, total,
--                   purchaser_name, purchased_at)
-- friends          (id, user_id, friend_id, friend_name)
-- chat_messages    (id, event_id, user_id, user_name, text, created_at)
-- host_applications(id, name, email, user_id, business_name, event_types,
--                   description, why_host, status, created_at)
