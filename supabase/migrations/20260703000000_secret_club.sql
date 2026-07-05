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

-- ── curator_codes ──────────────────────────────────────────────────────────
create table if not exists public.curator_codes (
  code         text primary key,                    -- e.g. CUR-AB12-CD34 (upper)
  curator_name text,                                -- who issued it (venue/host)
  tier         text        not null default 'standard',
  active       boolean     not null default true,
  created_at   timestamptz not null default now()
);
alter table public.curator_codes enable row level security;
-- No policies for anon/authenticated on purpose: the anon key must NOT be able
-- to read this table directly (that would let anyone dump valid codes).
-- All validation flows through validate_curator_code() below.
-- (An admin using the service_role key bypasses RLS to manage codes.)

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
-- Mirrors the existing host_applications posture: the anon client submits and
-- the owner reviews in-app. NOTE: approval is currently gated CLIENT-SIDE by the
-- owner's email — see the security note in the review. For a hardened setup,
-- replace the select/update policies below with an is_admin() check (JWT claim)
-- or move approvals behind the service_role key.
drop policy if exists pending_events_insert on public.pending_events;
create policy pending_events_insert on public.pending_events
  for insert to anon, authenticated with check (true);
drop policy if exists pending_events_select on public.pending_events;
create policy pending_events_select on public.pending_events
  for select to anon, authenticated using (true);
drop policy if exists pending_events_update on public.pending_events;
create policy pending_events_update on public.pending_events
  for update to anon, authenticated using (true) with check (true);
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
--                   description, why_host, status, created_at);
