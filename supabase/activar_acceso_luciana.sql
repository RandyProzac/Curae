-- ============================================
-- ACTIVACIÓN DE EMERGENCIA: ACCESO LUCIANA
-- ============================================

DO $$
DECLARE
  v_luciana_id uuid;
BEGIN
  -- 1. Buscar el ID real de Luciana Jiménez
  SELECT id INTO v_luciana_id FROM public.doctors WHERE name ILIKE '%Luciana%Jim%nez%' LIMIT 1;

  -- 2. Limpiar cualquier basura de login previo para ella
  DELETE FROM auth.identities WHERE user_id = v_luciana_id;
  DELETE FROM auth.users WHERE id = v_luciana_id;

  -- 3. Actualizar sus datos públicos
  UPDATE public.doctors SET email = 'luciana@curae.com', active = true WHERE id = v_luciana_id;

  -- 4. Crear su cuenta en auth (Lógica 100% compatible)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    v_luciana_id, 
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 'authenticated', 
    'luciana@curae.com', 
    crypt('72229058', gen_salt('bf', 10)), 
    now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, 
    json_build_object('name', 'Luciana Jiménez', 'role', 'ADMIN')::jsonb, 
    now(), now()
  );

  -- 5. Crear la identidad necesaria para entrar
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), 
    v_luciana_id,
    json_build_object('sub', v_luciana_id::text, 'email', 'luciana@curae.com')::jsonb, 
    'email', 
    v_luciana_id::text, 
    now(), now(), now()
  );

  RAISE NOTICE 'Luciana activada con password 72229058';
END $$;
