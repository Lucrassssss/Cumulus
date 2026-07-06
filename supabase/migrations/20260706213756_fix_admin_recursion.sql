-- Fix infinite recursion in admins policy by removing the call to public.is_admin()
-- because public.is_admin() queries public.admins, causing a loop.
drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
  for select to authenticated using (user_id = auth.uid());
