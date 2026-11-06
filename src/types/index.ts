export type UserRole = 'patient' | 'physiotherapist' | 'caregiver';

export type SupportedLanguage = 'en' | 'hi' | 'kn' | 'te' | 'bn';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  condition?: string;
  prescribed_by?: string;
  preferred_language?: SupportedLanguage;
  created_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  error: string | null;
}

export type JointStatus = 'good' | 'incorrect' | 'uncertain';

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface ExerciseDefinition {
  id: string;
  code: string;
  name: string;
  category: 'lower_body' | 'upper_body' | 'spine' | 'balance';
  description: string;
  instructions: string[];
  referenceVideoUrl?: string;
  targetJoints: string[];
  targetAngleDegrees: number;
  allowedVarianceDegrees: number;
  minHoldDurationSec: number;
  voiceCues: {
    ready: string;
    start: string;
    peak: string;
    correct: string;
    errorCue: string;
    reposition: string;
  };
}

export interface ExerciseSession {
  id: string;
  patient_id: string;
  exercise_id: string;
  exercise_name: string;
  duration_sec: number;
  completed_reps: number;
  target_reps: number;
  form_score: number; // 0 to 100 percentage of repetitions adhering to criteria
  stopped_early: boolean;
  created_at: string;
  notes?: string;
  plan_id?: string;
}

export interface RecoveryCheckin {
  id: string;
  patient_id: string;
  session_id?: string;
  pain_level: number; // 0 to 10
  fatigue_level: 'low' | 'moderate' | 'high';
  exercise_difficulty: 'easy' | 'moderate' | 'hard';
  stopped_due_to_pain: boolean;
  notes?: string;
  created_at: string;
}

export interface ReportShare {
  id: string;
  patient_id: string;
  recipient_name: string;
  recipient_email: string;
  recipient_role: 'physiotherapist' | 'family' | 'doctor';
  access_level: 'summary_only' | 'full_telemetry';
  share_token: string;
  is_revoked: boolean;
  created_at: string;
  expires_at: string;
}

// ─── Doctor Portal Types ─────────────────────────────────────────────────────

export interface DoctorProfile {
  id: string;
  full_name: string;
  email: string;
  specialty: string;
  qualifications: string[];
  clinic_name?: string;
  registration_number?: string; // fictional demo only
  bio?: string;
  is_demo: boolean;
  created_at: string;
}

export interface DoctorPatientAssignment {
  id: string;
  doctor_id: string;
  patient_id: string;
  assigned_at: string;
  is_active: boolean;
  notes?: string;
}

export interface ExercisePlan {
  id: string;
  doctor_id: string;
  patient_id: string;
  exercise_id: string;
  exercise_name: string;
  target_reps: number;
  target_sets: number;
  target_angle_degrees?: number;
  frequency_per_week: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorNotification {
  id: string;
  doctor_id: string;
  type: 'new_patient_request' | 'session_completed' | 'plan_updated' | 'high_pain_alert';
  message: string;
  patient_id?: string;
  is_read: boolean;
  created_at: string;
}

// Composite: patient summary for doctor's roster view
export interface PatientRosterEntry {
  patient: UserProfile;
  assignment: DoctorPatientAssignment;
  activePlans: ExercisePlan[];
  recentSessions: ExerciseSession[];
  recentCheckins: RecoveryCheckin[];
  adherenceRate: number;   // 0-100
  avgPainLevel: number;    // 0-10
  lastSessionDate?: string;
}

// Doctor portal dashboard statistics
export interface DoctorStats {
  totalPatients: number;
  activePlans: number;
  totalSessions: number;
  pendingNotifications: number;
}
