import React from 'react';
import { useTranslation } from 'react-i18next';
import { INITIAL_MOCK_SESSIONS, INITIAL_MOCK_CHECKINS } from '../../lib/mockData';
import { HeartPulse } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const ProgressPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const sessions = INITIAL_MOCK_SESSIONS;
  const checkins = INITIAL_MOCK_CHECKINS;

  const getExerciseTitle = (id: string, fallback: string) => {
    if (id === 'ex-knee-ext') return t('exercise.seatedKneeExtName');
    if (id === 'ex-shoulder-abd') return t('exercise.shoulderAbdName');
    return fallback;
  };

  const locale = i18n.language === 'en' ? 'en-IN' : i18n.language;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{t('progress.title')}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('progress.subtitle')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>{t('progress.completionHistory')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: '0.875rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                    {getExerciseTitle(s.exercise_id, s.exercise_name)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(s.created_at).toLocaleDateString(locale)} • {Math.round(s.duration_sec / 60)} {t('common.minutes')}
                  </div>
                  {s.notes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      "{s.notes}"
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge variant={s.completed_reps >= s.target_reps ? 'success' : 'warning'}>
                    {s.completed_reps} / {s.target_reps} {t('common.reps')}
                  </Badge>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {s.form_score}% {t('common.adherence')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>{t('progress.painLogsTitle')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {checkins.map((chk) => (
              <div
                key={chk.id}
                style={{
                  padding: '0.875rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--card-bg-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HeartPulse size={16} style={{ color: chk.pain_level > 3 ? 'var(--warning)' : 'var(--teal)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--navy)' }}>
                      {t('therapist.painRating')}: {chk.pain_level} / 10
                    </span>
                  </div>
                  <Badge variant={chk.stopped_due_to_pain ? 'error' : 'neutral'}>
                    {chk.stopped_due_to_pain ? t('progress.stoppedDueToDiscomfort') : t('progress.sessionCompleted')}
                  </Badge>
                </div>
                {chk.notes && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    {chk.notes}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {t('progress.loggedAt')}: {new Date(chk.created_at).toLocaleString(locale)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
