
CREATE OR REPLACE FUNCTION export_database_json()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'patients', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM patients t),
    'doctors', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM doctors t),
    'services', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM services t),
    'appointments', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM appointments t),
    'events', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM events t),
    'treatment_plans', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM treatment_plans t),
    'budgets', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM budgets t),
    'payments', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM payments t),
    'clinical_notes', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM clinical_notes t),
    'clinical_files', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM clinical_files t),
    'odontogram_snapshots', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM odontogram_snapshots t),
    'integrations', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM integrations t)
  ) INTO result;
  
  RETURN result;
END;
$$;

