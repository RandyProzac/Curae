-- ============================================
-- FIX: Add missing RLS policies for voucher tables
-- The voucher tables have RLS enabled but are missing
-- the "Authenticated Full Access" policy, causing
-- authenticated users to get empty results on SELECT.
-- ============================================

-- Drop any existing policies first (clean slate)
DROP POLICY IF EXISTS "Public Access" ON vouchers;
DROP POLICY IF EXISTS "Public Access" ON voucher_items;
DROP POLICY IF EXISTS "Public Access" ON voucher_payment_methods;
DROP POLICY IF EXISTS "Authenticated Full Access" ON vouchers;
DROP POLICY IF EXISTS "Authenticated Full Access" ON voucher_items;
DROP POLICY IF EXISTS "Authenticated Full Access" ON voucher_payment_methods;

-- Recreate with correct authenticated access
CREATE POLICY "Authenticated Full Access" ON vouchers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated Full Access" ON voucher_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated Full Access" ON voucher_payment_methods
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
