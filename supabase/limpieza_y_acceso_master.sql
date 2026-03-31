-- ============================================
-- LIMPIEZA TOTAL Y CREACIÓN DE ACCESO MASTER
-- ============================================

DO $$
DECLARE
  v_master_id uuid := gen_random_uuid();
  v_old_admin_id uuid;
BEGIN
  -- 1. ELIMINAR CUALQUIER RASTRO DE 'admin@curae.com' (Para evitar el error de esquema)
  DELETE FROM auth.users WHERE email = 'admin@curae.com';
  DELETE FROM public.doctors WHERE email = 'admin@curae.com' OR name = 'Administrador Central';

  -- 2. ASEGURAR QUE NO HAYA CONFLICTOS CON EL NUEVO EMAIL 'master@curae.com'
  DELETE FROM auth.users WHERE email = 'master@curae.com';
  DELETE FROM public.doctors WHERE email = 'master@curae.com';

  -- 3. CREAR EL USUARIO MAESTRO EN LA TABLA PÚBLICA (Como "Inactivo" para que no figure)
  INSERT INTO public.doctors (id, name, email, specialty, phone, dni, color, active, join_date)
  VALUES (v_master_id, 'Master', 'master@curae.com', 'Administración', '-', '-', '#1e293b', false, now());

  -- 4. INSERTAR EN EL MOTOR DE AUTH (Mismo ID)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at
  ) VALUES (
    v_master_id, 
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 
    'master@curae.com', 
    crypt('Curae_Master_2026!#', gen_salt('bf', 10)), 
    now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, 
    '{"name":"Administrador","role":"ADMIN"}'::jsonb, 
    now(), now()
  );

  -- 5. CREAR IDENTIDAD DE LOGIN
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

  RAISE NOTICE 'Proceso completado exitosamente.';
  RAISE NOTICE 'Usuario: master';
  RAISE NOTICE 'Password: Curae_Master_2026!#';
END $$;
