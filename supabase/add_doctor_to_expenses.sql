-- Add doctor_id to expenses to link an expense to a specific doctor
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;

-- Make sure RLS is allowing access to expenses correctly
-- Currently the policy is public access so this shouldn't be an issue
