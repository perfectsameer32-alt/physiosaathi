import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

export const RecoveryCheckinPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [painLevel, setPainLevel] = useState(2);
  const [fatigue, setFatigue] = useState<'low' | 'moderate' | 'high'>('low');
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard'>('moderate');
  const [stoppedDueToPain, setStoppedDueToPain] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{t('checkin.title')}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('checkin.subtitle')}
        </p>
      </div>

      <Card>
        {isSubmitted ? (
          <Alert variant="success" title={t('checkin.checkinSuccess')}>
            {t('checkin.checkinSuccessDesc')}
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Pain Slider (VAS 0-10) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">
                  {t('checkin.painLabel')}
                </label>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    color: painLevel > 5 ? 'var(--error)' : painLevel > 2 ? 'var(--warning)' : 'var(--success)',
                  }}
                >
                  {painLevel} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={painLevel}
                onChange={(e) => setPainLevel(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--teal)', marginTop: '0.5rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>{t('checkin.none')}</span>
                <span>{t('checkin.moderate')}</span>
                <span>{t('checkin.severe')}</span>
              </div>
            </div>

            {/* Fatigue level */}
            <div className="form-group">
              <label className="form-label">{t('checkin.fatigueLabel')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
                {(['low', 'moderate', 'high'] as const).map((lvl) => {
                  const label = lvl === 'low' ? t('checkin.low') : (lvl === 'high' ? t('checkin.high') : t('checkin.moderate'));
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFatigue(lvl)}
                      style={{
                        padding: '0.625rem',
                        borderRadius: 'var(--radius-md)',
                        border: fatigue === lvl ? '2px solid var(--teal)' : '1px solid var(--border)',
                        backgroundColor: fatigue === lvl ? 'var(--teal-subtle)' : 'var(--white)',
                        fontWeight: fatigue === lvl ? 600 : 400,
                        color: fatigue === lvl ? 'var(--teal)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Perceived Difficulty */}
            <div className="form-group">
              <label className="form-label">{t('checkin.difficultyLabel')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
                {(['easy', 'moderate', 'hard'] as const).map((diff) => {
                  const label = diff === 'easy' ? t('checkin.easy') : (diff === 'hard' ? t('checkin.hard') : t('checkin.moderate'));
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      style={{
                        padding: '0.625rem',
                        borderRadius: 'var(--radius-md)',
                        border: difficulty === diff ? '2px solid var(--teal)' : '1px solid var(--border)',
                        backgroundColor: difficulty === diff ? 'var(--teal-subtle)' : 'var(--white)',
                        fontWeight: difficulty === diff ? 600 : 400,
                        color: difficulty === diff ? 'var(--teal)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discomfort stop toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem',
                backgroundColor: 'var(--card-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              <input
                id="stoppedEarly"
                type="checkbox"
                checked={stoppedDueToPain}
                onChange={(e) => setStoppedDueToPain(e.target.checked)}
                style={{ width: '1.125rem', height: '1.125rem', accentColor: 'var(--error)' }}
              />
              <label htmlFor="stoppedEarly" style={{ fontSize: '0.875rem', color: 'var(--navy)', cursor: 'pointer' }}>
                {t('checkin.stoppedEarlyLabel')}
              </label>
            </div>

            {/* Qualitative Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="checkinNotes">
                {t('checkin.notesLabel')}
              </label>
              <textarea
                id="checkinNotes"
                rows={3}
                className="form-textarea"
                placeholder={t('checkin.notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
                {t('common.skip')}
              </Button>
              <Button type="submit" variant="primary" leftIcon={<CheckCircle2 size={16} />}>
                {t('checkin.saveCheckin')}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
