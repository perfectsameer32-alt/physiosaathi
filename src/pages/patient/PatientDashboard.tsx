import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { CLINICAL_EXERCISES, INITIAL_MOCK_SESSIONS, INITIAL_MOCK_CHECKINS } from '../../lib/mockData';
import {
  PlayCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  HeartPulse
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const PatientDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const sessions = INITIAL_MOCK_SESSIONS;
  const checkins = INITIAL_MOCK_CHECKINS;
  const totalReps = sessions.reduce((sum, s) => sum + s.completed_reps, 0);
  const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + s.duration_sec, 0) / 60);

  const getExerciseTitle = (id: string, fallback: string) => {
    if (id === 'ex-knee-ext') return t('exercise.seatedKneeExtName');
    if (id === 'ex-shoulder-abd') return t('exercise.shoulderAbdName');
    return fallback;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.35rem' }}>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>
              {t('dashboard.welcome')}, {user?.full_name?.split(' ')[0] || t('common.patient')}
            </h1>
            {isDemoMode && (
              <Badge variant="neutral" icon={<ShieldCheck size={12} style={{ color: 'var(--teal)' }} />}>
                {t('common.demoSandbox')}
              </Badge>
            )}
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            {t('dashboard.condition')}: <strong style={{ color: 'var(--navy)' }}>{user?.condition || 'Post-ACL Reconstruction (Week 6)'}</strong>
            {user?.prescribed_by && <span> • {t('dashboard.prescribedBy')} {user.prescribed_by}</span>}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/exercise/ex-knee-ext')}
          leftIcon={<PlayCircle size={18} />}
        >
          {t('dashboard.startTodayExercise')}
        </Button>
      </div>

      {/* KPI Activity Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase' }}>{t('dashboard.sessionsThisWeek')}</span>
            <Calendar size={18} style={{ color: 'var(--teal)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.1 }}>
            {sessions.length}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {t('dashboard.sessionsTarget')}
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase' }}>{t('dashboard.repsRecorded')}</span>
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.1 }}>
            {totalReps}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {t('dashboard.repsSubtext')}
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase' }}>{t('dashboard.activeDuration')}</span>
            <Clock size={18} style={{ color: 'var(--teal)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.1 }}>
            {totalMinutes} {t('common.minutes')}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {t('dashboard.durationSubtext')}
          </div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase' }}>{t('dashboard.recentPain')}</span>
            <HeartPulse size={18} style={{ color: '#E06A3B' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.1 }}>
            {checkins[0]?.pain_level || 2} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 10</span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {t('dashboard.painSubtext')}
          </div>
        </Card>
      </div>

      {/* Main Grid: Today's Plan & Recent Sessions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
        }}
      >
        {/* Prescribed Exercises */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem' }}>{t('dashboard.todayPlan')}</h3>
            <Badge variant="teal">{t('dashboard.assignedBadge')}</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {CLINICAL_EXERCISES.map((ex) => (
              <div
                key={ex.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--card-bg-subtle)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.9375rem' }}>
                    {getExerciseTitle(ex.id, ex.name)}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {t('common.target')}: 10 {t('common.reps')} • 2 sets • {ex.targetAngleDegrees}° extension
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/exercise/${ex.id}`)}
                  rightIcon={<ArrowRight size={14} />}
                >
                  {t('common.start')}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Session Records */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem' }}>{t('dashboard.recentActivity')}</h3>
            <button
              onClick={() => navigate('/progress')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--teal)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('dashboard.viewFullHistory')} &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sessions.map((sess) => (
              <div
                key={sess.id}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--divider)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--navy)' }}>
                    {getExerciseTitle(sess.exercise_id, sess.exercise_name)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {new Date(sess.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-IN' : i18n.language)} • {Math.round(sess.duration_sec / 60)} {t('common.minutes')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <Badge variant={sess.completed_reps >= sess.target_reps ? 'success' : 'warning'}>
                    {sess.completed_reps} / {sess.target_reps} {t('common.reps')}
                  </Badge>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {t('dashboard.formAdherence')}: {sess.form_score}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
