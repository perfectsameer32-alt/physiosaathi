-- ============================================================
-- Pysiosaathi Full Database Schema
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ============================================================

-- 1. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'physiotherapist', 'caregiver')),
  avatar_url TEXT,
  phone TEXT,
  condition TEXT,
  prescribed_by TEXT,
  preferred_language VARCHAR(10) DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'kn', 'te', 'bn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Doctor Profiles (Extended profile data for Physiotherapists)
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL DEFAULT 'Physiotherapist & Rehab Specialist',
  qualifications TEXT[] NOT NULL DEFAULT ARRAY['BPT'],
  clinic_name TEXT DEFAULT 'Pysiosaathi Clinic',
  registration_number TEXT,
  bio TEXT DEFAULT 'Licensed physical therapy specialist.',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Doctor ↔ Patient Assignments
CREATE TABLE IF NOT EXISTS public.doctor_patient_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  UNIQUE(doctor_id, patient_id)
);

-- 4. Exercise Plans
CREATE TABLE IF NOT EXISTS public.exercise_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
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

-- 5. Exercise Sessions
CREATE TABLE IF NOT EXISTS public.exercise_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.exercise_plans(id) ON DELETE SET NULL,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  completed_reps INTEGER NOT NULL DEFAULT 0,
  target_reps INTEGER NOT NULL DEFAULT 10,
  form_score NUMERIC DEFAULT 100,
  stopped_early BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Recovery Check-ins
CREATE TABLE IF NOT EXISTS public.recovery_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.exercise_sessions(id) ON DELETE SET NULL,
  pain_level INTEGER NOT NULL CHECK (pain_level >= 0 AND pain_level <= 10),
  fatigue_level TEXT CHECK (fatigue_level IN ('low', 'moderate', 'high')),
  exercise_difficulty TEXT CHECK (exercise_difficulty IN ('easy', 'moderate', 'hard')),
  stopped_due_to_pain BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Doctor Notifications
CREATE TABLE IF NOT EXISTS public.doctor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_patient_request', 'session_completed', 'plan_updated', 'high_pain_alert')),
  message TEXT NOT NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Automatic User Profile Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'patient')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;

  -- If therapist, also ensure doctor profile exists
  IF (COALESCE(new.raw_user_meta_data->>'role', 'patient') = 'physiotherapist') THEN
    INSERT INTO public.doctor_profiles (id, specialty, qualifications, clinic_name, is_demo)
    VALUES (new.id, 'Physiotherapist & Rehabilitation Specialist', ARRAY['BPT'], 'Pysiosaathi Clinic', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9. Row Level Security (RLS) Enablement & Permissive Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users and service clients to access tables
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Public read doctor profiles" ON public.doctor_profiles FOR SELECT USING (true);
CREATE POLICY "Doctors can manage own profile" ON public.doctor_profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Allow assignments access" ON public.doctor_patient_assignments FOR ALL USING (true);
CREATE POLICY "Allow exercise plans access" ON public.exercise_plans FOR ALL USING (true);
CREATE POLICY "Allow exercise sessions access" ON public.exercise_sessions FOR ALL USING (true);
CREATE POLICY "Allow recovery checkins access" ON public.recovery_checkins FOR ALL USING (true);
CREATE POLICY "Allow doctor notifications access" ON public.doctor_notifications FOR ALL USING (true);

