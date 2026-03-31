-- ============================================================
-- CURAE ONLINE: RECREACIÓN CORRECTA DEL USUARIO ASISTENCIA
-- ============================================================
-- CONFIRMADO: El error "Database error querying schema" ocurre
-- porque los campos de token (confirmation_token, recovery_token, etc.)
-- quedaron NULL al crear el usuario por SQL.
-- Supabase GoTrue exige que sean '' (cadena vacía), nunca NULL.

BEGIN;

-- 1. Limpiar registros anteriores corruptos
DELETE FROM auth.identities 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'asistencia@curae.com');

DELETE FROM auth.users WHERE email = 'asistencia@curae.com';
DELETE FROM public.doctors WHERE email = 'asistencia@curae.com';

-- 2. Obtener el instance_id de un usuario funcional
DO $$
DECLARE
  v_new_id uuid := gen_random_uuid();
  v_instance_id uuid;
  v_aud text;
BEGIN
  SELECT instance_id, aud INTO v_instance_id, v_aud 
  FROM auth.users 
  WHERE email IN ('luciana@curae.com', 'ljimenezaranzaens@gmail.com') 
  LIMIT 1;

  v_instance_id := COALESCE(v_instance_id, '00000000-0000-0000-0000-000000000000');
  v_aud := COALESCE(v_aud, 'authenticated');

  -- 3. Insertar con TODOS los campos requeridos (incluyendo tokens vacíos)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    -- CAMPOS CRÍTICOS: Deben ser '' no NULL
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    phone_change_token,
    is_super_admin,
    is_sso_user
  ) VALUES (
    v_instance_id, v_new_id, v_aud, 'authenticated', 
    'asistencia@curae.com',
    crypt('asistencia123', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Asistencia Curae","role":"ADMIN"}'::jsonb,
    now(), now(),
    '', '', '', '', '',
    false, false
  );

  -- 4. Crear identidad
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_new_id,
    json_build_object('sub', v_new_id::text, 'email', 'asistencia@curae.com')::jsonb,
    'email', v_new_id::text,
    now(), now(), now()
  );

  -- 5. Crear en tabla pública SIN aparecer en cuerpo médico
  INSERT INTO public.doctors (id, name, email, specialty, active, created_at)
  VALUES (v_new_id, 'Asistencia Curae', 'asistencia@curae.com', 'ADMINISTRACION', true, now());

  RAISE NOTICE 'Usuario Asistencia creado exitosamente con ID: %', v_new_id;
END;
$$;

COMMIT;

-- 6. Verificar (el usuario debe aparecer con role='authenticated')
SELECT email, role, aud, raw_user_meta_data->>'role' AS app_role
FROM auth.users WHERE email = 'asistencia@curae.com';
