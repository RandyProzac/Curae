-- ============================================
-- SERVICES MIGRATION (v2.0)
-- ============================================

-- 1. Modify Services Table
ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- 2. Create Patient Custom Prices Table
CREATE TABLE IF NOT EXISTS patient_service_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    custom_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, service_id)
);

-- Enable RLS
ALTER TABLE patient_service_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON patient_service_prices FOR ALL USING (true);

-- 3. Modify Appointments Table for Financial Reporting
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'; -- pending, paid, partial

-- 4. Clear old services and Seed New Data
DELETE FROM services;

-- Insert Services by Category
INSERT INTO services (name, category, price, duration_min, description) VALUES
-- 1. Odontología general / preventiva
('Consulta y diagnóstico', 'Odontología General', 50.00, 30, 'Evaluación inicial'),
('Examen clínico y plan de tratamiento', 'Odontología General', 80.00, 45, 'Diagnóstico completo'),
('Limpieza dental (profilaxis)', 'Odontología General', 120.00, 45, 'Limpieza profunda'),
('Fluorización', 'Odontología General', 60.00, 30, 'Aplicación de flúor'),
('Sellantes', 'Odontología General', 50.00, 30, 'Protección de fisuras'),
('Educación en higiene oral', 'Odontología General', 30.00, 30, 'Instrucción de técnica de cepillado'),
('Radiografías simples', 'Odontología General', 40.00, 15, 'Periapical o Bitewing'),

-- 2. Odontología restauradora
('Obturación Resina Simple', 'Odontología Restauradora', 150.00, 45, 'Una superficie'),
('Obturación Resina Compuesta', 'Odontología Restauradora', 200.00, 60, 'Dos o más superficies'),
('Obturación Amalgama', 'Odontología Restauradora', 100.00, 45, 'Restauración metálica'),
('Reconstrucción dental', 'Odontología Restauradora', 300.00, 90, 'Reconstrucción de muñón'),
('Incrustación Cerámica', 'Odontología Restauradora', 450.00, 60, 'Incrustación estética'),
('Incrustación Metálica', 'Odontología Restauradora', 350.00, 60, 'Incrustación en metal noble'),
('Tratamiento de caries profunda', 'Odontología Restauradora', 180.00, 60, 'Con protección pulpar'),

-- 3. Endodoncia
('Endodoncia Unirradicular', 'Endodoncia', 300.00, 90, 'Dientes anteriores/premolares'),
('Endodoncia Multirradicular', 'Endodoncia', 500.00, 120, 'Muelas/Molares'),
('Retratamiento de conducto', 'Endodoncia', 600.00, 120, 'Re-hacer endodoncia previa'),
('Medicación intraconducto', 'Endodoncia', 80.00, 30, 'Curación entre citas'),
('Urgencia Endodóntica', 'Endodoncia', 150.00, 45, 'Alivio del dolor agudo'),

-- 4. Periodoncia
('Diagnóstico Periodontal', 'Periodoncia', 100.00, 45, 'Sondaje y periodontograma'),
('Raspaje y Alisado Radicular (por cuadrante)', 'Periodoncia', 150.00, 60, 'Limpieza profunda bajo anestesia'),
('Tratamiento de Gingivitis', 'Periodoncia', 120.00, 45, 'Limpieza y control de placa'),
('Mantenimiento Periodontal', 'Periodoncia', 180.00, 60, 'Control cada 3-6 meses'),
('Gingivectomía (por pieza)', 'Periodoncia', 100.00, 45, 'Recorte de encía'),

-- 5. Cirugía Oral
('Extracción Simple', 'Cirugía Oral', 100.00, 30, 'Diente erupcionado'),
('Extracción Compleja', 'Cirugía Oral', 200.00, 60, 'Requiere osteotomía'),
('Cirugía Tercera Molar', 'Cirugía Oral', 350.00, 90, 'Muela del juicio'),
('Frenectomía', 'Cirugía Oral', 250.00, 45, 'Corte de frenillo'),
('Drenaje de Absceso', 'Cirugía Oral', 120.00, 30, 'Incisión y drenaje'),

