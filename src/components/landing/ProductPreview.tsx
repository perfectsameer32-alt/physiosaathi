import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, Volume2, CheckCircle2, ShieldCheck, Eye, Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const ProductPreview: React.FC = () => {
  const { t } = useTranslation();
  const [repCount, setRepCount] = useState(7);
  const [kneeAngle, setKneeAngle] = useState(165);
  const [isConcentric, setIsConcentric] = useState(true);

  // Subtle interactive animation simulating live joint angle movement in preview
  useEffect(() => {
    const interval = setInterval(() => {
      setKneeAngle((prev) => {
        if (prev >= 170) {
          setIsConcentric(false);
          return 169;
        }
        if (prev <= 100) {
          setIsConcentric(true);
          setRepCount((r) => (r >= 10 ? 1 : r + 1));
          return 105;
        }
        return isConcentric ? prev + 3 : prev - 3;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isConcentric]);

  const jointStatus = kneeAngle > 155 ? 'good' : kneeAngle > 130 ? 'in_progress' : 'starting';

  return (
    <div
      style={{
        backgroundColor: 'var(--navy)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem',
        boxShadow: '0 25px 50px -12px rgba(21, 48, 71, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'var(--white)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Telemetry Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.875rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '0.625rem',
              height: '0.625rem',
              borderRadius: '50%',
              backgroundColor: '#16804A',
              boxShadow: '0 0 8px #16804A',
            }}
          />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--white)' }}>
            {t('exercise.seatedKneeExtName')}
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#8EA1B2',
            }}
          >
            {t('camera.simulatedTelemetry')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Badge variant="teal" icon={<ShieldCheck size={12} />}>
            {t('landing.t1Title')}
          </Badge>
          <span style={{ fontSize: '0.8125rem', color: '#A9B8C5', fontFamily: 'monospace' }}>
            02:18 {t('common.elapsed', 'Elapsed')}
          </span>
        </div>
      </div>

      {/* Side-by-Side Dual Viewport */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Left: Patient Camera & Pose Tracking Wireframe */}
        <div
          style={{
            backgroundColor: '#0D2132',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            aspectRatio: '16/10',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1rem',
          }}
        >
          {/* Top Status Overlays */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'rgba(21, 48, 71, 0.75)',
                backdropFilter: 'blur(4px)',
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                color: '#80E0D8',
                border: '1px solid rgba(22, 140, 134, 0.4)',
              }}
            >
              <Eye size={12} />
              <span>{t('camera.tracking')}: 96%</span>
            </div>

            <div
              style={{
                backgroundColor: jointStatus === 'good' ? 'rgba(22, 128, 74, 0.85)' : 'rgba(183, 121, 31, 0.85)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--white)',
              }}
            >
              {jointStatus === 'good' ? `${t('common.target')} (165°)` : `${t('common.start')}...`}
            </div>
          </div>

          {/* Biomechanical Silhouette & Kinetic Skeleton Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg viewBox="0 0 300 200" style={{ width: '85%', height: '85%' }}>
              <circle cx="120" cy="50" r="14" fill="#1F4566" />
              <line x1="120" y1="64" x2="120" y2="120" stroke="#2C5B82" strokeWidth="4" />
              <line x1="120" y1="120" x2="180" y2="125" stroke="#16804A" strokeWidth="5" />
              
              {(() => {
                const rad = ((180 - kneeAngle) * Math.PI) / 180;
                const ankleX = 180 + 55 * Math.cos(rad);
                const ankleY = 125 + 55 * Math.sin(rad);
                return (
                  <>
                    <line
                      x1="180"
                      y1="125"
                      x2={ankleX}
                      y2={ankleY}
                      stroke={jointStatus === 'good' ? '#16804A' : '#B7791F'}
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <circle cx="120" cy="120" r="5" fill="#168C86" />
                    <circle cx="180" cy="125" r="7" fill={jointStatus === 'good' ? '#16804A' : '#B7791F'} />
                    <circle cx={ankleX} cy={ankleY} r="5" fill="#168C86" />
                    <text x="160" y="110" fill="#E2E8F0" fontSize="11" fontFamily="monospace" fontWeight="600">
                      {kneeAngle}°
                    </text>
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Bottom Feedback Notification */}
          <div
            style={{
              zIndex: 2,
              backgroundColor: 'rgba(14, 34, 51, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: '#D4E2EC',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle2 size={14} style={{ color: '#16804A', flexShrink: 0 }} />
            <span>{t('camera.criteriaMet')}: 160°–180°</span>
          </div>
        </div>

        {/* Right: Clinician Reference Demonstration & Metrics */}
        <div
          style={{
            backgroundColor: '#0D2132',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#A9B8C5', textTransform: 'uppercase' }}>
                {t('dashboard.todayPlan')}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#168C86' }}>Set 1 / 2</span>
            </div>

            {/* Repetition KPI Tile */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem',
                backgroundColor: 'rgba(21, 48, 71, 0.45)',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                marginBottom: '1rem',
              }}
            >
              <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--white)', lineHeight: 1 }}>
                {repCount}
              </span>
              <span style={{ fontSize: '1.125rem', color: '#8EA1B2', fontWeight: 500 }}>
                / 10 {t('common.reps')}
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: '6px',
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                marginBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  width: `${(repCount / 10) * 100}%`,
                  height: '100%',
                  backgroundColor: 'var(--teal)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* Voice Guidance Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.875rem',
                backgroundColor: 'rgba(22, 140, 134, 0.15)',
                border: '1px solid rgba(22, 140, 134, 0.3)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                color: '#A2E3DF',
              }}
            >
              <Volume2 size={16} style={{ color: 'var(--teal)', flexShrink: 0 }} />
              <span>{t('voice.voiceCoach')}: "{t('voice.peak')}"</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              marginTop: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'var(--white)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Pause size={12} /> {t('common.pause')}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#8EA1B2' }}>
              <Sparkles size={14} style={{ color: 'var(--teal)' }} />
              <span>{t('common.adherence')}: 94%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
