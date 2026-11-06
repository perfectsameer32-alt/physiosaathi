import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CLINICAL_EXERCISES } from '../../lib/mockData';
import { CameraView } from '../../components/camera/CameraView';
import type { PoseLandmarks } from '../../types/pose';
import type { JointStatus } from '../../types';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Pause,
  Play
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const ExerciseSessionPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const exercise = CLINICAL_EXERCISES.find((e) => e.id === id) || CLINICAL_EXERCISES[0];

  const [currentLandmarks, setCurrentLandmarks] = useState<PoseLandmarks | null>(null);
  const [highlightJoints, setHighlightJoints] = useState<Record<number, JointStatus>>({
    24: 'good', // Right Hip
    26: 'good', // Right Knee
    28: 'good', // Right Ankle
  });
  const [isPaused, setIsPaused] = useState(false);

  const handleLandmarksDetected = (landmarks: PoseLandmarks | null) => {
    setCurrentLandmarks(landmarks);
    if (!landmarks) return;

    // Check visibility of target exercise landmarks (hip=24, knee=26, ankle=28)
    const hip = landmarks[24];
    const knee = landmarks[26];
    const ankle = landmarks[28];

    const minVis = 0.55;
    const isHipVis = (hip?.visibility ?? 0) >= minVis;
    const isKneeVis = (knee?.visibility ?? 0) >= minVis;
    const isAnkleVis = (ankle?.visibility ?? 0) >= minVis;

    setHighlightJoints({
      24: isHipVis ? 'good' : 'uncertain',
      26: isKneeVis ? 'good' : 'uncertain',
      28: isAnkleVis ? 'good' : 'uncertain',
    });
  };

  const exerciseName = exercise.id === 'ex-knee-ext' ? t('exercise.seatedKneeExtName') : (exercise.id === 'ex-shoulder-abd' ? t('exercise.shoulderAbdName') : exercise.name);
  const exerciseDesc = exercise.id === 'ex-knee-ext' ? t('exercise.seatedKneeExtDesc') : (exercise.id === 'ex-shoulder-abd' ? t('exercise.shoulderAbdDesc') : exercise.description);

  const translatedInstructions = t('exercise.instructions', { returnObjects: true });
  const instructionsList: string[] = Array.isArray(translatedInstructions)
    ? translatedInstructions
    : exercise.instructions;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> {t('common.exit')}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Badge variant="teal" icon={<ShieldCheck size={12} />}>
            {t('camera.localProcessing')}
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            leftIcon={isPaused ? <Play size={14} /> : <Pause size={14} />}
          >
            {isPaused ? t('common.resume') : t('common.pause')}
          </Button>
        </div>
      </div>

      {/* Title & Exercise Info */}
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>{exerciseName}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {exerciseDesc} • {t('common.target')}: {exercise.targetAngleDegrees}° {t('exercise.targetAngle')}
        </p>
      </div>

      {/* Main Vision Interface Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left: Live Camera View with Canvas Skeleton Overlay */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <CameraView
            onLandmarksDetected={handleLandmarksDetected}
            highlightJoints={highlightJoints}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(!isPaused)}
            exerciseTitle={exerciseName}
            exerciseTarget={`${exercise.targetAngleDegrees}° ${t('exercise.targetAngle')}`}
          />

          {/* Joint Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--white)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              fontSize: '0.8125rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{t('camera.jointLegend')}:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
              <span>{t('camera.criteriaMet')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--error)' }} />
              <span>{t('camera.deviation')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
              <span>{t('camera.lowVisibility')}</span>
            </div>
          </div>
        </div>

        {/* Right: Biomechanical Telemetry & Instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Telemetry Inspection Card */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>{t('camera.simulatedTelemetry')}</h3>
              <Badge variant={currentLandmarks ? 'success' : 'neutral'}>
                {currentLandmarks ? t('camera.poseTracked') : t('camera.waitingForView')}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  backgroundColor: 'var(--card-bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{t('camera.targetKineticChain')}:</span>
                <strong style={{ color: 'var(--navy)' }}>Hip &rarr; Knee &rarr; Ankle</strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  backgroundColor: 'var(--card-bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{t('camera.targetROM')}:</span>
                <strong style={{ color: 'var(--navy)' }}>{exercise.targetAngleDegrees}° (&plusmn;15°)</strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  backgroundColor: 'var(--card-bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{t('camera.detectedLandmarks')}:</span>
                <strong style={{ color: 'var(--navy)' }}>
                  {currentLandmarks ? t('camera.pointsDetected') : '0'}
                </strong>
              </div>
            </div>
          </Card>

          {/* Positioning Guide */}
          <Card>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>{t('camera.setupChecklist')}</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {instructionsList.map((inst, idx) => (
                <li key={idx} style={{ display: 'flex', gap: '0.625rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--teal)', flexShrink: 0, marginTop: '2px' }} />
                  <span>{inst}</span>
                </li>
              ))}
            </ul>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', lineHeight: 1.4 }}>
              {t('exercise.unreviewedNotice')}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
