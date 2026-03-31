-- ============================================
-- LIMPIEZA Y ACCESO FINAL 'GERENCIA'
-- ============================================

DO $$
DECLARE
  v_new_id uuid := '00000000-0000-0000-0000-000000000999';
BEGIN
  -- 1. Limpieza radical
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('gerencia@curae.com', 'master@curae.com', 'admin@curae.com'));
  DELETE FROM auth.users WHERE email IN ('gerencia@curae.com', 'master@curae.com', 'admin@curae.com');
  DELETE FROM public.doctors WHERE email IN ('gerencia@curae.com', 'master@curae.com', 'admin@curae.com');

  -- 2. Crear usuario con email neutro 'gerencia@curae.com'
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at
  ) VALUES (
    v_new_id, 
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 
    'gerencia@curae.com', 
    crypt('Curae_Master_2026!#', gen_salt('bf', 10)), 
    now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, 
    json_build_object('name', 'Gerencia', 'role', 'ADMIN')::jsonb, 
    now(), now()
  );

  -- 3. Crear su identidad
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), 
    v_new_id,
    json_build_object('sub', v_new_id::text, 'email', 'gerencia@curae.com')::jsonb, 
    'email', 
    v_new_id::text, 
    now(), now(), now()
  );

  -- 4. Registro público invisible
  INSERT INTO public.doctors (id, name, email, specialty, active)
  VALUES (v_new_id, 'Gerencia', 'gerencia@curae.com', 'ADMINISTRACION', true);

  -- 5. RECARGA DE ESQUEMA
  NOTIFY pgrst, 'reload schema';

  RAISE NOTICE 'Usuario gerencia@curae.com creado exitosamente.';
END $$;
