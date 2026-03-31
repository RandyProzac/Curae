-- ============================================
-- REPAIR: PATIENT-DOCTOR ASSOCIATIONS
-- ============================================
-- This script fixes patients and budget items that lost their doctor_id
-- due to the recent doctor migration (deleted demo doctors).

DO $$
DECLARE
    rec RECORD;
BEGIN
    -- 1. Reparar la tabla 'patients'
    -- Buscamos el doctor más frecuente para cada paciente basado en sus citas (que sí fueron migradas)
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
        -- Actualizamos solo si el doctor_id es NULL (o si queremos forzar la actualización del más frecuente)
        UPDATE patients 
        SET doctor_id = rec.doctor_id 
        WHERE id = rec.patient_id AND doctor_id IS NULL;
        
        -- 2. Reparar la tabla 'budget_items'
        -- Reasignamos el doctor del paciente a sus ítems de presupuesto que quedaron huérfanos
        UPDATE budget_items bi
        SET doctor_id = rec.doctor_id
        FROM budgets b
        WHERE bi.budget_id = b.id 
          AND b.patient_id = rec.patient_id 
          AND bi.doctor_id IS NULL;
    END LOOP;

    -- 3. Fallback final: Si un paciente NO tiene citas o queremos asegurar su doctor,
    -- le asignamos a Luciana Pacheco Hurtado (quien es la doctora de los 3 pacientes mencionados).
    UPDATE patients 
    SET doctor_id = (SELECT id FROM doctors WHERE name = 'Luciana Pacheco Hurtado' LIMIT 1)
    WHERE doctor_id IS NULL;

    -- 4. Reasignar específicamente a Dionicio y Justo si aún no tienen doctor asignado (seguridad extra)
    UPDATE patients 
    SET doctor_id = (SELECT id FROM doctors WHERE name = 'Luciana Pacheco Hurtado' LIMIT 1)
    WHERE (first_name || ' ' || last_name) IN ('Dionicio Velarde Pizarro', 'Justo Fernandez', 'Justo Fernández')
       OR (last_name || ' ' || first_name) IN ('Dionicio Velarde Pizarro', 'Justo Fernandez', 'Justo Fernández');

    -- 5. REPARAR CITAS: Si una cita quedó huerfana (-), le asignamos el doctor responsable del paciente
    UPDATE appointments a
    SET doctor_id = p.doctor_id
    FROM patients p
    WHERE a.patient_id = p.id 
      AND a.doctor_id IS NULL;

    -- 6. Fallback final para budget_items
    UPDATE budget_items bi
    SET doctor_id = p.doctor_id
    FROM budgets b
    JOIN patients p ON b.patient_id = p.id
    WHERE bi.budget_id = b.id 
      AND bi.doctor_id IS NULL;

END $$;
