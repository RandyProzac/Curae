-- DIAGNÓSTICO PROFUNDO: ¿POR QUÉ NO PUEDO ENTRAR?
-- Ejecuta esto y mira los resultados detallados.

-- 1. Ver qué email y ID tiene el Admin en Auth
SELECT id, email, created_at, last_sign_in_at, 
       raw_user_meta_data->>'role' as role,
       raw_user_meta_data->>'name' as name
FROM auth.users 
WHERE email LIKE '%admin%';

-- 2. Ver si hay un doctor con ese ID
SELECT id, name, email, active 
FROM public.doctors 
WHERE email LIKE '%admin%' 
   OR id IN (SELECT id FROM auth.users WHERE email LIKE '%admin%');

-- 3. Ver si hay algún trigger extraño que falle
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
