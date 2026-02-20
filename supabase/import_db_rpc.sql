
CREATE OR REPLACE FUNCTION import_database_json(data json)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Disable triggers and foreign keys temporarily for a clean wipe & insert
  SET session_replication_role = 'replica';

  -- 1. WIPE CURRENT DATA (in correct order to respect constraints if any remain active)
  TRUNCATE TABLE 
    events, appointments, treatment_plans, budgets, payments, 
    clinical_notes, clinical_files, odontogram_snapshots, integrations,
    patients, doctors, services
  RESTART IDENTITY CASCADE;

  -- 2. INSERT NEW DATA FROM JSON
  
  -- Core entities
  IF data->>'doctors' IS NOT NULL THEN
    INSERT INTO doctors
    SELECT * FROM json_populate_recordset(null::doctors, (data->>'doctors')::json);
  END IF;

  IF data->>'services' IS NOT NULL THEN
    INSERT INTO services
    SELECT * FROM json_populate_recordset(null::services, (data->>'services')::json);
  END IF;

  IF data->>'patients' IS NOT NULL THEN
    INSERT INTO patients
    SELECT * FROM json_populate_recordset(null::patients, (data->>'patients')::json);
  END IF;

  -- Dependent entities
  IF data->>'appointments' IS NOT NULL THEN
    INSERT INTO appointments
    SELECT * FROM json_populate_recordset(null::appointments, (data->>'appointments')::json);
  END IF;

  IF data->>'events' IS NOT NULL THEN
    INSERT INTO events
    SELECT * FROM json_populate_recordset(null::events, (data->>'events')::json);
  END IF;

  IF data->>'treatment_plans' IS NOT NULL THEN
    INSERT INTO treatment_plans
    SELECT * FROM json_populate_recordset(null::treatment_plans, (data->>'treatment_plans')::json);
  END IF;

  IF data->>'budgets' IS NOT NULL THEN
    INSERT INTO budgets
    SELECT * FROM json_populate_recordset(null::budgets, (data->>'budgets')::json);
  END IF;

  IF data->>'payments' IS NOT NULL THEN
    INSERT INTO payments
    SELECT * FROM json_populate_recordset(null::payments, (data->>'payments')::json);
  END IF;

  IF data->>'clinical_notes' IS NOT NULL THEN
    INSERT INTO clinical_notes
    SELECT * FROM json_populate_recordset(null::clinical_notes, (data->>'clinical_notes')::json);
  END IF;

  IF data->>'clinical_files' IS NOT NULL THEN
    INSERT INTO clinical_files
    SELECT * FROM json_populate_recordset(null::clinical_files, (data->>'clinical_files')::json);
  END IF;

  IF data->>'odontogram_snapshots' IS NOT NULL THEN
    INSERT INTO odontogram_snapshots
    SELECT * FROM json_populate_recordset(null::odontogram_snapshots, (data->>'odontogram_snapshots')::json);
  END IF;

  IF data->>'integrations' IS NOT NULL THEN
    INSERT INTO integrations
    SELECT * FROM json_populate_recordset(null::integrations, (data->>'integrations')::json);
  END IF;

  -- Re-enable triggers and foreign keys
  SET session_replication_role = 'origin';
END;
$$;

