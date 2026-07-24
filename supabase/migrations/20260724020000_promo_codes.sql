-- ============================================================================
-- Promo/discount codes (production-readiness audit, Section 6 "For the
-- host"): "Cumulus has time-based tiers but nothing a host can hand out
-- selectively — guestlist comps, influencer codes, early-supporter
-- discounts." A host manages their own event's codes directly (RLS-scoped
-- to host_id = auth.uid()); a buyer's entered code is only ever resolved
-- server-side, inside create-checkout-session, which is also the ONLY place
-- that decides what Stripe actually charges — same price-authority
-- discipline as the existing tiered-pricing logic (activeTierPrice()) this
-- sits alongside. No RLS SELECT policy for plain authenticated buyers at
-- all: a code is looked up by the edge function via the service-role key,
-- so a buyer can never enumerate an event's codes by querying the table
-- directly, only redeem one they were actually given.
-- ============================================================================

create table if not exists public.promo_codes (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  host_id        uuid not null references public.users(id) on delete cascade,
  code           text not null,
  discount_type  text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  max_uses       integer check (max_uses is null or max_uses > 0),
  uses_count     integer not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (event_id, code)
);
create index if not exists promo_codes_event_idx on public.promo_codes (event_id);

alter table public.promo_codes enable row level security;

drop policy if exists promo_codes_host_all on public.promo_codes;
create policy promo_codes_host_all on public.promo_codes
  for all to authenticated
  using (host_id = auth.uid() or public.is_admin())
  with check (host_id = auth.uid() or public.is_admin());

-- Atomic usage increment, called only from stripe-webhook (service role,
-- which bypasses RLS/grants anyway — the revoke below just documents that
-- no client role should ever call this directly) once a payment carrying a
-- redeemed code has actually succeeded. Plain UPDATE ... +1 rather than a
-- read-then-write from the edge function, so two near-simultaneous
-- redemptions of a max_uses-limited code can't both read the same stale
-- count and both slip through.
create or replace function public.increment_promo_code_use(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.promo_codes set uses_count = uses_count + 1 where id = p_id;
$$;
revoke all on function public.increment_promo_code_use(uuid) from public, anon, authenticated;
