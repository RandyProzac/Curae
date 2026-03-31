-- ============================================
-- REPARACIÓN DEFINITIVA DE ACCESOS
-- ============================================
-- Este script soluciona el "Database error querying schema"
-- Asegura que los usuarios Admin existan en ambos motores correctamente.

DO $$
DECLARE
  v_admin_id uuid := gen_random_uuid();
  v_luciana_id uuid;
BEGIN
  -- 1. LIMPIEZA PREVIA (Evitar conflictos)
  DELETE FROM auth.users WHERE email IN ('admin@curae.com', 'admin@curae.com');
  
  -- 2. ASEGURAR QUE LUCIANA EXISTE EN LA TABLA PÚBLICA
  -- Buscamos el ID de Luciana Jimenez
  SELECT id INTO v_luciana_id FROM public.doctors WHERE name ILIKE '%Luciana%Jim%nez%' LIMIT 1;
  
  IF v_luciana_id IS NOT NULL THEN
    -- Reset de password para Luciana (DNI: 72229058)
    UPDATE auth.users 
    SET encrypted_password = crypt('72229058', gen_salt('bf', 10)),
        raw_user_meta_data = json_build_object('name', 'Luciana Jiménez', 'role', 'ADMIN')::jsonb
    WHERE id = v_luciana_id;
    
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    SELECT v_luciana_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'luciana@curae.com', crypt('72229058', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Luciana Jiménez","role":"ADMIN"}'::jsonb, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_luciana_id);

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    SELECT gen_random_uuid(), v_luciana_id, json_build_object('sub', v_luciana_id::text, 'email', 'luciana@curae.com')::jsonb, 'email', v_luciana_id::text, now(), now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_luciana_id);
  END IF;

  -- 3. CREAR EL ADMINISTRADOR MAESTRO (Híbrido para no figurar pero existir)
  -- Lo insertamos por si acaso en la tabla pública para evitar el error de esquema
  INSERT INTO public.doctors (id, name, email, specialty, phone, dni, color, active)
  VALUES (v_admin_id, 'Administrador Central', 'admin@curae.com', 'Gestión', '-', '-', '#0f172a', false)
  ON CONFLICT DO NOTHING;

  -- Insertar en Auth con el mismo UUID
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@curae.com', crypt('Curae_Master_Admin_2026$#Secure!', gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Administrador","role":"ADMIN"}'::jsonb, now(), now());

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_admin_id, json_build_object('sub', v_admin_id::text, 'email', 'admin@curae.com')::jsonb, 'email', v_admin_id::text, now(), now(), now());

  RAISE NOTICE 'Proceso de reparación completado.';
END $$;
