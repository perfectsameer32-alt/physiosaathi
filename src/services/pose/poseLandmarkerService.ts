import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { PoseDetectionResult } from '../../types/pose';

class PoseLandmarkerService {
  private landmarker: PoseLandmarker | null = null;
  private isLoading = false;
  private isReady = false;
  private error: string | null = null;

  public async initialize(): Promise<boolean> {
    if (this.landmarker && this.isReady) {
      return true;
    }
    if (this.isLoading) {
      // Wait until loaded
      while (this.isLoading) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return this.isReady;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const wasmPath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
      const modelPath = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

      const vision = await FilesetResolver.forVisionTasks(wasmPath);

      // Attempt with GPU delegate first
      try {
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch {
        // Fallback to CPU delegate if WebGL is unavailable or restricted
        this.landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }

      this.isReady = true;
      this.isLoading = false;
      return true;
    } catch (err: any) {
      this.error = err?.message || 'Failed to initialize MediaPipe Pose Landmarker';
      this.isLoading = false;
      this.isReady = false;
      return false;
    }
  }

  public detectForVideo(video: HTMLVideoElement, timestampMs: number): PoseDetectionResult | null {
    if (!this.landmarker || !this.isReady) {
      return null;
    }

    try {
      if (video.readyState < 2) {
        return null; // Video data not yet ready for extraction
      }

      const result = this.landmarker.detectForVideo(video, timestampMs);
      return {
        landmarks: result.landmarks,
        worldLandmarks: result.worldLandmarks,
        timestampMs,
      };
    } catch {
      return null;
    }
  }

  public close() {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch {
        // ignore
      }
      this.landmarker = null;
    }
    this.isReady = false;
    this.isLoading = false;
  }

  public getStatus() {
    return {
      isLoading: this.isLoading,
      isReady: this.isReady,
      error: this.error,
    };
  }
}

export const poseService = new PoseLandmarkerService();
