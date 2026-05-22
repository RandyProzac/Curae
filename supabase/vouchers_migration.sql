-- ============================================
-- VOUCHER SYSTEM MIGRATION
-- Sistema de Boletas / Vouchers de Venta
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Vouchers (cabecera de cada boleta)
--    ticket_number es SERIAL — auto-incremental global único.
--    Se formatea en frontend: String(ticket_number).padStart(8, '0') → "00002180"
CREATE TABLE IF NOT EXISTS vouchers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number   SERIAL          NOT NULL,   -- correlativo global (1, 2, 3...)
    patient_id      UUID REFERENCES patients(id) ON DELETE SET NULL,
    budget_id       UUID REFERENCES budgets(id)  ON DELETE SET NULL,
    doctor_id       UUID REFERENCES doctors(id)  ON DELETE SET NULL,
    total_paid      DECIMAL(10,2)   NOT NULL,
    created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- Índice único sobre ticket_number para búsquedas rápidas y garantía de unicidad
CREATE UNIQUE INDEX IF NOT EXISTS idx_vouchers_ticket_number ON vouchers(ticket_number);

-- 2. Voucher Items (línea por servicio cobrado en esa boleta)
--    amount_paid = lo cobrado en esta boleta (puede ser parcial o total del item)
CREATE TABLE IF NOT EXISTS voucher_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id      UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    budget_item_id  UUID REFERENCES budget_items(id) ON DELETE SET NULL,
    service_name    VARCHAR(255)    NOT NULL,
    quantity        INTEGER         DEFAULT 1,
    unit_price      DECIMAL(10,2),
    amount_paid     DECIMAL(10,2)   NOT NULL    -- lo pagado por este item en este voucher
);

-- 3. Voucher Payment Methods (métodos de pago usados en esa boleta)
--    Permite split payment: BCP S/300 + Yape S/150
CREATE TABLE IF NOT EXISTS voucher_payment_methods (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id  UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    method      VARCHAR(50)     NOT NULL,   -- VISA, BCP, Yape, Efectivo, Transferencia, etc.
    amount      DECIMAL(10,2)   NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vouchers_patient   ON vouchers(patient_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_budget    ON vouchers(budget_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_created   ON vouchers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voucher_items_vch  ON voucher_items(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_methods_vch ON voucher_payment_methods(voucher_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE vouchers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_payment_methods ENABLE ROW LEVEL SECURITY;

-- Misma política abierta que el resto del sistema (authenticated users)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'vouchers' AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access" ON vouchers FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'voucher_items' AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access" ON voucher_items FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'voucher_payment_methods' AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access" ON voucher_payment_methods FOR ALL USING (true);
    END IF;
END $$;

-- ============================================
-- VERIFICATION QUERY (run after migration)
-- ============================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('vouchers', 'voucher_items', 'voucher_payment_methods');
