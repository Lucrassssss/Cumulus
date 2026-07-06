-- Grant execute on app_role to authenticated and anon so RLS policies can evaluate it.
grant execute on function public.app_role(uuid) to authenticated, anon;
