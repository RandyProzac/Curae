-- ============================================
-- ACTUALIZAR CONTRASEÑA DE LUCIANA (ADMIN)
-- ============================================
-- Este script actualiza la contraseña de acceso al sistema para Luciana.
-- Se aplica a las cuentas vinculadas a los doctores cuyo nombre contenga "Luciana".

UPDATE auth.users 
SET encrypted_password = crypt('72229058', gen_salt('bf', 10))
WHERE id IN (
  SELECT id FROM public.doctors WHERE name = 'Luciana Renata Jiménez Aranzaens'
);

-- Verificación rápida
DO $$
BEGIN
  RAISE NOTICE 'Contraseña actualizada para todas las cuentas de Luciana.';
  RAISE NOTICE 'Nuevo acceso:';
  RAISE NOTICE 'Usuario: luciana';
  RAISE NOTICE 'Password: 72229058';
END $$;
