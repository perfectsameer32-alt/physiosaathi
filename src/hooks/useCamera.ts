import { useState, useRef, useCallback, useEffect } from 'react';
import type { CameraErrorType } from '../types/pose';

interface UseCameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

export const useCamera = (options: UseCameraOptions = {}) => {
  const { width = 1280, height = 720, facingMode = 'user' } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<{ type: CameraErrorType; message: string; details?: string } | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Enumerate video devices
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch {
      // Ignore enumeration error
    }
  }, [selectedDeviceId]);

  // Stop camera tracks explicitly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Start camera stream on explicit user action
  const startCamera = useCallback(async (deviceId?: string) => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError({
        type: 'BROWSER_UNSUPPORTED',
        message: 'Your browser does not support webcam video capture.',
        details: 'Please use a modern browser such as Chrome, Edge, Safari, or Firefox.',
      });
      return false;
    }

    // Stop existing stream if any
    stopCamera();

    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: width },
      height: { ideal: height },
      frameRate: { ideal: 30, max: 30 },
    };

    if (deviceId || selectedDeviceId) {
      videoConstraints.deviceId = { exact: deviceId || selectedDeviceId };
    } else {
      videoConstraints.facingMode = facingMode;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false, // Explicitly no audio stream to protect privacy
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;

        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => resolve()).catch(() => resolve());
          };
        });
      }

      setIsStreaming(true);
      await refreshDevices();
      return true;
    } catch (err: any) {
      setHasPermission(false);
      setIsStreaming(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError({
          type: 'PERMISSION_DENIED',
          message: 'Camera access was denied.',
          details: 'Please click the camera/lock icon in your browser address bar to allow camera access for this session.',
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError({
          type: 'DEVICE_NOT_FOUND',
          message: 'No video camera detected on your system.',
          details: 'Please connect an external webcam or enable your device camera.',
        });
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError({
          type: 'DEVICE_IN_USE',
          message: 'Camera is currently in use by another application.',
          details: 'Please close any other video calling apps (Zoom, Teams, Google Meet) and try again.',
        });
      } else {
        setError({
          type: 'UNKNOWN_ERROR',
          message: 'Unable to start camera stream.',
          details: err.message || 'An unexpected hardware error occurred.',
        });
      }
      return false;
    }
  }, [width, height, facingMode, selectedDeviceId, stopCamera, refreshDevices]);

  // Teardown cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isStreaming,
    hasPermission,
    error,
    startCamera,
    stopCamera,
    availableDevices,
    selectedDeviceId,
    setSelectedDeviceId,
  };
};
