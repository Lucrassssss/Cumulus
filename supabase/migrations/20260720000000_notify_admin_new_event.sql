-- ============================================================================
-- Cumulus — instant admin email alert on new pending_events submissions
-- ----------------------------------------------------------------------------
-- Fires the notify-admin-new-event edge function (via pg_net) whenever a host
-- submits a new event into public.pending_events with status = 'pending'.
-- The function emails hello@cumulusapp.co (or whatever ADMIN_NOTIFY_EMAIL is
-- set to) via Resend, with one-click Studio links to review/approve/reject.
--
-- SETUP REQUIRED AFTER THIS MIGRATION RUNS (cannot be done from SQL alone):
--   1. Deploy the function:  supabase functions deploy notify-admin-new-event
--   2. Set its secrets:
--        supabase secrets set RESEND_API_KEY=<your real Resend API key>
--        supabase secrets set ADMIN_NOTIFY_EMAIL=<inbox to alert>
--        supabase secrets set NOTIFY_WEBHOOK_SECRET=<value from step 3 below>
--   3. Fetch the random secret this migration generated so it matches the one
--      the trigger sends:
--        select decrypted_secret from vault.decrypted_secrets
--          where name = 'notify_admin_webhook_secret';
--      Use that exact value for NOTIFY_WEBHOOK_SECRET in step 2.
-- ============================================================================

create extension if not exists pg_net;
-- Vault ships enabled by default on Supabase Cloud projects; this is a no-op
-- there and just guards against a from-scratch/self-hosted project.
create extension if not exists supabase_vault cascade;

-- Vault secret shared between this trigger and the edge function. Generated
-- randomly at migration time (never hardcoded/committed) — see setup notes
-- above for how to read it back out once.
do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets where name = 'notify_admin_webhook_secret'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'notify_admin_webhook_secret'
    );
  end if;
end $$;

create or replace function public.trg_notify_admin_new_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'notify_admin_webhook_secret';

  perform net.http_post(
    url     := 'https://xyzrvgbdnevllwvxqcka.supabase.co/functions/v1/notify-admin-new-event',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || v_secret
               ),
    body    := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

-- Not meant to be called directly by clients — only fired by the trigger below.
revoke execute on function public.trg_notify_admin_new_event() from public, anon, authenticated;

drop trigger if exists notify_admin_new_event_trg on public.pending_events;
create trigger notify_admin_new_event_trg
  after insert on public.pending_events
  for each row
  when (new.status = 'pending')
  execute function public.trg_notify_admin_new_event();
