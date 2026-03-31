-- ============================================
-- ACCESO FINAL BLINDADO V2 (SIN ERRORES)
-- ============================================

DO $$
DECLARE
  v_master_id uuid := gen_random_uuid();
BEGIN
  -- 1. LIMPIEZA ABSOLUTA
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('master@curae.com', 'admin@curae.com'));
  DELETE FROM auth.users WHERE email IN ('master@curae.com', 'admin@curae.com');
  DELETE FROM public.doctors WHERE email IN ('master@curae.com', 'admin@curae.com') OR name = 'Administrador Sistema';

  -- 2. CREAR PERFIL EN TABLA PÚBLICA (Híbrido invisible)
  INSERT INTO public.doctors (id, name, email, specialty, active, color)
  VALUES (v_master_id, 'Administrador Sistema', 'master@curae.com', 'ADMINISTRACION', true, '#000000');

  -- 3. INSERTAR EN MOTOR DE AUTH (Sin las columnas generadas por el sistema)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, is_sso_user
  ) VALUES (
    v_master_id, 
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 
    'master@curae.com', 
    crypt('MasterCurae2026!!', gen_salt('bf', 10)), 
    now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, 
    '{"name":"Administrador","role":"ADMIN"}'::jsonb, 
    now(), now(), false
  );

  -- 4. VINCULAR IDENTIDAD
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, 
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 
    v_master_id,
    json_build_object('sub', v_master_id::text, 'email', 'master@curae.com')::jsonb,
    'email', 
    v_master_id::text,
    now(), now(), now()
  );

  -- 5. NOTIFICAR RECARGA DE ESQUEMA
  NOTIFY pgrst, 'reload schema';

  RAISE NOTICE 'Acceso blindado V2 creado exitosamente.';
END $$;
