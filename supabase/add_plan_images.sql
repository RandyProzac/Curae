-- =====================================================
-- Migration: Add display_name and treatment_plan_id 
-- to patient_files + Fix ALL RLS policies
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- ═══════════════════════════════════════════════════
-- STEP 1: Add new columns
-- ═══════════════════════════════════════════════════

-- Custom display name for images
ALTER TABLE public.patient_files 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Link to treatment plan (nullable, for plan-specific images)
ALTER TABLE public.patient_files 
ADD COLUMN IF NOT EXISTS treatment_plan_id UUID REFERENCES public.treatment_plans(id) ON DELETE SET NULL;

-- Index for faster lookups by treatment plan
CREATE INDEX IF NOT EXISTS idx_patient_files_plan 
ON public.patient_files(treatment_plan_id) WHERE treatment_plan_id IS NOT NULL;

-- Backfill display_name with original filename
UPDATE public.patient_files SET display_name = name WHERE display_name IS NULL;

-- ═══════════════════════════════════════════════════
-- STEP 2: Fix RLS for patient_files (COMPLETE RESET)
-- Drop ALL possible existing policies to avoid conflicts
-- ═══════════════════════════════════════════════════

-- Disable and re-enable RLS
ALTER TABLE public.patient_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;

-- Drop every possible policy name (past migrations used different names)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.patient_files;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.patient_files;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.patient_files;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.patient_files;
DROP POLICY IF EXISTS "patient_files_all_access" ON public.patient_files;
DROP POLICY IF EXISTS "Public Access" ON public.patient_files;
DROP POLICY IF EXISTS "Allow Select for Authenticated" ON public.patient_files;
DROP POLICY IF EXISTS "Allow Insert for Authenticated" ON public.patient_files;
DROP POLICY IF EXISTS "Allow Update for Authenticated" ON public.patient_files;
DROP POLICY IF EXISTS "Allow Delete for Authenticated" ON public.patient_files;

-- Create a SINGLE public policy (same approach as treatment_plans fix)
-- Using "to public" covers both anon and authenticated roles
CREATE POLICY "Public Access" ON public.patient_files
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- ═══════════════════════════════════════════════════
-- STEP 3: Verify treatment_plans also has correct RLS
-- (In case it was reset or the previous fix wasn't run)
-- ═══════════════════════════════════════════════════

DROP POLICY IF EXISTS "Public Access" ON public.treatment_plans;
DROP POLICY IF EXISTS "Allow Select for Authenticated" ON public.treatment_plans;
DROP POLICY IF EXISTS "Allow Insert for Authenticated" ON public.treatment_plans;
DROP POLICY IF EXISTS "Allow Update for Authenticated" ON public.treatment_plans;
DROP POLICY IF EXISTS "Allow Delete for Authenticated" ON public.treatment_plans;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.treatment_plans;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.treatment_plans;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.treatment_plans;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.treatment_plans;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.treatment_plans;

ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access" ON public.treatment_plans
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- ═══════════════════════════════════════════════════
-- STEP 4: Verify Storage bucket policies
-- ═══════════════════════════════════════════════════

-- Drop and recreate storage policies to ensure public read access
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- Upload: authenticated only
CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'clinical-files');

-- Read: public (so image URLs work without auth headers)
CREATE POLICY "Allow public reads" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'clinical-files');

-- Delete: authenticated only
CREATE POLICY "Allow authenticated deletes" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'clinical-files');

-- ═══════════════════════════════════════════════════
-- DONE! Verify with:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('patient_files', 'treatment_plans');
-- ═══════════════════════════════════════════════════
