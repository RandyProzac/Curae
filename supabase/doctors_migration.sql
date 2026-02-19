-- Add new columns to doctors table
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS dni VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Update existing doctors to ensure they have default values
UPDATE doctors SET active = true WHERE active IS NULL;
