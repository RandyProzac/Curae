-- Add is_emergency boolean to appointments
ALTER TABLE appointments ADD COLUMN is_emergency BOOLEAN DEFAULT false;
