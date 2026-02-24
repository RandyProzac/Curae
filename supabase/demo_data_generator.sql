-- ============================================
-- DEMO DATA GENERATOR: Planes y Presupuestos
-- ============================================
-- Este script genera datos de demostración para todos los pacientes actuales.
-- Incluye: Planes de Tratamiento, Odontogramas marcados y Presupuestos.

DO $$
DECLARE
    p_record RECORD;
    d_id UUID;
    tp_id UUID;
    b_id UUID;
    
    -- Service IDs (Reales de tu DB)
    s_consulta UUID;
    s_limpieza UUID;
    s_resina UUID;
    s_extraccion UUID;
    s_endo UUID;
    s_protesis UUID;
    s_blanqueamiento UUID;
    
    -- Precios (Reales de tu DB)
    p_consulta DECIMAL := 50.00;
    p_limpieza DECIMAL := 120.00;
    p_resina DECIMAL := 150.00;
    p_extraccion DECIMAL := 100.00;
    p_endo DECIMAL := 500.00;
    p_blanqueamiento DECIMAL := 400.00;

    -- Odontogram JSON builders
    odo_empty JSONB := '{"dientes": {}}'::JSONB;
    odo_data JSONB;
BEGIN
    -- 0. Limpiar datos previos de demostración (Opcional, pero recomendado para evitar duplicados)
    -- DELETE FROM payments;
    -- DELETE FROM budget_items;
    -- DELETE FROM budgets;
    -- DELETE FROM treatment_plans;

    -- Obtener un Doctor ID válido para los planes (usaremos el primero que encuentre)
    SELECT id INTO d_id FROM doctors LIMIT 1;

    -- Obtener Service IDs reales
    SELECT id INTO s_consulta FROM services WHERE name ILIKE '%Consulta%' LIMIT 1;
    SELECT id INTO s_limpieza FROM services WHERE name ILIKE '%Limpieza%' LIMIT 1;
    SELECT id INTO s_resina FROM services WHERE name ILIKE '%Resina Simple%' LIMIT 1;
    SELECT id INTO s_extraccion FROM services WHERE name ILIKE '%Extracción Simple%' LIMIT 1;
    SELECT id INTO s_endo FROM services WHERE name ILIKE '%Endodoncia Unirradicular%' LIMIT 1;
    SELECT id INTO s_blanqueamiento FROM services WHERE name ILIKE '%Blanqueamiento%' LIMIT 1;

    -- Loop por todos los pacientes
    FOR p_record IN SELECT id, first_name, last_name FROM patients LOOP
        
        -- Escenario aleatorio (1-3)
        CASE floor(random() * 3 + 1)
            WHEN 1 THEN
                -- ESCENARIO: REHABILITACIÓN BÁSICA
                odo_data := jsonb_build_object(
                    'dientes', jsonb_build_object(
                        '16', jsonb_build_object(
                            'hallazgos', jsonb_build_array(jsonb_build_object('id', 'caries', 'color', '#FF0000')),
                            'superficies', jsonb_build_object('oclusal', jsonb_build_object('hallazgo', true, 'color', '#FF0000', 'relleno', true))
                        ),
                        '47', jsonb_build_object(
                            'hallazgos', jsonb_build_array(jsonb_build_object('id', 'extraccion', 'color', '#FF0000'))
                        )
                    )
                );

                INSERT INTO treatment_plans (patient_id, title, status, notes, odontogram_data)
                VALUES (p_record.id, 'Plan de Saneamiento Inicial', 'active', '• Realizar curaciones pendientes en cuadrante 1\n• Extraer pieza con mal pronóstico en cuadrante 4', odo_data)
                RETURNING id INTO tp_id;

                INSERT INTO budgets (patient_id, title, status, is_treatment_plan)
                VALUES (p_record.id, 'Presupuesto: ' || p_record.first_name, 'active', true)
                RETURNING id INTO b_id;

                -- Vincular presupuesto al plan
                UPDATE treatment_plans SET budget_id = b_id WHERE id = tp_id;

                -- Items
                INSERT INTO budget_items (budget_id, service_id, service_name, quantity, unit_price, paid_amount, tooth_number)
                VALUES 
                    (b_id, s_consulta, 'Consulta y Diagnóstico', 1, 50.00, 50.00, NULL),
                    (b_id, s_resina, 'Resina Simple', 1, 150.00, 0, '16'),
                    (b_id, s_extraccion, 'Extracción Simple', 1, 100.00, 0, '47');

            WHEN 2 THEN
                -- ESCENARIO: ESTÉTICA
                odo_data := jsonb_build_object(
                    'dientes', jsonb_build_object(
                        '11', jsonb_build_object('hallazgos', jsonb_build_array(jsonb_build_object('id', 'desgaste', 'color', '#0000FF'))),
                        '21', jsonb_build_object('hallazgos', jsonb_build_array(jsonb_build_object('id', 'desgaste', 'color', '#0000FF')))
                    )
                );

                INSERT INTO treatment_plans (patient_id, title, status, notes, odontogram_data)
                VALUES (p_record.id, 'Tratamiento de Estética Dental', 'active', '• Blanqueamiento dental en consultorio\n• Profilaxis profunda', odo_data)
                RETURNING id INTO tp_id;

                INSERT INTO budgets (patient_id, title, status, is_treatment_plan)
                VALUES (p_record.id, 'Presupuesto Estética', 'active', true)
                RETURNING id INTO b_id;

                UPDATE treatment_plans SET budget_id = b_id WHERE id = tp_id;

                INSERT INTO budget_items (budget_id, service_id, service_name, quantity, unit_price, paid_amount)
                VALUES 
                    (b_id, s_limpieza, 'Limpieza Dental (Profilaxis)', 1, 120.00, 120.00),
                    (b_id, s_blanqueamiento, 'Blanqueamiento Dental', 1, 400.00, 100.00);

            ELSE
                -- ESCENARIO: URGENCIA / ENDODONCIA
                odo_data := jsonb_build_object(
                    'dientes', jsonb_build_object(
                        '36', jsonb_build_object(
                            'hallazgos', jsonb_build_array(jsonb_build_object('id', 'caries', 'color', '#FF0000')),
                            'superficies', jsonb_build_object(
                                'mesial', jsonb_build_object('hallazgo', true, 'color', '#FF0000', 'relleno', true),
                                'oclusal', jsonb_build_object('hallazgo', true, 'color', '#FF0000', 'relleno', true)
                            )
                        )
                    )
                );

                INSERT INTO treatment_plans (patient_id, title, status, notes, odontogram_data)
                VALUES (p_record.id, 'Tratamiento de Conductos (Endodoncia)', 'active', '• Pieza 3.6 presenta dolor agudo.\n• Se indica endodoncia para salvar la pieza.', odo_data)
                RETURNING id INTO tp_id;

                INSERT INTO budgets (patient_id, title, status, is_treatment_plan)
                VALUES (p_record.id, 'Presupuesto Urgencia', 'active', true)
                RETURNING id INTO b_id;

                UPDATE treatment_plans SET budget_id = b_id WHERE id = tp_id;

                INSERT INTO budget_items (budget_id, service_id, service_name, quantity, unit_price, paid_amount, tooth_number)
                VALUES 
                    (b_id, s_consulta, 'Consulta de Urgencia', 1, 50.00, 50.00, NULL),
                    (b_id, s_endo, 'Endodoncia Unirradicular', 1, 500.00, 250.00, '36');
        END CASE;

    END LOOP;
    
    RAISE NOTICE '✅ Datos de demostración generados para todos los pacientes.';
END $$;
