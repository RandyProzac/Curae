-- ============================================
-- FIX DEFINITIVO DE SEGURIDAD PARA FIRMAS
-- ============================================

-- 1. Crear el bucket si por alguna razón no se creó
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Asegurarse de que las columnas existan en la tabla doctors
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS cop TEXT,
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- 3. Limpiar políticas de firmas anteriores por si hubo conflicto
DROP POLICY IF EXISTS "Public Access Signatures" ON storage.objects;
DROP POLICY IF EXISTS "Public Signature Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload signatures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update signatures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete signatures" ON storage.objects;

-- 4. Crear una política universal para el bucket 'signatures'
-- (Usamos la misma estructura que ya te funciona con 'clinical-files')
CREATE POLICY "Public Access Signatures" ON storage.objects
FOR ALL TO public
USING (bucket_id = 'signatures')
WITH CHECK (bucket_id = 'signatures');

