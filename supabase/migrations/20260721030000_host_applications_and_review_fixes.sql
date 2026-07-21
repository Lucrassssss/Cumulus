-- ============================================================================
-- Cumulus — host applications table + pending_events review hardening
-- ----------------------------------------------------------------------------
-- Two problems this fixes:
--
-- 1. public.host_applications never existed in this project. The "Become a
--    host" landing-page flow (and the in-app "Apply to host" flow it now
--    shares logic with) tries `sb.from("host_applications").insert(...)`
--    first and silently falls back to a browser-local localStorage array on
--    any error — including "relation does not exist". Every application was
--    quietly landing in the applicant's own browser only, never reaching the
--    admin Host Applications review screen unless it happened to be the same
--    browser/profile. This creates the real table with RLS so applications
--    are actually persisted and visible to admins.
--
-- 2. pending_events_select/pending_events_update (from the original
--    2026-07-03 migration) are still `using (true)` for both anon and
--    authenticated — i.e. fully open reads AND writes on every row,
--    regardless of who submitted it. Combined with events_insert_own's
--    `host_id = auth.uid()` check, any signed-in user could call
--    `decideEvent(<their own pending_events id>, 'approved')` directly
--    (e.g. from devtools) and self-publish, completely bypassing admin
--    review — the UI-only admin gate was cosmetic, not a real boundary.
--    Tightened here to admin-only reads/writes (submitters can still see
--    their own row's status).
-- ============================================================================

create table if not exists public.host_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete cascade,
  name          text not null,
  email         text not null,
  business_name text,
  event_types   text,
  description   text,
  why_host      text,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now(),
  decided_at    timestamptz
);

create index if not exists host_applications_user_id_idx on public.host_applications(user_id);
create index if not exists host_applications_status_idx  on public.host_applications(status);

alter table public.host_applications enable row level security;

drop policy if exists host_applications_insert on public.host_applications;
create policy host_applications_insert on public.host_applications
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists host_applications_select on public.host_applications;
create policy host_applications_select on public.host_applications
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Only admins decide applications — applicants can read their own status
-- (above) but never flip it themselves.
drop policy if exists host_applications_update on public.host_applications;
create policy host_applications_update on public.host_applications
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── pending_events: close the open select/update policies ──────────────────
drop policy if exists pending_events_select on public.pending_events;
create policy pending_events_select on public.pending_events
  for select to authenticated
  using (host_id = auth.uid() or public.is_admin());

drop policy if exists pending_events_update on public.pending_events;
create policy pending_events_update on public.pending_events
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
