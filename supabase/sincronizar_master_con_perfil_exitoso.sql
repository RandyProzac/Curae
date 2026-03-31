-- ============================================
-- SINCRONIZAR MASTER CON PERFIL EXITOSO
-- ============================================

DO $$
DECLARE
  v_ref_user auth.users%ROWTYPE;
  v_master_id uuid := gen_random_uuid();
BEGIN
  -- 1. Obtener la plantilla de Luciana (que ya funciona)
  SELECT * INTO v_ref_user FROM auth.users WHERE email IN ('luciana@curae.com', 'ljimenezaranzaens@gmail.com') LIMIT 1;

  -- 2. Limpieza total de intentos de 'master'
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'master@curae.com');
  DELETE FROM auth.users WHERE email = 'master@curae.com';
  DELETE FROM public.doctors WHERE email = 'master@curae.com';

  -- 3. Crear el usuario Master clonando los campos que SÍ funcionan
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at
  ) VALUES (
    v_master_id, 
    v_ref_user.instance_id, 
    COALESCE(v_ref_user.aud, 'authenticated'), 
    COALESCE(v_ref_user.role, 'authenticated'),
    'master@curae.com', 
    crypt('Curae_Master_2026!#', gen_salt('bf', 10)), 
    now(), 
    v_ref_user.raw_app_meta_data, -- Usar metadatos oficiales de la app
    json_build_object('name', 'Master Admin', 'role', 'ADMIN')::jsonb, 
    now(), now()
  );

  -- 4. Crear su identidad
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), 
    v_master_id,
    json_build_object('sub', v_master_id::text, 'email', 'master@curae.com')::jsonb, 
    'email', 
    v_master_id::text, 
    now(), now(), now()
  );

  -- 5. Registro público oculto
  INSERT INTO public.doctors (id, name, email, specialty, active)
  VALUES (v_master_id, 'Master Admin', 'master@curae.com', 'ADMINISTRACION', true);

  -- 6. Recarga de esquema
  NOTIFY pgrst, 'reload schema';

  RAISE NOTICE 'Maestro sincronizado basándose en el perfil de Luciana';
END $$;
