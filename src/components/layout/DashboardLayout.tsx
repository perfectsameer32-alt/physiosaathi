import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  LayoutDashboard,
  PlayCircle,
  TrendingUp,
  HeartPulse,
  Bot,
  Share2,
  LogOut,
  Menu,
  ShieldCheck,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { LanguageSelector } from '../ui/LanguageSelector';

export const DashboardLayout: React.FC = () => {
  const { t } = useTranslation();
  const { user, isDemoMode, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isTherapist = user?.role === 'physiotherapist';

  const patientNavItems = [
    { name: t('nav.overview'), path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: t('nav.startSession'), path: '/exercise/ex-knee-ext', icon: <PlayCircle size={18} /> },
    { name: t('nav.progressActivity'), path: '/progress', icon: <TrendingUp size={18} /> },
    { name: t('nav.recoveryCheckins'), path: '/checkins', icon: <HeartPulse size={18} /> },
    { name: t('nav.aiAssistant'), path: '/chatbot', icon: <Bot size={18} /> },
    { name: t('nav.sharedReports'), path: '/reports', icon: <Share2 size={18} /> },
  ];

  const therapistNavItems = [
    { name: t('nav.overview'), path: '/therapist', icon: <LayoutDashboard size={18} /> },
    { name: 'Assign Exercise Plan', path: '/therapist/plans/new', icon: <Activity size={18} /> },
    { name: 'My Profile & Demo Credentials', path: '/therapist/profile', icon: <Stethoscope size={18} /> },
  ];

  const navItems = isTherapist ? therapistNavItems : patientNavItems;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getRoleLabel = () => {
    if (user?.role === 'physiotherapist') return t('common.physiotherapist');
    if (user?.role === 'caregiver') return t('common.caregiver');
    return t('common.patient');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--off-white)' }}>
      {/* Sidebar Desktop */}
      <aside
        style={{
          width: '260px',
          backgroundColor: 'var(--white)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
        }}
        className="dashboard-sidebar"
      >
        {/* Brand Header */}
        <div
          style={{
            height: '4.25rem',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            borderBottom: '1px solid var(--divider)',
          }}
        >
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--teal)',
            }}
          >
            <Activity size={18} strokeWidth={2.4} />
          </div>
          <div>
            <Link
              to="/"
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--navy)',
                textDecoration: 'none',
                letterSpacing: '-0.02em',
              }}
            >
              {t('common.brandName')}
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--divider)',
            backgroundColor: 'var(--card-bg-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                backgroundColor: isTherapist ? 'var(--navy)' : 'var(--teal)',
                color: 'var(--white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'var(--navy)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {user?.full_name || 'Active User'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                <Badge
                  variant={isTherapist ? 'neutral' : 'teal'}
                  icon={isTherapist ? <Stethoscope size={11} /> : undefined}
                >
                  {getRoleLabel()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1, overflowY: 'auto' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0 0.75rem 0.5rem',
            }}
          >
            {isTherapist ? t('nav.therapistPortal') : t('nav.patientPortal')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: active ? 'var(--teal-subtle)' : 'transparent',
                    color: active ? 'var(--teal)' : 'var(--text-primary)',
                    fontWeight: active ? 600 : 500,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  {active && <ChevronRight size={14} />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--divider)' }}>
          {isDemoMode && (
            <div style={{ padding: '0 0.5rem 0.75rem' }}>
              <Badge variant="neutral" icon={<ShieldCheck size={12} style={{ color: 'var(--teal)' }} />}>
                {t('common.demoSandbox')}
              </Badge>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <LogOut size={16} />
            <span>{t('common.signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: '4.25rem',
            backgroundColor: 'var(--white)',
            borderBottom: '1px solid var(--border)',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mobile-sidebar-toggle"
              aria-label="Toggle menu"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'var(--navy)',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              <Menu size={22} />
            </button>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)' }}>
              {isTherapist ? t('nav.therapistPortal') : t('nav.patientPortal')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <LanguageSelector compact />
            <Link to="/" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {t('nav.publicSite')}
            </Link>
            <div
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                backgroundColor: 'var(--success)',
              }}
              title="System Connected"
            />
          </div>
        </header>

        {/* Content Viewport */}
        <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .dashboard-sidebar {
            display: ${sidebarOpen ? 'flex' : 'none'} !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            box-shadow: var(--shadow-modal) !important;
          }
          .mobile-sidebar-toggle {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};
