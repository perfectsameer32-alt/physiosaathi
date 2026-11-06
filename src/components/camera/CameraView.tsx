import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCamera } from '../../hooks/useCamera';
import { poseService } from '../../services/pose/poseLandmarkerService';
import { drawPoseOnCanvas } from '../../services/pose/landmarkDrawing';
import { speechService } from '../../services/voice/speechService';
import type { PoseLandmarks } from '../../types/pose';
import type { JointStatus } from '../../types';
import {
  Camera,
  CameraOff,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Video,
  Maximize2,
  Minimize2,
  Pause,
  Play,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface CameraViewProps {
  onLandmarksDetected?: (landmarks: PoseLandmarks | null) => void;
  highlightJoints?: Record<number, JointStatus>;
  mirrored?: boolean;
  isPaused?: boolean;
  onTogglePause?: () => void;
  exerciseTitle?: string;
  exerciseTarget?: string;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onLandmarksDetected,
  highlightJoints = {},
  mirrored = true,
  isPaused = false,
  onTogglePause,
  exerciseTitle,
  exerciseTarget,
}) => {
  const { t, i18n } = useTranslation();
  const {
    videoRef,
    isStreaming,
    error: cameraError,
    startCamera,
    stopCamera,
    availableDevices,
    selectedDeviceId,
    setSelectedDeviceId,
  } = useCamera();

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [fps, setFps] = useState(0);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  // Toggle Full Screen with native API + CSS fallback
  const toggleFullscreen = useCallback(async () => {
    const el = viewportRef.current;
    if (!el) return;

    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch {
        // Fallback CSS modal fullscreen
        setIsFullscreen((prev) => !prev);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } catch {
        // ignore
      }
      setIsFullscreen(false);
    }
  }, []);

  // Listen for native fullscreen changes & Esc key
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement === viewportRef.current ||
          (document as any).webkitFullscreenElement === viewportRef.current
      );
      setIsFullscreen(isFs);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Initialize MediaPipe Pose Landmarker
  const initModel = useCallback(async () => {
    setIsModelLoading(true);
    const ready = await poseService.initialize();
    setIsModelLoading(false);
    if (ready) {
      setModelReady(true);
    }
  }, []);

  // Request camera and load model
  const handleStartCapture = async () => {
    await initModel();
    await startCamera();
    speechService.speak(t('voice.ready'), i18n.language);
  };

  const handleStartSimulation = () => {
    setIsSimulationMode(true);
    speechService.speak(t('voice.ready'), i18n.language);
  };

  // Continuous Detection Loop
  useEffect(() => {
    if (!isStreaming || !modelReady || isPaused) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let isDetecting = false;

    const detectLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState < 2) {
        animFrameIdRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      // Sync canvas dimensions with video intrinsic size
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Run inference if model ready and video playing
        if (modelReady && !isPaused && !isDetecting) {
          isDetecting = true;
          const now = performance.now();
          const result = poseService.detectForVideo(video, now);
          isDetecting = false;

          if (result && result.landmarks && result.landmarks.length > 0) {
            const firstPose = result.landmarks[0];
            onLandmarksDetected?.(firstPose);

            // Compute confidence estimate
            const avgVisibility =
              firstPose.reduce((acc, p) => acc + (p.visibility ?? 1), 0) / firstPose.length;
            setLastConfidence(Math.round(avgVisibility * 100));

            // Render skeleton overlay
            drawPoseOnCanvas(ctx, firstPose, canvas.width, canvas.height, {
              highlightJoints,
              mirrored,
            });
          }
        }
      }

      // Calculate approximate FPS
      frameCount++;
      const now = performance.now();
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      animFrameIdRef.current = requestAnimationFrame(detectLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(detectLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isStreaming, modelReady, isPaused, highlightJoints, mirrored, onLandmarksDetected, videoRef]);

  // Synthetic Biomechanical Simulation Mode for rapid testing
  useEffect(() => {
    if (!isSimulationMode || isPaused) return;

    let angle = 120;
    let step = 3;

    const interval = setInterval(() => {
      angle += step;
      if (angle >= 175) {
        step = -3;
      } else if (angle <= 110) {
        step = 3;
      }

      const rad = (angle * Math.PI) / 180;
      const kneeX = 0.5;
      const kneeY = 0.55;
      const legLength = 0.22;
      const ankleX = kneeX + legLength * Math.sin(rad - Math.PI / 2);
      const ankleY = kneeY + legLength * Math.cos(rad - Math.PI / 2);

      const fakePose: PoseLandmarks = Array(33)
        .fill(null)
        .map(() => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));

      // Map key simulated coordinates
      fakePose[11] = { x: 0.45, y: 0.25, z: 0, visibility: 0.98 };
      fakePose[12] = { x: 0.55, y: 0.25, z: 0, visibility: 0.98 };
      fakePose[23] = { x: 0.48, y: 0.45, z: 0, visibility: 0.98 };
      fakePose[24] = { x: 0.52, y: 0.45, z: 0, visibility: 0.98 };
      fakePose[25] = { x: 0.48, y: 0.65, z: 0, visibility: 0.98 };
      fakePose[26] = { x: kneeX, y: kneeY, z: 0, visibility: 0.98 };
      fakePose[27] = { x: 0.48, y: 0.85, z: 0, visibility: 0.98 };
      fakePose[28] = { x: ankleX, y: ankleY, z: 0, visibility: 0.98 };

      // Draw onto canvas
      const canvas = canvasRef.current;
      if (canvas) {
        if (canvas.width !== 640) {
          canvas.width = 640;
          canvas.height = 480;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Dark background for simulation
          ctx.fillStyle = '#081420';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          drawPoseOnCanvas(ctx, fakePose, canvas.width, canvas.height, {
            highlightJoints,
            mirrored: false,
          });
        }
      }

      setLastConfidence(96);
      setFps(30);
      onLandmarksDetected?.(fakePose);
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulationMode, isPaused, highlightJoints, onLandmarksDetected]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', width: '100%' }}>
      {/* Viewport Frame */}
      <div
        ref={viewportRef}
        style={{
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 0 : undefined,
          left: isFullscreen ? 0 : undefined,
          right: isFullscreen ? 0 : undefined,
          bottom: isFullscreen ? 0 : undefined,
          width: isFullscreen ? '100vw' : '100%',
          height: isFullscreen ? '100vh' : 'auto',
          aspectRatio: isFullscreen ? 'auto' : '16/10',
          backgroundColor: '#071522',
          borderRadius: isFullscreen ? 0 : 'var(--radius-lg)',
          overflow: 'hidden',
          border: isFullscreen ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isFullscreen ? 'none' : 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: isFullscreen ? 999999 : 'auto',
        }}
      >
        {/* Hidden or displayed video element */}
        <video
          ref={videoRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: isFullscreen ? 'contain' : 'cover',
            transform: mirrored ? 'scaleX(-1)' : 'none',
            display: isStreaming && !isSimulationMode ? 'block' : 'none',
          }}
          autoPlay
          playsInline
          muted
        />

        {/* Canvas for Skeleton & Landmark Overlays */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: isFullscreen ? 'contain' : 'cover',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />

        {/* State 1: Camera Not Started (Permission & Positioning Gate) */}
        {!isStreaming && !isSimulationMode && (
          <div
            style={{
              padding: isFullscreen ? '3rem' : '2rem',
              maxWidth: isFullscreen ? '560px' : '460px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              zIndex: 20,
              backgroundColor: 'rgba(14, 34, 51, 0.94)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--white)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                width: '3.75rem',
                height: '3.75rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(22, 140, 134, 0.25)',
                color: 'var(--teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera size={34} />
            </div>

            <div>
              <h3 style={{ color: 'var(--white)', fontSize: '1.35rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                {t('camera.guidanceTitle')}
              </h3>
              <p style={{ color: '#A9B8C5', fontSize: '0.9rem', lineHeight: 1.55 }}>
                {t('camera.guidanceDesc')}
              </p>
            </div>

            {/* Error Display if Camera failed */}
            {cameraError && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'rgba(196, 61, 61, 0.2)',
                  border: '1px solid rgba(196, 61, 61, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  color: '#FFBABA',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                  <AlertTriangle size={14} />
                  <span>{cameraError.message}</span>
                </div>
                <div>{cameraError.details}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="primary"
                onClick={handleStartCapture}
                isLoading={isModelLoading}
                leftIcon={<Video size={16} />}
              >
                {isModelLoading ? t('camera.initializingModel') : t('camera.startSession')}
              </Button>

              <Button
                variant="secondary"
                onClick={handleStartSimulation}
                leftIcon={<Sparkles size={16} />}
              >
                {t('camera.demoSynthetic')}
              </Button>
            </div>

            {/* Device Switcher if multiple webcams */}
            {availableDevices.length > 1 && (
              <div style={{ marginTop: '0.5rem', width: '100%' }}>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    startCamera(e.target.value);
                  }}
                  className="form-select"
                  style={{ backgroundColor: '#153047', color: 'var(--white)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  {availableDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.substring(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Fullscreen Toggle Button in non-streaming preview */}
        {!isStreaming && !isSimulationMode && (
          <button
            onClick={toggleFullscreen}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              backgroundColor: 'rgba(14, 34, 51, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--white)',
              padding: '0.4rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              zIndex: 30,
              transition: 'all 0.15s ease',
            }}
            title={isFullscreen ? t('camera.exitFullscreen') : t('camera.fullscreen')}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? t('camera.exitFullscreen') : t('camera.fullscreen')}</span>
          </button>
        )}

        {/* Top Overlay HUD Bar during active stream OR in Fullscreen */}
        {(isStreaming || isSimulationMode) && (
          <div
            style={{
              position: 'absolute',
              top: isFullscreen ? '1.25rem' : '0.875rem',
              left: isFullscreen ? '1.5rem' : '0.875rem',
              right: isFullscreen ? '1.5rem' : '0.875rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 30,
              pointerEvents: 'none',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            {/* Left HUD indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', pointerEvents: 'auto', flexWrap: 'wrap' }}>
              {isFullscreen && exerciseTitle && (
                <div
                  style={{
                    backgroundColor: 'rgba(10, 25, 38, 0.88)',
                    backdropFilter: 'blur(8px)',
                    padding: '0.4rem 0.9rem',
                    borderRadius: 'var(--radius-full)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>{exerciseTitle}</span>
                  {exerciseTarget && (
                    <span style={{ color: 'var(--teal-light)', fontSize: '0.8125rem', fontWeight: 500 }}>
                      • {exerciseTarget}
                    </span>
                  )}
                </div>
              )}

              <Badge variant="teal" icon={<ShieldCheck size={12} />}>
                {isSimulationMode ? t('camera.simulatedTelemetry') : t('camera.localProcessing')}
              </Badge>

              {lastConfidence !== null && (
                <div
                  style={{
                    backgroundColor: 'rgba(14, 34, 51, 0.8)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    color: lastConfidence > 75 ? '#80E0D8' : '#F8DA93',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    fontWeight: 600,
                  }}
                >
                  {t('camera.tracking')}: {lastConfidence}%
                </div>
              )}

              <div
                style={{
                  backgroundColor: 'rgba(14, 34, 51, 0.8)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  color: '#A9B8C5',
                  fontFamily: 'monospace',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                {fps} {t('camera.fps')}
              </div>
            </div>

            {/* Right HUD: Fullscreen Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', pointerEvents: 'auto' }}>
              <Button
                variant={isFullscreen ? 'primary' : 'secondary'}
                size="sm"
                onClick={toggleFullscreen}
                leftIcon={isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                title={isFullscreen ? t('camera.exitFullscreen') : t('camera.fullscreen')}
                style={
                  isFullscreen
                    ? { backgroundColor: 'var(--teal)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }
                    : { backgroundColor: 'rgba(14, 34, 51, 0.85)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }
                }
              >
                {isFullscreen ? `${t('camera.exitFullscreen')} (Esc)` : t('camera.fullscreen')}
              </Button>
            </div>
          </div>
        )}

        {/* Center Pause notice */}
        {isPaused && (
          <div
            style={{
              position: 'absolute',
              backgroundColor: 'rgba(14, 34, 51, 0.92)',
              padding: '0.85rem 1.75rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--white)',
              zIndex: 35,
              fontWeight: 700,
              fontSize: isFullscreen ? '1.25rem' : '1rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
            }}
          >
            <Pause size={isFullscreen ? 22 : 18} style={{ color: 'var(--warning)' }} />
            <span>{t('camera.paused')}</span>
          </div>
        )}

        {/* Floating Bottom HUD in Fullscreen Mode */}
        {isFullscreen && (isStreaming || isSimulationMode) && (
          <div
            style={{
              position: 'absolute',
              bottom: '1.75rem',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: 'rgba(10, 25, 38, 0.92)',
              backdropFilter: 'blur(12px)',
              padding: '0.65rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
              zIndex: 40,
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#fff', fontWeight: 500 }}>
              <div
                style={{
                  width: '0.6rem',
                  height: '0.6rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)',
                  boxShadow: '0 0 8px var(--success)',
                }}
              />
              <span>{isSimulationMode ? t('camera.runningSynthetic') : t('camera.liveConnected')}</span>
            </div>

            {onTogglePause && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onTogglePause}
                leftIcon={isPaused ? <Play size={14} /> : <Pause size={14} />}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#fff', borderColor: 'transparent' }}
              >
                {isPaused ? t('common.resume') : t('common.pause')}
              </Button>
            )}

            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                stopCamera();
                setIsSimulationMode(false);
              }}
              leftIcon={<CameraOff size={14} />}
            >
              {t('camera.stopFeed')}
            </Button>
          </div>
        )}
      </div>

      {/* Camera Session Controls Footer (When not fullscreen) */}
      {!isFullscreen && (isStreaming || isSimulationMode) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <div
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                backgroundColor: isStreaming || isSimulationMode ? 'var(--success)' : 'var(--error)',
              }}
            />
            <span>{isSimulationMode ? t('camera.runningSynthetic') : t('camera.liveConnected')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleFullscreen}
              leftIcon={<Maximize2 size={14} />}
            >
              {t('camera.fullscreen')}
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                stopCamera();
                setIsSimulationMode(false);
              }}
              leftIcon={<CameraOff size={14} />}
            >
              {t('camera.stopFeed')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
