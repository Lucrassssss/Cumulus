-- ============================================================================
-- Cumulus — "Master Development Codex" growth features
-- ----------------------------------------------------------------------------
-- Concrete, buildable pieces from the founder-supplied 7-page codex that
-- weren't already covered by the earlier Master Blueprint pass. See
-- ARCHITECTURE.md for the full reconciliation (what matched, what was
-- reformed, what was deliberately declined and why).
-- ============================================================================

-- ── UK GDPR marketing opt-in (Page 2 / Page 4) ──────────────────────────────
-- "Allow [Host] to email me about future local events" — a per-ticket
-- consent flag, defaulting to false (opt-in, not opt-out, per UK GDPR).
-- get_past_attendee_emails() below is the actual enforcement point: the
-- guestlist CSV never carried email addresses in the first place (just
-- name/ticket/seat/status), so consent only matters where email addresses
-- actually leave the building — the "Invite Past Attendees" blast.
alter table public.tickets add column if not exists marketing_opt_in boolean not null default false;

create or replace function public.get_past_attendee_emails(p_host_id uuid default auth.uid())
returns table (email text, display_name text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or (auth.uid() <> p_host_id and not public.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select distinct u.email, u.display_name
    from public.tickets t
    join public.events e on e.id = t.event_id
    join public.users u on u.id = t.user_id
    where e.host_id = p_host_id
      and t.status = 'active'
      and t.marketing_opt_in = true
      and u.email is not null;
end;
$$;

-- ── Master "Valid for N Entries" QR + group scan (Page 3 / Page 6) ──────────
-- One QR per squad purchase instead of one per ticket. Scanning it checks in
-- the next still-active ticket in that squad, race-safe via
-- FOR UPDATE SKIP LOCKED (same pattern as claim_group_ticket) so two door
-- staff scanning the same QR at once can never double-check-in a seat.
-- Deliberately NOT "one scan admits all N at once" — that would let one
-- phone screen wave a whole group through without anyone checking headcount,
-- which undercuts the same anti-fraud intent the rest of this spec cares
-- about (rotating QR, 1:1 licensing compliance). One scan per person
-- arriving, same as scanning individual tickets, just from a single image.
create or replace function public.check_in_squad_ticket(p_squad_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row   public.tickets%rowtype;
  v_host  uuid;
  v_event uuid;
  v_remaining int;
begin
  select event_id into v_event from public.event_squads where id = p_squad_id;
  if v_event is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  select host_id into v_host from public.events where id = v_event;
  if v_host is distinct from auth.uid() and not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  select * into v_row
  from public.tickets
  where squad_id = p_squad_id and status = 'active'
  order by seat_num nulls last
  for update skip locked
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'all_checked_in');
  end if;

  update public.tickets set status = 'checked_in' where id = v_row.id;

  select count(*) into v_remaining
  from public.tickets
  where squad_id = p_squad_id and status = 'active';

  return jsonb_build_object(
    'ok', true,
    'ticket_id', v_row.ticket_id,
    'purchaser_name', v_row.purchaser_name,
    'remaining', v_remaining
  );
end;
$$;
revoke all on function public.check_in_squad_ticket(uuid) from public;
grant execute on function public.check_in_squad_ticket(uuid) to authenticated;

-- ── Repeat-attendee tracker (Page 4) ─────────────────────────────────────────
-- "Highlight Repeat Attendees" — how many of THIS event's attendees have
-- also attended a past event by the same host. The other two Page 4 asks
-- (spontaneity ratio, drop-off rate) need no new backend — both are derived
-- client-side from data the scanner guestlist already carries
-- (purchased_at, status) — see spontaneityStat()/dropOffStat() in app.js.
create or replace function public.get_repeat_attendee_count(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_host  uuid;
  v_total int;
  v_repeat int;
begin
  select host_id into v_host from public.events where id = p_event_id;
  if v_host is null then
    return jsonb_build_object('total', 0, 'repeat', 0);
  end if;
  if v_host is distinct from auth.uid() and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select count(distinct user_id) into v_total
  from public.tickets
  where event_id = p_event_id and status in ('active', 'checked_in');

  select count(distinct t1.user_id) into v_repeat
  from public.tickets t1
  where t1.event_id = p_event_id
    and t1.status in ('active', 'checked_in')
    and exists (
      select 1
      from public.tickets t2
      join public.events e2 on e2.id = t2.event_id
      where t2.user_id = t1.user_id
        and e2.host_id = v_host
        and t2.event_id <> p_event_id
        and t2.status in ('active', 'checked_in')
    );

  return jsonb_build_object('total', v_total, 'repeat', v_repeat);
end;
$$;
revoke all on function public.get_repeat_attendee_count(uuid) from public;
grant execute on function public.get_repeat_attendee_count(uuid) to authenticated;

-- ── Real event flyer upload (Page 2 / Page 5) ───────────────────────────────
-- events/pending_events get a real photo_url instead of always falling back
-- to the category stock photo (catImg() in app.js). Compression happens
-- client-side (canvas re-encode, see compressImageFile() in app.js) before
-- upload — this migration only adds the storage location and the column.
alter table public.events add column if not exists photo_url text;
alter table public.pending_events add column if not exists photo_url text;

insert into storage.buckets (id, name, public)
values ('event-flyers', 'event-flyers', true)
on conflict (id) do nothing;

-- No SELECT policy on storage.objects: a public bucket already serves
-- object URLs (GET /storage/v1/object/public/event-flyers/<path>) without
-- consulting RLS at all — that's what "public" means. A SELECT policy here
-- would only add the ability to list/enumerate every uploaded file path via
-- PostgREST, which gains the app nothing (nothing queries storage.objects
-- directly) and is exactly what Supabase's own advisor warns against for
-- public buckets. Writes are scoped to the caller's own folder — every
-- upload path starts with the uploader's own auth.uid(), so one host can
-- never overwrite another's flyer.
drop policy if exists event_flyers_select on storage.objects;

drop policy if exists event_flyers_insert on storage.objects;
create policy event_flyers_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'event-flyers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists event_flyers_update on storage.objects;
create policy event_flyers_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'event-flyers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists event_flyers_delete on storage.objects;
create policy event_flyers_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'event-flyers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
