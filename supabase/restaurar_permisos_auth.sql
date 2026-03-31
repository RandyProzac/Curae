-- ============================================================
-- CURAE ONLINE: FIX PARA PERMISOS DEL ESQUEMA AUTH
-- ============================================================
-- Si recibes 500 "Database error finding users" via API, 
-- es probable que el rol 'authenticator' haya perdido el acceso.

BEGIN;

-- 1. Restaurar permisos básicos del esquema auth
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT USAGE ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO service_role;

-- 2. Restaurar permisos sobre las tablas críticas
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticator;

-- 3. Asegurar que las secuencias funcionen
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO service_role;

COMMIT;

-- 4. Prueba rápida de lectura (debería funcionar si los permisos están ok)
DO $$
BEGIN
  PERFORM * FROM auth.users LIMIT 1;
  RAISE NOTICE 'Acceso a auth.users restaurado correctamente.';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Aún no se puede acceder a auth.users. Error: %', SQLERRM;
END;
$$;
