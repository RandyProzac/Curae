-- ============================================
-- INTEGRATIONS TABLE (Para Google Calendar)
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider VARCHAR(50) NOT NULL UNIQUE, 
    access_token TEXT,
    refresh_token TEXT,
    expiry_date BIGINT, 
    status VARCHAR(50) DEFAULT 'disconnected',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users on integrations" ON integrations FOR ALL USING (true);
CREATE POLICY "Allow anon read/write on integrations" ON integrations FOR ALL TO anon USING (true);
