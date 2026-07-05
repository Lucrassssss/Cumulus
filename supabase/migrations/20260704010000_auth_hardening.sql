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
-- because those requests have no auth.uid(). Apply it together with the Phase 2
-- deploy — on a STAGING project first.
--
-- Depends on 20260703000000_secret_club.sql (public.admins, is_admin()).
-- RESILIENT: the optional tables (rsvps/tickets/chat_messages/friends/
-- host_applications) are guarded with to_regclass(), so this applies cleanly
-- whether or not every table exists yet. Idempotent / re-runnable.
-- ============================================================================

-- ── Roles ───────────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_role as enum ('eventee', 'partner_host');
exception when duplicate_object then null; end $$;
-- ── users profile (ensure it exists and is keyed on auth.users) ─────────────
-- Created only if absent; if you already have a users table this is a no-op and
-- the add-column-if-not-exists lines below reconcile any missing fields.
create table if not exists public.users (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text,
  name           text,
  profile_id     text,
  special_badges jsonb default '[]'::jsonb,
  theme          text default 'light',
  card_theme     text,
  card_bio       text,
  card_interests text,
  card_fact      text,
  role           public.user_role not null default 'eventee',
  created_at     timestamptz not null default now()
);
alter table public.users add column if not exists profile_id     text;
alter table public.users add column if not exists special_badges jsonb default '[]'::jsonb;
alter table public.users add column if not exists theme          text default 'light';
alter table public.users add column if not exists card_theme     text;
alter table public.users add column if not exists card_bio       text;
alter table public.users add column if not exists card_interests text;
alter table public.users add column if not exists card_fact      text;
alter table public.users add column if not exists role           public.user_role not null default 'eventee';
-- ── Profile provisioning: auth.users → public.users ─────────────────────────
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
-- ── users RLS (table is guaranteed to exist by now) ─────────────────────────
alter table public.users enable row level security;
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
-- ── events RLS ──────────────────────────────────────────────────────────────
-- (events is guaranteed by 20260704000000_events_table.sql, but guard anyway.)
do $$ begin
  if to_regclass('public.events') is null then return; end if;
  execute 'alter table public.events enable row level security';

  execute 'drop policy if exists events_read on public.events';
  execute 'create policy events_read on public.events
             for select to authenticated using (true)';

  execute 'drop policy if exists events_insert_own on public.events';
  execute 'create policy events_insert_own on public.events
             for insert to authenticated with check (host_id = auth.uid())';

  execute 'drop policy if exists events_modify_own on public.events';
  execute 'create policy events_modify_own on public.events
             for update to authenticated using (host_id = auth.uid() or public.is_admin())
             with check (host_id = auth.uid() or public.is_admin())';

  execute 'drop policy if exists events_delete_own on public.events';
  execute 'create policy events_delete_own on public.events
             for delete to authenticated using (host_id = auth.uid() or public.is_admin())';
end $$;
-- ── rsvps RLS ───────────────────────────────────────────────────────────────
do $$ begin
  if to_regclass('public.rsvps') is null then return; end if;
  execute 'alter table public.rsvps enable row level security';

  execute 'drop policy if exists rsvps_read on public.rsvps';
  execute 'create policy rsvps_read on public.rsvps
             for select to authenticated using (true)';

  execute 'drop policy if exists rsvps_insert_own on public.rsvps';
  execute 'create policy rsvps_insert_own on public.rsvps
             for insert to authenticated with check (user_id = auth.uid())';

  execute 'drop policy if exists rsvps_delete_own on public.rsvps';
  execute 'create policy rsvps_delete_own on public.rsvps
             for delete to authenticated using (user_id = auth.uid() or public.is_admin())';
end $$;
-- ── tickets RLS (private — owner only) ──────────────────────────────────────
do $$ begin
  if to_regclass('public.tickets') is null then return; end if;
  execute 'alter table public.tickets enable row level security';

  execute 'drop policy if exists tickets_read_own on public.tickets';
  execute 'create policy tickets_read_own on public.tickets
             for select to authenticated using (user_id = auth.uid() or public.is_admin())';

  execute 'drop policy if exists tickets_insert_own on public.tickets';
  execute 'create policy tickets_insert_own on public.tickets
             for insert to authenticated with check (user_id = auth.uid())';
end $$;
-- ── chat_messages RLS ───────────────────────────────────────────────────────
do $$ begin
  if to_regclass('public.chat_messages') is null then return; end if;
  execute 'alter table public.chat_messages enable row level security';

  execute 'drop policy if exists chat_read on public.chat_messages';
  execute 'create policy chat_read on public.chat_messages
             for select to authenticated using (true)';

  execute 'drop policy if exists chat_insert_own on public.chat_messages';
  execute 'create policy chat_insert_own on public.chat_messages
             for insert to authenticated with check (user_id = auth.uid())';

  execute 'drop policy if exists chat_delete_own on public.chat_messages';
  execute 'create policy chat_delete_own on public.chat_messages
             for delete to authenticated using (user_id = auth.uid() or public.is_admin())';
end $$;
-- ── friends RLS (fully private to owner) ────────────────────────────────────
do $$ begin
  if to_regclass('public.friends') is null then return; end if;
  execute 'alter table public.friends enable row level security';

  execute 'drop policy if exists friends_own on public.friends';
  execute 'create policy friends_own on public.friends
             for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())';
end $$;
-- ── host_applications RLS ───────────────────────────────────────────────────
do $$ begin
  if to_regclass('public.host_applications') is null then return; end if;
  execute 'alter table public.host_applications enable row level security';

  execute 'drop policy if exists host_apps_insert_own on public.host_applications';
  execute 'create policy host_apps_insert_own on public.host_applications
             for insert to authenticated with check (user_id = auth.uid())';

  execute 'drop policy if exists host_apps_read on public.host_applications';
  execute 'create policy host_apps_read on public.host_applications
             for select to authenticated using (user_id = auth.uid() or public.is_admin())';

  execute 'drop policy if exists host_apps_admin_update on public.host_applications';
  execute 'create policy host_apps_admin_update on public.host_applications
             for update to authenticated using (public.is_admin()) with check (public.is_admin())';
end $$;
-- ============================================================================
-- END Phase 1. Phase 2 (frontend) switches sign-up/login to sb.auth so these
-- policies have an auth.uid() to enforce against.
-- ============================================================================;
