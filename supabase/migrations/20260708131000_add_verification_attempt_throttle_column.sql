-- ============================================================================
-- Throttle Stripe Identity verification session creation
-- ----------------------------------------------------------------------------
-- Each call to create-verification-session spins up a real Stripe Identity
-- session (~$1-1.50 each regardless of outcome). Without a cooldown, a
-- signed-in user could spam the endpoint and rack up charges. Track the
-- last attempt per user so the edge function can enforce a cooldown.
-- ============================================================================

alter table public.users
  add column if not exists last_verification_attempt_at timestamptz;
