-- ============================================================
-- ChoreBoard V1 – Supabase SQL Setup
-- Run this in the Supabase SQL Editor (https://app.supabase.com)
-- ============================================================

-- 1. Households
CREATE TABLE IF NOT EXISTS households (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Users (parents)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  household_id  UUID REFERENCES households(id) ON DELETE CASCADE,
  role          TEXT DEFAULT 'parent' CHECK (role IN ('parent', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. Child profiles
CREATE TABLE IF NOT EXISTS child_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  age_range    TEXT CHECK (age_range IN ('5-7', '8-10', '11-13', '14+')),
  pin_hash     TEXT,
  archived_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 4. Chores
CREATE TABLE IF NOT EXISTS chores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id     UUID REFERENCES households(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  type             TEXT DEFAULT 'one-time' CHECK (type IN ('one-time', 'recurring')),
  frequency        TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  due_date         TIMESTAMPTZ,
  reward           NUMERIC DEFAULT 0,
  difficulty       TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status           TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'approved', 'rejected')),
  assigned_to      UUID[],          -- array of child_profile IDs
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email           ON users(email);
CREATE INDEX IF NOT EXISTS idx_child_profiles_hh     ON child_profiles(household_id);
CREATE INDEX IF NOT EXISTS idx_chores_hh             ON chores(household_id);
CREATE INDEX IF NOT EXISTS idx_chores_status         ON chores(status);

-- ── Row Level Security (optional but recommended) ─────────────────────────
-- We use the service-role key server-side, so RLS is bypassed on the API.
-- You can enable RLS later once you move to client-side Supabase auth.
-- ALTER TABLE households     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chores         ENABLE ROW LEVEL SECURITY;
