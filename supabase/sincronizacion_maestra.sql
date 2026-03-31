-- ============================================
-- SINCRONIZACIÓN MAESTRA: CLONACIÓN DE METADATOS
-- ============================================
-- Este script copia la configuración técnica exacta de un usuario funcional.

DO $$
DECLARE
  v_new_id uuid := gen_random_uuid();
  v_ref_user auth.users%ROWTYPE;
BEGIN
  -- 1. Obtener plantilla de un usuario que SÍ funciona (Diego o Luciana)
  SELECT * INTO v_ref_user FROM auth.users WHERE email IN ('diego@curae.com', 'luciana@curae.com') LIMIT 1;

  -- 2. Limpiar rastros previos para el email 'master@curae.com'
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'master@curae.com');
  DELETE FROM auth.users WHERE email = 'master@curae.com';
  DELETE FROM public.doctors WHERE email = 'master@curae.com';

  -- 3. Crear el usuario clonando los campos técnicos (instance_id, aud, role, metadata_structure)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, is_sso_user
  ) VALUES (
    v_new_id,
    v_ref_user.instance_id,
    v_ref_user.aud,
    v_ref_user.role,
    'master@curae.com',
    crypt('Curae_Master_2026!#', gen_salt('bf', 10)),
    now(),
    v_ref_user.raw_app_meta_data, -- Copiamos metadata de la app
    json_build_object('name', 'Administrador', 'role', 'ADMIN')::jsonb, -- Nuestra meta de usuario
    now(), now(), false
  );

  -- 4. Crear la identidad espejo
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, 
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 
    v_new_id,
    json_build_object('sub', v_new_id::text, 'email', 'master@curae.com')::jsonb,
    'email', 
    v_new_id::text,
    now(), now(), now()
  );

  -- 5. Registro invisible en tabla pública (necesario para el esquema)
  INSERT INTO public.doctors (id, name, email, active)
  VALUES (v_new_id, 'Master', 'master@curae.com', false);

  -- 6. FORZAR RECARGA DE ESQUEMA (Notificación a PostgREST)
  NOTIFY pgrst, 'reload schema';

  RAISE NOTICE 'Sincronización maestra completada.';
END $$;
