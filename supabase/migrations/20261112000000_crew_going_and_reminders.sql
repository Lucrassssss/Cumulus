-- 1. "Your crew is going" ───────────────────────────────────────────────────
-- Crew = anyone you've shared a Squad with (you bought for them, they bought
-- for you, or you both claimed seats from the same squad). No friend
-- requests to manage: if you've been out together on Cumulus, you're crew.
-- Opt-out per user via users.share_going (Settings → "Show my crew…").
alter table public.users add column if not exists share_going boolean not null default true;

create or replace function public.crew_going()
returns table (event_id uuid, user_id uuid, name text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as id),
  my_squads as (
    select s.id from public.event_squads s, me where s.buyer_user_id = me.id
    union
    select t.squad_id from public.tickets t, me
     where t.squad_id is not null and (t.user_id = me.id or t.claimed_by = me.id)
  ),
  crew as (
    select s.buyer_user_id as uid from public.event_squads s where s.id in (select id from my_squads)
    union
    select coalesce(t.claimed_by, t.user_id) from public.tickets t where t.squad_id in (select id from my_squads)
  )
  select distinct on (t.event_id, u.id)
         t.event_id, u.id, coalesce(nullif(u.display_name, ''), split_part(u.name, ' ', 1)), u.avatar_url
    from crew c
    join public.users u on u.id = c.uid
    join public.tickets t on coalesce(t.claimed_by, t.user_id) = u.id
    join public.events e on e.id = t.event_id
   where c.uid is not null
     and c.uid <> (select id from me)
     and u.share_going
     and t.status in ('active', 'checked_in')
     and e.status = 'active'
     and e.start_time > now() - interval '6 hours'
$$;
revoke execute on function public.crew_going() from public, anon;
grant execute on function public.crew_going() to authenticated;

-- 2. 24-hour reminders ──────────────────────────────────────────────────────
alter table public.tickets add column if not exists reminded_at timestamptz;

create extension if not exists pg_cron;

create or replace function public.run_upcoming_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'notify_admin_webhook_secret';
  if v_secret is null then return; end if;
  perform net.http_post(
    url     := 'https://xyzrvgbdnevllwvxqcka.supabase.co/functions/v1/remind-upcoming',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
    body    := '{}'::jsonb
  );
end;
$$;
revoke execute on function public.run_upcoming_reminders() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'cumulus-remind-upcoming';
select cron.schedule('cumulus-remind-upcoming', '7 * * * *', 'select public.run_upcoming_reminders()');
