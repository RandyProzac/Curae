-- ============================================
-- ADD STATUS TRACKING TO APPOINTMENTS
-- ============================================
-- Run this in Supabase SQL Editor to add audit fields

-- Add status tracking columns
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS status_updated_by VARCHAR(255) DEFAULT 'Sistema';

-- Add constraint for valid status values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'appointments_status_check'
    ) THEN
        ALTER TABLE appointments 
        ADD CONSTRAINT appointments_status_check 
        CHECK (status IN ('pending', 'confirmed', 'attended', 'cancelled'));
    END IF;
END $$;

-- Update existing records to have 'pending' status if they have 'scheduled'
UPDATE appointments SET status = 'pending' WHERE status = 'scheduled';

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Optional: Add trigger to auto-update status_updated_at
CREATE OR REPLACE FUNCTION update_appointment_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.status_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_appointment_status ON appointments;
CREATE TRIGGER trigger_update_appointment_status
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_status_timestamp();
