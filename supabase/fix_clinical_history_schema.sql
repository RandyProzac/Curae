-- FIX SCRIPT: Run this to resolve permission issues and missing columns

-- 1. Ensure 'odontogram' column exists in clinical_histories (Fixes 400 Bad Request)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_histories' AND column_name = 'odontogram') THEN
        ALTER TABLE public.clinical_histories ADD COLUMN odontogram jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Reset RLS Policies for odontogram_snapshots (Fixes 42501 Permission Denied)
ALTER TABLE public.odontogram_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.odontogram_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.odontogram_snapshots;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.odontogram_snapshots;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.odontogram_snapshots;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.odontogram_snapshots;

CREATE POLICY "Enable read access for authenticated users" ON public.odontogram_snapshots
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.odontogram_snapshots
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.odontogram_snapshots
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.odontogram_snapshots
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);

-- 3. Reset RLS Policies for patient_files (Preventive Fix)
ALTER TABLE public.patient_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.patient_files;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.patient_files;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.patient_files;

CREATE POLICY "Enable read access for authenticated users" ON public.patient_files
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.patient_files
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON public.patient_files
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);

-- 4. Storage Policies (Ensure bucket access)
-- Note: These might fail if policies already exist with same name, so we drop first.
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'clinical-files' );

CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'clinical-files' );

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'clinical-files' );
