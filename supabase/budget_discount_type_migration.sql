-- Add discount_type column to budgets table
-- Supports 'fixed' (S/ amount) and 'percent' (% of subtotal)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'fixed';

-- Update existing 'created' status to 'in_progress' (only 2 valid statuses now)
UPDATE budgets SET status = 'in_progress' WHERE status = 'created';
