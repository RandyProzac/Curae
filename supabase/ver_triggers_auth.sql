-- ============================================================
-- DIAGNÓSTICO COMPLETO DE TRIGGERS EN auth.users
-- ============================================================
-- Pega esto en el SQL Editor de Supabase y muéstrame el resultado

-- 1. Listar todos los triggers en el schema auth
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- 2. Listar funciones que se disparan por triggers en auth
SELECT 
    tgname AS trigger_name,
    relname AS table_name,
    proname AS function_name,
    tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth';
