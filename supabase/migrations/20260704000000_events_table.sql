-- ============================================================================
-- Cumulus — events table shape reconciliation
-- ----------------------------------------------------------------------------
-- The app now runs on REAL events only (the demo seed was removed from app.js).
-- This migration guarantees the `events` table exists with every column the
-- client reads/writes, so real events have a well-defined home. It is
-- idempotent and ADDITIVE — it never drops or retypes an existing column, so
-- it is safe to run against a populated table.
--
-- NOTE ON RLS: this migration intentionally does NOT enable/alter Row Level
-- Security on `events`. The live app writes events with the anon key under the
-- custom-users model (host_id is a public.users id, not an auth.uid()), so
-- turning on strict RLS here would block event creation. The security model is
-- a deliberate decision — see docs/velvet-rope/ for the hardened (Supabase
-- Auth) alternative. Apply the matching RLS separately once that choice is made.
-- ============================================================================

create extension if not exists pgcrypto;
create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  category       text,
  host_id        uuid,
  host_name      text,
  venue          text,
  area           text,
  address        text,
  lat            double precision,
  lon            double precision,
  start_time     timestamptz,
  end_time       timestamptz,
  description    text,
  capacity       integer,
  price          numeric(10,2) not null default 0,
  night_shot_url text,
  created_at     timestamptz not null default now()
);
-- Reconcile an existing table: add any column the client needs but that a
-- pre-existing schema may be missing. (No-ops where the column already exists.)
alter table public.events add column if not exists category       text;
alter table public.events add column if not exists host_id        uuid;
alter table public.events add column if not exists host_name      text;
alter table public.events add column if not exists venue          text;
alter table public.events add column if not exists area           text;
alter table public.events add column if not exists address        text;
alter table public.events add column if not exists lat            double precision;
alter table public.events add column if not exists lon            double precision;
alter table public.events add column if not exists start_time     timestamptz;
alter table public.events add column if not exists end_time       timestamptz;
alter table public.events add column if not exists description    text;
alter table public.events add column if not exists capacity       integer;
alter table public.events add column if not exists price          numeric(10,2) default 0;
alter table public.events add column if not exists night_shot_url text;
alter table public.events add column if not exists created_at     timestamptz default now();
create index if not exists events_start_time_idx on public.events (start_time);
create index if not exists events_category_idx   on public.events (category);
create index if not exists events_host_idx       on public.events (host_id);
