import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, ShieldCheck, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer
      style={{
        backgroundColor: 'var(--navy-dark)',
        color: '#A9B8C5',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        marginTop: 'auto',
        padding: '4rem 0 2.5rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '3rem',
            paddingBottom: '3rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Brand Info */}
          <div style={{ maxWidth: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--white)',
                }}
              >
                <Activity size={18} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--white)' }}>
                {t('common.brandName')}
              </span>
            </div>
            <p style={{ color: '#8EA1B2', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {t('landing.heroSubtitle')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#168C86' }}>
              <ShieldCheck size={16} />
              <span>{t('landing.t1Title')}</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 style={{ color: 'var(--white)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('nav.product')}
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0 }}>
              <li>
                <a href="#how-it-works" style={{ color: '#A9B8C5', fontSize: '0.875rem' }}>{t('nav.howItWorks')}</a>
              </li>
              <li>
                <a href="#features" style={{ color: '#A9B8C5', fontSize: '0.875rem' }}>{t('nav.features')}</a>
              </li>
              <li>
                <a href="#for-physiotherapists" style={{ color: '#A9B8C5', fontSize: '0.875rem' }}>{t('nav.forPhysiotherapists')}</a>
              </li>
              <li>
                <Link to="/auth/login" style={{ color: '#A9B8C5', fontSize: '0.875rem' }}>{t('landing.tryInstantDemo')}</Link>
              </li>
            </ul>
          </div>

          {/* Clinical & Safety */}
          <div>
            <h4 style={{ color: 'var(--white)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('landing.trustTitle')}
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0 }}>
              <li>
                <a href="#trust-privacy" style={{ color: '#A9B8C5', fontSize: '0.875rem' }}>{t('nav.privacyTrust')}</a>
              </li>
              <li>
                <span style={{ color: '#8EA1B2', fontSize: '0.875rem' }}>{t('landing.t1Title')}</span>
              </li>
              <li>
                <span style={{ color: '#8EA1B2', fontSize: '0.875rem' }}>{t('landing.t3Title')}</span>
              </li>
              <li>
                <span style={{ color: '#8EA1B2', fontSize: '0.875rem' }}>{t('chatbot.emergencyAlertTitle')}</span>
              </li>
            </ul>
          </div>

          {/* Project & Legal */}
          <div>
            <h4 style={{ color: 'var(--white)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('common.brandTagline')}
            </h4>
            <p style={{ color: '#8EA1B2', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              {t('landing.boundariesDesc')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#A9B8C5', fontSize: '0.8125rem' }}>
              <HeartHandshake size={16} style={{ color: 'var(--teal)' }} />
              <span>{t('landing.dualBadge')}</span>
            </div>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div
          style={{
            paddingTop: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div
            style={{
              padding: '0.875rem 1.25rem',
              backgroundColor: 'rgba(21, 48, 71, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              color: '#8EA1B2',
              lineHeight: 1.5,
            }}
          >
            {t('landing.footerNotice')}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8125rem',
              color: '#6F8495',
            }}
          >
            <span>&copy; 2026 {t('common.brandName')}. {t('landing.footerCopyright')}</span>
            <span>Healthcare Engineering Architecture Project</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
