-- ============================================
-- AGREGAR DOCTOR RESPONSABLE A LOS PAGOS
-- ============================================

-- 1. Añadir la columna a la tabla de pagos
ALTER TABLE payments ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;

-- 2. Crear índice para optimizar las consultas financieras por doctor
CREATE INDEX IF NOT EXISTS idx_payments_doctor_id ON payments(doctor_id);

-- Opcional: Actualizar el esquema del cliente RPC si usas uno (no obligatorio si usas el cliente normal)
-- Notificar a PostgREST que recargue el esquema
NOTIFY pgrst, 'reload schema';
