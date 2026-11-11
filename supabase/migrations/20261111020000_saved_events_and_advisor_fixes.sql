-- 1. Saved events (♥) synced to the account ─────────────────────────────────
-- The client keeps localStorage as its fast synchronous cache (works for
-- guests); signed-in users mirror it here so saves follow them across devices.
create table if not exists public.saved_events (
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
create index if not exists saved_events_event_idx on public.saved_events(event_id);
alter table public.saved_events enable row level security;

drop policy if exists saved_events_select_own on public.saved_events;
drop policy if exists saved_events_insert_own on public.saved_events;
drop policy if exists saved_events_delete_own on public.saved_events;
create policy saved_events_select_own on public.saved_events
  for select to authenticated using (user_id = (select auth.uid()));
create policy saved_events_insert_own on public.saved_events
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy saved_events_delete_own on public.saved_events
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, delete on public.saved_events to authenticated;

-- 2. Advisor: login-only SECURITY DEFINER RPCs callable by anon ─────────────
-- Every one of these already rejects callers without auth.uid() internally;
-- this removes the anonymous surface entirely (defence in depth).
do $$
declare f text;
begin
  foreach f in array array[
    'public.app_role(uuid)',
    'public.check_in_squad_ticket(uuid)',
    'public.check_in_ticket(text)',
    'public.check_into_event(uuid)',
    'public.claim_group_ticket(uuid)',
    'public.claim_ticket(text)',
    'public.get_host_payouts(uuid)',
    'public.get_past_attendee_emails(uuid)',
    'public.get_repeat_attendee_count(uuid)',
    'public.start_ticket_transfer(text)',
    'public.claim_waitlist_offer(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;

-- Service-role only (it already raises unless auth.role() = service_role).
revoke execute on function public.finalize_event_cancellation(uuid) from public, anon, authenticated;
grant execute on function public.finalize_event_cancellation(uuid) to service_role;

-- 3. Advisor: re-evaluated auth.uid() in RLS (per-row → once per query) ────
alter policy host_follows_insert on public.host_follows
  with check (follower_id = (select auth.uid()));
alter policy host_follows_delete on public.host_follows
  using (follower_id = (select auth.uid()));
alter policy host_follows_update on public.host_follows
  using (follower_id = (select auth.uid()))
  with check (follower_id = (select auth.uid()));
alter policy event_waitlist_select_own on public.event_waitlist
  using (user_id = (select auth.uid()) or public.is_admin());
alter policy event_waitlist_insert_own on public.event_waitlist
  with check (user_id = (select auth.uid()));
alter policy event_waitlist_delete_own on public.event_waitlist
  using (user_id = (select auth.uid()));
alter policy promo_codes_host_all on public.promo_codes
  using (host_id = (select auth.uid()) or public.is_admin())
  with check (host_id = (select auth.uid()) or public.is_admin());

-- 4. Advisor: unindexed foreign keys ────────────────────────────────────────
create index if not exists event_reports_event_id_idx on public.event_reports(event_id);
create index if not exists event_waitlist_user_id_idx on public.event_waitlist(user_id);
create index if not exists promo_codes_host_id_idx on public.promo_codes(host_id);
