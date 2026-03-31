-- DIAGNÓSTICO: LISTA DE TABLAS Y ESQUEMAS
-- Ejecuta esto para ver si hay algún problema con las tablas de auth o triggers.

SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema IN ('public', 'auth')
ORDER BY table_schema, table_name;

-- Y chequear triggers de auth
SELECT event_object_schema as table_schema,
       event_object_table as table_name,
       trigger_name,
       action_statement as definition
FROM information_schema.triggers
WHERE event_object_schema = 'auth';
