-- ============================================
-- ACCESO MAESTRO (VERSIÓN DIRECTA SIN BLOQUES)
-- ============================================

-- 1. Limpieza rápida
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'master@curae.com');
DELETE FROM auth.users WHERE email = 'master@curae.com';
DELETE FROM public.doctors WHERE email = 'master@curae.com';

-- 2. Crear usuario con ID fijo para evitar confusiones
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000abc', 
  '00000000-0000-0000-0000-000000000000', 
  'authenticated', 'authenticated', 
  'master@curae.com', 
  crypt('Curae_Master_2026!#', gen_salt('bf', 10)), 
  now(), 
  '{"provider":"email","providers":["email"]}'::jsonb, 
  '{"name":"Master","role":"ADMIN"}'::jsonb, 
  now(), now()
);

-- 3. Crear identidad
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(), 
  '00000000-0000-0000-0000-000000000abc', 
  json_build_object('sub', '00000000-0000-0000-0000-000000000abc', 'email', 'master@curae.com')::jsonb, 
  'email', 
  '00000000-0000-0000-0000-000000000abc', 
  now(), now(), now()
);

-- 4. Registro público (Invisible en web)
INSERT INTO public.doctors (id, name, email, specialty, active)
VALUES ('00000000-0000-0000-0000-000000000abc', 'Master', 'master@curae.com', 'ADMINISTRACION', true);

-- 5. Recarga
NOTIFY pgrst, 'reload schema';
