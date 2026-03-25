-- ============================================================
-- ChoreBoard V1 – Supabase SQL Setup (Frontend-only mode)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 0) Needed extension
create extension if not exists pgcrypto;

-- 1) Households
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Ensure created_by exists if the table was created without it
alter table public.households
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- 2) Parent profiles (maps auth user to household)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  role text not null default 'parent' check (role in ('parent', 'admin')),
  created_at timestamptz default now()
);

-- 3) Child profiles
create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  age_range text check (age_range in ('5-7', '8-10', '11-13', '14+')),
  pin_code text,
  archived_at timestamptz,
  created_at timestamptz default now()
);

-- 4) Chores
create table if not exists public.chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  type text default 'one-time' check (type in ('one-time', 'recurring')),
  frequency text check (frequency in ('daily', 'weekly', 'monthly')),
  due_date timestamptz,
  reward numeric default 0,
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  status text default 'active' check (status in ('active', 'pending_approval', 'approved', 'rejected')),
  assigned_to uuid[],
  rejection_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_profiles_household      on public.profiles(household_id);
create index if not exists idx_child_profiles_household on public.child_profiles(household_id);
create index if not exists idx_chores_household         on public.chores(household_id);
create index if not exists idx_chores_status            on public.chores(status);

-- ============================================================
-- RLS (parent auth only)
-- Note: child-login uses PIN lookup from frontend and needs public read of
-- child id/name/pin. This is MVP-only and not high-security.
-- ============================================================

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.child_profiles enable row level security;
alter table public.chores enable row level security;

drop policy if exists households_select_own on public.households;
create policy households_select_own on public.households
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.household_id = households.id
  )
);

drop policy if exists households_insert_auth on public.households;
create policy households_insert_auth on public.households
for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists profiles_select_own_household on public.profiles;
create policy profiles_select_own_household on public.profiles
for select to authenticated
using (
  id = auth.uid() or
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.household_id = profiles.household_id
  )
);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists child_profiles_read_household on public.child_profiles;
create policy child_profiles_read_household on public.child_profiles
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.household_id = child_profiles.household_id
  )
);

drop policy if exists child_profiles_write_household on public.child_profiles;
create policy child_profiles_write_household on public.child_profiles
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.household_id = child_profiles.household_id
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.household_id = child_profiles.household_id
  )
);

drop policy if exists chores_read_household on public.chores;
create policy chores_read_household on public.chores
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.household_id = chores.household_id
  )
);

drop policy if exists chores_write_household on public.chores;
create policy chores_write_household on public.chores
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.household_id = chores.household_id
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.household_id = chores.household_id
  )
);

-- Temporary policy for child login dropdown + PIN check from frontend.
-- Remove this once you migrate child-login to Edge Functions.
drop policy if exists child_profiles_public_login on public.child_profiles;
create policy child_profiles_public_login on public.child_profiles
for select to anon
using (archived_at is null);
