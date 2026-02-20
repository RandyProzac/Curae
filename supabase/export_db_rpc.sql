
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
    'inventory_products', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM inventory_products t),
    'expense_categories', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM expense_categories t),
    'expenses', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM expenses t),
    'purchases', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM purchases t),
    'purchase_items', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM purchase_items t),
    'appointments', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM appointments t),
    'events', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM events t),
    'treatment_plans', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM treatment_plans t),
    'treatment_plan_items', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM treatment_plan_items t),
    'budgets', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM budgets t),
    'budget_items', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM budget_items t),
    'payments', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM payments t),
    'clinical_notes', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM clinical_notes t),
    'treatment_evolution_notes', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM treatment_evolution_notes t),
    'patient_files', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM patient_files t),
    'odontogram_snapshots', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM odontogram_snapshots t),
    'integrations', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM integrations t)
  ) INTO result;
  
  RETURN result;
END;
$$;

