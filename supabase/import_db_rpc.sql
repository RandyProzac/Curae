
CREATE OR REPLACE FUNCTION import_database_json(data json)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Disable triggers and foreign keys temporarily for a clean wipe & insert
  SET session_replication_role = 'replica';

  -- 1. WIPE CURRENT DATA (in correct order to respect constraints)
  TRUNCATE TABLE 
    treatment_evolution_notes,
    treatment_plan_items,
    treatment_plans,
    budget_items,
    budgets,
    payments,
    expenses,
    purchase_items,
    purchases,
    appointments,
    events,
    clinical_notes,
    patient_files,
    odontogram_snapshots,
    integrations,
    patients,
    doctors,
    services,
    inventory_products,
    expense_categories
  RESTART IDENTITY CASCADE;

  -- 2. INSERT NEW DATA FROM JSON
  -- We follow a logical order: core configuration -> main entities -> dependent items

  IF data->>'expense_categories' IS NOT NULL THEN
    INSERT INTO expense_categories SELECT * FROM json_populate_recordset(null::expense_categories, (data->>'expense_categories')::json);
  END IF;

  IF data->>'inventory_products' IS NOT NULL THEN
    INSERT INTO inventory_products SELECT * FROM json_populate_recordset(null::inventory_products, (data->>'inventory_products')::json);
  END IF;

  IF data->>'doctors' IS NOT NULL THEN
    INSERT INTO doctors SELECT * FROM json_populate_recordset(null::doctors, (data->>'doctors')::json);
  END IF;

  IF data->>'services' IS NOT NULL THEN
    INSERT INTO services SELECT * FROM json_populate_recordset(null::services, (data->>'services')::json);
  END IF;

  IF data->>'patients' IS NOT NULL THEN
    INSERT INTO patients SELECT * FROM json_populate_recordset(null::patients, (data->>'patients')::json);
  END IF;

  IF data->>'integrations' IS NOT NULL THEN
    INSERT INTO integrations SELECT * FROM json_populate_recordset(null::integrations, (data->>'integrations')::json);
  END IF;

  IF data->>'appointments' IS NOT NULL THEN
    INSERT INTO appointments SELECT * FROM json_populate_recordset(null::appointments, (data->>'appointments')::json);
  END IF;

  IF data->>'events' IS NOT NULL THEN
    INSERT INTO events SELECT * FROM json_populate_recordset(null::events, (data->>'events')::json);
  END IF;

  IF data->>'clinical_notes' IS NOT NULL THEN
    INSERT INTO clinical_notes SELECT * FROM json_populate_recordset(null::clinical_notes, (data->>'clinical_notes')::json);
  END IF;

  IF data->>'patient_files' IS NOT NULL THEN
    INSERT INTO patient_files SELECT * FROM json_populate_recordset(null::patient_files, (data->>'patient_files')::json);
  END IF;

  IF data->>'odontogram_snapshots' IS NOT NULL THEN
    INSERT INTO odontogram_snapshots SELECT * FROM json_populate_recordset(null::odontogram_snapshots, (data->>'odontogram_snapshots')::json);
  END IF;

  IF data->>'budgets' IS NOT NULL THEN
    INSERT INTO budgets SELECT * FROM json_populate_recordset(null::budgets, (data->>'budgets')::json);
  END IF;

  IF data->>'treatment_plans' IS NOT NULL THEN
    INSERT INTO treatment_plans SELECT * FROM json_populate_recordset(null::treatment_plans, (data->>'treatment_plans')::json);
  END IF;

  IF data->>'treatment_plan_items' IS NOT NULL THEN
    INSERT INTO treatment_plan_items SELECT * FROM json_populate_recordset(null::treatment_plan_items, (data->>'treatment_plan_items')::json);
  END IF;

  IF data->>'budget_items' IS NOT NULL THEN
    INSERT INTO budget_items SELECT * FROM json_populate_recordset(null::budget_items, (data->>'budget_items')::json);
  END IF;

  IF data->>'payments' IS NOT NULL THEN
    INSERT INTO payments SELECT * FROM json_populate_recordset(null::payments, (data->>'payments')::json);
  END IF;

  IF data->>'expenses' IS NOT NULL THEN
    INSERT INTO expenses SELECT * FROM json_populate_recordset(null::expenses, (data->>'expenses')::json);
  END IF;

  IF data->>'purchases' IS NOT NULL THEN
    INSERT INTO purchases SELECT * FROM json_populate_recordset(null::purchases, (data->>'purchases')::json);
  END IF;

  IF data->>'purchase_items' IS NOT NULL THEN
    INSERT INTO purchase_items SELECT * FROM json_populate_recordset(null::purchase_items, (data->>'purchase_items')::json);
  END IF;

  IF data->>'treatment_evolution_notes' IS NOT NULL THEN
    INSERT INTO treatment_evolution_notes SELECT * FROM json_populate_recordset(null::treatment_evolution_notes, (data->>'treatment_evolution_notes')::json);
  END IF;

  -- Re-enable triggers and foreign keys
  SET session_replication_role = 'origin';
END;
$$;

