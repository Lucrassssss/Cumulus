-- ============================================================================
-- Cumulus — additional mock curator codes for testing
-- Extends the seed set from 20260703000000_secret_club.sql with more variety:
-- a few more active codes across tiers, plus one INACTIVE code so the
-- rejection path (validate_curator_code returns no rows) is testable too.
-- Idempotent — safe to re-run.
-- ============================================================================

insert into public.curator_codes (code, curator_name, tier, active) values
  ('CUR-DALS-4410', 'The Dalston Yard',        'standard', true),
  ('CUR-SHRD-7788', 'Shoreditch Collective',   'vip',      true),
  ('CUR-CAMD-1923', 'Camden Roasters',         'standard', true),
  ('CUR-VOID-0000', 'Expired Test Code',       'standard', false)
on conflict (code) do nothing;
