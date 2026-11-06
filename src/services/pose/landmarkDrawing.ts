import type { PoseLandmarks } from '../../types/pose';
import { POSE_CONNECTIONS } from '../../types/pose';
import type { JointStatus } from '../../types';

export interface LandmarkStyleOptions {
  highlightJoints?: Record<number, JointStatus>; // Mapping from landmark index to status
  defaultJointColor?: string;
  defaultBoneColor?: string;
  minConfidence?: number;
  mirrored?: boolean;
}

const STATUS_COLORS: Record<JointStatus, string> = {
  good: '#16804A',     // Healthcare success green
  incorrect: '#C43D3D', // Clinical violation red
  uncertain: '#B7791F', // Occluded or low-confidence amber/yellow
};

export const drawPoseOnCanvas = (
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmarks,
  width: number,
  height: number,
  options: LandmarkStyleOptions = {}
) => {
  const {
    highlightJoints = {},
    defaultJointColor = '#168C86',
    defaultBoneColor = 'rgba(255, 255, 255, 0.45)',
    minConfidence = 0.5,
    mirrored = true,
  } = options;

  ctx.save();

  // If mirrored, flip horizontally so user sees natural mirror perspective
  if (mirrored) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  // 1. Draw Skeletal Kinetic Connections (Bones)
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];

    if (!p1 || !p2) continue;
    if ((p1.visibility ?? 1) < minConfidence || (p2.visibility ?? 1) < minConfidence) continue;

    // Check if either end has a status highlight
    const startStatus = highlightJoints[startIdx];
    const endStatus = highlightJoints[endIdx];

    if (startStatus === 'incorrect' || endStatus === 'incorrect') {
      ctx.strokeStyle = '#C43D3D';
      ctx.lineWidth = 4;
    } else if (startStatus === 'good' && endStatus === 'good') {
      ctx.strokeStyle = '#16804A';
      ctx.lineWidth = 4;
    } else if (startStatus === 'uncertain' || endStatus === 'uncertain') {
      ctx.strokeStyle = '#B7791F';
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = defaultBoneColor;
      ctx.lineWidth = 2.5;
    }

    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  }

  // 2. Draw Anatomical Landmark Nodes (Joints)
  for (let idx = 0; idx < landmarks.length; idx++) {
    const p = landmarks[idx];
    if (!p || (p.visibility ?? 1) < minConfidence) continue;

    const x = p.x * width;
    const y = p.y * height;

    const status = highlightJoints[idx];
    let jointColor = defaultJointColor;
    let radius = 4;

    if (status) {
      jointColor = STATUS_COLORS[status];
      radius = status === 'incorrect' ? 7 : 6;
    }

    // Outer subtle ring for highlighted joints
    if (status) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
      ctx.strokeStyle = jointColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Inner filled joint circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = jointColor;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
};
