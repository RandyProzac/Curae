-- ============================================
-- BUDGET SYSTEM MIGRATION
-- ============================================
-- Run this in Supabase SQL Editor

-- 1. Presupuestos (Budget headers per patient)
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'created',  -- created, in_progress, completed
    discount DECIMAL(10,2) DEFAULT 0,
    internal_notes TEXT,
    patient_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Budget line items
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    service_name VARCHAR(255) NOT NULL,
    tooth_number VARCHAR(50),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Payment records
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_item_id UUID REFERENCES budget_items(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) DEFAULT 'efectivo',  -- efectivo, tarjeta, transferencia, yape
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_budgets_patient ON budgets(patient_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_payments_item ON payments(budget_item_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access" ON budgets FOR ALL USING (true);
CREATE POLICY "Public Access" ON budget_items FOR ALL USING (true);
CREATE POLICY "Public Access" ON payments FOR ALL USING (true);

-- ============================================
-- CLEANUP: Drop old patient_service_prices table
-- ============================================
-- DROP TABLE IF EXISTS patient_service_prices;
-- ^ Uncomment the line above after confirming migration works
