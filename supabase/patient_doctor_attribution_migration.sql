-- ============================================
-- PATIENT-DOCTOR ATTRIBUTION MIGRATION
-- ============================================

-- 1. Add doctor_id to patients (The primary/responsible doctor)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;

-- 2. Add doctor_id to budget_items (The doctor who performed the treatment)
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_doctor ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_doctor ON budget_items(doctor_id);

-- 4. Backfill: Assign patients to their most frequent doctor based on appointments
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN (
        WITH patient_doctor_counts AS (
            SELECT 
                patient_id, 
                doctor_id,
                COUNT(*) as visit_count,
                MAX(date) as last_visit
            FROM appointments
            WHERE doctor_id IS NOT NULL
            GROUP BY patient_id, doctor_id
        ),
        ranked_doctors AS (
            SELECT 
                patient_id,
                doctor_id,
                ROW_NUMBER() OVER(PARTITION BY patient_id ORDER BY visit_count DESC, last_visit DESC) as rank
            FROM patient_doctor_counts
        )
        SELECT patient_id, doctor_id 
        FROM ranked_doctors 
        WHERE rank = 1
    ) LOOP
        UPDATE patients 
        SET doctor_id = rec.doctor_id 
        WHERE id = rec.patient_id AND doctor_id IS NULL;
        
        -- Also backfill budget_items for the patient
        UPDATE budget_items bi
        SET doctor_id = rec.doctor_id
        FROM budgets b
        WHERE bi.budget_id = b.id 
          AND b.patient_id = rec.patient_id 
          AND bi.doctor_id IS NULL;
    END LOOP;
END $$;
