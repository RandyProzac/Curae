-- ============================================================
-- CURAE ONLINE: Sincronización Doctor ↔ Auth (Identidad Unificada)
-- Ejecutar completo en Supabase SQL Editor (una sola vez)
-- ============================================================

-- ==========================
-- PASO 1: Preparar doctores (asegurar que todos tengan email correcto)
-- ==========================
UPDATE public.doctors 
SET email = lower(regexp_replace(split_part(name, ' ', 1), '[^a-zA-Z0-9]', '', 'g')) || '@curae.com'
WHERE email IS NULL OR email = '' OR email NOT LIKE '%@%';

-- ==========================
-- PASO 2: Limpiar auth corrupto (borrar cualquier sesión rota)
-- ==========================
DELETE FROM auth.identities;
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.users;

-- ==========================
-- PASO 3: Clonar doctores existentes a auth.users (MISMO UUID)
-- ==========================
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
  created_at, updated_at
)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  d.id,
  'authenticated', 'authenticated',
  d.email,
  crypt(split_part(d.email, '@', 1) || '123', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  json_build_object(
    'name', d.name, 
    'role', CASE 
      WHEN d.name ILIKE '%Luciana%' OR d.name ILIKE '%Diego%' THEN 'ADMIN' 
      ELSE 'DOCTOR' 
    END
  )::jsonb,
  now(), now()
FROM public.doctors d;

-- ==========================
-- PASO 4: Crear identidades (obligatorio para que GoTrue acepte login)
-- ==========================
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, 
  last_sign_in_at, created_at, updated_at
)
SELECT 
  gen_random_uuid(), 
  u.id,
  json_build_object('sub', u.id::text, 'email', u.email)::jsonb,
  'email', 
  u.id::text,
  now(), now(), now()
FROM auth.users u;

-- ==========================
-- PASO 5: Función RPC para CREAR doctor con cuenta de acceso
-- Solo ejecutable por ADMINs (Luciana / Diego)
-- ==========================
CREATE OR REPLACE FUNCTION public.create_doctor_with_auth(
  p_name text,
  p_password text,
  p_specialty text DEFAULT '',
  p_phone text DEFAULT '',
  p_email text DEFAULT NULL,
  p_dni text DEFAULT '',
  p_cop text DEFAULT '',
  p_color text DEFAULT '#14b8a6',
  p_join_date date DEFAULT CURRENT_DATE,
  p_signature_url text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  new_id uuid := gen_random_uuid();
  v_email text;
BEGIN
  -- Validar que solo ADMINs puedan crear doctores
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden crear doctores';
  END IF;

  -- Auto-generar email si no se proporcionó
  v_email := COALESCE(
    NULLIF(TRIM(p_email), ''), 
    lower(regexp_replace(split_part(p_name, ' ', 1), '[^a-zA-Z0-9]', '', 'g')) || '@curae.com'
  );

  -- 1. Crear usuario en la bóveda de auth
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
    v_email, crypt(p_password, gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('name', p_name, 'role', 'DOCTOR')::jsonb,
    now(), now()
  );

  -- 2. Crear identidad para login
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, 
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_id,
    json_build_object('sub', new_id::text, 'email', v_email)::jsonb,
    'email', new_id::text,
    now(), now(), now()
  );

  -- 3. Crear doctora en tabla pública (con el MISMO UUID)
  INSERT INTO public.doctors (id, name, email, specialty, phone, dni, cop, color, join_date, active, signature_url, created_at)
  VALUES (new_id, p_name, v_email, p_specialty, p_phone, p_dni, p_cop, p_color, p_join_date, true, p_signature_url, now());

  -- Devolver el doctor creado
  RETURN (SELECT row_to_json(d) FROM public.doctors d WHERE d.id = new_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================
-- PASO 6: Función RPC para ELIMINAR doctor y su cuenta de acceso
-- Solo ejecutable por ADMINs
-- ==========================
CREATE OR REPLACE FUNCTION public.delete_doctor_with_auth(p_doctor_id uuid) RETURNS void AS $$
BEGIN
  -- Validar que solo ADMINs puedan eliminar doctores
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden eliminar doctores';
  END IF;

  -- No permitir que un admin se elimine a sí mismo
  IF p_doctor_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes eliminar tu propia cuenta';
  END IF;

  -- Eliminar en cadena: identidades → sesiones → auth → doctor
  DELETE FROM auth.identities WHERE user_id = p_doctor_id;
  DELETE FROM auth.sessions WHERE user_id = p_doctor_id;
  DELETE FROM auth.refresh_tokens WHERE user_id::uuid = p_doctor_id;
  DELETE FROM auth.users WHERE id = p_doctor_id;
  DELETE FROM public.doctors WHERE id = p_doctor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================
-- VERIFICACIÓN FINAL
-- ==========================
SELECT 
  d.name, d.email, 
  CASE WHEN au.id IS NOT NULL THEN '✅ Sincronizado' ELSE '❌ SIN CUENTA' END AS auth_status,
  au.raw_user_meta_data->>'role' AS role
FROM public.doctors d
LEFT JOIN auth.users au ON au.id = d.id
ORDER BY d.name;
