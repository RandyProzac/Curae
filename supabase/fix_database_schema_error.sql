-- ============================================================
-- CURAE ONLINE: SANITIZACIÓN DE AUTH.USERS
-- ============================================================
-- Este script corrige el infame "Database error querying schema"
-- que ocurre cuando el motor interno de Supabase (GoTrue) intenta
-- loguear a un usuario cuyo campo `role` o `aud` no es 'authenticated'.

BEGIN;

-- 1. Forzar que todos los usuarios tengan el postgres_role oficial
-- El rol REAL del sistema se guarda en raw_user_meta_data->>'role'
-- El campo `role` de la tabla auth.users DEBE SER 'authenticated' SIEMPRE.
UPDATE auth.users 
SET role = 'authenticated' 
WHERE role = 'ADMIN';

-- 2. Forzar la audiencia (aud) correcta para el JWT
UPDATE auth.users 
SET aud = 'authenticated' 
WHERE aud != 'authenticated' OR aud IS NULL;

-- 3. Asegurar que las contraseñas estén activas
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

COMMIT;

-- 4. Mostrar cómo quedó la tabla (sólo para depuración)
SELECT email, role, aud, raw_user_meta_data->>'role' as app_role 
FROM auth.users;
