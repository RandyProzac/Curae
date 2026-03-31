-- ============================================
-- CREACIÓN OFICIAL DE ADMINISTRADOR MAESTRO
-- ============================================

DO $$
DECLARE
  v_new_id uuid := gen_random_uuid();
BEGIN
  -- 1. LIMPIEZA DE CONFLICTOS
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'master@curae.com');
  DELETE FROM auth.users WHERE email = 'master@curae.com';
  DELETE FROM public.doctors WHERE email = 'master@curae.com';

  -- 2. INSERTAR EN AUTH (LÓGICA OFICIAL)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_new_id, 'authenticated', 'authenticated',
    'master@curae.com', crypt('Curae_Master_2026!#', gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('name', 'Administrador Maestro', 'role', 'ADMIN')::jsonb,
    now(), now()
  );

  -- 3. INSERTAR IDENTIDAD OFICIAL
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, 
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_new_id,
    json_build_object('sub', v_new_id::text, 'email', 'master@curae.com')::jsonb,
    'email', v_new_id::text,
    now(), now(), now()
  );

  -- 4. REGISTRO EN TABLA PÚBLICA (Como Administrativo)
  INSERT INTO public.doctors (id, name, email, specialty, active)
  VALUES (v_new_id, 'Administrador Maestro', 'master@curae.com', 'ADMINISTRACION', true);

  -- 5. RECARGA DE ESQUEMA PARA POSTGREST
  NOTIFY pgrst, 'reload schema';

  RAISE NOTICE 'Admin creado exitosamente con ID %', v_new_id;
END $$;
