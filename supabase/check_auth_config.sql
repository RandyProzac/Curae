-- VERIFICAR INSTANCE_ID DE USUARIOS QUE SÍ FUNCIONAN
-- Esto nos dirá si estamos usando el UUID correcto en los scripts.

SELECT email, instance_id, aud, role 
FROM auth.users 
LIMIT 10;
