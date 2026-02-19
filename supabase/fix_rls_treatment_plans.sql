-- Fix RLS policies for treatment_plans to ensure authenticated users can save
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies to start fresh
drop policy if exists "Enable read access for authenticated users" on public.treatment_plans;
drop policy if exists "Enable insert for authenticated users" on public.treatment_plans;
drop policy if exists "Enable update for authenticated users" on public.treatment_plans;
drop policy if exists "Enable delete for authenticated users" on public.treatment_plans;

-- 2. Ensure RLS is enabled
alter table public.treatment_plans enable row level security;

-- 3. Create permissive policies for authenticated users
-- Allow selecting any plan if logged in
create policy "Allow Select for Authenticated"
on public.treatment_plans for select
to authenticated
using (true);

-- Allow inserting any plan if logged in
create policy "Allow Insert for Authenticated"
on public.treatment_plans for insert
to authenticated
with check (true);

-- Allow updating any plan if logged in
create policy "Allow Update for Authenticated"
on public.treatment_plans for update
to authenticated
using (true);

-- Allow deleting any plan if logged in
create policy "Allow Delete for Authenticated"
on public.treatment_plans for delete
to authenticated
using (true);
