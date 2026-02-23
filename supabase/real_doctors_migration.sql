-- 1. Asegurar columnas necesarias
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS cmp VARCHAR(50);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS dni VARCHAR(50);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Limpiar doctores antiguos para evitar conflictos
-- Reasignamos sus datos antes de borrarlos
DO $$
DECLARE
    new_doc_id UUID;
    old_doc RECORD;
BEGIN
    -- Insertamos al menos un doctor nuevo primero para tener a dónde reasignar
    INSERT INTO doctors (name, specialty, email, phone, color, cmp, dni)
    VALUES ('Luciana Renata Jiménez Aranzaens', 'Ortodoncia y Estética', 'ljimenezaranzaens@gmail.com', '944131255', '#F8526A', '42106', '72229058')
    ON CONFLICT DO NOTHING;

    new_doc_id := (SELECT id FROM doctors WHERE name = 'Luciana Renata Jiménez Aranzaens' LIMIT 1);

    -- Reasignar TODO lo que pertenezca a doctores que no son los nuevos
    FOR old_doc IN 
        SELECT id FROM doctors 
        WHERE name NOT IN (
            'Luciana Renata Jiménez Aranzaens', 'Luciana Pacheco Hurtado',
            'Barbara Casapía Prado', 'Diego Casapía Prado', 'Stephany Baldarrago Zevallos',
            'Maria Elena Prado Rivera', 'Sergio Huaylla Paredes'
        )
    LOOP
        UPDATE appointments SET doctor_id = new_doc_id WHERE doctor_id = old_doc.id;
        UPDATE events SET doctor_id = new_doc_id WHERE doctor_id = old_doc.id;
        UPDATE clinical_histories SET doctor_id = new_doc_id WHERE doctor_id = old_doc.id;
    END LOOP;

    -- Ahora sí, borramos los antiguos
    DELETE FROM doctors 
    WHERE name NOT IN (
        'Luciana Renata Jiménez Aranzaens', 'Luciana Pacheco Hurtado',
        'Barbara Casapía Prado', 'Diego Casapía Prado', 'Stephany Baldarrago Zevallos',
        'Maria Elena Prado Rivera', 'Sergio Huaylla Paredes'
    );
END $$;

-- 3. Insertar el resto del staff (si no existen)
INSERT INTO doctors (name, specialty, email, phone, color, cmp, dni)
VALUES 
('Luciana Pacheco Hurtado', 'Odontología General', 'lupacheco05@gmail.com', '974214717', '#e5e580', '41142', '73621929'),
('Barbara Casapía Prado', 'Endodoncia', 'barbaracp99@gmail.com', '956709805', '#3b82f6', '61548', '71573162'),
('Diego Casapía Prado', 'Ortodoncia', 'diegocp2594@gmail.com', '952365178', '#f59e0b', '46252', '71573161'),
('Stephany Baldarrago Zevallos', 'Implantología y Periodoncia', 'crisalida262@hotmail.com', '986244649', '#92D050', '38555', '71236945'),
('Maria Elena Prado Rivera', 'Odontología General', 'mariaelena@curae.com', '961315289', '#A030A3', '20694', null),
('Sergio Huaylla Paredes', 'Implantología y Periodoncia', 'shp_77@hotmail.com', '969270240', '#0000FF', '41978', '72128285')
ON CONFLICT DO NOTHING;

-- 4. Reasignación final aleatoria (balanceo opcional de datos antiguos)
DO $$
BEGIN
    UPDATE appointments SET doctor_id = (SELECT id FROM doctors ORDER BY random() LIMIT 1) WHERE doctor_id = (SELECT id FROM doctors WHERE name = 'Luciana Renata Jiménez Aranzaens' LIMIT 1);
    UPDATE events SET doctor_id = (SELECT id FROM doctors ORDER BY random() LIMIT 1) WHERE doctor_id = (SELECT id FROM doctors WHERE name = 'Luciana Renata Jiménez Aranzaens' LIMIT 1);
END $$;
