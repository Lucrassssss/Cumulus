-- ============================================================================
-- Tighten pending_events INSERT policy
-- ----------------------------------------------------------------------------
-- Previously WITH CHECK (true) — any authenticated user could insert a
-- pending_events row with a forged host_id/host_email or an arbitrary
-- status. Only admins can SELECT from this table, so it couldn't be used to
-- sneak a live event onto the map, but it still allowed identity spoofing in
-- the review queue. Restrict inserts to the caller's own uid, always
-- starting as 'pending'.
-- ============================================================================

drop policy if exists pending_events_insert on public.pending_events;

create policy pending_events_insert on public.pending_events
  for insert to authenticated
  with check (
    status = 'pending'
    and host_id = auth.uid()
  );
