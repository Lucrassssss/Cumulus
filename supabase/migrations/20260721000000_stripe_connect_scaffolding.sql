-- ============================================================================
-- Cumulus — Stripe Connect scaffolding + final velvet-rope/age-verification
-- cleanup
-- ----------------------------------------------------------------------------
-- Two unrelated things bundled into one migration because the second is a
-- prerequisite for the first (protect_user_columns() must be rewritten either
-- way, so touch it once):
--
-- 1. DROP the last dead velvet-rope/age-verification leftovers the pivot
--    migration (20260720010000) missed: mark_age_verified(), and the
--    age_verified_at / invited_by / onboarded_at / last_verification_attempt_at
--    columns on public.users. Nothing in the live frontend has read or written
--    any of these since the pivot — grepped src/js/*.js and every
--    supabase/functions/*/index.ts to confirm. The two edge functions that
--    used them (create-verification-session, identity-webhook) are deleted in
--    this same change (see the repo diff, not this file — Postgres migrations
--    can't touch the filesystem).
--
-- 2. ADD the schema for real Stripe Connect ("separate charges and
--    transfers"): the platform account collects the full checkout amount,
--    then a later transfer moves the host's net share to their own Connect
--    account once event_payouts.scheduled_release_at has passed (the
--    existing 24h/48h trust-tier logic from the pivot migration is REUSED
--    as-is — this migration only adds where the money actually goes).
--
-- IMPORTANT — this migration adds SCHEMA ONLY. As of this change there is
-- still no code path anywhere that has been exercised against a live Stripe
-- account from this sandbox (no Stripe/Supabase MCP credentials available
-- here). The edge functions that use these columns
-- (create-checkout-session, stripe-webhook, connect-onboarding,
-- release-payout, cancel-event-refund) are new in this same change and need
-- STRIPE_SECRET_KEY (already configured, per create-verification-session
-- having needed it) plus a NEW STRIPE_CHECKOUT_WEBHOOK_SECRET (Stripe issues
-- a distinct signing secret per webhook endpoint — this is not the same
-- secret as the old identity-webhook's STRIPE_WEBHOOK_SECRET) and Stripe
-- Connect enabled on the platform account before any of this can be
-- exercised for real.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Drop the last dead age-verification / invite-system columns.
-- ─────────────────────────────────────────────────────────────────────────
drop function if exists public.mark_age_verified(uuid);

alter table public.users drop column if exists age_verified_at;
alter table public.users drop column if exists last_verification_attempt_at;
alter table public.users drop column if exists invited_by;
alter table public.users drop column if exists onboarded_at;

-- Rewrite the column-privilege guard: drop references to the columns just
-- removed, add guards for the new stripe_connect_* columns below (a member
-- must never be able to UPDATE their own row to claim a connected payout
-- account or self-flip charges/payouts-enabled from the client — those are
-- only ever true once Stripe's account.updated webhook confirms it).
create or replace function public.protect_user_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;
  if new.role                            is distinct from old.role
     or new.stripe_connect_account_id    is distinct from old.stripe_connect_account_id
     or new.stripe_connect_charges_enabled is distinct from old.stripe_connect_charges_enabled
     or new.stripe_connect_payouts_enabled is distinct from old.stripe_connect_payouts_enabled then
    raise exception 'protected_columns' using
      detail = 'role and stripe_connect_* fields are managed by the system';
  end if;
  return new;
end;
$$;
-- Trigger itself is unchanged (same name, same table, same timing) — the
-- function body swap above is all that's needed; re-declaring it here only
-- for readers who grep the trigger list rather than the function body.
drop trigger if exists protect_user_columns_trg on public.users;
create trigger protect_user_columns_trg
  before update on public.users
  for each row execute function public.protect_user_columns();

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Stripe Connect columns.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.users
  add column if not exists stripe_connect_account_id      text,
  add column if not exists stripe_connect_charges_enabled boolean not null default false,
  add column if not exists stripe_connect_payouts_enabled boolean not null default false;

-- One host's connected account can only ever be one Stripe account — not a
-- security boundary (RLS + protect_user_columns already are), just prevents
-- an operational footgun of two rows silently pointing at the same account.
create unique index if not exists users_stripe_connect_account_idx
  on public.users (stripe_connect_account_id)
  where stripe_connect_account_id is not null;

alter table public.tickets
  add column if not exists stripe_payment_intent_id  text,
  add column if not exists stripe_checkout_session_id text;
create index if not exists tickets_stripe_pi_idx
  on public.tickets (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
-- The webhook looks tickets up by session id to avoid creating them twice if
-- Stripe retries a checkout.session.completed delivery.
create index if not exists tickets_stripe_session_idx
  on public.tickets (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

alter table public.event_payouts
  add column if not exists stripe_transfer_id text;
alter table public.event_payouts drop constraint if exists event_payouts_status_check;
alter table public.event_payouts
  add constraint event_payouts_status_check
  check (status in ('pending', 'released', 'disputed', 'refunded'));

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Event cancellation (needed so cancel-event-refund has somewhere to
--    record "this event no longer happens" and the map/list views can filter
--    it out). Public events never had a status column — every row in
--    `events` was implicitly live — so this is additive, not a repurpose.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.events
  add column if not exists status text not null default 'active'
  check (status in ('active', 'cancelled'));
create index if not exists events_status_idx on public.events (status);

-- Ticket-side mirror of a refund: 'cancelled' already exists as a tickets.status
-- value (used for host-cancels-attendance today) — reused, not renamed, for
-- "this ticket was refunded because the event was cancelled." The refund
-- edge function additionally records money movement on event_payouts below.

-- ─────────────────────────────────────────────────────────────────────────
-- 4. finalize_event_cancellation() — the DB half of cancel-event-refund.
--    SECURITY DEFINER, service_role only: the edge function calls Stripe
--    refunds FIRST, and only calls this once Stripe confirms every refund
--    succeeded, so the DB state never claims "refunded" before the money
--    actually moved. Idempotent — safe to call twice for the same event.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.finalize_event_cancellation(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cancelled_tickets int;
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.events set status = 'cancelled' where id = p_event_id;

  update public.tickets
  set status = 'cancelled'
  where event_id = p_event_id and status = 'active';
  get diagnostics v_cancelled_tickets = row_count;

  -- Only a payout still sitting in escrow (never released to the host) can
  -- be zeroed out here. A payout already 'released' means the transfer to
  -- the host's Connect account already happened — clawing that back is a
  -- SEPARATE reverse-transfer Stripe call the edge function must also make;
  -- this function only ever adjusts bookkeeping for money Stripe has
  -- confirmed was actually refunded to the buyer.
  update public.event_payouts
  set status = 'refunded', gross_amount = 0, fee_amount = 0, net_amount = 0
  where event_id = p_event_id and status = 'pending';

  return jsonb_build_object(
    'ok', true,
    'event_id', p_event_id,
    'tickets_cancelled', v_cancelled_tickets
  );
end;
$$;
revoke all on function public.finalize_event_cancellation(uuid) from public;
grant execute on function public.finalize_event_cancellation(uuid) to service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. start_ticket_transfer() — generalises the existing Squad claim-code
--    mechanism (built for "share extra tickets from one purchase") to ANY
--    single ticket a member owns, satisfying the self-serve "transfer a
--    ticket" requirement without inventing a second code system. The
--    existing claim_ticket() RPC (pivot migration) already reassigns
--    user_id on redemption, so it needs no changes — this just puts a fresh,
--    unclaimed code onto a ticket the caller currently owns.
--
--    Takes the human-readable ticket_id (text, e.g. "CU-AB12CD"), not the
--    UUID primary key — that's the identifier the frontend already carries
--    around everywhere (myTickets[].ticketId, cancelTicket(), etc.); the
--    client never loads tickets.id at all, so requiring the UUID here would
--    mean plumbing a field through loadMyTickets() for no real benefit,
--    since ticket_id is already unique.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.start_ticket_transfer(p_ticket_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.tickets%rowtype;
  v_code text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_row from public.tickets where ticket_id = p_ticket_code for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if v_row.user_id is distinct from v_uid then
    raise exception 'not_your_ticket' using errcode = '42501';
  end if;
  if v_row.status <> 'active' then
    raise exception 'ticket_not_active' using errcode = 'P0001';
  end if;

  -- Same shape as generateClaimCode() client-side (app.js): random, opaque,
  -- collision-checked by the unique index on tickets.claim_code.
  v_code := encode(gen_random_bytes(9), 'base64');
  v_code := regexp_replace(v_code, '[^a-zA-Z0-9]', '', 'g');

  update public.tickets
  set claim_code = v_code, claimed_by = null, claimed_at = null
  where id = v_row.id;

  return jsonb_build_object('ok', true, 'claim_code', v_code, 'ticket_id', v_row.ticket_id);
end;
$$;
revoke all on function public.start_ticket_transfer(text) from public;
grant execute on function public.start_ticket_transfer(text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Cancelled events must disappear from the map/pins RPC. get_event_details
--    is deliberately left unfiltered — a buyer with an existing ticket to a
--    cancelled event still needs to open it and see the cancellation notice,
--    so filtering happens client-side there (ev.status === 'cancelled'), not
--    server-side. Only the signature (min_lng..max_lng) is repeated from the
--    pivot migration; the body adds one predicate.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.get_events_geojson(
  min_lng double precision,
  min_lat double precision,
  max_lng double precision,
  max_lat double precision
)
returns jsonb
language plpgsql
stable
security invoker
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
grant execute on function public.get_events_geojson(
  double precision, double precision, double precision, double precision
) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 7. get_host_payouts() must stop lazily flipping status to 'released' on
--    read now that release-payout (new edge function) does a REAL Stripe
--    transfer before a payout may be marked released. The old behaviour
--    (pivot migration) was correct only because nothing else ever moved
--    money — with a real release path added, a host opening their payouts
--    panel would otherwise mark rows 'released' with no transfer having
--    happened, and release-payout would then never see (or pay) them.
--    This is now a pure read; release-payout owns every status transition.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.get_host_payouts(p_host uuid default auth.uid())
returns setof public.event_payouts
language sql security definer set search_path = public as $$
  select * from public.event_payouts where host_id = p_host order by created_at desc;
$$;
revoke all on function public.get_host_payouts(uuid) from public;
grant execute on function public.get_host_payouts(uuid) to authenticated;
