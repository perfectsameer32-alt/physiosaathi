export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type PoseLandmarks = NormalizedLandmark[];

export interface PoseDetectionResult {
  landmarks: PoseLandmarks[];
  worldLandmarks?: PoseLandmarks[];
  timestampMs: number;
}

// MediaPipe 33 Pose Landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

// Kinetic connections between pairs of landmark indices
export const POSE_CONNECTIONS: [number, number][] = [
  // Face & Torso
  [11, 12], // Shoulder to shoulder
  [11, 23], // Left shoulder to left hip
  [12, 24], // Right shoulder to right hip
  [23, 24], // Hip to hip
  
  // Left Arm
  [11, 13], // Left shoulder to elbow
  [13, 15], // Left elbow to wrist
  
  // Right Arm
  [12, 14], // Right shoulder to elbow
  [14, 16], // Right elbow to wrist
  
  // Left Leg
  [23, 25], // Left hip to knee
  [25, 27], // Left knee to ankle
  [27, 29], // Left ankle to heel
  [29, 31], // Left heel to foot index
  [27, 31], // Left ankle to foot index

  // Right Leg
  [24, 26], // Right hip to knee
  [26, 28], // Right knee to ankle
  [28, 30], // Right ankle to heel
  [30, 32], // Right heel to foot index
  [28, 32], // Right ankle to foot index
];

export type CameraErrorType = 
  | 'PERMISSION_DENIED'
  | 'DEVICE_NOT_FOUND'
  | 'DEVICE_IN_USE'
  | 'MODEL_LOAD_FAILED'
  | 'BROWSER_UNSUPPORTED'
  | 'UNKNOWN_ERROR';

export interface CameraState {
  isStreaming: boolean;
  isLoadingModel: boolean;
  modelReady: boolean;
  error: {
    type: CameraErrorType;
    message: string;
    details?: string;
  } | null;
  fps: number;
}
