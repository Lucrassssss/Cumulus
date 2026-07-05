SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_arguments(p.oid) as arguments 
FROM pg_proc p 
JOIN pg_namespace n ON n.oid = p.pronamespace 
WHERE p.proname = 'is_admin';
