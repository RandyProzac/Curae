-- CORRECCIÓN DEL SEARCH PATH (POSIBLE CAUSA DEL ERROR 500)
-- A veces el motor de autenticación pierde el acceso al esquema public.

ALTER ROLE authenticator SET search_path = 'public', 'auth';
SELECT pg_reload_conf();

-- Y por si acaso, le damos permisos totales sobre el esquema público al rol authenticated
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
