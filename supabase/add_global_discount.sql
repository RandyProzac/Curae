-- =============================================
-- Add Global Discount to Budgets
-- Run this in Supabase SQL Editor
-- =============================================

-- Add global_discount column (numeric, default 0)
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS global_discount NUMERIC DEFAULT 0;

-- Add global_discount_type column ('fixed' or 'percent', default 'fixed')
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS global_discount_type TEXT DEFAULT 'fixed';
