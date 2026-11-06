/**
 * Doctor Portal — Assign / Create Exercise Plan
 * Allows doctor to browse the exercise library and create a new plan for a patient.
 * ⚠️ DEMO: All patient/doctor data is fictional.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DEMO_PATIENTS, CLINICAL_EXERCISES } from '../../lib/mockData';
import { createExercisePlan } from '../../lib/doctorService';
import type { ExerciseDefinition } from '../../types';
import { ArrowLeft, CheckCircle, Dumbbell } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

const categoryColor: Record<string, string> = {
  lower_body: 'var(--teal)',
  upper_body: '#6366f1',
  spine: '#f59e0b',
  balance: '#10b981',
};

const ExerciseCard: React.FC<{
  exercise: ExerciseDefinition;
  selected: boolean;
  onSelect: () => void;
}> = ({ exercise, selected, onSelect }) => (
  <div
    onClick={onSelect}
    style={{
      padding: '1rem',
      borderRadius: 'var(--radius-md)',
      border: selected ? '2px solid var(--teal)' : '1px solid var(--border)',
      backgroundColor: selected ? 'var(--teal-subtle)' : 'var(--card-bg-subtle)',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--navy)' }}>{exercise.name}</div>
      <Badge variant="neutral" style={{ backgroundColor: categoryColor[exercise.category] + '20', color: categoryColor[exercise.category] }}>
        {exercise.category.replace('_', ' ')}
      </Badge>
    </div>
    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
      {exercise.description}
    </div>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
      Target joints: {exercise.targetJoints.join(', ')} · Default angle: {exercise.targetAngleDegrees}°
    </div>
    {selected && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', color: 'var(--teal)', fontWeight: 600, fontSize: '0.8125rem' }}>
        <CheckCircle size={13} /> Selected
      </div>
    )}
  </div>
);

export const AssignPlanPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatient = searchParams.get('patient') || '';

  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatient);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [targetReps, setTargetReps] = useState(10);
  const [targetSets, setTargetSets] = useState(3);
  const [targetAngle, setTargetAngle] = useState(165);
  const [frequencyPerWeek, setFrequencyPerWeek] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doctorId = user?.id || 'demo-doctor-001';

  // Set default angle when exercise changes
  useEffect(() => {
    const ex = CLINICAL_EXERCISES.find(e => e.id === selectedExerciseId);
    if (ex) setTargetAngle(ex.targetAngleDegrees);
  }, [selectedExerciseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedExerciseId) {
      setError('Please select both a patient and an exercise.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const exercise = CLINICAL_EXERCISES.find(ex => ex.id === selectedExerciseId)!;
    const result = await createExercisePlan({
      doctor_id: doctorId,
      patient_id: selectedPatientId,
      exercise_id: selectedExerciseId,
      exercise_name: exercise.name,
      target_reps: targetReps,
      target_sets: targetSets,
      target_angle_degrees: targetAngle,
      frequency_per_week: frequencyPerWeek,
      notes: notes.trim() || undefined,
      is_active: true,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate(selectedPatientId ? `/therapist/patient/${selectedPatientId}` : '/therapist');
      }, 1800);
    }
  };

  const selectedExercise = CLINICAL_EXERCISES.find(e => e.id === selectedExerciseId);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Link to="/therapist" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', width: 'fit-content' }}>
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>

      <div>
        <h1 style={{ fontSize: '1.625rem', margin: '0 0 0.25rem' }}>Assign Exercise Plan</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Select a patient, choose an exercise from the library, and configure the protocol parameters.</p>
      </div>

      {success ? (
        <Alert variant="success" title="Exercise Plan Assigned Successfully!">
          The exercise plan has been saved and the patient will see it in their dashboard. Redirecting…
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && <Alert variant="error" title="Error">{error}</Alert>}

          {/* Step 1: Patient */}
          <Card style={{ padding: '1.25rem 1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: 'var(--navy)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>1</span>
              Select Patient
            </h3>
            <div className="form-group">
              <label className="form-label">Patient</label>
              <select
                className="form-select"
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                required
              >
                <option value="">— Choose a patient —</option>
                {DEMO_PATIENTS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} — {p.condition || 'No diagnosis'}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Step 2: Exercise Library */}
          <Card style={{ padding: '1.25rem 1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: 'var(--navy)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>2</span>
              Choose Exercise
              <Badge variant="neutral">{CLINICAL_EXERCISES.length} exercises available</Badge>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {CLINICAL_EXERCISES.map(ex => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  selected={selectedExerciseId === ex.id}
                  onSelect={() => setSelectedExerciseId(ex.id)}
                />
              ))}
            </div>
          </Card>

          {/* Step 3: Protocol Parameters */}
          {selectedExercise && (
            <Card style={{ padding: '1.25rem 1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: 'var(--navy)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>3</span>
                Configure Protocol
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>— {selectedExercise.name}</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Repetitions per set</label>
                  <input type="number" min="1" max="50" className="form-input" value={targetReps} onChange={e => setTargetReps(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Sets</label>
                  <input type="number" min="1" max="10" className="form-input" value={targetSets} onChange={e => setTargetSets(Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Target angle (°)</label>
                  <input type="number" min="30" max="180" className="form-input" value={targetAngle} onChange={e => setTargetAngle(Number(e.target.value))} required />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default: {selectedExercise.targetAngleDegrees}° ± {selectedExercise.allowedVarianceDegrees}°</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Frequency (days/week)</label>
                  <input type="number" min="1" max="7" className="form-input" value={frequencyPerWeek} onChange={e => setFrequencyPerWeek(Number(e.target.value))} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Notes (optional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Halt if pain exceeds 4/10. Aim for full terminal extension by Week 8."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </Card>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button type="button" variant="ghost" onClick={() => navigate('/therapist')}>Cancel</Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !selectedPatientId || !selectedExerciseId}
              leftIcon={<Dumbbell size={15} />}
            >
              {isSubmitting ? 'Saving Plan…' : 'Assign Exercise Plan'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
