/**
 * Doctor Portal — Patient Detail View
 * Shows full clinical picture: profile, exercise plans, session history,
 * pain/fatigue trends, and recovery check-ins for a single patient.
 * ⚠️ DEMO: All patient data is fictional synthetic data.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getPatientProfile,
  getPatientSessions,
  getPatientCheckins,
  getPatientPlans,
  deactivatePlan,
} from '../../lib/doctorService';
import type { UserProfile, ExercisePlan, ExerciseSession, RecoveryCheckin } from '../../types';
import {
  ArrowLeft,
  Activity,
  CheckCircle,
  XCircle,
  HeartPulse,
  ClipboardList,
  ShieldAlert,
  Plus,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';

// ─── Pain Trend Mini Bar ──────────────────────────────────────────────────────
const PainBar: React.FC<{ level: number }> = ({ level }) => {
  const color = level <= 3 ? 'var(--success)' : level <= 6 ? 'var(--warning)' : 'var(--error)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: 'var(--border)' }}>
        <div style={{ width: `${(level / 10) * 100}%`, height: '100%', borderRadius: '3px', backgroundColor: color, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color, minWidth: '1.5rem' }}>{level}/10</span>
    </div>
  );
};

// ─── Session Row ──────────────────────────────────────────────────────────────
const SessionRow: React.FC<{ session: ExerciseSession; checkin?: RecoveryCheckin }> = ({ session, checkin }) => {
  const complete = session.completed_reps >= session.target_reps;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '1rem', alignItems: 'center', padding: '0.875rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--card-bg-subtle)' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{session.exercise_name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
          {new Date(session.created_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          {' · '}{Math.round(session.duration_sec / 60)} min
          {session.notes && <span> · {session.notes}</span>}
        </div>
        {checkin && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Pain: {checkin.pain_level}/10 · Fatigue: {checkin.fatigue_level} · Difficulty: {checkin.exercise_difficulty}
            {checkin.stopped_due_to_pain && <span style={{ color: 'var(--error)', fontWeight: 600 }}> · Stopped (pain)</span>}
          </div>
        )}
      </div>
      <Badge variant={complete ? 'success' : 'warning'}>
        {session.completed_reps}/{session.target_reps} reps
      </Badge>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: session.form_score >= 85 ? 'var(--success)' : session.form_score >= 70 ? 'var(--warning)' : 'var(--error)' }}>
          {session.form_score}%
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Form</div>
      </div>
      {complete
        ? <CheckCircle size={16} style={{ color: 'var(--success)' }} />
        : <XCircle size={16} style={{ color: 'var(--warning)' }} />
      }
    </div>
  );
};

// ─── Plan Card ────────────────────────────────────────────────────────────────
const PlanCard: React.FC<{ plan: ExercisePlan; onDeactivate: (id: string) => void }> = ({ plan, onDeactivate }) => (
  <div style={{ padding: '1rem', border: `1px solid ${plan.is_active ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', backgroundColor: plan.is_active ? 'var(--teal-subtle)' : 'var(--card-bg-subtle)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--navy)' }}>{plan.exercise_name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
          Assigned {new Date(plan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </div>
      </div>
      <Badge variant={plan.is_active ? 'success' : 'neutral'}>{plan.is_active ? 'Active' : 'Inactive'}</Badge>
    </div>
    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
      <span><strong>{plan.target_sets}×{plan.target_reps}</strong> reps/sets</span>
      {plan.target_angle_degrees && <span>Target: <strong>{plan.target_angle_degrees}°</strong></span>}
      <span><strong>{plan.frequency_per_week}×/week</strong></span>
    </div>
    {plan.notes && (
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic', borderTop: '1px solid var(--divider)', paddingTop: '0.4rem' }}>{plan.notes}</div>
    )}
    {plan.is_active && (
      <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
        <Button variant="ghost" onClick={() => onDeactivate(plan.id)} style={{ fontSize: '0.8125rem', padding: '0.25rem 0.75rem' }}>
          Deactivate Plan
        </Button>
      </div>
    )}
  </div>
);

// ─── Patient Detail Page ──────────────────────────────────────────────────────
export const PatientDetailPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();

  const [patient, setPatient] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<ExercisePlan[]>([]);
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [checkins, setCheckins] = useState<RecoveryCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'plans' | 'checkins'>('sessions');
  const [deactivateModalId, setDeactivateModalId] = useState<string | null>(null);

  const doctorId = user?.id || 'demo-doctor-001';

  const load = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    try {
      const [prof, plns, sess, chks] = await Promise.all([
        getPatientProfile(patientId),
        getPatientPlans(doctorId, patientId),
        getPatientSessions(patientId),
        getPatientCheckins(patientId),
      ]);
      setPatient(prof);
      setPlans(plns);
      setSessions(sess);
      setCheckins(chks);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, doctorId]);

  useEffect(() => { load(); }, [load]);

  const handleDeactivate = async (planId: string) => {
    await deactivatePlan(planId);
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, is_active: false } : p));
    setDeactivateModalId(null);
  };

  // Pain trend from recent check-ins
  const avgPain = checkins.length
    ? (checkins.reduce((s, c) => s + c.pain_level, 0) / checkins.length).toFixed(1)
    : '—';

  const adherence = sessions.length
    ? Math.round((sessions.filter(s => s.completed_reps >= s.target_reps).length / sessions.length) * 100)
    : 0;

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Skeleton style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[...Array(3)].map((_, i) => <Skeleton key={i} style={{ height: '90px' }} />)}
      </div>
    </div>
  );

  if (!patient) return (
    <Alert variant="error" title="Patient not found">
      This patient does not exist or is not assigned to your account.
    </Alert>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Back */}
      <Link to="/therapist" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', width: 'fit-content' }}>
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>

      {/* Patient Profile Header */}
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem', flexShrink: 0 }}>
            {patient.full_name[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.375rem', color: 'var(--navy)' }}>{patient.full_name}</h2>
              <Badge variant="teal">Patient</Badge>
              <Badge variant="warning" icon={<ShieldAlert size={11} />}>DEMO</Badge>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              {patient.condition || 'No diagnosis recorded'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {patient.email} · Enrolled {new Date(patient.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <Link to={`/therapist/plans/new?patient=${patientId}`}>
            <Button variant="primary" leftIcon={<Plus size={14} />}>Assign Exercise</Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--divider)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: adherence >= 75 ? 'var(--success)' : 'var(--warning)' }}>{adherence}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overall Adherence</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)' }}>{sessions.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sessions Logged</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: plans.filter(p => p.is_active).length > 0 ? 'var(--teal)' : 'var(--text-muted)' }}>
              {plans.filter(p => p.is_active).length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Plans</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: Number(avgPain) <= 3 ? 'var(--success)' : Number(avgPain) <= 6 ? 'var(--warning)' : 'var(--error)' }}>{avgPain}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Pain (/10)</div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)' }}>
        {([
          { key: 'sessions', label: 'Session History', icon: <Activity size={14} /> },
          { key: 'plans', label: 'Exercise Plans', icon: <ClipboardList size={14} /> },
          { key: 'checkins', label: 'Recovery Check-ins', icon: <HeartPulse size={14} /> },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--teal)' : '2px solid transparent',
              padding: '0.5rem 0.875rem',
              fontWeight: activeTab === tab.key ? 600 : 500,
              fontSize: '0.875rem',
              color: activeTab === tab.key ? 'var(--teal)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              marginBottom: '-1px',
            }}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Session History */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sessions.length === 0 ? (
            <Card style={{ padding: '2rem', textAlign: 'center' }}>
              <Activity size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No sessions recorded yet.</p>
            </Card>
          ) : sessions.map(s => {
            const checkin = checkins.find(c => c.session_id === s.id);
            return <SessionRow key={s.id} session={s} checkin={checkin} />;
          })}
        </div>
      )}

      {/* Exercise Plans */}
      {activeTab === 'plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {plans.length === 0 ? (
            <Card style={{ padding: '2rem', textAlign: 'center' }}>
              <ClipboardList size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No exercise plans assigned. Create a plan to get started.</p>
              <Link to={`/therapist/plans/new?patient=${patientId}`} style={{ marginTop: '0.75rem', display: 'inline-block' }}>
                <Button variant="primary" leftIcon={<Plus size={14} />}>Assign First Plan</Button>
              </Link>
            </Card>
          ) : plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onDeactivate={(id) => setDeactivateModalId(id)} />
          ))}
        </div>
      )}

      {/* Recovery Check-ins */}
      {activeTab === 'checkins' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {checkins.length === 0 ? (
            <Card style={{ padding: '2rem', textAlign: 'center' }}>
              <HeartPulse size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No recovery check-ins recorded yet.</p>
            </Card>
          ) : checkins.map(c => (
            <div key={c.id} style={{ padding: '0.875rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: c.stopped_due_to_pain ? 'rgba(239,68,68,0.04)' : 'var(--card-bg-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {new Date(c.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </div>
                  {c.notes && <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{c.notes}</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <Badge variant={c.fatigue_level === 'low' ? 'success' : c.fatigue_level === 'moderate' ? 'warning' : 'error'}>
                    {c.fatigue_level} fatigue
                  </Badge>
                  {c.stopped_due_to_pain && <Badge variant="error">Stopped (pain)</Badge>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartPulse size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <PainBar level={c.pain_level} />
                </div>
                <Badge variant={c.exercise_difficulty === 'easy' ? 'success' : c.exercise_difficulty === 'moderate' ? 'neutral' : 'warning'}>
                  {c.exercise_difficulty}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deactivate Plan Confirmation */}
      <Modal
        isOpen={!!deactivateModalId}
        onClose={() => setDeactivateModalId(null)}
        title="Deactivate Exercise Plan"
        description="Are you sure you want to deactivate this plan? The patient will no longer see it as an active assignment. You can reassign a new plan at any time."
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="ghost" onClick={() => setDeactivateModalId(null)}>Cancel</Button>
          <Button variant="primary" onClick={() => deactivateModalId && handleDeactivate(deactivateModalId)}>
            Yes, Deactivate
          </Button>
        </div>
      </Modal>
    </div>
  );
};
