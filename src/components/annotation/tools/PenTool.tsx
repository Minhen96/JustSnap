// JustSnap - Pen Annotation Tool
// Reference: use_case.md SC-03

import { Line } from 'react-konva';
import type { AnnotationStyle } from '../../../types';

interface PenToolProps {
  isActive: boolean;
  style: AnnotationStyle;
  onDrawComplete: (points: number[]) => void;
}

export function PenTool({ isActive, style, onDrawComplete }: PenToolProps) {
  // TODO: Implement freehand drawing logic
  // TODO: Track mouse movement
  // TODO: Smooth line rendering

  return null;
}
