-- ============================================================
-- Migration: Doctor / Physiotherapist Portal
-- Creates doctor profiles, patient assignments, and exercise plans
-- All fictional demo data — not real medical professionals
-- ============================================================

-- 1. Doctor profiles (extends existing profiles table)
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL DEFAULT 'General Physiotherapy',
  qualifications TEXT[] NOT NULL DEFAULT ARRAY['BPT'],
  clinic_name TEXT,
  registration_number TEXT,  -- fictional demo only
  bio TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE doctor_profiles IS 
  'Extended profile data for physiotherapist / doctor users. All demo records are fictional.';

-- 2. Doctor ↔ Patient assignments (many-to-many with metadata)
CREATE TABLE IF NOT EXISTS doctor_patient_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  UNIQUE(doctor_id, patient_id)
);

COMMENT ON TABLE doctor_patient_assignments IS
  'Links demo doctor accounts to demo patient accounts. Enforced by RLS.';

-- 3. Exercise plans (doctor-prescribed rehabilitation protocols)
CREATE TABLE IF NOT EXISTS exercise_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,         -- references CLINICAL_EXERCISES[].id
  exercise_name TEXT NOT NULL,
  target_reps INTEGER NOT NULL DEFAULT 10,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_angle_degrees INTEGER,
  frequency_per_week INTEGER NOT NULL DEFAULT 5,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE exercise_plans IS
  'Doctor-prescribed rehabilitation plans linking to exercise library.';

-- 4. Add doctor_plan_id FK to exercise_sessions (optional, nullable)
ALTER TABLE exercise_sessions
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES exercise_plans(id) ON DELETE SET NULL;

-- 5. Notifications table for doctor portal
CREATE TABLE IF NOT EXISTS doctor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_patient_request', 'session_completed', 'plan_updated', 'high_pain_alert')),
  message TEXT NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_notifications ENABLE ROW LEVEL SECURITY;

-- Doctor can see and edit their own profile
CREATE POLICY "doctor_own_profile" ON doctor_profiles
  FOR ALL USING (auth.uid() = id);

-- Patients can read profiles of their assigned doctors
CREATE POLICY "patient_read_doctor_profile" ON doctor_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctor_patient_assignments dpa
      WHERE dpa.doctor_id = doctor_profiles.id
        AND dpa.patient_id = auth.uid()
        AND dpa.is_active = true
    )
  );

-- Doctor sees their own assignments
CREATE POLICY "doctor_see_assignments" ON doctor_patient_assignments
  FOR SELECT USING (auth.uid() = doctor_id);

-- Patient sees their own assignments
CREATE POLICY "patient_see_assignments" ON doctor_patient_assignments
  FOR SELECT USING (auth.uid() = patient_id);

-- Doctor can manage their assignments
CREATE POLICY "doctor_manage_assignments" ON doctor_patient_assignments
  FOR ALL USING (auth.uid() = doctor_id);

-- Doctor sees plans they created
CREATE POLICY "doctor_see_plans" ON exercise_plans
  FOR SELECT USING (auth.uid() = doctor_id);

-- Patient sees plans assigned to them
CREATE POLICY "patient_see_plans" ON exercise_plans
  FOR SELECT USING (auth.uid() = patient_id);

-- Doctor can insert / update / delete plans they own
CREATE POLICY "doctor_manage_plans" ON exercise_plans
  FOR ALL USING (auth.uid() = doctor_id);

-- Doctor sees their notifications
CREATE POLICY "doctor_notifications_own" ON doctor_notifications
  FOR ALL USING (auth.uid() = doctor_id);

-- ============================================================
-- Trigger: auto-update updated_at on exercise_plans
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS exercise_plans_updated_at ON exercise_plans;
CREATE TRIGGER exercise_plans_updated_at
  BEFORE UPDATE ON exercise_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
