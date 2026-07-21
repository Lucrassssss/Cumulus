-- ============================================================================
-- Cumulus — Supabase security + performance advisor remediation
-- ----------------------------------------------------------------------------
-- A full pass through `get_advisors` (security + performance). See
-- ARCHITECTURE.md → "Advisor remediation pass" for the write-up of what each
-- section fixes, what was found to be a real vulnerability vs. an intentional
-- false positive, and what can't be fixed from here (documented, not silently
-- skipped).
-- ============================================================================

-- ── 1. Two real, unauthenticated-readable info-disclosure bugs ─────────────
-- Both app_role() and get_host_payouts() take a "p_user"/"p_host" parameter
-- that defaults to the caller's own auth.uid() (which is why the app's own
-- only call sites — currentUserRole() in services.js, and the host payouts
-- dashboard — never pass an override and looked fine in normal use) but
-- NEITHER function checked that an override actually belonged to the caller.
-- Both are SECURITY DEFINER, so they run with elevated rights and bypass RLS
-- entirely — meaning anyone with just the anon key could call, e.g.,
-- `/rest/v1/rpc/app_role?p_user=<any-uuid>` and learn whether an arbitrary
-- account is an admin, or `/rest/v1/rpc/get_host_payouts?p_host=<any-uuid>`
-- and read another host's entire payout ledger (gross/fee/net amounts,
-- dispute status) — completely bypassing the event_payouts_host_read RLS
-- policy that looks like it protects this table. Fixed by adding the same
-- "self, or admin" check every other parameterized RPC in this codebase
-- already uses.
create or replace function public.app_role(p_user uuid default auth.uid())
returns public.user_role
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user is distinct from auth.uid() and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return (select role from public.users where id = p_user);
end;
$$;

create or replace function public.get_host_payouts(p_host uuid default auth.uid())
returns setof public.event_payouts
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_host is distinct from auth.uid() and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query select * from public.event_payouts where host_id = p_host order by created_at desc;
end;
$$;

-- ── 2. function_search_path_mutable (WARN) ──────────────────────────────────
-- Pin search_path so these can't be redirected by a session-level search_path
-- change. Bodies are unchanged from what's live — this only adds the clause.
create or replace function public.get_event_details(p_id uuid)
returns setof public.events
language sql
stable
set search_path = public, pg_temp
as $$
  select * from public.events where id = p_id;
$$;

create or replace function public.get_events_geojson(min_lng double precision, min_lat double precision, max_lng double precision, max_lat double precision)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
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
      and e.status = 'active'
      and ST_Intersects(e.coordinates, ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography)
  ) t;

  return v_result;
end;
$$;

create or replace function public.sync_event_coordinates()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.lat is not null and new.lon is not null then
    new.coordinates := ST_SetSRID(ST_MakePoint(new.lon, new.lat), 4326)::geography;
  end if;
  return new;
end;
$$;

-- ── 3. Trigger-only functions don't need to be directly RPC-callable ───────
-- protect_user_columns, set_payout_schedule, sync_event_payout and
-- sync_event_coordinates only ever fire as triggers (confirmed via
-- pg_trigger) — Postgres runs a trigger as the function's owner regardless
-- of the invoking role's own EXECUTE privilege, so revoking anon/authenticated
-- access here removes an unnecessary public /rest/v1/rpc/... entry point
-- without changing how the triggers themselves fire. is_trusted_host is the
-- same story: it's only ever called from inside set_payout_schedule(), never
-- from the client.
revoke all on function public.protect_user_columns() from public, anon, authenticated;
revoke all on function public.set_payout_schedule() from public, anon, authenticated;
revoke all on function public.sync_event_payout() from public, anon, authenticated;
revoke all on function public.sync_event_coordinates() from public, anon, authenticated;
revoke all on function public.is_trusted_host(uuid) from public, anon, authenticated;

-- ── 4. auth_rls_initplan (PERFORMANCE) ──────────────────────────────────────
-- Wrap every direct auth.<fn>() call inside a policy in `(select ...)` so
-- Postgres evaluates it once per statement instead of once per row. Also
-- folds each table's separate "*_admin_all" blanket policy (or duplicate
-- "*_admin" policy) into the specific per-action policies below it, which
-- simultaneously resolves every multiple_permissive_policies warning — same
-- boolean logic, fewer policies for Postgres to evaluate per query. No
-- authorization behavior changes: every OR'd is_admin() branch removed from
-- one policy is added to whichever policy(ies) now cover that action.

drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists attendees_self_cancel on public.event_attendees;
create policy attendees_self_cancel on public.event_attendees for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists attendees_self_read on public.event_attendees;
create policy attendees_self_read on public.event_attendees for select to authenticated
  using (
    (user_id = (select auth.uid()))
    or is_admin()
    or is_event_host(event_id, (select auth.uid()))
  );

drop policy if exists attendees_self_rsvp on public.event_attendees;
create policy attendees_self_rsvp on public.event_attendees for insert to authenticated
  with check (user_id = (select auth.uid()) and checked_in_at is null);

