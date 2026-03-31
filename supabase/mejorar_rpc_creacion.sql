-- ============================================================
-- CURAE ONLINE: ACTUALIZACIÓN DE MOTOR DE CREACIÓN (RPC)
-- ============================================================
-- Este script permite que el botón "Nuevo Personal" sea inteligente.
-- Si la especialidad es 'ADMINISTRACION', le da rol de ADMIN automáticamente.

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
  v_role text := 'DOCTOR'; -- Rol por defecto
  v_instance_id uuid;
  v_aud text;
BEGIN
  -- 1. Obtener los metadatos técnicos del sistema de un usuario real (Luciana)
  -- Esto soluciona de raíz el error 'Database error querying schema'
  SELECT instance_id, aud INTO v_instance_id, v_aud 
  FROM auth.users 
  WHERE email IN ('luciana@curae.com', 'ljimenezaranzaens@gmail.com') 
  LIMIT 1;

  -- Fallback seguro por si no hay nadie
  v_instance_id := COALESCE(v_instance_id, '00000000-0000-0000-0000-000000000000');
  v_aud := COALESCE(v_aud, 'authenticated');

  -- 2. Inteligencia de Roles: 
  -- Si es ADMINISTRACION, se convierte en ADMIN real en Auth.
  IF p_specialty ILIKE 'ADMINISTRACION' OR p_specialty ILIKE 'ASISTENTE' THEN
    v_role := 'ADMIN';
  END IF;

  -- 3. Auto-generar email si no hay uno
  v_email := COALESCE(
    NULLIF(TRIM(p_email), ''), 
    lower(regexp_replace(split_part(p_name, ' ', 1), '[^a-zA-Z0-9]', '', 'g')) || '@curae.com'
  );

  -- 4. Crear usuario en Auth
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at
  ) VALUES (
    v_instance_id, new_id, v_aud, 'authenticated',
    v_email, crypt(p_password, gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('name', p_name, 'role', v_role)::jsonb,
    now(), now()
  );

  -- 5. Crear identidad
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, 
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_id,
    json_build_object('sub', new_id::text, 'email', v_email)::jsonb,
    'email', new_id::text,
    now(), now(), now()
  );

  -- 6. Crear en tabla pública (mismo ID)
  INSERT INTO public.doctors (id, name, email, specialty, phone, dni, cop, color, join_date, active, signature_url, created_at)
  VALUES (new_id, p_name, v_email, p_specialty, p_phone, p_dni, p_cop, p_color, p_join_date, true, p_signature_url, now());

  RETURN (SELECT row_to_json(d) FROM public.doctors d WHERE d.id = new_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
