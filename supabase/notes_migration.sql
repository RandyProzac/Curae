-- Create table for storing clinical notes (Bitácora de Evolución)
create table if not exists public.clinical_notes (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  title text,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.clinical_notes enable row level security;

-- Policies (Permissive for now to avoid issues)
create policy "Allow all authenticated access to notes"
  on public.clinical_notes
  for all
  to authenticated
  using (true)
  with check (true);
