-- ============================================================================
-- Waitlist + self-serve ticket return (production-readiness audit, Section 6
-- "For the ticket buyer" — the single highest-value buyer-side gap: a
-- sold-out event currently shows a permanently disabled "Sold Out" button
-- and any seat that frees up later is just lost. DICE's model: a waitlist
-- button the instant an event sells out, and a returned ticket auto-offers
-- to the next person in queue with a reservation window + automatic refund
-- to the returner.
--
-- Scoped honestly: this does NOT hard-lock inventory against a race between
-- the offered person and a brand-new booker. Nothing else in this codebase
-- enforces capacity server-side either (create-checkout-session has no
-- capacity check at all — capacity is a client-side display concern only),
-- so building airtight reservation locking here would be inconsistent with
-- how the rest of ticketing actually works today, not a small addition.
-- What this DOES give a waitlisted person: a genuine priority notice with a
-- reservation window shown on the event page, which is the real value DICE
-- describes ("reservation window") — just without a hard seat lock behind
-- it. Worth revisiting if hard capacity enforcement is ever built.
-- ============================================================================

create table if not exists public.event_waitlist (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  status      text not null default 'waiting' check (status in ('waiting', 'offered', 'claimed', 'expired', 'cancelled')),
  offered_at  timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  unique (event_id, user_id)
);
create index if not exists event_waitlist_event_idx on public.event_waitlist (event_id, status, created_at);

alter table public.event_waitlist enable row level security;

-- A user manages their own entry directly (join = insert, leave = delete) —
-- no RPC needed for either. Status transitions to 'offered'/'expired' only
-- ever happen through offer_next_waitlist_seat() below (SECURITY DEFINER,
-- since offering a seat necessarily touches another user's row), and
-- 'claimed' only through claim_waitlist_offer() — hence no update policy
-- for plain authenticated users.
drop policy if exists event_waitlist_select_own on public.event_waitlist;
create policy event_waitlist_select_own on public.event_waitlist
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists event_waitlist_insert_own on public.event_waitlist;
create policy event_waitlist_insert_own on public.event_waitlist
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists event_waitlist_delete_own on public.event_waitlist;
create policy event_waitlist_delete_own on public.event_waitlist
  for delete to authenticated using (user_id = auth.uid());

-- Offers the oldest still-'waiting' entry for an event a reservation window,
-- lazily expiring any past-due 'offered' row it encounters along the way
-- (chains to the next person rather than leaving a stale reservation
-- blocking everyone behind it). Called server-side (service role, via the
-- cancel-ticket-refund edge function) right after a ticket is returned —
-- never called directly by the client, since a client could otherwise spam
-- reservation offers with no real return behind them.
create or replace function public.offer_next_waitlist_seat(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- Expire anything whose reservation window already lapsed so it doesn't
  -- keep blocking the next person via the unique(event_id, user_id) — an
  -- expired row stays as history, it just stops counting as "ahead in line".
  update public.event_waitlist
    set status = 'expired'
    where event_id = p_event_id and status = 'offered' and expires_at < now();

  select id into v_id
    from public.event_waitlist
    where event_id = p_event_id and status = 'waiting'
    order by created_at asc
    limit 1;

  if v_id is null then
    return null;
  end if;

  update public.event_waitlist
    set status = 'offered', offered_at = now(), expires_at = now() + interval '30 minutes'
    where id = v_id;

  return v_id;
end;
$$;
revoke all on function public.offer_next_waitlist_seat(uuid) from public, anon, authenticated;

-- A signed-in user claiming their own still-valid offer. Plain client call
-- (not restricted to service role) since it only ever mutates the caller's
-- own row and the WHERE clause is the entire safety check — no way to claim
-- someone else's offer or one that's already expired/claimed.
create or replace function public.claim_waitlist_offer(p_waitlist_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.event_waitlist
    set status = 'claimed'
    where id = p_waitlist_id
      and user_id = auth.uid()
      and status = 'offered'
      and expires_at > now();
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;
revoke all on function public.claim_waitlist_offer(uuid) from public, anon;
grant execute on function public.claim_waitlist_offer(uuid) to authenticated;
