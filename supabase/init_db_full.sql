-- ============================================
-- CURAE ONLINE - BASE DE DATOS COMPLETA (v1.0)
-- ============================================
-- Ejecuta todo este script en el Editor SQL de Supabase para reiniciar la BD
-- ADVERTENCIA: ESTO BORRARÁ LOS DATOS EXISTENTES SI YA EXISTEN LAS TABLAS

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. LIMPIEZA (DROP)
-- ============================================
DROP TABLE IF EXISTS clinical_histories CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;

-- ============================================
-- 2. CREACIÓN DE TABLAS
-- ============================================

-- A. DOCTORES
CREATE TABLE doctors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    color VARCHAR(7) DEFAULT '#14b8a6', -- Color para el calendario
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- B. PACIENTES
CREATE TABLE patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    dni VARCHAR(20) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C. SERVICIOS (Nueva tabla solicitada)
CREATE TABLE services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    duration_min INTEGER DEFAULT 30, -- Duración estimada en minutos
    active BOOLEAN DEFAULT true
);

-- D. CITAS (Appointments)
CREATE TABLE appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL, -- Link a servicios
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    motivo VARCHAR(255), -- Texto libre o título
    consultorio VARCHAR(255),
    frecuencia VARCHAR(100) DEFAULT 'No se repite',
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E. HISTORIA CLÍNICA (Clinical Histories)
CREATE TABLE clinical_histories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    numero_historia VARCHAR(50),
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    
    -- Datos Médicos (JSONB para flexibilidad)
    antecedentes JSONB DEFAULT '{}'::jsonb, -- { enfermedadCardiaca: true, alergias: false ... }
    odontograma JSONB DEFAULT '{}'::jsonb, -- Datos visuales del odontograma
    
    examen_radiografico TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- F. EVENTOS (Bloqueos de calendario)
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    all_day BOOLEAN DEFAULT false,
    color VARCHAR(7) DEFAULT '#64748b',
    frecuencia VARCHAR(100) DEFAULT 'No se repite',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. SEGURIDAD (RLS)
-- ============================================
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Política de acceso total (ajustar en producción)
CREATE POLICY "Public Access" ON doctors FOR ALL USING (true);
CREATE POLICY "Public Access" ON patients FOR ALL USING (true);
CREATE POLICY "Public Access" ON services FOR ALL USING (true);
CREATE POLICY "Public Access" ON appointments FOR ALL USING (true);
CREATE POLICY "Public Access" ON clinical_histories FOR ALL USING (true);
CREATE POLICY "Public Access" ON events FOR ALL USING (true);

-- ============================================
-- 4. DATOS DE EJEMPLO (SEED DATA)
-- ============================================

-- A. DOCTORES (5)
INSERT INTO doctors (name, specialty, email, color) VALUES
    ('Dr. Roberto Mendoza', 'Odontología General', 'roberto@curae.com', '#14b8a6'),
    ('Dra. María García', 'Ortodoncia', 'maria@curae.com', '#f59e0b'),
    ('Dr. Carlos López', 'Endodoncia', 'carlos@curae.com', '#3b82f6'),
    ('Dra. Ana Torres', 'Odontopediatría', 'ana@curae.com', '#ec4899'),
    ('Dr. Luis Fernandez', 'Cirugía Maxilofacial', 'luis@curae.com', '#8b5cf6');

-- B. PACIENTES (5)
INSERT INTO patients (first_name, last_name, dni, email, phone, date_of_birth, gender) VALUES
    ('Ana', 'Garcia', '74829103', 'ana@gmail.com', '987654321', '1990-05-15', 'F'),
    ('Carlos', 'Morales', '09283746', 'carlosm@hotmail.com', '912345678', '1985-08-22', 'M'),
    ('Elena', 'Rodriguez', '12345678', 'elena.rod@gmail.com', '956789012', '1995-11-30', 'F'),
    ('Juan', 'Perez', '87654321', 'juanperez@yahoo.com', '998877665', '1982-02-10', 'M'),
    ('Sofia', 'Martinez', '11223344', 'sofia.m@gmail.com', '944556677', '2000-07-25', 'F');

-- C. SERVICIOS CLÍNICOS (10)
INSERT INTO services (name, description, price, duration_min) VALUES
    ('Consulta General', 'Evaluación inicial y diagnóstico', 50.00, 30),
    ('Profilaxis (Limpieza)', 'Limpieza dental profunda y pulido', 120.00, 45),
    ('Curación Resina Simple', 'Restauración de una superficie', 150.00, 45),
    ('Curación Resina Compuesta', 'Restauración compleja estética', 250.00, 60),
    ('Extracción Simple', 'Extracción de pieza dental sin cirugía', 100.00, 30),
    ('Extracción Tercera Molar', 'Cirugía de muela del juicio', 350.00, 90),
    ('Blanqueamiento Dental', 'Sesión de aclaramiento dental láser', 400.00, 60),
    ('Endodoncia Unirradicular', 'Tratamiento de conducto (1 raíz)', 300.00, 90),
    ('Endodoncia Multirradicular', 'Tratamiento de conducto (múltiples)', 500.00, 120),
    ('Corona de Porcelana', 'Prótesis fija unitaria', 800.00, 60);

-- D. CITA DE EJEMPLO
INSERT INTO appointments (date, start_time, end_time, motivo, doctor_id, patient_id) 
SELECT 
    CURRENT_DATE + 1, '09:00', '10:00', 'Limpieza General', 
    (SELECT id FROM doctors WHERE name = 'Dr. Roberto Mendoza'),
    (SELECT id FROM patients WHERE first_name = 'Ana');
