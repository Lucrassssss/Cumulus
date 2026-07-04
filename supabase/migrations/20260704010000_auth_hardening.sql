-- ============================================================================
-- Cumulus — Phase 1: Supabase Auth hardening + RLS on the live tables
-- ----------------------------------------------------------------------------
-- Moves the app from the "anon key + custom users" model to real Supabase Auth:
-- every identity is an auth.users row, public.users is the profile keyed on
-- auth.uid(), and RLS enforces "you can only write your own rows" server-side.
--
-- ORDERING — IMPORTANT. This migration REQUIRES the Phase 2 frontend (which
-- signs users in through sb.auth so requests carry a JWT). Applying it while the
-- old anon/localStorage signup is still live WILL break sign-up and writes,
-- because those requests have no auth.uid(). Apply this together with the
-- Phase 2 deploy, on a STAGING project first.
--
-- Depends on 20260703000000_secret_club.sql (public.admins, is_admin()).
-- Idempotent: re-runnable.
-- ============================================================================

-- ── Roles ───────────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_role as enum ('eventee', 'partner_host');
exception when duplicate_object then null; end $$;

alter table if exists public.users
  add column if not exists role public.user_role not null default 'eventee';

-- ── Profile provisioning: auth.users → public.users ─────────────────────────
-- public.users.id must equal auth.users.id. New signups get a profile row here.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helper (SECURITY DEFINER avoids RLS recursion inside policies).
create or replace function public.app_role(p_user uuid default auth.uid())
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.users where id = p_user;
$$;

-- ── Enable RLS everywhere ────────────────────────────────────────────────────
alter table if exists public.users            enable row level security;
alter table if exists public.events           enable row level security;
alter table if exists public.rsvps            enable row level security;
alter table if exists public.tickets          enable row level security;
alter table if exists public.chat_messages    enable row level security;
alter table if exists public.friends          enable row level security;
alter table if exists public.host_applications enable row level security;

-- ── users ────────────────────────────────────────────────────────────────────
-- Self + admin only. Other members' display names are read from denormalised
-- columns (rsvps.user_name, chat_messages.user_name, friends.friend_name), so
-- the profile row — which holds email — never needs a public read.
drop policy if exists users_self_read   on public.users;
create policy users_self_read on public.users
  for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists users_self_write  on public.users;
create policy users_self_write on public.users
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists users_self_insert on public.users;
create policy users_self_insert on public.users
  for insert to authenticated with check (id = auth.uid());

drop policy if exists users_admin_all   on public.users;
create policy users_admin_all on public.users
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Guard privileged columns: a member may edit their profile but not their own
-- role. service_role (backend) and admins bypass.
create or replace function public.protect_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then return new; end if;
  if new.role is distinct from old.role then
    raise exception 'role is managed by admins';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_user_role_trg on public.users;
create trigger protect_user_role_trg
  before update on public.users
  for each row execute function public.protect_user_role();

-- ── events ───────────────────────────────────────────────────────────────────
-- Public listings: any signed-in member may read. Writes must be your own
-- (host_id = auth.uid()) — no anon writes, no impersonation.
drop policy if exists events_read        on public.events;
create policy events_read on public.events
  for select to authenticated using (true);

drop policy if exists events_insert_own  on public.events;
create policy events_insert_own on public.events
  for insert to authenticated with check (host_id = auth.uid());
-- To restrict public hosting to vetted partners later, tighten the check to:
--   host_id = auth.uid() and public.app_role() = 'partner_host'
-- (leave a separate connections/private policy for eventees).

drop policy if exists events_modify_own  on public.events;
create policy events_modify_own on public.events
  for update to authenticated using (host_id = auth.uid() or public.is_admin())
  with check (host_id = auth.uid() or public.is_admin());

drop policy if exists events_delete_own  on public.events;
create policy events_delete_own on public.events
  for delete to authenticated using (host_id = auth.uid() or public.is_admin());

-- ── rsvps ────────────────────────────────────────────────────────────────────
-- Attendee lists are visible to members (the app shows who's going); you may
-- only add/remove your OWN rsvp.
drop policy if exists rsvps_read       on public.rsvps;
create policy rsvps_read on public.rsvps
  for select to authenticated using (true);

drop policy if exists rsvps_insert_own on public.rsvps;
create policy rsvps_insert_own on public.rsvps
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists rsvps_delete_own on public.rsvps;
create policy rsvps_delete_own on public.rsvps
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- ── tickets ──────────────────────────────────────────────────────────────────
-- Private: a ticket (with its QR) is visible only to its owner (or an admin).
drop policy if exists tickets_read_own   on public.tickets;
create policy tickets_read_own on public.tickets
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists tickets_insert_own on public.tickets;
create policy tickets_insert_own on public.tickets
  for insert to authenticated with check (user_id = auth.uid());

-- ── chat_messages ────────────────────────────────────────────────────────────
-- Readable by members; you may only post as yourself.
drop policy if exists chat_read       on public.chat_messages;
create policy chat_read on public.chat_messages
  for select to authenticated using (true);

drop policy if exists chat_insert_own on public.chat_messages;
create policy chat_insert_own on public.chat_messages
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists chat_delete_own on public.chat_messages;
create policy chat_delete_own on public.chat_messages
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- ── friends ──────────────────────────────────────────────────────────────────
-- Fully private to the owner.
drop policy if exists friends_own on public.friends;
create policy friends_own on public.friends
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── host_applications ────────────────────────────────────────────────────────
-- A member may submit their own application and read it back; only admins may
-- read the whole queue or change status (approve/reject).
drop policy if exists host_apps_insert_own on public.host_applications;
create policy host_apps_insert_own on public.host_applications
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists host_apps_read on public.host_applications;
create policy host_apps_read on public.host_applications
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists host_apps_admin_update on public.host_applications;
create policy host_apps_admin_update on public.host_applications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- END Phase 1. Phase 2 (frontend) switches sign-up/login to sb.auth so these
-- policies have an auth.uid() to enforce against.
-- ============================================================================
