-- ============================================
-- CURAE ONLINE: LIMPIEZA TOTAL Y ESTANDARIZACIÓN RLS
-- ============================================

-- 1. LIMPIEZA DINÁMICA DE POLICIES EXISTENTES
DO $$ 
DECLARE
  r record;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'appointments','budget_items','budgets','clinical_histories','clinical_notes',
        'doctors','events','expense_categories','expenses','integrations',
        'inventory_products','odontogram_snapshots','patient_files',
        'patient_service_prices','patients','payments','purchase_items','purchases',
        'services','treatment_evolution_notes','treatment_plan_items','treatment_plans'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 2. ASEGURAR QUE RLS ESTÉ ACTIVADO EN TODAS LAS TABLAS
ALTER TABLE IF EXISTS appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS odontogram_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patient_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS treatment_evolution_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS treatment_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS treatment_plans ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICA ÚNICA "Public Access" POR TABLA
CREATE POLICY "Public Access" ON appointments FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON budget_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON budgets FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON clinical_histories FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON clinical_notes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON doctors FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON events FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON expense_categories FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON expenses FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON integrations FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON inventory_products FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON odontogram_snapshots FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON patient_files FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON patients FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON payments FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON purchase_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON purchases FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON services FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON treatment_evolution_notes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON treatment_plan_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON treatment_plans FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. LIMPIEZA Y CONFIGURACIÓN DE STORAGE (Bucket clinical-files)
DO $$ 
DECLARE
  r record;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY "Public Access" ON storage.objects
FOR ALL TO public
USING (bucket_id = 'clinical-files')
WITH CHECK (bucket_id = 'clinical-files');
