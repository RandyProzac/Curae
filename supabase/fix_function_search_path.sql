-- ============================================================
-- CURAE ONLINE — FIX: Function Search Path Mutable
-- Resuelve warning: function_search_path_mutable (5 funciones)
-- ============================================================
-- INSTRUCCIONES:
--   1. Abrir Supabase Dashboard → SQL Editor
--   2. Pegar TODO este archivo y ejecutar (Run)
-- ============================================================
-- Por qué es necesario:
--   Las funciones con SECURITY DEFINER heredan el search_path
--   del usuario que las llama. Un atacante podría crear objetos
--   maliciosos en otro schema con el mismo nombre que tablas
--   del sistema. Fijar search_path = public elimina ese riesgo.
-- ============================================================

-- 1. Trigger de timestamps de citas
ALTER FUNCTION public.update_appointment_status_timestamp()
    SET search_path = public;

-- 2. Creación de doctores con autenticación
ALTER FUNCTION public.create_doctor_with_auth(
    text, text, text, text, text, text, text, text, date, text
) SET search_path = public;

-- 3. Eliminación de doctores con autenticación
ALTER FUNCTION public.delete_doctor_with_auth(uuid)
    SET search_path = public;

-- 4. Exportar base de datos como JSON
ALTER FUNCTION public.export_database_json()
    SET search_path = public;

-- 5. Importar base de datos desde JSON
ALTER FUNCTION public.import_database_json(json)
    SET search_path = public;

-- ============================================================
-- VERIFICACIÓN: Las 5 funciones deben aparecer con
--   proconfig = {search_path=public}
-- ============================================================
SELECT
    p.proname        AS function_name,
    p.proconfig      AS config,
    CASE
        WHEN p.proconfig IS NOT NULL
         AND p.proconfig::text LIKE '%search_path%'
        THEN '✅ Fixed'
        ELSE '❌ Still mutable'
    END AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'update_appointment_status_timestamp',
    'create_doctor_with_auth',
    'delete_doctor_with_auth',
    'export_database_json',
    'import_database_json'
  )
ORDER BY p.proname;
