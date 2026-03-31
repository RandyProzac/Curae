-- DIAGNÓSTICO DE TRIGGERS EN EL ESQUEMA AUTH
-- Esto nos dirá si hay algo que se dispara al intentar el login (auth.users).

SELECT 
    tgname AS trigger_name,
    relname AS table_name,
    proname AS function_name
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
WHERE pg_namespace.nspname = 'auth';
