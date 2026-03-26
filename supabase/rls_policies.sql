-- Curae Online: Smart Security Hardening Script
-- Este script es dinámico y a prueba de errores. 
-- Verifica qué tablas existen realmente en tu base de datos antes de aplicar el RLS.

DO $$ 
DECLARE
    tb_name text;
    -- Lista maestra de todas las tablas posibles en el código fuente de Curae
    tables_list text[] := ARRAY[
        'patients', 'appointments', 'clinical_histories', 'payments', 
        'doctors', 'odontogram_snapshots', 'gallery_images', 'clinical_history_items', 
        'treatment_plans', 'internal_notes', 'services', 'events', 'budget_items', 
        'budgets', 'integrations'
    ];
BEGIN
    FOREACH tb_name IN ARRAY tables_list
    LOOP
        -- 1. Verificar si la tabla existe fisicamente en la base de datos
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tb_name) THEN
            
            -- 2. Activar Row Level Security
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tb_name);
            
            -- 3. Eliminar la política si ya existía (para poder volver a correr el script sin errores)
            EXECUTE format('DROP POLICY IF EXISTS "Auth access for %I" ON public.%I;', tb_name, tb_name);
            
            -- 4. Crear la política que permite el acceso total a los usuarios con sesión iniciada
            EXECUTE format('CREATE POLICY "Auth access for %I" ON public.%I FOR ALL USING (auth.role() = ''authenticated'');', tb_name, tb_name);
            
        END IF;
    END LOOP;
END $$;
