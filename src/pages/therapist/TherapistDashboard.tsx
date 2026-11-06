/**
 * Therapist / Doctor Portal — Main Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  DEMO MODE: All doctor and patient profiles displayed here are FICTIONAL
 * synthetic accounts created for hackathon demonstration purposes.
 * They are NOT real medical professionals or real patients.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  getDoctorProfile,
  getDoctorStats,
  getAssignedPatients,
  getDoctorNotifications,
  markNotificationRead,
} from '../../lib/doctorService';
import type { DoctorProfile, DoctorStats, PatientRosterEntry, DoctorNotification } from '../../types';
import {
  Stethoscope,
  Users,
  Activity,
  Bell,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  BarChart2,
  Plus,
  Search,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  sublabel?: string;
}> = ({ label, value, icon, color, sublabel }) => (
  <Card style={{ padding: '1.25rem 1.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        {icon}
      </div>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1 }}>{value}</div>
    {sublabel && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{sublabel}</div>}
  </Card>
);

// ─── Notification Item ────────────────────────────────────────────────────────
const NotifItem: React.FC<{ notif: DoctorNotification; onRead: (id: string) => void }> = ({ notif, onRead }) => {
  const icon = notif.type === 'high_pain_alert'
    ? <AlertTriangle size={14} style={{ color: 'var(--error)' }} />
    : notif.type === 'session_completed'
    ? <CheckCircle size={14} style={{ color: 'var(--success)' }} />
    : <Bell size={14} style={{ color: 'var(--teal)' }} />;

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: notif.is_read ? 'transparent' : 'var(--teal-subtle)',
        border: `1px solid ${notif.is_read ? 'var(--border)' : 'var(--teal-border, var(--border))'}`,
        cursor: notif.is_read ? 'default' : 'pointer',
        transition: 'background 0.15s',
      }}
      onClick={() => !notif.is_read && onRead(notif.id)}
    >
      <div style={{ flexShrink: 0, marginTop: '0.1rem' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{notif.message}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          {new Date(notif.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {!notif.is_read && (
        <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--teal)', flexShrink: 0, marginTop: '0.3rem' }} />
      )}
    </div>
  );
};

// ─── Patient Roster Row ───────────────────────────────────────────────────────
const RosterRow: React.FC<{ entry: PatientRosterEntry; searchQuery: string }> = ({ entry, searchQuery }) => {
  const { patient, activePlans, adherenceRate, avgPainLevel, lastSessionDate } = entry;
  if (searchQuery && !patient.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    && !patient.condition?.toLowerCase().includes(searchQuery.toLowerCase())) return null;

  const painColor = avgPainLevel <= 3 ? 'var(--success)' : avgPainLevel <= 6 ? 'var(--warning)' : 'var(--error)';

  return (
    <Link
      to={`/therapist/patient/${patient.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto auto auto',
          gap: '1rem',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--card-bg-subtle)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
        }}
        className="roster-row"
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--navy)' }}>{patient.full_name}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{patient.condition || 'No diagnosis recorded'}</div>
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {activePlans.length} active plan{activePlans.length !== 1 ? 's' : ''}
          {lastSessionDate && (
            <div style={{ marginTop: '0.2rem', color: 'var(--text-muted)' }}>
              Last: {new Date(lastSessionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: adherenceRate >= 75 ? 'var(--success)' : 'var(--warning)' }}>{adherenceRate}%</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Adherence</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: painColor }}>{avgPainLevel.toFixed(1)}</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Avg Pain</div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
      </div>
    </Link>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export const TherapistDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, isDemoMode } = useAuth();

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [roster, setRoster] = useState<PatientRosterEntry[]>([]);
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'roster' | 'notifications'>('roster');

  const doctorId = user?.id || 'demo-doctor-001';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profile, statsData, rosterData, notifData] = await Promise.all([
        getDoctorProfile(doctorId),
        getDoctorStats(doctorId),
        getAssignedPatients(doctorId),
        getDoctorNotifications(doctorId),
      ]);
      setDoctorProfile(profile);
      setStats(statsData);
      setRoster(rosterData);
      setNotifications(notifData);
    } catch (err) {
      console.error('Error loading doctor dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleReadNotif = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── Demo Warning Banner ─────────────────────────────────────────────── */}
      {isDemoMode && (
        <Alert variant="info" title="⚠️ DEMO MODE — Fictional Data">
          All doctors, patients, and session records shown here are <strong>fictional synthetic demo accounts</strong> for hackathon demonstration purposes only. They are NOT real medical professionals or real patients.
        </Alert>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>{t('therapist.title')}</h1>
            <Badge variant="neutral" icon={<Stethoscope size={13} />}>
              {doctorProfile?.specialty || t('therapist.mptLicensed')}
            </Badge>
            {isDemoMode && <Badge variant="warning">DEMO</Badge>}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9375rem' }}>
            {t('therapist.loggedAs')}{' '}
            <strong style={{ color: 'var(--navy)' }}>{user?.full_name || doctorProfile?.full_name || 'Dr. Arjun Mehta'}</strong>
            {doctorProfile?.clinic_name && <span> · {doctorProfile.clinic_name}</span>}
            {doctorProfile?.qualifications?.length && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                {' '}({doctorProfile.qualifications.join(', ')})
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/therapist/patients/new">
            <Button variant="secondary" leftIcon={<Plus size={15} />}>Add Patient</Button>
          </Link>
          <Link to="/therapist/plans/new">
            <Button variant="primary" leftIcon={<ClipboardList size={15} />}>{t('therapist.assignProtocol')}</Button>
          </Link>
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} style={{ height: '110px', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <StatCard label="Total Patients" value={stats?.totalPatients ?? 0} icon={<Users size={16} />} color="var(--navy)" sublabel="Assigned to you" />
          <StatCard label="Active Plans" value={stats?.activePlans ?? 0} icon={<Activity size={16} />} color="var(--teal)" sublabel="Rehabilitation protocols" />
          <StatCard label="Sessions Logged" value={stats?.totalSessions ?? 0} icon={<TrendingUp size={16} />} color="#6366f1" sublabel="Across all patients" />
          <StatCard
            label="Notifications"
            value={unreadCount}
            icon={<Bell size={16} />}
            color={unreadCount > 0 ? 'var(--error)' : '#94a3b8'}
            sublabel={unreadCount > 0 ? 'Require attention' : 'All caught up'}
          />
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {(['roster', 'notifications'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--teal)' : '2px solid transparent',
              padding: '0.625rem 1rem',
              fontWeight: activeTab === tab ? 600 : 500,
              fontSize: '0.9rem',
              color: activeTab === tab ? 'var(--teal)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'color 0.15s',
              marginBottom: '-1px',
            }}
          >
            {tab === 'roster' ? <Users size={15} /> : <Bell size={15} />}
            {tab === 'roster' ? 'Patient Roster' : 'Notifications'}
            {tab === 'notifications' && unreadCount > 0 && (
              <span style={{ background: 'var(--error)', color: '#fff', borderRadius: '999px', fontSize: '0.7rem', padding: '0.1rem 0.4rem', fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Patient Roster Tab ──────────────────────────────────────────────── */}
      {activeTab === 'roster' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search patients or conditions…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...Array(3)].map((_, i) => <Skeleton key={i} style={{ height: '72px', borderRadius: 'var(--radius-md)' }} />)}
            </div>
          ) : roster.length === 0 ? (
            <Card style={{ padding: '2rem', textAlign: 'center' }}>
              <Users size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No patients assigned yet. Add a patient to get started.</p>
            </Card>
          ) : (
            <>
              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: '1rem', padding: '0 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <span>Patient</span>
                <span>Plans / Last Session</span>
                <span>Adherence</span>
                <span>Pain</span>
                <span />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {roster.map(entry => (
                  <RosterRow key={entry.patient.id} entry={entry} searchQuery={searchQuery} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Notifications Tab ───────────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} style={{ height: '64px', borderRadius: 'var(--radius-md)' }} />)
          ) : notifications.length === 0 ? (
            <Card style={{ padding: '2rem', textAlign: 'center' }}>
              <Bell size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No notifications yet.</p>
            </Card>
          ) : (
            notifications.map(n => <NotifItem key={n.id} notif={n} onRead={handleReadNotif} />)
          )}
          {unreadCount > 0 && !isLoading && (
            <button
              onClick={() => notifications.filter(n => !n.is_read).forEach(n => handleReadNotif(n.id))}
              style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', padding: '0.25rem 0' }}
            >
              Mark all as read
            </button>
          )}
        </div>
      )}

      {/* ── Doctor Profile Card ─────────────────────────────────────────────── */}
      {doctorProfile && (
        <Card style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.125rem', flexShrink: 0 }}>
              {doctorProfile.full_name[3]?.toUpperCase() || 'D'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)' }}>{doctorProfile.full_name}</span>
                <Badge variant="neutral">{doctorProfile.specialty}</Badge>
                {doctorProfile.is_demo && <Badge variant="warning" icon={<ShieldAlert size={11} />}>DEMO</Badge>}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {doctorProfile.qualifications.join(' · ')}
                {doctorProfile.clinic_name && <span> · {doctorProfile.clinic_name}</span>}
              </div>
              {doctorProfile.bio && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  {doctorProfile.bio}
                </div>
              )}
              {doctorProfile.registration_number && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Registration: {doctorProfile.registration_number} <span style={{ color: 'var(--warning)', fontWeight: 600 }}>(Demo only — not a real registration)</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/therapist/profile">
                <Button variant="ghost" leftIcon={<BarChart2 size={14} />}>View Full Profile</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* hover effect */}
      <style>{`
        .roster-row:hover { border-color: var(--teal) !important; background: var(--teal-subtle) !important; }
      `}</style>
    </div>
  );
};
