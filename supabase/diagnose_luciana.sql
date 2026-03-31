-- ============================================
-- DIAGNÓSTICO DE CUENTAS (LUCIANA)
-- ============================================
-- Ejecuta este script para ver exactamente qué usuario y email tiene Luciana Jiménez.

SELECT 
  d.name AS doctor_name,
  d.email AS doctor_email,
  au.email AS auth_email,
  au.id AS auth_id,
  CASE WHEN au.id IS NOT NULL THEN '✅ Sincronizado' ELSE '❌ NO TIENE CUENTA' END AS status
FROM public.doctors d
LEFT JOIN auth.users au ON au.id = d.id
WHERE d.name ILIKE '%Luciana%Jim%nez%';
