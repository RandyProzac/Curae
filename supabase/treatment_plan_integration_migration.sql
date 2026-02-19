-- ============================================
-- TREATMENT PLAN INTEGRATION MIGRATION
-- Connects Odontogram → Treatment Plan → Budget
-- ============================================

-- 1. Treatment Plan Items (hallazgos extracted from odontogram)
CREATE TABLE IF NOT EXISTS treatment_plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    odontogram_snapshot_id UUID REFERENCES odontogram_snapshots(id) ON DELETE SET NULL,
    tooth_number VARCHAR(10) NOT NULL,
    surface VARCHAR(100),
    finding_type VARCHAR(100) NOT NULL,
    finding_name VARCHAR(255) NOT NULL,
    severity VARCHAR(20),
    status VARCHAR(30) DEFAULT 'pendiente',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add finding_id to budget_items for traceability
ALTER TABLE budget_items
    ADD COLUMN IF NOT EXISTS finding_id UUID REFERENCES treatment_plan_items(id) ON DELETE SET NULL;

-- 3. Add treatment plan flags to budgets
ALTER TABLE budgets
    ADD COLUMN IF NOT EXISTS is_treatment_plan BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS odontogram_snapshot_id UUID REFERENCES odontogram_snapshots(id) ON DELETE SET NULL;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tpi_patient ON treatment_plan_items(patient_id);
CREATE INDEX IF NOT EXISTS idx_tpi_snapshot ON treatment_plan_items(odontogram_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_tpi_status ON treatment_plan_items(status);
CREATE INDEX IF NOT EXISTS idx_bi_finding ON budget_items(finding_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE treatment_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON treatment_plan_items FOR ALL USING (true);
