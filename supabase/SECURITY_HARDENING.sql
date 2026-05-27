-- ============================================================
-- CURAE ONLINE — SECURITY HARDENING
-- Resuelve: sensitive_columns_exposed + rls_disabled_in_public
-- ============================================================
-- INSTRUCCIONES:
--   1. Abrir Supabase Dashboard → SQL Editor
--   2. Pegar TODO este archivo
--   3. Ejecutar (Run)
--   4. Verificar que la sección FASE 5 muestre 0 tablas inseguras
-- ============================================================

-- ============================================================
-- FASE 1: DIAGNÓSTICO PRE-FIX (informativo)
-- ============================================================
SELECT
    t.tablename,
    t.rowsecurity AS rls_enabled,
    COUNT(p.policyname) AS total_policies,
    COUNT(CASE WHEN p.roles::text LIKE '%anon%' OR p.roles::text LIKE '%public%' THEN 1 END) AS insecure_policies
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- ============================================================
-- FASE 2: LIMPIAR TODAS LAS POLÍTICAS EXISTENTES (slate limpio)
-- ============================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I;',
            r.policyname, r.schemaname, r.tablename
        );
        RAISE NOTICE 'Dropped policy "%" on %.%', r.policyname, r.schemaname, r.tablename;
    END LOOP;
END $$;

-- ============================================================
-- FASE 3: ACTIVAR RLS + CREAR POLÍTICAS SEGURAS
-- Solo usuarios autenticados (con sesión) tienen acceso total.
-- Rol anon (sin login) queda bloqueado.
-- ============================================================
DO $$
DECLARE
    tbl TEXT;
    all_tables TEXT[] := ARRAY[
        -- Core clínico
        'patients',
        'doctors',
        'appointments',
        'events',
        -- Historia clínica
        'clinical_histories',
        'clinical_notes',
        'internal_notes',
        'odontogram_snapshots',
        'patient_files',
        'gallery_images',
        'clinical_history_items',
        -- Tratamientos
        'treatment_plans',
        'treatment_plan_items',
        'treatment_evolution_notes',
        -- Finanzas
        'budgets',
        'budget_items',
        'payments',
        'expenses',
        'expense_categories',
        'purchases',
        'purchase_items',
        -- Boletas / Vouchers
        'vouchers',
        'voucher_items',
        'voucher_payment_methods',
        -- Catálogos
        'services',
        'patient_service_prices',
        'inventory_products',
        -- Sistema
        'integrations'
    ];
BEGIN
    FOREACH tbl IN ARRAY all_tables
    LOOP
        -- Solo actuar si la tabla existe físicamente
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            -- 1. Activar RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

            -- 2. Crear política segura: solo authenticated, acceso total
            --    USING(true)       → puede ver todas las filas
            --    WITH CHECK(true)  → puede insertar/actualizar sin restricción de fila
            EXECUTE format(
                'CREATE POLICY "Authenticated Full Access" ON public.%I
                 FOR ALL
                 TO authenticated
                 USING (true)
                 WITH CHECK (true);',
                tbl
            );

            RAISE NOTICE '✅ Secured: %', tbl;
        ELSE
            RAISE NOTICE '⏭️  Skipped (not found): %', tbl;
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- FASE 4: STORAGE — Buckets seguros
-- Solo usuarios autenticados pueden subir/ver archivos
-- ============================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Limpiar policies de storage existentes
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I;',
            r.policyname, r.schemaname, r.tablename
        );
    END LOOP;
END $$;

-- Política unificada de Storage: solo authenticated
CREATE POLICY "Authenticated Storage Access"
ON storage.objects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================
-- FASE 5: VERIFICACIÓN POST-FIX
-- Todas las filas deben mostrar rls_enabled = true
-- La columna insecure_policies debe ser 0 en todas las tablas
-- ============================================================
SELECT
    t.tablename,
    t.rowsecurity                                                        AS rls_enabled,
    COUNT(p.policyname)                                                  AS total_policies,
    COUNT(CASE
        WHEN p.roles::text LIKE '%anon%'
          OR p.roles::text LIKE '%public%' THEN 1
    END)                                                                  AS insecure_policies,
    STRING_AGG(p.policyname, ', ')                                       AS active_policies
FROM pg_tables t
LEFT JOIN pg_policies p
       ON p.tablename  = t.tablename
      AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY rls_enabled ASC, t.tablename;

-- ============================================================
-- ✅ RESULTADO ESPERADO:
--    - rls_enabled = true en todas las tablas
--    - insecure_policies = 0 en todas las tablas
--    - active_policies = "Authenticated Full Access" en cada tabla
--
-- 🔒 ACCESO DESPUÉS DEL FIX:
--    Doctores logueados   → acceso total ✅
--    Asistente logueado   → acceso total ✅
--    Sin login (anon)     → bloqueado    ❌
-- ============================================================
