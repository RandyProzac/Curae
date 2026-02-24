-- Add cop and signature_url to doctors table
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS cop TEXT,
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Create storage bucket for signatures if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for signatures
-- Note: Replace these with your actual policy requirements, here we make it public read and authenticated upload
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'signatures' );

CREATE POLICY "Authenticated users can upload signatures"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'signatures' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can update signatures"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'signatures' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can delete signatures"
ON storage.objects FOR DELETE
USING ( bucket_id = 'signatures' AND auth.role() = 'authenticated' );
