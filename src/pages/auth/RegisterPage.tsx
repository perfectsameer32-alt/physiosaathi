import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { Activity, ArrowRight, UserCheck, Stethoscope, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUpWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg(t('auth.passwordLengthError'));
      return;
    }

    setIsLoading(true);
    const res = await signUpWithEmail(email, password, fullName, role);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      if (role === 'physiotherapist') {
        navigate('/therapist');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 4.25rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        backgroundColor: 'var(--off-white)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--navy)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--teal)',
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Activity size={28} strokeWidth={2.4} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>{t('auth.createTitle')}</h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            {t('auth.createSubtitle')}
          </p>
        </div>

        <Card style={{ backgroundColor: 'var(--white)', padding: '2rem', marginBottom: '1.5rem' }}>
          {errorMsg && (
            <div style={{ marginBottom: '1.25rem' }}>
              <Alert variant="error">{errorMsg}</Alert>
            </div>
          )}

          <form onSubmit={handleRegister}>
            {/* Role Selection */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">{t('auth.roleSelectLabel')}</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  marginTop: '0.25rem',
                }}
              >
                {[
                  { id: 'patient', label: t('common.patient'), icon: <UserCheck size={16} /> },
                  { id: 'physiotherapist', label: t('common.physiotherapist'), icon: <Stethoscope size={16} /> },
                  { id: 'caregiver', label: t('common.caregiver'), icon: <Users size={16} /> },
                ].map((r) => {
                  const selected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as UserRole)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        border: selected ? '2px solid var(--teal)' : '1px solid var(--border)',
                        backgroundColor: selected ? 'var(--teal-subtle)' : 'var(--white)',
                        color: selected ? 'var(--teal)' : 'var(--text-primary)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: selected ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {r.icon}
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fullName">
                {t('auth.fullNameLabel')}
              </label>
              <input
                id="fullName"
                type="text"
                className="form-input"
                placeholder="e.g. Aravind Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="regEmail">
                {t('auth.emailLabel')}
              </label>
              <input
                id="regEmail"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="regPassword">
                {t('auth.passwordLabel')}
              </label>
              <input
                id="regPassword"
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <Button
                type="submit"
                variant="primary"
                style={{ width: '100%' }}
                isLoading={isLoading}
                rightIcon={<ArrowRight size={16} />}
              >
                {t('auth.createAccountBtn')}
              </Button>
            </div>
          </form>
        </Card>

        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {t('auth.haveAccount')}{' '}
          <Link to="/auth/login" style={{ fontWeight: 600, color: 'var(--teal)' }}>
            {t('common.signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
};