drop policy if exists event_payouts_host_read on public.event_payouts;
create policy event_payouts_host_read on public.event_payouts for select to authenticated
  using (host_id = (select auth.uid()) or is_admin());

drop policy if exists event_squads_buyer_insert on public.event_squads;
create policy event_squads_buyer_insert on public.event_squads for insert to authenticated
  with check (buyer_user_id = (select auth.uid()));

drop policy if exists event_squads_member_read on public.event_squads;
create policy event_squads_member_read on public.event_squads for select to authenticated
  using (
    buyer_user_id = (select auth.uid())
    or exists (
      select 1 from tickets t
      where t.squad_id = event_squads.id
        and (t.user_id = (select auth.uid()) or t.claimed_by = (select auth.uid()))
    )
    or is_admin()
  );

-- events: drop the blanket ALL policy, fold is_admin() into insert (the only
-- one of the four that didn't already have it — select/delete/update did).
drop policy if exists events_admin_all on public.events;

drop policy if exists events_insert_own on public.events;
create policy events_insert_own on public.events for insert to authenticated
  with check (host_id = (select auth.uid()) or is_admin());

drop policy if exists events_delete_own on public.events;
create policy events_delete_own on public.events for delete to authenticated
  using (host_id = (select auth.uid()) or is_admin());

drop policy if exists events_modify_own on public.events;
create policy events_modify_own on public.events for update to authenticated
  using (host_id = (select auth.uid()) or is_admin())
  with check (host_id = (select auth.uid()) or is_admin());
-- events_read (qual `true`) is untouched — already covers admins, no
-- auth.<fn>() call to wrap.

drop policy if exists host_applications_insert on public.host_applications;
create policy host_applications_insert on public.host_applications for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists host_applications_select on public.host_applications;
create policy host_applications_select on public.host_applications for select to authenticated
  using (user_id = (select auth.uid()) or is_admin());

-- pending_events_select_admin was a pure subset of pending_events_select
-- (is_admin() alone vs. host_id=... OR is_admin()) — genuinely redundant,
-- not just an initplan issue.
drop policy if exists pending_events_select_admin on public.pending_events;
drop policy if exists pending_events_select on public.pending_events;
create policy pending_events_select on public.pending_events for select to authenticated
  using (host_id = (select auth.uid()) or is_admin());

-- pending_events_update and pending_events_update_admin were byte-for-byte
-- identical (both `is_admin()` only) — drop the duplicate, keep one.
drop policy if exists pending_events_update_admin on public.pending_events;

drop policy if exists pending_events_insert on public.pending_events;
create policy pending_events_insert on public.pending_events for insert to authenticated
  with check (status = 'pending' and host_id = (select auth.uid()));

drop policy if exists rsvps_delete_own on public.rsvps;
create policy rsvps_delete_own on public.rsvps for delete to authenticated
  using (user_id = (select auth.uid()) or is_admin());

drop policy if exists rsvps_insert_own on public.rsvps;
create policy rsvps_insert_own on public.rsvps for insert to authenticated
  with check (user_id = (select auth.uid()));

-- tickets: buyer_read + host_read were two separate permissive SELECT
-- policies (Postgres ORs them together anyway) — merged into one.
drop policy if exists tickets_buyer_read on public.tickets;
drop policy if exists tickets_host_read on public.tickets;
create policy tickets_select on public.tickets for select to authenticated
  using (
    user_id = (select auth.uid())
    or claimed_by = (select auth.uid())
    or is_admin()
    or exists (
      select 1 from events e
      where e.id = tickets.event_id and e.host_id = (select auth.uid())
    )
  );

drop policy if exists tickets_buyer_delete on public.tickets;
create policy tickets_buyer_delete on public.tickets for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists tickets_buyer_insert on public.tickets;
create policy tickets_buyer_insert on public.tickets for insert to authenticated
  with check (user_id = (select auth.uid()));

-- users: users_admin_all was ALL (select/insert/update/delete). select and
-- update already OR'd is_admin() in a second policy; insert and delete
-- didn't have an admin path anywhere else, so those two need it added here
-- to avoid silently taking away admin's existing ability to create a user
-- row for someone else or delete an account.
drop policy if exists users_admin_all on public.users;

drop policy if exists users_self_insert on public.users;
create policy users_self_insert on public.users for insert to authenticated
  with check (id = (select auth.uid()) or is_admin());

drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users for select to authenticated
  using (id = (select auth.uid()) or is_admin());

-- users_self_update and users_self_write were byte-for-byte identical
-- (both UPDATE, both `id = auth.uid()`) — drop the duplicate, keep one,
-- and fold in the admin path users_admin_all used to provide.
drop policy if exists users_self_update on public.users;
drop policy if exists users_self_write on public.users;
create policy users_self_update on public.users for update to authenticated
  using (id = (select auth.uid()) or is_admin())
  with check (id = (select auth.uid()) or is_admin());

-- users had no dedicated DELETE policy of its own — only users_admin_all
-- covered it. Give it an explicit one so dropping users_admin_all doesn't
-- quietly remove the ability to delete a user account at all.
create policy users_admin_delete on public.users for delete to authenticated
  using (is_admin());
