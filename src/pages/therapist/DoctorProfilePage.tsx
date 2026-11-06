/**
 * Doctor Portal — Doctor Profile Page
 * Displays full doctor details with specialty, qualifications, bio, and demo credentials.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDoctorProfile } from '../../lib/doctorService';
import type { DoctorProfile } from '../../types';
import { ArrowLeft, Stethoscope, GraduationCap, Building2, ShieldAlert, BadgeCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';

const DEMO_CREDENTIALS = [
  { name: 'Dr. Arjun Mehta', email: 'arjun.mehta@demo.pysiosaathi', password: 'Demo@1234', role: 'Orthopedic Physiotherapy' },
  { name: 'Dr. Priya Sharma', email: 'priya.sharma@demo.pysiosaathi', password: 'Demo@1234', role: 'Sports Rehabilitation' },
  { name: 'Dr. Rahul Verma', email: 'rahul.verma@demo.pysiosaathi', password: 'Demo@1234', role: 'Musculoskeletal Rehabilitation' },
];

export const DoctorProfilePage: React.FC = () => {
  const { user, isDemoMode } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const doctorId = user?.id || 'demo-doctor-001';

  useEffect(() => {
    getDoctorProfile(doctorId).then(p => {
      setProfile(p);
      setIsLoading(false);
    });
  }, [doctorId]);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Link to="/therapist" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', width: 'fit-content' }}>
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>

      <h1 style={{ fontSize: '1.625rem', margin: 0 }}>Doctor Profile</h1>

      {isDemoMode && (
        <Alert variant="info" title="⚠️ DEMO Profiles — Not Real Medical Professionals">
          The profiles shown are <strong>fictional synthetic doctor accounts</strong> created for hackathon demonstration. No real medical credentials or patient data are involved.
        </Alert>
      )}

      {isLoading ? (
        <Skeleton style={{ height: '240px', borderRadius: 'var(--radius-lg)' }} />
      ) : profile ? (
        <Card style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {/* Avatar */}
            <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', backgroundColor: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.5rem', flexShrink: 0 }}>
              {profile.full_name.split(' ').find(w => w.length > 2)?.[0]?.toUpperCase() || 'D'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.375rem', color: 'var(--navy)' }}>{profile.full_name}</h2>
                {profile.is_demo && <Badge variant="warning" icon={<ShieldAlert size={11} />}>DEMO</Badge>}
              </div>
              <div style={{ fontSize: '0.9375rem', color: 'var(--teal)', fontWeight: 600, marginBottom: '0.35rem' }}>
                {profile.specialty}
              </div>
              {profile.clinic_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <Building2 size={14} /> {profile.clinic_name}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Qualifications */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <GraduationCap size={13} /> Qualifications
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {profile.qualifications.map((q, i) => (
                  <Badge key={i} variant="neutral" icon={<BadgeCheck size={11} />}>{q}</Badge>
                ))}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                  About
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{profile.bio}</div>
              </div>
            )}

            {/* Registration */}
            {profile.registration_number && (
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--card-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Registration Number</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--navy)' }}>{profile.registration_number}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600, marginTop: '0.2rem' }}>
                  ⚠️ DEMO ONLY — This is not a real registration number
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Alert variant="error" title="Profile Not Found">Could not load doctor profile.</Alert>
      )}

      {/* Demo Login Credentials */}
      <Card style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={16} style={{ color: 'var(--warning)' }} />
          Demo Login Credentials
        </h3>
        <Alert variant="info" title="Hackathon Demo Only">
          These are fictional accounts for demonstration. Do not use real patient data. Passwords are generic placeholders — production deployments must use secure auth.
        </Alert>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '1rem' }}>
          {DEMO_CREDENTIALS.map((cred, i) => (
            <div key={i} style={{ padding: '0.875rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--card-bg-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--navy)' }}>{cred.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{cred.role}</div>
                </div>
                <Badge variant="neutral" icon={<Stethoscope size={11} />}>Physiotherapist</Badge>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', marginRight: '0.35rem' }}>Email:</span>
                  <code style={{ backgroundColor: 'var(--border)', padding: '0.1rem 0.35rem', borderRadius: '3px', fontSize: '0.8rem' }}>{cred.email}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', marginRight: '0.35rem' }}>Password:</span>
                  <code style={{ backgroundColor: 'var(--border)', padding: '0.1rem 0.35rem', borderRadius: '3px', fontSize: '0.8rem' }}>{cred.password}</code>
                </div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--divider)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Demo Patients</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <div><code style={{ backgroundColor: 'var(--border)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>aravind.sharma@demo.pysiosaathi</code> · Aravind Sharma (ACL rehab)</div>
              <div><code style={{ backgroundColor: 'var(--border)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>sunita.rao@demo.pysiosaathi</code> · Sunita Rao (Rotator cuff)</div>
              <div><code style={{ backgroundColor: 'var(--border)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>kavitha.menon@demo.pysiosaathi</code> · Kavitha Menon (Hamstring)</div>
              <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '0.25rem' }}>All patient passwords: <code style={{ backgroundColor: 'var(--border)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>Demo@1234</code></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
