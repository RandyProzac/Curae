-- FINAL FIX: Enable public access for treatment_plans (same as budgets)
-- Run this in Supabase SQL Editor

-- 1. Clean up ALL existing policies on treatment_plans to avoid conflicts
drop policy if exists "Enable read access for authenticated users" on public.treatment_plans;
drop policy if exists "Enable insert for authenticated users" on public.treatment_plans;
drop policy if exists "Enable update for authenticated users" on public.treatment_plans;
drop policy if exists "Enable delete for authenticated users" on public.treatment_plans;
drop policy if exists "Allow Select for Authenticated" on public.treatment_plans;
drop policy if exists "Allow Insert for Authenticated" on public.treatment_plans;
drop policy if exists "Allow Update for Authenticated" on public.treatment_plans;
drop policy if exists "Allow Delete for Authenticated" on public.treatment_plans;
drop policy if exists "Permitir todo a usuarios autenticados" on public.treatment_plans;
drop policy if exists "Public Access" on public.treatment_plans;

-- 2. Create a single PUBLIC policy allowing everything to everyone (Anon + Auth)
create policy "Public Access"
on public.treatment_plans
for all
to public
using (true)
with check (true);

-- 3. Ensure RLS is enabled (or disabled, but enabled with public policy is safer for future)
alter table public.treatment_plans enable row level security;
