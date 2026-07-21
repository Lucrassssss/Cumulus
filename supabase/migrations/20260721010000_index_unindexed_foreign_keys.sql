-- ============================================================================
-- Cumulus — cover unindexed foreign keys flagged by the performance advisor
-- ----------------------------------------------------------------------------
-- All six are on tables the Stripe Connect scaffolding (previous migration)
-- touches most heavily — event_payouts/event_squads/tickets/rsvps. Pure
-- read-path optimization: adds indexes only, no behavior change.
-- ============================================================================
create index if not exists event_payouts_host_id_idx on public.event_payouts (host_id);
create index if not exists event_squads_buyer_user_id_idx on public.event_squads (buyer_user_id);
create index if not exists event_squads_event_id_idx on public.event_squads (event_id);
create index if not exists rsvps_user_id_idx on public.rsvps (user_id);
create index if not exists tickets_claimed_by_idx on public.tickets (claimed_by);
create index if not exists tickets_squad_id_idx on public.tickets (squad_id);
