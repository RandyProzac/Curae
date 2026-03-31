-- ============================================
-- CREATE MASTER ADMINISTRATOR (HIDDEN)
-- ============================================
-- Este script crea un usuario Administrador Maestro que:
-- 1. NO aparece en la lista de Doctores (no está en la tabla pública).
-- 2. Tiene acceso total (Role: ADMIN).
-- 3. No figura en ninguna parte del sistema como personal clínico.

DO $$
DECLARE
  master_id uuid := gen_random_uuid();
  admin_user text := 'admin'; -- El usuario para el login
  admin_email text := 'admin@curae.com'; -- Formato email para Supabase Auth
  admin_pass text := 'Curae_Master_Admin_2026$#Secure!'; -- CONTRASEÑA SEGURA
BEGIN
  -- 1. Insertar en la bóveda de auth.users
  -- Usamos pgcrypto para encriptar la contraseña con salt
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', -- instance_id por defecto en Supabase
    master_id,
    'authenticated', 
    'authenticated',
    admin_email, 
    crypt(admin_pass, gen_salt('bf', 10)), 
    now(), -- Confirmar email inmediatamente
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object(
        'name', 'Administrador', 
        'role', 'ADMIN'
    )::jsonb,
    now(), 
    now()
  );

  -- 2. Crear la identidad para que GoTrue permita el inicio de sesión
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, 
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 
    master_id,
    json_build_object('sub', master_id::text, 'email', admin_email)::jsonb,
    'email', 
    master_id::text,
    now(), 
    now(), 
    now()
  );

  RAISE NOTICE 'Usuario Administrador Maestro creado exitosamente.';
  RAISE NOTICE 'Usuario: %', admin_user;
  RAISE NOTICE 'Password: %', admin_pass;
END $$;
