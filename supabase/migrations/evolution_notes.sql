-- Create table for evolution notes
CREATE TABLE IF NOT EXISTS treatment_evolution_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL, -- optional link to doctor
    doctor_name TEXT, -- Can be manual or linked
    data JSONB DEFAULT '{}'::jsonb, -- For structured data (e.g. metadata)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE treatment_evolution_notes ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists to avoid errors on re-run
DROP POLICY IF EXISTS "Enable read/write for authenticated users" ON treatment_evolution_notes;
DROP POLICY IF EXISTS "Enable all access for anon and authenticated" ON treatment_evolution_notes;

-- RLS Policy: Allow anon + authenticated (app uses mock auth with anon key)
CREATE POLICY "Enable all access for anon and authenticated" 
ON treatment_evolution_notes 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Add evolution log column to treatment_plans if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'treatment_plans' AND column_name = 'evolution_odontogram_data') THEN 
        ALTER TABLE treatment_plans ADD COLUMN evolution_odontogram_data JSONB DEFAULT '{}'::jsonb; 
    END IF; 
END $$;