-- 6. Rehabilitación Oral / Prótesis
('Corona Metal-Porcelana', 'Rehabilitación Oral', 600.00, 60, 'Estructura metálica'),
('Corona Libre de Metal (Zirconio)', 'Rehabilitación Oral', 1200.00, 60, 'Alta estética'),
('Puente Fijo (por unidad)', 'Rehabilitación Oral', 600.00, 60, 'Precio por pieza'),
('Prótesis Parcial Removible (Acrílico)', 'Rehabilitación Oral', 500.00, 60, 'Base acrílica'),
('Prótesis Parcial Removible (Metal)', 'Rehabilitación Oral', 900.00, 60, 'Base metálica (PPR)'),
('Prótesis Total (una arcada)', 'Rehabilitación Oral', 1100.00, 60, 'Superior o inferior'),
('Ajuste de Prótesis', 'Rehabilitación Oral', 50.00, 30, 'Desgastes por molestias'),
('Reparación de Prótesis', 'Rehabilitación Oral', 150.00, 60, 'Soldadura o agregado de diente'),

-- 7. Implantología
('Evaluación Implantológica', 'Implantología', 100.00, 45, 'Análisis de TAC y modelos'),
('Colocación de Implante', 'Implantología', 2500.00, 90, 'Fase quirúrgica'),
('Corona sobre Implante', 'Implantología', 1500.00, 60, 'Fase protésica'),
('Implante carga inmediata', 'Implantología', 3500.00, 120, 'Implante + provisional en un día'),
('Regeneración Ósea', 'Implantología', 500.00, 60, 'Injerto de hueso'),

-- 8. Ortodoncia
('Ortodoncia Convencional (Inicial)', 'Ortodoncia', 1500.00, 90, 'Instalación brackets metálicos'),
('Control Mensual Ortodoncia', 'Ortodoncia', 150.00, 30, 'Ajuste de arcos'),
('Brackets Estéticos (Inicial)', 'Ortodoncia', 2500.00, 90, 'Zafiro o Cerámica'),
('Alineadores Invisibles (Paquete)', 'Ortodoncia', 4000.00, 60, 'Tratamiento completo alineadores'),
('Contención Post-Ortodoncia', 'Ortodoncia', 250.00, 45, 'Placa hawley o fija'),

-- 9. Odontología Estética
('Blanqueamiento Dental (Consultorio)', 'Estética Dental', 400.00, 60, 'Láser o luz LED'),
('Blanqueamiento Casero (Férulas)', 'Estética Dental', 300.00, 30, 'Kit para casa'),
('Carilla de Resina', 'Estética Dental', 350.00, 90, 'Directa en boca'),
('Carilla de Porcelana', 'Estética Dental', 1200.00, 60, 'Laboratorio (Lente de contacto)'),
('Diseño de Sonrisa Digital', 'Estética Dental', 200.00, 60, 'Planificación fotográfica'),
('Gingivoplastía Estética', 'Estética Dental', 300.00, 60, 'Recorntorneo de encías'),

-- 10. Odontopediatría
('Consulta Infantil', 'Odontopediatría', 50.00, 30, 'Adaptación y examen'),
('Profilaxis Infantil', 'Odontopediatría', 80.00, 30, 'Limpieza suave'),
('Aplicación de Flúor Barniz', 'Odontopediatría', 70.00, 30, 'Alta concentración'),
('Restauración Pediátrica', 'Odontopediatría', 100.00, 45, 'Resina o ionómero'),
('Pulpotomía', 'Odontopediatría', 150.00, 45, 'Tratamiento nervio diente leche'),
('Corona de Acero', 'Odontopediatría', 150.00, 45, 'Para molares muy destruidas'),
('Mantenedor de Espacio', 'Odontopediatría', 250.00, 45, 'Para pérdida prematura');
