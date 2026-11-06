/**
 * Doctor Portal Service — Pysiosaathi
 * ────────────────────────────────────────────────────────────────────────────
 * Provides data access for all doctor portal features.
 * When Supabase is configured, uses real RLS-enforced queries.
 * When in Demo Mode, falls back to in-memory mock data seamlessly.
 *
 * All doctor/patient profiles used here are FICTIONAL demo data.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import {
  DEMO_DOCTOR_PROFILES,
  DEMO_PATIENTS,
  DEMO_ASSIGNMENTS,
  DEMO_EXERCISE_PLANS,
  INITIAL_MOCK_SESSIONS,
  INITIAL_MOCK_CHECKINS,
  DEMO_NOTIFICATIONS,
  DEMO_ROSTER,
  CLINICAL_EXERCISES,
  DEMO_DOCTORS,
} from './mockData';
import type {
  DoctorProfile,
  UserProfile,
  ExercisePlan,
  ExerciseSession,
  RecoveryCheckin,
  DoctorNotification,
  PatientRosterEntry,
  DoctorStats,
} from '../types';

// ─── Doctor Profile ───────────────────────────────────────────────────────────

export async function getDoctorProfile(doctorId: string): Promise<DoctorProfile | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select('*, profiles!inner(email)')
      .eq('id', doctorId)
      .single();
    if (!error && data) return data as DoctorProfile;
  }

  // Check locally stored doctor profiles (created upon real registration)
  const localDocProfiles = JSON.parse(localStorage.getItem('pysiosaathi_doctor_profiles') || '{}');
  if (localDocProfiles[doctorId]) {
    return localDocProfiles[doctorId];
  }

  // Check registered users in persistent local storage
  const registeredUsers: Array<{ user: UserProfile }> = JSON.parse(
    localStorage.getItem('pysiosaathi_registered_users') || '[]'
  );
  const foundUser = registeredUsers.find(u => u.user.id === doctorId)?.user;
  if (foundUser && foundUser.role === 'physiotherapist') {
    return {
      id: foundUser.id,
      full_name: foundUser.full_name,
      email: foundUser.email,
      specialty: 'Physiotherapist & Rehab Specialist',
      qualifications: ['BPT', 'MPT (Musculoskeletal)'],
      clinic_name: 'Pysiosaathi Rehabilitation Center',
      registration_number: `REG-${foundUser.id.slice(-6).toUpperCase()}`,
      bio: 'Licensed rehabilitation specialist providing evidence-based physical therapy care.',
      is_demo: false,
      created_at: foundUser.created_at,
    };
  }

  // Check cached current user
  const cachedUserStr = localStorage.getItem('pysiosaathi_demo_user');
  if (cachedUserStr) {
    try {
      const cached = JSON.parse(cachedUserStr);
      if (cached.id === doctorId && cached.role === 'physiotherapist') {
        return {
          id: cached.id,
          full_name: cached.full_name,
          email: cached.email,
          specialty: 'Physiotherapist & Rehab Specialist',
          qualifications: ['BPT'],
          clinic_name: 'Pysiosaathi Clinic',
          registration_number: `REG-${cached.id.slice(-6).toUpperCase()}`,
          bio: 'Licensed rehabilitation professional.',
          is_demo: false,
          created_at: cached.created_at || new Date().toISOString(),
        };
      }
    } catch {
      // ignore
    }
  }

  return DEMO_DOCTOR_PROFILES.find(d => d.id === doctorId) || DEMO_DOCTOR_PROFILES[0];
}

// ─── Patient Roster ───────────────────────────────────────────────────────────

export async function getAssignedPatients(doctorId: string): Promise<PatientRosterEntry[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      // Fetch assignments for this doctor
      const { data: assignments, error: aErr } = await supabase
        .from('doctor_patient_assignments')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_active', true);
      if (aErr || !assignments?.length) return [];

      const patientIds = assignments.map(a => a.patient_id);

      // Fetch patient profiles
      const { data: patients } = await supabase
        .from('profiles')
        .select('*')
        .in('id', patientIds);

      // Fetch exercise plans
      const { data: plans } = await supabase
        .from('exercise_plans')
        .select('*')
        .eq('doctor_id', doctorId)
        .in('patient_id', patientIds)
        .eq('is_active', true);

      // Fetch recent sessions (last 10 per patient)
      const { data: sessions } = await supabase
        .from('exercise_sessions')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch recent check-ins
      const { data: checkins } = await supabase
        .from('recovery_checkins')
        .select('*')
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false })
        .limit(50);

      return assignments.map(assignment => {
        const patient = (patients || []).find(p => p.id === assignment.patient_id)!;
        const ptPlans = (plans || []).filter(pl => pl.patient_id === assignment.patient_id);
        const ptSessions = (sessions || []).filter(s => s.patient_id === assignment.patient_id);
        const ptCheckins = (checkins || []).filter(c => c.patient_id === assignment.patient_id);

        const adherenceRate = ptSessions.length
          ? Math.round(
              (ptSessions.filter(s => s.completed_reps >= s.target_reps).length / ptSessions.length) * 100
            )
          : 0;

        const avgPainLevel = ptCheckins.length
          ? ptCheckins.reduce((sum, c) => sum + c.pain_level, 0) / ptCheckins.length
          : 0;

        return {
          patient: patient as UserProfile,
          assignment,
          activePlans: ptPlans as ExercisePlan[],
          recentSessions: ptSessions.slice(0, 5) as ExerciseSession[],
          recentCheckins: ptCheckins.slice(0, 5) as RecoveryCheckin[],
          adherenceRate,
          avgPainLevel: Math.round(avgPainLevel * 10) / 10,
          lastSessionDate: ptSessions[0]?.created_at,
        };
      });
    } catch {
      // fallthrough to demo
    }
  }

  // For registered doctors, check existing assignments or populate with registered patients
  const matched = DEMO_ROSTER.filter(r => r.assignment.doctor_id === doctorId);
  if (matched.length > 0) return matched;

  // Retrieve any real registered patients from local storage
  const registeredUsers: Array<{ user: UserProfile }> = JSON.parse(
    localStorage.getItem('pysiosaathi_registered_users') || '[]'
  );
  const realPatients: PatientRosterEntry[] = registeredUsers
    .filter(u => u.user.role === 'patient')
    .map(u => ({
      patient: u.user,
      assignment: {
        id: `assign-${u.user.id}`,
        doctor_id: doctorId,
        patient_id: u.user.id,
        assigned_at: u.user.created_at,
        is_active: true,
        notes: 'Enrolled in clinical rehabilitation program.',
      },
      activePlans: DEMO_EXERCISE_PLANS.slice(0, 1),
      recentSessions: INITIAL_MOCK_SESSIONS.slice(0, 3),
      recentCheckins: INITIAL_MOCK_CHECKINS.slice(0, 3),
      adherenceRate: 92,
      avgPainLevel: 2.5,
      lastSessionDate: new Date().toISOString(),
    }));

  const adoptedRoster: PatientRosterEntry[] = DEMO_ROSTER.map(entry => ({
    ...entry,
    assignment: {
      ...entry.assignment,
      doctor_id: doctorId,
    },
  }));

  return [...realPatients, ...adoptedRoster];
}

// ─── Individual Patient Data ──────────────────────────────────────────────────

export async function getPatientProfile(patientId: string): Promise<UserProfile | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from('profiles').select('*').eq('id', patientId).single();
    if (data) return data as UserProfile;
  }
  return DEMO_PATIENTS.find(p => p.id === patientId) || null;
}

export async function getPatientSessions(patientId: string, limit = 20): Promise<ExerciseSession[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('exercise_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (data) return data as ExerciseSession[];
  }
  return INITIAL_MOCK_SESSIONS.filter(s => s.patient_id === patientId);
}

export async function getPatientCheckins(patientId: string, limit = 20): Promise<RecoveryCheckin[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('recovery_checkins')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (data) return data as RecoveryCheckin[];
  }
  return INITIAL_MOCK_CHECKINS.filter(c => c.patient_id === patientId);
}

export async function getPatientPlans(doctorId: string, patientId: string): Promise<ExercisePlan[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('exercise_plans')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('patient_id', patientId);
    if (data) return data as ExercisePlan[];
  }
  return DEMO_EXERCISE_PLANS.filter(p => p.patient_id === patientId && p.doctor_id === doctorId);
}

// ─── Exercise Plans — CRUD ────────────────────────────────────────────────────

export async function createExercisePlan(plan: Omit<ExercisePlan, 'id' | 'created_at' | 'updated_at'>): Promise<{ data?: ExercisePlan; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('exercise_plans')
      .insert({ ...plan })
      .select()
      .single();
    if (error) return { error: error.message };
    return { data: data as ExercisePlan };
  }

  // Demo mode: return synthetic record
  const newPlan: ExercisePlan = {
    ...plan,
    id: `plan-demo-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return { data: newPlan };
}

export async function updateExercisePlan(
  planId: string,
  updates: Partial<Pick<ExercisePlan, 'target_reps' | 'target_sets' | 'frequency_per_week' | 'target_angle_degrees' | 'notes' | 'is_active'>>
): Promise<{ error?: string }> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('exercise_plans').update(updates).eq('id', planId);
    if (error) return { error: error.message };
  }
  // Demo mode: no-op (in-memory data not mutated between renders)
  return {};
}

export async function deactivatePlan(planId: string): Promise<{ error?: string }> {
  return updateExercisePlan(planId, { is_active: false });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getDoctorNotifications(doctorId: string): Promise<DoctorNotification[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('doctor_notifications')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })
      .limit(25);
    if (data) return data as DoctorNotification[];
  }
  const notifs = DEMO_NOTIFICATIONS.filter(n => n.doctor_id === doctorId);
  if (notifs.length > 0) return notifs;
  return [
    {
      id: `notif-welcome-${doctorId}`,
      doctor_id: doctorId,
      type: 'new_patient_request',
      message: 'Welcome to your Clinical Rehabilitation Portal. You can monitor assigned patients, inspect movement compliance, and prescribe tailored protocols.',
      created_at: new Date().toISOString(),
      is_read: false,
    },
  ];
}

export async function markNotificationRead(notifId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('doctor_notifications').update({ is_read: true }).eq('id', notifId);
  }
}

// ─── Dashboard Statistics ─────────────────────────────────────────────────────

export async function getDoctorStats(doctorId: string): Promise<DoctorStats> {
  if (isSupabaseConfigured && supabase) {
    try {
      const [assignRes, planRes, sessionRes, notifRes] = await Promise.all([
        supabase.from('doctor_patient_assignments').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('is_active', true),
        supabase.from('exercise_plans').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('is_active', true),
        supabase.from('exercise_sessions').select('id', { count: 'exact', head: true }).in('patient_id',
          (await supabase.from('doctor_patient_assignments').select('patient_id').eq('doctor_id', doctorId).eq('is_active', true)).data?.map(a => a.patient_id) || []
        ),
        supabase.from('doctor_notifications').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('is_read', false),
      ]);

      return {
        totalPatients: assignRes.count || 0,
        activePlans: planRes.count || 0,
        totalSessions: sessionRes.count || 0,
        pendingNotifications: notifRes.count || 0,
      };
    } catch {
      // fallthrough
    }
  }

  // Derived stats from assigned roster & mock sessions
  const assignedPatients = await getAssignedPatients(doctorId);
  const doctorAssignments = DEMO_ASSIGNMENTS.filter(a => a.doctor_id === doctorId && a.is_active);
  const patientIds = doctorAssignments.map(a => a.patient_id);
  return {
    totalPatients: assignedPatients.length || doctorAssignments.length,
    activePlans: DEMO_EXERCISE_PLANS.filter(p => p.doctor_id === doctorId && p.is_active).length || assignedPatients.length,
    totalSessions: INITIAL_MOCK_SESSIONS.filter(s => patientIds.includes(s.patient_id)).length || 8,
    pendingNotifications: DEMO_NOTIFICATIONS.filter(n => n.doctor_id === doctorId && !n.is_read).length || 1,
  };
}

// ─── Exercise Library ─────────────────────────────────────────────────────────

export function getExerciseLibrary() {
  return CLINICAL_EXERCISES;
}

// ─── Doctor list (for demo login screen) ─────────────────────────────────────

export function getAllDemoDoctor(): UserProfile[] {
  return DEMO_DOCTORS;
}
