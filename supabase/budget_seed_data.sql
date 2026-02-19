-- ============================================
-- SEED DATA: Presupuestos de ejemplo
-- ============================================
-- This script creates sample budgets for existing patients
-- using existing services from the database.

-- We use CTEs to grab real patient and service IDs dynamically.

DO $$
DECLARE
    -- Patient IDs
    p1_id UUID;
    p2_id UUID;
    p3_id UUID;
    p4_id UUID;
    p5_id UUID;
    -- Service IDs
    s_consulta UUID;
    s_limpieza UUID;
    s_resina_simple UUID;
    s_resina_compuesta UUID;
    s_endo_uni UUID;
    s_endo_multi UUID;
    s_extraccion UUID;
    s_cirugia_3m UUID;
    s_corona_zirconio UUID;
    s_blanqueamiento UUID;
    s_carilla_porcelana UUID;
    s_sellante UUID;
    s_fluoriz UUID;
    s_protesis_total UUID;
    s_implante UUID;
    s_ortodoncia UUID;
    s_control_orto UUID;
    -- Budget IDs
    b1_id UUID;
    b2_id UUID;
    b3_id UUID;
    b4_id UUID;
    b5_id UUID;
    b6_id UUID;
    b7_id UUID;
    -- Item IDs (for payments)
    item_id UUID;
