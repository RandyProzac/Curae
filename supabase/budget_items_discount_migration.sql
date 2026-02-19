-- Add discount columns to budget_items table
ALTER TABLE budget_items 
ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'fixed'; -- 'fixed' or 'percent'
