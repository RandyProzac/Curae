-- Add detailed fields to patients table for synchronization with Clinical History
ALTER TABLE patients ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS work_place VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city VARCHAR(100);
