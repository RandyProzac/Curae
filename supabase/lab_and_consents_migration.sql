-- Migration for Laboratory Works and Informed Consents

CREATE TABLE IF NOT EXISTS laboratory_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    work_type VARCHAR(255) NOT NULL,
    tooth_number VARCHAR(50),
    laboratory_name VARCHAR(255),
    sent_date DATE NOT NULL,
    expected_receive_date DATE,
    actual_receive_date DATE,
    status VARCHAR(50) DEFAULT 'ENVIADO', -- ENVIADO, RECIBIDO, EN_PRUEBA, INSTALADO
    cost DECIMAL(10,2) DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS patient_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    treatment_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    signature_data_url TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
