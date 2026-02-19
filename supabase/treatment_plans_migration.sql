-- Create table for storing treatment plans (Plan de Tratamiento)
create table public.treatment_plans (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  title text not null,
  status text check (status in ('active', 'completed', 'archived', 'draft')) not null default 'draft',
  
  -- Snapshot Data
  odontogram_data jsonb default '{}'::jsonb, -- The state of the teeth/odontogram at this point
  odontogram_image_url text, -- Optional: URL to a generated image of the odontogram
  
  -- Link to Budget (Optional, can be null if no budget yet)
  budget_id uuid references public.budgets(id) on delete set null,
  
  -- Notes (Replaces Bitácora/Evolution/Diagnosis text for this plan)
  notes text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.treatment_plans enable row level security;

create policy "Enable read access for authenticated users" on public.treatment_plans
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.treatment_plans
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.treatment_plans
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.treatment_plans
  for delete using (auth.role() = 'authenticated');

-- Add index for performance
create index idx_treatment_plans_patient on public.treatment_plans(patient_id);
