-- Evolution Module Migration
-- 1. Add column to store the evolving odontogram state
ALTER TABLE public.treatment_plans
ADD COLUMN IF NOT EXISTS evolution_odontogram_data JSONB DEFAULT NULL;

-- 2. Create table for evolution notes (Bitacora)
CREATE TABLE IF NOT EXISTS public.treatment_evolution_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    treatment_plan_id UUID REFERENCES public.treatment_plans(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    doctor_name TEXT, -- Snapshot of name at time of creation (or 'Admin')
    doctor_id UUID REFERENCES auth.users(id), -- Optional link to user who created it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.treatment_evolution_notes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON public.treatment_evolution_notes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.treatment_evolution_notes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.treatment_evolution_notes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.treatment_evolution_notes
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_evolution_notes_plan ON public.treatment_evolution_notes(treatment_plan_id);
