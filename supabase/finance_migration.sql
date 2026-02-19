-- ============================================
-- CURAE ONLINE - MÓDULO DE FINANZAS Y FLUJO DE CAJA
-- ============================================

-- 1. DROP EXISTING IF NEEDED (Clean Install)
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS inventory_products CASCADE;

-- 2. CREATE TABLES

-- A. CATEGORÍAS DE GASTOS
CREATE TABLE expense_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    icon VARCHAR(50), -- Nombre del icono (Lucide)
    color VARCHAR(7) DEFAULT '#94a3b8',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- B. PRODUCTOS DE INVENTARIO
CREATE TABLE inventory_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'unidad', -- unidad, caja, litro, etc.
    cost DECIMAL(10, 2) DEFAULT 0.00, -- Costo de reposición actual
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5, -- Alerta de stock bajo
    category VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C. COMPRAS (Purchase Orders)
CREATE TABLE purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier VARCHAR(255),
    date DATE DEFAULT CURRENT_DATE,
    total DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pendiente', -- pendiente, pagada, cancelada
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- D. ÍTEMS DE COMPRA
CREATE TABLE purchase_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES inventory_products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E. GASTOS (Expenses - Cash Flow Out)
CREATE TABLE expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(20) DEFAULT 'OPERATIVO', -- OPERATIVO, INVENTARIO
    category VARCHAR(255) NOT NULL, -- Link flexible a nombre de categoría
    supplier VARCHAR(255),
    payment_method VARCHAR(50) DEFAULT 'Efectivo',
    status VARCHAR(50) DEFAULT 'pagado', -- pagado, pendiente
    description VARCHAR(255),
    notes TEXT,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL, -- Link si viene de inventario
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access" ON expense_categories FOR ALL USING (true);
CREATE POLICY "Public Access" ON inventory_products FOR ALL USING (true);
CREATE POLICY "Public Access" ON purchases FOR ALL USING (true);
CREATE POLICY "Public Access" ON purchase_items FOR ALL USING (true);
CREATE POLICY "Public Access" ON expenses FOR ALL USING (true);

-- 4. SEED DATA

-- Categorías
INSERT INTO expense_categories (name, icon, color) VALUES
    ('Alquiler', 'Building', '#3b82f6'),
    ('Servicios Públicos', 'Zap', '#f59e0b'),
    ('Sueldos y Salarios', 'Users', '#10b981'),
    ('Mantenimiento', 'Tool', '#64748b'),
    ('Materiales e Insumos', 'Package', '#8b5cf6'),
    ('Software y Licencias', 'Monitor', '#ec4899'),
    ('Marketing', 'Megaphone', '#ef4444'),
    ('Impuestos', 'FileText', '#f97316'),
    ('Otros', 'MoreHorizontal', '#9ca3af');

-- Insumos Odontológicos (15 items)
INSERT INTO inventory_products (name, sku, unit, cost, stock, min_stock, category) VALUES
    ('Resina Compuesta 3M', 'RES-001', 'jeringa', 180.00, 10, 3, 'Restauración'),
    ('Anestesia Local (Lidocaína)', 'ANE-002', 'caja x 50', 120.00, 5, 2, 'Cirugía'),
    ('Guantes de Látex (M)', 'GUA-003', 'caja x 100', 35.00, 20, 5, 'Bioseguridad'),
    ('Algodón Dental', 'ALG-004', 'rollo', 15.00, 30, 10, 'General'),
    ('Cemento de Ionómero', 'CEM-005', 'kit', 150.00, 4, 1, 'Restauración'),
    ('Brackets Metálicos (Juego)', 'BRA-006', 'juego', 250.00, 8, 2, 'Ortodoncia'),
    ('Arcos de NiTi', 'ARC-007', 'paquete x 10', 80.00, 15, 5, 'Ortodoncia'),
    ('Limas de Endodoncia', 'LIM-008', 'kit', 120.00, 6, 2, 'Endodoncia'),
    ('Hipoclorito de Sodio', 'HIP-009', 'litro', 25.00, 10, 3, 'Endodoncia'),
    ('Baberos Desechables', 'BAB-010', 'paquete x 100', 45.00, 12, 4, 'Bioseguridad'),
    ('Eyectores de Saliva', 'EYE-011', 'paquete x 100', 30.00, 15, 5, 'General'),
    ('Mascarillas Quirúrgicas', 'MAS-012', 'caja x 50', 20.00, 25, 10, 'Bioseguridad'),
    ('Agujas Dentales Cortas', 'AGU-013', 'caja x 100', 50.00, 8, 3, 'Cirugía'),
    ('Pasta para Profilaxis', 'PAS-014', 'pote', 40.00, 5, 2, 'Prevención'),
    ('Flúor Gel', 'FLU-015', 'frasco', 60.00, 4, 2, 'Prevención');

-- Gastos de Ejemplo (Mes Actual)
INSERT INTO expenses (date, amount, type, category, supplier, description, status) VALUES
    (CURRENT_DATE - 25, 3500.00, 'OPERATIVO', 'Alquiler', 'Inmobiliaria Centro', 'Alquiler consultorio Enero', 'pagado'),
    (CURRENT_DATE - 20, 450.00, 'OPERATIVO', 'Servicios Públicos', 'Luz del Sur', 'Recibo de Luz', 'pagado'),
    (CURRENT_DATE - 20, 180.00, 'OPERATIVO', 'Servicios Públicos', 'Movistar', 'Internet Fibra', 'pagado'),
    (CURRENT_DATE - 5, 12000.00, 'OPERATIVO', 'Sueldos y Salarios', 'Planilla', 'Pago de personal técnico y doctores', 'pagado'),
    (CURRENT_DATE - 2, 250.00, 'OPERATIVO', 'Software y Licencias', 'Curae Inc', 'Suscripción Software', 'pagado');
