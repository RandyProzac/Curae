-- ============================================
-- CURAE ONLINE - SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DOCTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    color VARCHAR(7) DEFAULT '#14b8a6',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PATIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    motivo VARCHAR(255),
    servicio VARCHAR(255),
    consultorio VARCHAR(255),
    frecuencia VARCHAR(100) DEFAULT 'No se repite',
    notes TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EVENTS TABLE (Calendar blocks)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    all_day BOOLEAN DEFAULT false,
    color VARCHAR(7) DEFAULT '#14b8a6',
    frecuencia VARCHAR(100) DEFAULT 'No se repite',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_doctor ON events(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);

-- ============================================
-- ROW LEVEL SECURITY (Optional - for multi-tenant)
-- ============================================
-- For now, we'll enable RLS but allow all authenticated users access
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON doctors FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON patients FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON events FOR ALL USING (true);

-- Also allow anonymous access for development
CREATE POLICY "Allow anon read" ON doctors FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon all" ON doctors FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon all" ON patients FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon all" ON appointments FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon all" ON events FOR ALL TO anon USING (true);

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================
INSERT INTO doctors (name, specialty, color) VALUES
    ('Dr. Roberto Mendoza', 'Odontología General', '#14b8a6'),
    ('Dra. María García', 'Ortodoncia', '#f59e0b'),
    ('Dr. Carlos López', 'Endodoncia', '#3b82f6')
ON CONFLICT DO NOTHING;
