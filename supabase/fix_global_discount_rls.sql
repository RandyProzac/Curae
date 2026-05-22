-- =============================================
-- Fix Global Discount: Columns + RLS
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Ensure columns exist
ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS global_discount NUMERIC DEFAULT 0;

ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS global_discount_type TEXT DEFAULT 'fixed';

-- 2. Fix RLS: drop old policy and recreate with WITH CHECK
DROP POLICY IF EXISTS "Public Access" ON budgets;
CREATE POLICY "Public Access" ON budgets
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);

-- 3. Verify: test a direct update (change the UUID to a real budget id if needed)
-- SELECT id, global_discount, global_discount_type FROM budgets LIMIT 5;
