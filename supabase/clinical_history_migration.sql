-- Create table for storing odontogram history/snapshots
create table public.odontogram_snapshots (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  type text check (type in ('INICIAL', 'EVOLUTIVO', 'ARCHIVADO')) not null default 'EVOLUTIVO',
  data jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Enable RLS for odontogram_snapshots
alter table public.odontogram_snapshots enable row level security;

create policy "Enable read access for authenticated users" on public.odontogram_snapshots
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.odontogram_snapshots
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.odontogram_snapshots
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.odontogram_snapshots
  for delete using (auth.role() = 'authenticated');


-- Create table for storing patient files (Radiographies, 3D Scans, etc.)
create table public.patient_files (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  category text check (category in ('RADIOGRAFIA', 'SCAN_3D', 'FOTO_CLINICA', 'DOCUMENTO', 'OTROS')) not null default 'OTROS',
  name text not null,
  url text not null,
  size_bytes bigint,
  content_type text,
  metadata jsonb default '{}'::jsonb,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  uploaded_by uuid references auth.users(id)
);

-- Enable RLS for patient_files
alter table public.patient_files enable row level security;

create policy "Enable read access for authenticated users" on public.patient_files
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.patient_files
  for insert with check (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.patient_files
  for delete using (auth.role() = 'authenticated');


-- Storage Bucket Policies (Assuming bucket 'clinical-files' is created manually or via dashboard)
-- We insert storage objects via API, so we define policies for storage.objects
-- Note: Creating buckets via SQL is possible but often restricted. We'll add policies assuming bucket exists.

-- Allow authenticated uploads to 'clinical-files'
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'clinical-files' );

-- Allow authenticated reads from 'clinical-files'
create policy "Allow authenticated reads"
on storage.objects for select
to authenticated
using ( bucket_id = 'clinical-files' );

-- Allow authenticated deletes from 'clinical-files'
create policy "Allow authenticated deletes"
on storage.objects for delete
to authenticated
using ( bucket_id = 'clinical-files' );
