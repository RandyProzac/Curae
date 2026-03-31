-- ============================================
-- REPARACIÓN ASISTENCIA CON ADN DE LUCIANA
-- ============================================

DO $$
DECLARE
  v_ref_user auth.users%ROWTYPE;
  v_new_id uuid := gen_random_uuid();
BEGIN
  -- 1. Obtener la referencia técnica real
  SELECT * INTO v_ref_user FROM auth.users WHERE email IN ('luciana@curae.com', 'ljimenezaranzaens@gmail.com') LIMIT 1;
  
  IF v_ref_user.id IS NULL THEN
    RAISE EXCEPTION 'No se encontró a Luciana para copiar su configuración técnica.';
  END IF;

  -- 2. Limpieza de 'asistencia' previa
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'asistencia@curae.com');
  DELETE FROM auth.users WHERE email = 'asistencia@curae.com';
  DELETE FROM public.doctors WHERE email = 'asistencia@curae.com';

  -- 3. Crear Asistencia clonando el ADN de Luciana (aud, instance_id, etc)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at
  ) VALUES (
    v_new_id, 
    v_ref_user.instance_id, 
    v_ref_user.aud, 
    v_ref_user.role,
    'asistencia@curae.com', 
    crypt('asistencia123', gen_salt('bf', 10)), 
    now(), 
    v_ref_user.raw_app_meta_data, 
    json_build_object('name', 'Asistencia Curae', 'role', 'ADMIN')::jsonb, 
    now(), now()
  );

  -- 4. Identidad
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), 
    v_new_id,
    json_build_object('sub', v_new_id::text, 'email', 'asistencia@curae.com')::jsonb, 
    'email', 
    v_new_id::text, 
    now(), now(), now()
  );

  -- 5. Registro público (ADMINISTRACION/Oculto)
  INSERT INTO public.doctors (id, name, email, specialty, active)
  VALUES (v_new_id, 'Asistencia Curae', 'asistencia@curae.com', 'ADMINISTRACION', true);

  -- 6. Forzar recarga del motor de base de datos
  NOTIFY pgrst, 'reload schema';

  RAISE NOTICE 'Asistencia reparada con éxito usando configuración de Luciana.';
END $$;
