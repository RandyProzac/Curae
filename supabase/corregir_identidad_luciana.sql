-- ============================================
-- UNIFICACIÓN DE IDENTIDAD: LUCIANA ADMIN
-- ============================================

DO $$
DECLARE
  v_luciana_id uuid;
BEGIN
  -- 1. Identificar a Luciana Jiménez por su nombre (el ID persistente)
  SELECT id INTO v_luciana_id FROM public.doctors WHERE name ILIKE '%Luciana%Jim%nez%' LIMIT 1;

  IF v_luciana_id IS NULL THEN
    RAISE NOTICE 'No se encontró a Luciana, creando registro base...';
    v_luciana_id := gen_random_uuid();
    INSERT INTO public.doctors (id, name, email, specialty, active)
    VALUES (v_luciana_id, 'Luciana Jiménez', 'luciana@curae.com', 'Ortodoncia', true);
  END IF;

  -- 2. LIMPIAR AUTH PARA EVITAR CONFLICTOS
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'luciana@curae.com') OR user_id = v_luciana_id;
  DELETE FROM auth.users WHERE email = 'luciana@curae.com' OR id = v_luciana_id;

  -- 3. ACTUALIZAR EMAIL EN LA TABLA PÚBLICA
  UPDATE public.doctors SET email = 'luciana@curae.com', active = true WHERE id = v_luciana_id;

  -- 4. CREAR USUARIO EN AUTH (Email unificado)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, is_sso_user
  ) VALUES (
    v_luciana_id, 
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 
    'luciana@curae.com', 
    crypt('72229058', gen_salt('bf', 10)), 
    now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, 
    json_build_object('name', 'Luciana Jiménez', 'role', 'ADMIN')::jsonb, 
    now(), now(), false
  );

  -- 5. CREAR IDENTIDAD DE LOGIN
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, 
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 
    v_luciana_id,
    json_build_object('sub', v_luciana_id::text, 'email', 'luciana@curae.com')::jsonb,
    'email', 
    v_luciana_id::text,
    now(), now(), now()
  );

  -- 6. RECARGAR ESQUEMA
  NOTIFY pgrst, 'reload schema';

  RAISE NOTICE 'Luciana sincronizada como Administradora con email luciana@curae.com';
END $$;
