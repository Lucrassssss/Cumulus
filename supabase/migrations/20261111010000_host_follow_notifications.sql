-- "Notify me when they post" for host profiles.
--
-- host_follows.notify: per-follow opt-in. Following stays a quiet bookmark;
-- notify=true additionally asks for a heads-up when that host publishes.
-- Turning notify on from the app implies following (the client upserts).
alter table public.host_follows
  add column if not exists notify boolean not null default false;

-- Followers may flip notify on their own rows (INSERT/DELETE policies
-- already exist; there was no UPDATE policy).
drop policy if exists host_follows_update on public.host_follows;
create policy host_follows_update on public.host_follows
  for update using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- On every newly published event (admin publish or approved host event both
-- INSERT into events), ping the notify-followers-new-event Edge Function —
-- but only when the event has a real host and at least one follower asked
-- to be notified, so the common case costs one indexed EXISTS and no HTTP.
-- Same server-to-server pattern + vault secret as trg_notify_admin_new_event.
create or replace function public.trg_notify_followers_new_event()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_secret text;
begin
  if new.host_id is null or new.status <> 'active' then
    return new;
  end if;
  if not exists (
    select 1 from public.host_follows f
    where f.host_id = new.host_id and f.notify
  ) then
    return new;
  end if;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'notify_admin_webhook_secret';

  perform net.http_post(
    url     := 'https://xyzrvgbdnevllwvxqcka.supabase.co/functions/v1/notify-followers-new-event',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || v_secret
               ),
    body    := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

revoke execute on function public.trg_notify_followers_new_event() from public, anon, authenticated;

drop trigger if exists notify_followers_new_event_trg on public.events;
create trigger notify_followers_new_event_trg
  after insert on public.events
  for each row execute function public.trg_notify_followers_new_event();

create index if not exists host_follows_host_notify_idx
  on public.host_follows (host_id) where notify;
