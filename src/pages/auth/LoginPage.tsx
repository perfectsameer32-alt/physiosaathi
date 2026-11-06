import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { DEMO_DOCTORS } from '../../lib/mockData';
import { Activity, ArrowRight, UserCheck, Stethoscope, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithEmail, loginAsDemo, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const res = await signInWithEmail(email, password);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      // Route based on authenticated user's role (supports both real registered and demo users)
      const targetRole = res.user?.role;
      if (targetRole === 'physiotherapist') {
        navigate('/therapist');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    loginAsDemo(role);
    if (role === 'physiotherapist') {
      navigate('/therapist');
    } else {
      navigate('/dashboard');
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
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Brand Header */}
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
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>{t('auth.signInTitle')}</h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            {t('auth.signInSubtitle')}
          </p>
        </div>

        {/* Demo Mode Notice Banner */}
        {isDemoMode && (
          <div style={{ marginBottom: '1.25rem' }}>
            <Alert variant="info" title={t('auth.demoAlertTitle')}>
              {t('auth.demoAlertDesc')}
            </Alert>
          </div>
        )}

        {/* Login Card */}
        <Card style={{ backgroundColor: 'var(--white)', padding: '2rem', marginBottom: '1.5rem' }}>
          {errorMsg && (
            <div style={{ marginBottom: '1.25rem' }}>
              <Alert variant="error">{errorMsg}</Alert>
            </div>
          )}

          <form onSubmit={handleSignIn}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                {t('auth.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password">
                  {t('auth.passwordLabel')}
                </label>
                <Link to="/auth/forgot" style={{ fontSize: '0.8125rem', color: 'var(--teal)' }}>
                  {t('auth.forgot')}
                </Link>
              </div>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
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
                {t('auth.signInBtn')}
              </Button>
            </div>
          </form>

          {/* Demonstration Quick-Access Accounts (Visible only when Demo Mode is active) */}
          {isDemoMode && (
            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--divider)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem',
                  textAlign: 'center',
                }}
              >
                {t('auth.demoProfilesTitle')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoLogin('patient')}
                  leftIcon={<UserCheck size={16} style={{ color: 'var(--teal)' }} />}
                  style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>Demo {t('common.patient')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aravind Sharma — ACL Rehab</div>
                  </div>
                </Button>

                {/* Three demo doctor accounts */}
                {DEMO_DOCTORS.map((doc) => (
                  <Button
                    key={doc.id}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => { loginAsDemo('physiotherapist'); navigate('/therapist'); }}
                    leftIcon={<Stethoscope size={16} style={{ color: 'var(--navy)' }} />}
                    style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>{doc.full_name}</span>
                        <Badge variant="warning" style={{ fontSize: '0.6rem', padding: '0.05rem 0.3rem' }}>DEMO</Badge>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doc.email}</div>
                    </div>
                  </Button>
                ))}

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDemoLogin('caregiver')}
                  leftIcon={<Users size={16} style={{ color: '#8855CC' }} />}
                  style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>Demo {t('common.caregiver')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Meera Sharma — Authorized Caregiver</div>
                  </div>
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {t('auth.noAccount')}{' '}
          <Link to="/auth/register" style={{ fontWeight: 600, color: 'var(--teal)' }}>
            {t('auth.registerLink')}
          </Link>
        </div>
      </div>
    </div>
  );
};
