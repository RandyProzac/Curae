-- 1. ELIMINAR LA FUNCIÓN ANTERIOR (Limpiar conflictos de versión)
DROP FUNCTION IF EXISTS public.create_doctor_with_auth(text,text,text,text,text,text,text,text,date,text);

-- 2. INSTALAR LA NUEVA FUNCIÓN MEJORADA
CREATE FUNCTION public.create_doctor_with_auth(
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
) 
RETURNS json 
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid := gen_random_uuid();
  v_email text;
  v_role text := 'DOCTOR';
  v_instance_id uuid;
  v_aud text;
BEGIN
  -- Obtener ADN técnico de Luciana
  SELECT instance_id, aud INTO v_instance_id, v_aud 
  FROM auth.users 
  WHERE email IN ('luciana@curae.com', 'ljimenezaranzaens@gmail.com') 
  LIMIT 1;

  v_instance_id := COALESCE(v_instance_id, '00000000-0000-0000-0000-000000000000');
  v_aud := COALESCE(v_aud, 'authenticated');

  -- Asignar rol de ADMIN si es administración
  IF p_specialty ILIKE 'ADMINISTRACION' OR p_specialty ILIKE 'ASISTENTE' THEN
    v_role := 'ADMIN';
  END IF;

  v_email := COALESCE(
    NULLIF(TRIM(p_email), ''), 
    lower(regexp_replace(split_part(p_name, ' ', 1), '[^a-zA-Z0-9]', '', 'g')) || '@curae.com'
  );

  -- Crear en Auth
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (v_instance_id, new_id, v_aud, 'authenticated', v_email, crypt(p_password, gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}'::jsonb, json_build_object('name', p_name, 'role', v_role)::jsonb, now(), now());

  -- Crear Identidad
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, json_build_object('sub', new_id::text, 'email', v_email)::jsonb, 'email', new_id::text, now(), now(), now());

  -- Crear en Público
  INSERT INTO public.doctors (id, name, email, specialty, phone, dni, cop, color, join_date, active, signature_url, created_at)
  VALUES (new_id, p_name, v_email, p_specialty, p_phone, p_dni, p_cop, p_color, p_join_date, true, p_signature_url, now());

  RETURN (SELECT row_to_json(d) FROM public.doctors d WHERE d.id = new_id);
END;
$$ LANGUAGE plpgsql;
