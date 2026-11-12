-- Order receipt email (send-receipt edge function): stamped once sent so the
-- automatic post-purchase send never double-emails.
alter table public.tickets add column if not exists receipt_sent_at timestamptz;
