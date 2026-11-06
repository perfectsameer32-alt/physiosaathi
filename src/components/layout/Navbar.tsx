import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Activity, Menu, X, ArrowRight, User, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LanguageSelector } from '../ui/LanguageSelector';

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, isDemoMode, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getDashboardRoute = () => {
    if (user?.role === 'physiotherapist') return '/therapist';
    return '/dashboard';
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4.25rem',
          gap: '1rem',
        }}
      >
        {/* Brand Logo & Wordmark */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--teal)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <Activity size={22} strokeWidth={2.4} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--navy)',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}
            >
              {t('common.brandName')}
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: 'var(--teal)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {t('common.brandTagline')}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav
          style={{
            display: 'none',
            gap: '1.5rem',
            alignItems: 'center',
          }}
          className="desktop-nav"
        >
          <button
            onClick={() => handleNavClick('product')}
            className="btn-ghost"
            style={{ fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', border: 'none', padding: '0.5rem' }}
          >
            {t('nav.product')}
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className="btn-ghost"
            style={{ fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', border: 'none', padding: '0.5rem' }}
          >
            {t('nav.howItWorks')}
          </button>
          <button
            onClick={() => handleNavClick('features')}
            className="btn-ghost"
            style={{ fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', border: 'none', padding: '0.5rem' }}
          >
            {t('nav.features')}
          </button>
          <button
            onClick={() => handleNavClick('for-physiotherapists')}
            className="btn-ghost"
            style={{ fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', border: 'none', padding: '0.5rem' }}
          >
            {t('nav.forPhysiotherapists')}
          </button>
          <button
            onClick={() => handleNavClick('trust-privacy')}
            className="btn-ghost"
            style={{ fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', border: 'none', padding: '0.5rem' }}
          >
            {t('nav.privacyTrust')}
          </button>
        </nav>

        {/* Right CTA / Session Area */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.75rem',
          }}
          className="desktop-actions"
        >
          {/* Multilingual Selector */}
          <LanguageSelector compact />

          {isDemoMode && (
            <Badge variant="neutral" icon={<ShieldCheck size={13} style={{ color: 'var(--teal)' }} />}>
              {t('common.demoModeActive')}
            </Badge>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(getDashboardRoute())}
                leftIcon={<User size={15} />}
              >
                {user.role === 'physiotherapist' ? t('nav.therapistPortal') : t('nav.patientPortal')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                {t('common.signOut')}
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth/login')}>
                {t('common.signIn')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/auth/login')}
                rightIcon={<ArrowRight size={15} />}
              >
                {t('common.getStarted')}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Actions: Language + Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="mobile-header-actions">
          <div className="mobile-lang">
            <LanguageSelector compact />
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              color: 'var(--navy)',
              cursor: 'pointer',
            }}
            className="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'var(--white)',
            borderBottom: '1px solid var(--border)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
          className="mobile-menu"
        >
          <button
            onClick={() => handleNavClick('product')}
            style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.5rem 0', fontWeight: 500 }}
          >
            {t('nav.product')}
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.5rem 0', fontWeight: 500 }}
          >
            {t('nav.howItWorks')}
          </button>
          <button
            onClick={() => handleNavClick('features')}
            style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.5rem 0', fontWeight: 500 }}
          >
            {t('nav.features')}
          </button>
          <button
            onClick={() => handleNavClick('for-physiotherapists')}
            style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.5rem 0', fontWeight: 500 }}
          >
            {t('nav.forPhysiotherapists')}
          </button>
          <button
            onClick={() => handleNavClick('trust-privacy')}
            style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.5rem 0', fontWeight: 500 }}
          >
            {t('nav.privacyTrust')}
          </button>

          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--divider)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <LanguageSelector />
            {user ? (
              <>
                <Button variant="primary" onClick={() => { setMobileMenuOpen(false); navigate(getDashboardRoute()); }}>
                  {user.role === 'physiotherapist' ? t('nav.therapistPortal') : t('nav.patientPortal')}
                </Button>
                <Button variant="ghost" onClick={() => { setMobileMenuOpen(false); logout(); }}>
                  {t('common.signOut')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => { setMobileMenuOpen(false); navigate('/auth/login'); }}>
                  {t('common.signIn')}
                </Button>
                <Button variant="primary" onClick={() => { setMobileMenuOpen(false); navigate('/auth/login'); }}>
                  {t('common.getStarted')}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .desktop-actions { display: flex !important; }
          .mobile-header-actions { display: none !important; }
          .mobile-menu { display: none !important; }
        }
        @media (max-width: 899px) {
          .desktop-nav { display: none !important; }
          .desktop-actions { display: none !important; }
          .mobile-header-actions { display: flex !important; }
        }
      `}</style>
    </header>
  );
};