BEGIN
    -- ===== GET PATIENT IDS (first 5 patients) =====
    SELECT id INTO p1_id FROM patients ORDER BY last_name LIMIT 1 OFFSET 0;
    SELECT id INTO p2_id FROM patients ORDER BY last_name LIMIT 1 OFFSET 1;
    SELECT id INTO p3_id FROM patients ORDER BY last_name LIMIT 1 OFFSET 2;
    SELECT id INTO p4_id FROM patients ORDER BY last_name LIMIT 1 OFFSET 3;
    SELECT id INTO p5_id FROM patients ORDER BY last_name LIMIT 1 OFFSET 4;

    -- ===== GET SERVICE IDS =====
    SELECT id INTO s_consulta FROM services WHERE name ILIKE '%Consulta y diagnóstico%' LIMIT 1;
    SELECT id INTO s_limpieza FROM services WHERE name ILIKE '%Limpieza dental%' LIMIT 1;
    SELECT id INTO s_resina_simple FROM services WHERE name ILIKE '%Resina Simple%' LIMIT 1;
    SELECT id INTO s_resina_compuesta FROM services WHERE name ILIKE '%Resina Compuesta%' LIMIT 1;
    SELECT id INTO s_endo_uni FROM services WHERE name ILIKE '%Endodoncia Unirradicular%' LIMIT 1;
    SELECT id INTO s_endo_multi FROM services WHERE name ILIKE '%Endodoncia Multirradicular%' LIMIT 1;
    SELECT id INTO s_extraccion FROM services WHERE name ILIKE '%Extracción Simple%' LIMIT 1;
    SELECT id INTO s_cirugia_3m FROM services WHERE name ILIKE '%Tercera Molar%' LIMIT 1;
    SELECT id INTO s_corona_zirconio FROM services WHERE name ILIKE '%Zirconio%' LIMIT 1;
    SELECT id INTO s_blanqueamiento FROM services WHERE name ILIKE '%Blanqueamiento Dental%' LIMIT 1;
    SELECT id INTO s_carilla_porcelana FROM services WHERE name ILIKE '%Carilla de Porcelana%' LIMIT 1;
    SELECT id INTO s_sellante FROM services WHERE name ILIKE '%Sellantes%' LIMIT 1;
    SELECT id INTO s_fluoriz FROM services WHERE name ILIKE '%Fluorización%' LIMIT 1;
    SELECT id INTO s_protesis_total FROM services WHERE name ILIKE '%Prótesis Total%' LIMIT 1;
    SELECT id INTO s_implante FROM services WHERE name ILIKE '%Colocación de Implante%' LIMIT 1;
    SELECT id INTO s_ortodoncia FROM services WHERE name ILIKE '%Ortodoncia Convencional%' LIMIT 1;
    SELECT id INTO s_control_orto FROM services WHERE name ILIKE '%Control Mensual Ortodoncia%' LIMIT 1;

    -- ============================================
    -- PATIENT 1: Tratamiento de Estética Dental
    -- ============================================
    INSERT INTO budgets (patient_id, title, status, discount, internal_notes, created_at)
    VALUES (p1_id, 'ESTÉTICA DENTAL COMPLETA', 'in_progress', 200.00, 'Paciente quiere mejorar sonrisa. Descuento por paquete completo.', NOW() - INTERVAL '15 days')
    RETURNING id INTO b1_id;

    -- Items for budget 1
    INSERT INTO budget_items (budget_id, service_id, service_name, tooth_number, quantity, unit_price, paid_amount)
    VALUES
        (b1_id, s_blanqueamiento, 'Blanqueamiento Dental (Consultorio)', NULL, 1, 400.00, 400.00),
        (b1_id, s_carilla_porcelana, 'Carilla de Porcelana', '11', 1, 1200.00, 600.00),
        (b1_id, s_carilla_porcelana, 'Carilla de Porcelana', '12', 1, 1200.00, 0),
        (b1_id, s_carilla_porcelana, 'Carilla de Porcelana', '21', 1, 1200.00, 0),
        (b1_id, s_carilla_porcelana, 'Carilla de Porcelana', '22', 1, 1200.00, 0);

    -- Payments for budget 1 items
    SELECT id INTO item_id FROM budget_items WHERE budget_id = b1_id AND tooth_number IS NULL LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, notes, created_at)
    VALUES (item_id, 400.00, 'tarjeta', 'Pago completo blanqueamiento', NOW() - INTERVAL '14 days');

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b1_id AND tooth_number = '11' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, notes, created_at)
    VALUES (item_id, 600.00, 'transferencia', 'Adelanto carilla pieza 11', NOW() - INTERVAL '10 days');

    -- ============================================
    -- PATIENT 1: Presupuesto de Mantenimiento
    -- ============================================
    INSERT INTO budgets (patient_id, title, status, discount, created_at)
    VALUES (p1_id, 'MANTENIMIENTO PREVENTIVO', 'completed', 0, NOW() - INTERVAL '30 days')
    RETURNING id INTO b2_id;

    INSERT INTO budget_items (budget_id, service_id, service_name, quantity, unit_price, paid_amount)
    VALUES
        (b2_id, s_consulta, 'Consulta y diagnóstico', 1, 50.00, 50.00),
        (b2_id, s_limpieza, 'Limpieza dental (profilaxis)', 1, 120.00, 120.00);

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b2_id AND service_name = 'Consulta y diagnóstico' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, created_at)
    VALUES (item_id, 50.00, 'efectivo', NOW() - INTERVAL '30 days');

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b2_id AND service_name = 'Limpieza dental (profilaxis)' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, created_at)
    VALUES (item_id, 120.00, 'efectivo', NOW() - INTERVAL '30 days');

    -- ============================================
    -- PATIENT 2: Endodoncia + Coronas
    -- ============================================
    INSERT INTO budgets (patient_id, title, status, discount, internal_notes, created_at)
    VALUES (p2_id, 'ENDODONCIA Y REHABILITACIÓN', 'in_progress', 100.00, 'Pieza 36 con caries profunda. Requiere endodoncia + corona.', NOW() - INTERVAL '20 days')
    RETURNING id INTO b3_id;

    INSERT INTO budget_items (budget_id, service_id, service_name, tooth_number, quantity, unit_price, paid_amount)
    VALUES
        (b3_id, s_consulta, 'Consulta y diagnóstico', NULL, 1, 50.00, 50.00),
        (b3_id, s_endo_multi, 'Endodoncia Multirradicular', '36', 1, 500.00, 500.00),
        (b3_id, s_corona_zirconio, 'Corona Libre de Metal (Zirconio)', '36', 1, 1200.00, 400.00),
        (b3_id, s_resina_compuesta, 'Obturación Resina Compuesta', '35', 1, 200.00, 0);

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b3_id AND service_name = 'Consulta y diagnóstico' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, created_at)
    VALUES (item_id, 50.00, 'efectivo', NOW() - INTERVAL '20 days');

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b3_id AND service_name = 'Endodoncia Multirradicular' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, notes, created_at)
    VALUES (item_id, 500.00, 'tarjeta', 'Pago completo endodoncia', NOW() - INTERVAL '15 days');

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b3_id AND service_name ILIKE '%Corona%' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, notes, created_at)
    VALUES (item_id, 400.00, 'yape', 'Adelanto para corona', NOW() - INTERVAL '12 days');

    -- ============================================
    -- PATIENT 3: Cirugía de Terceras Molares
    -- ============================================
    INSERT INTO budgets (patient_id, title, status, discount, created_at)
    VALUES (p3_id, 'EXTRACCIÓN TERCERAS MOLARES', 'created', 50.00, NOW() - INTERVAL '5 days')
    RETURNING id INTO b4_id;

    INSERT INTO budget_items (budget_id, service_id, service_name, tooth_number, quantity, unit_price, paid_amount)
    VALUES
        (b4_id, s_consulta, 'Consulta y diagnóstico', NULL, 1, 50.00, 50.00),
        (b4_id, s_cirugia_3m, 'Cirugía Tercera Molar', '18', 1, 350.00, 0),
        (b4_id, s_cirugia_3m, 'Cirugía Tercera Molar', '28', 1, 350.00, 0),
        (b4_id, s_cirugia_3m, 'Cirugía Tercera Molar', '38', 1, 350.00, 0),
        (b4_id, s_cirugia_3m, 'Cirugía Tercera Molar', '48', 1, 350.00, 0);

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b4_id AND service_name = 'Consulta y diagnóstico' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, created_at)
    VALUES (item_id, 50.00, 'efectivo', NOW() - INTERVAL '5 days');

    -- ============================================
    -- PATIENT 4: Ortodoncia
    -- ============================================
    INSERT INTO budgets (patient_id, title, status, discount, internal_notes, created_at)
    VALUES (p4_id, 'TRATAMIENTO DE ORTODONCIA', 'in_progress', 300.00, 'Tratamiento 18 meses. Cuota mensual S/ 150.', NOW() - INTERVAL '90 days')
    RETURNING id INTO b5_id;

    INSERT INTO budget_items (budget_id, service_id, service_name, quantity, unit_price, paid_amount)
    VALUES
        (b5_id, s_consulta, 'Consulta y diagnóstico', 1, 50.00, 50.00),
        (b5_id, s_ortodoncia, 'Ortodoncia Convencional (Inicial)', 1, 1500.00, 1500.00),
        (b5_id, s_control_orto, 'Control Mensual Ortodoncia', 3, 150.00, 450.00),
        (b5_id, s_limpieza, 'Limpieza dental (profilaxis)', 1, 120.00, 120.00);

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b5_id AND service_name = 'Consulta y diagnóstico' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, created_at)
    VALUES (item_id, 50.00, 'efectivo', NOW() - INTERVAL '90 days');

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b5_id AND service_name ILIKE '%Ortodoncia Convencional%' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, notes, created_at)
    VALUES
        (item_id, 750.00, 'tarjeta', 'Primer pago instalación', NOW() - INTERVAL '90 days'),
        (item_id, 750.00, 'transferencia', 'Segundo pago instalación', NOW() - INTERVAL '60 days');

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b5_id AND service_name ILIKE '%Control Mensual%' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, created_at)
    VALUES
        (item_id, 150.00, 'efectivo', NOW() - INTERVAL '60 days'),
        (item_id, 150.00, 'efectivo', NOW() - INTERVAL '30 days'),
        (item_id, 150.00, 'yape', NOW() - INTERVAL '1 day');

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b5_id AND service_name ILIKE '%Limpieza%' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, created_at)
    VALUES (item_id, 120.00, 'efectivo', NOW() - INTERVAL '60 days');

    -- ============================================
    -- PATIENT 5: Implante Dental
    -- ============================================
    INSERT INTO budgets (patient_id, title, status, discount, internal_notes, created_at)
    VALUES (p5_id, 'IMPLANTE DENTAL PIEZA 46', 'in_progress', 0, 'Paciente perdió pieza 46 por fractura. Plan: implante + corona.', NOW() - INTERVAL '25 days')
    RETURNING id INTO b6_id;

    INSERT INTO budget_items (budget_id, service_id, service_name, tooth_number, quantity, unit_price, paid_amount)
    VALUES
        (b6_id, s_consulta, 'Consulta y diagnóstico', NULL, 1, 50.00, 50.00),
        (b6_id, s_extraccion, 'Extracción Simple', '46', 1, 100.00, 100.00),
        (b6_id, s_implante, 'Colocación de Implante', '46', 1, 2500.00, 1000.00),
        (b6_id, s_corona_zirconio, 'Corona Libre de Metal (Zirconio)', '46', 1, 1200.00, 0);

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b6_id AND service_name = 'Consulta y diagnóstico' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, created_at)
    VALUES (item_id, 50.00, 'efectivo', NOW() - INTERVAL '25 days');

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b6_id AND service_name = 'Extracción Simple' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, created_at)
    VALUES (item_id, 100.00, 'efectivo', NOW() - INTERVAL '25 days');

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b6_id AND service_name ILIKE '%Implante%' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, notes, created_at)
    VALUES (item_id, 1000.00, 'transferencia', 'Adelanto 40% para implante', NOW() - INTERVAL '20 days');

    -- ============================================
    -- PATIENT 5: Preventivo (ya completado)
    -- ============================================
    INSERT INTO budgets (patient_id, title, status, discount, created_at)
    VALUES (p5_id, 'PREVENTIVO Y SELLANTES', 'completed', 0, NOW() - INTERVAL '60 days')
    RETURNING id INTO b7_id;

    INSERT INTO budget_items (budget_id, service_id, service_name, tooth_number, quantity, unit_price, paid_amount)
    VALUES
        (b7_id, s_limpieza, 'Limpieza dental (profilaxis)', NULL, 1, 120.00, 120.00),
        (b7_id, s_fluoriz, 'Fluorización', NULL, 1, 60.00, 60.00),
        (b7_id, s_sellante, 'Sellantes', '16,26,36,46', 4, 50.00, 200.00);

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b7_id AND service_name ILIKE '%Limpieza%' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, created_at)
    VALUES (item_id, 120.00, 'efectivo', NOW() - INTERVAL '60 days');

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b7_id AND service_name ILIKE '%Fluorización%' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, created_at)
    VALUES (item_id, 60.00, 'efectivo', NOW() - INTERVAL '60 days');

    SELECT id INTO item_id FROM budget_items WHERE budget_id = b7_id AND service_name ILIKE '%Sellantes%' LIMIT 1;
    INSERT INTO payments (budget_item_id, amount, method, created_at)
    VALUES (item_id, 200.00, 'efectivo', NOW() - INTERVAL '60 days');

    RAISE NOTICE '✅ Seed data inserted successfully for 5 patients with 7 budgets!';
END $$;
