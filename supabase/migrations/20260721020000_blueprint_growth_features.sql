-- ============================================================================
-- Cumulus — "Master Blueprint" growth features
-- ----------------------------------------------------------------------------
-- Implements the concrete, buildable items from the founder-supplied
-- strategy doc's "Developer Specification" and feature-matrix sections:
--
-- 1. claim_group_ticket() — the blueprint's actual spec: ONE shareable
--    group link (not a code per ticket), claimed by grabbing any unclaimed
--    row in the group via FOR UPDATE SKIP LOCKED. Reuses the EXISTING
--    event_squads/tickets shape from the frictionless-ticketing pivot
--    (squad_id already groups a purchase; claim_code IS NOT NULL already
--    marks "this row is an extra seat, not the buyer's own") — no new
--    columns needed for this one.
--
-- 2. Tiered ticketing (Early Bird / General / Final) — events.price_tiers
--    jsonb, time-cutoff only for this pass (capacity-based flipping would
--    need live attendee-count triggers; deferred, documented in
--    ARCHITECTURE.md rather than half-built).
--
-- 3. get_past_attendee_emails() — backs the "Invite Past Attendees"
--    one-click blast: a host's own distinct past-attendee emails, deduped,
--    RLS-safe (SECURITY DEFINER checks is_event_host()-equivalent inline
--    rather than relying on RLS, since this reaches across a host's whole
--    event history in one call).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. claim_group_ticket(p_squad_id) — the Magic Link group claim.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.claim_group_ticket(p_squad_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_ticket_id uuid;
  v_event_id uuid;
  v_ticket_code text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not exists (select 1 from public.event_squads where id = p_squad_id) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  -- Already holds a ticket from this squad (buyer opening their own link,
  -- or a double-claim attempt) — nothing to do.
  if exists (
    select 1 from public.tickets
    where squad_id = p_squad_id and (claimed_by = v_uid or user_id = v_uid)
  ) then
    raise exception 'already_claimed' using errcode = 'P0001';
  end if;

  select id, event_id, ticket_id into v_ticket_id, v_event_id, v_ticket_code
  from public.tickets
  where squad_id = p_squad_id
    and claim_code is not null
    and claimed_by is null
    and status = 'active'
  for update skip locked
  limit 1;

  if v_ticket_id is null then
    raise exception 'no_tickets_remaining' using errcode = 'P0001';
  end if;

  update public.tickets
  set claimed_by = v_uid, claimed_at = now(), user_id = v_uid
  where id = v_ticket_id;

  return jsonb_build_object(
    'ok', true,
    'event_id', v_event_id,
    'ticket_id', v_ticket_code
  );
end;
$$;
revoke all on function public.claim_group_ticket(uuid) from public;
grant execute on function public.claim_group_ticket(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Tiered ticketing. price_tiers is nullable/empty for events that just
--    use the existing flat `price` column — fully backward compatible,
--    nothing about the existing checkout path breaks if this is unused.
--    Shape: [{"label":"Early Bird","price":8,"cutoff":"2026-08-01T18:00:00Z"}, ...]
--    ordered by cutoff ascending; the active tier is the first whose
--    cutoff hasn't passed yet, falling back to the last (final) tier once
--    all cutoffs have passed.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.events add column if not exists price_tiers jsonb;
-- pending_events mirrors this so a host's tier config survives the
-- pending -> events promotion in _publishApprovedEvent() (app.js).
alter table public.pending_events add column if not exists price_tiers jsonb;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. get_past_attendee_emails(p_host_id) — for the "Invite Past Attendees"
--    blast. SECURITY DEFINER, checks the caller IS p_host_id (or admin)
--    itself rather than trusting RLS, since it joins across users+tickets+
--    events for a host's entire history in one call.
-- ─────────────────────────────────────────────────────────────────────────
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
      and u.email is not null;
end;
$$;
revoke all on function public.get_past_attendee_emails(uuid) from public;
grant execute on function public.get_past_attendee_emails(uuid) to authenticated;
