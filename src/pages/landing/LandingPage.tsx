import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Activity,
  Volume2,
  Video,
  LayoutDashboard,
  FileText,
  HeartPulse,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Lock,
  Cpu,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ProductPreview } from '../../components/landing/ProductPreview';
import { useAuth } from '../../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginAsDemo, isDemoMode } = useAuth();

  const handleStartDemo = (role: 'patient' | 'physiotherapist') => {
    loginAsDemo(role);
    if (role === 'physiotherapist') {
      navigate('/therapist');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* 1. Hero Section */}
      <section
        id="product"
        style={{
          padding: '4.5rem 0 3.5rem',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F7F9F8 100%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center', marginBottom: '2.75rem' }}>
            <div style={{ display: 'inline-flex', marginBottom: '1.25rem' }}>
              <Badge variant="teal" icon={<Sparkles size={13} />}>
                {t('landing.badge')}
              </Badge>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                fontWeight: 700,
                color: 'var(--navy)',
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                marginBottom: '1.25rem',
              }}
            >
              {t('landing.heroTitle')}
            </h1>

            <p
              style={{
                fontSize: 'clamp(1.0625rem, 2vw, 1.25rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '720px',
                margin: '0 auto 2rem',
              }}
            >
              {t('landing.heroSubtitle')}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/auth/login')}
                rightIcon={<ArrowRight size={18} />}
              >
                {t('common.getStarted')}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('landing.seeHowItWorks')}
              </Button>
            </div>

            {/* Quick Demo Access Bar (Visible only when Demo Mode is active) */}
            {isDemoMode && (
              <div
                style={{
                  marginTop: '1.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  backgroundColor: 'rgba(21, 48, 71, 0.04)',
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <span>{t('landing.instantReview')}</span>
                <button
                  onClick={() => handleStartDemo('patient')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--teal)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  {t('landing.exploreAsPatient')}
                </button>
                <span>•</span>
                <button
                  onClick={() => handleStartDemo('physiotherapist')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--navy)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  {t('landing.exploreAsTherapist')}
                </button>
              </div>
            )}
          </div>

          {/* Interactive Live Product Preview */}
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <ProductPreview />
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                marginTop: '0.875rem',
              }}
            >
              {t('landing.previewNote')}
            </p>
          </div>
        </div>
      </section>

      {/* 2. How It Works Section */}
      <section
        id="how-it-works"
        style={{
          padding: '5rem 0',
          backgroundColor: 'var(--white)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>{t('landing.howItWorksTitle')}</h2>
            <p style={{ fontSize: '1.0625rem' }}>
              {t('landing.howItWorksSubtitle')}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Step 1 */}
            <Card style={{ position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--teal-subtle)',
                  color: 'var(--teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.625rem' }}>
                {t('landing.step1Title')}
              </h3>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                {t('landing.step1Desc')}
              </p>
            </Card>

            {/* Step 2 */}
            <Card style={{ position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--teal-subtle)',
                  color: 'var(--teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.625rem' }}>
                {t('landing.step2Title')}
              </h3>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                {t('landing.step2Desc')}
              </p>
            </Card>

            {/* Step 3 */}
            <Card style={{ position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--teal-subtle)',
                  color: 'var(--teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.625rem' }}>
                {t('landing.step3Title')}
              </h3>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                {t('landing.step3Desc')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. Features Grid */}
      <section
        id="features"
        style={{
          padding: '5rem 0',
          backgroundColor: 'var(--off-white)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3.5rem' }}>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>{t('landing.featuresTitle')}</h2>
            <p style={{ fontSize: '1.0625rem' }}>
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[
              {
                icon: <Camera size={22} style={{ color: 'var(--teal)' }} />,
                title: t('landing.f1Title'),
                desc: t('landing.f1Desc'),
              },
              {
                icon: <Activity size={22} style={{ color: 'var(--teal)' }} />,
                title: t('landing.f2Title'),
                desc: t('landing.f2Desc'),
              },
              {
                icon: <Volume2 size={22} style={{ color: 'var(--teal)' }} />,
                title: t('landing.f3Title'),
                desc: t('landing.f3Desc'),
              },
              {
                icon: <Video size={22} style={{ color: 'var(--teal)' }} />,
                title: t('landing.f4Title'),
                desc: t('landing.f4Desc'),
              },
              {
                icon: <LayoutDashboard size={22} style={{ color: 'var(--teal)' }} />,
                title: t('landing.f5Title'),
                desc: t('landing.f5Desc'),
              },
              {
                icon: <FileText size={22} style={{ color: 'var(--teal)' }} />,
                title: t('landing.f6Title'),
                desc: t('landing.f6Desc'),
              },
              {
                icon: <HeartPulse size={22} style={{ color: 'var(--teal)' }} />,
                title: t('landing.f7Title'),
                desc: t('landing.f7Desc'),
              },
              {
                icon: <Users size={22} style={{ color: 'var(--teal)' }} />,
                title: t('landing.f8Title'),
                desc: t('landing.f8Desc'),
              },
            ].map((feature, idx) => (
              <Card key={idx} style={{ padding: '1.5rem', backgroundColor: 'var(--white)' }}>
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--teal-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  {feature.icon}
                </div>
                <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{feature.title}</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Patient and Physiotherapist Section */}
      <section
        id="for-physiotherapists"
        style={{
          padding: '5rem 0',
          backgroundColor: 'var(--white)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
              alignItems: 'center',
            }}
          >
            <div>
              <Badge variant="neutral" icon={<Users size={13} />}>
                {t('landing.dualBadge')}
              </Badge>
              <h2 style={{ fontSize: '2.25rem', margin: '1rem 0 1rem' }}>
                {t('landing.dualTitle')}
              </h2>
              <p style={{ fontSize: '1.0625rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                {t('landing.dualSubtitle')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle2 size={20} style={{ color: 'var(--teal)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--navy)', fontSize: '0.9375rem' }}>{t('landing.forPatients')}</strong>
                    <p style={{ fontSize: '0.875rem' }}>
                      {t('landing.forPatientsDesc')}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle2 size={20} style={{ color: 'var(--teal)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--navy)', fontSize: '0.9375rem' }}>{t('landing.forTherapists')}</strong>
                    <p style={{ fontSize: '0.875rem' }}>
                      {t('landing.forTherapistsDesc')}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <Button
                  variant="outline"
                  onClick={() => handleStartDemo('physiotherapist')}
                  rightIcon={<ArrowRight size={16} />}
                >
                  {t('landing.launchTherapistPortal')}
                </Button>
              </div>
            </div>

            <Card style={{ backgroundColor: 'var(--off-white)', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('landing.boundariesTitle')}</h3>
              <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                {t('landing.boundariesDesc')}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>•</span>
                  <span>{t('landing.b1')}</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>•</span>
                  <span>{t('landing.b2')}</span>
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>•</span>
                  <span>{t('landing.b3')}</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. Trust and Privacy Section */}
      <section
        id="trust-privacy"
        style={{
          padding: '5rem 0',
          backgroundColor: 'var(--off-white)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>{t('landing.trustTitle')}</h2>
            <p style={{ fontSize: '1.0625rem' }}>
              {t('landing.trustSubtitle')}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <Card style={{ backgroundColor: 'var(--white)' }}>
              <div style={{ color: 'var(--teal)', marginBottom: '1rem' }}>
                <Cpu size={24} />
              </div>
              <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{t('landing.t1Title')}</h4>
              <p style={{ fontSize: '0.875rem' }}>
                {t('landing.t1Desc')}
              </p>
            </Card>

            <Card style={{ backgroundColor: 'var(--white)' }}>
              <div style={{ color: 'var(--teal)', marginBottom: '1rem' }}>
                <Lock size={24} />
              </div>
              <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{t('landing.t2Title')}</h4>
              <p style={{ fontSize: '0.875rem' }}>
                {t('landing.t2Desc')}
              </p>
            </Card>

            <Card style={{ backgroundColor: 'var(--white)' }}>
              <div style={{ color: 'var(--teal)', marginBottom: '1rem' }}>
                <ShieldCheck size={24} />
              </div>
              <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{t('landing.t3Title')}</h4>
              <p style={{ fontSize: '0.875rem' }}>
                {t('landing.t3Desc')}
              </p>
            </Card>

            <Card style={{ backgroundColor: 'var(--white)' }}>
              <div style={{ color: 'var(--teal)', marginBottom: '1rem' }}>
                <AlertCircle size={24} />
              </div>
              <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{t('landing.t4Title')}</h4>
              <p style={{ fontSize: '0.875rem' }}>
                {t('landing.t4Desc')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. Final Call to Action */}
      <section
        style={{
          padding: '5rem 0',
          backgroundColor: 'var(--navy)',
          color: 'var(--white)',
          textAlign: 'center',
        }}
      >
        <div className="container" style={{ maxWidth: '720px' }}>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--white)', marginBottom: '1rem' }}>
            {t('landing.ctaTitle')}
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#A9B8C5', marginBottom: '2.25rem', lineHeight: 1.6 }}>
            {t('landing.ctaSubtitle')}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/auth/login')}
              rightIcon={<ArrowRight size={18} />}
            >
              {t('landing.signUpOrIn')}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleStartDemo('patient')}
            >
              {t('landing.tryInstantDemo')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
