// JustSnap - Shape Annotation Tool (Rectangle, Circle, Arrow)
// Reference: use_case.md SC-05

import type { AnnotationStyle } from '../../../types';

type ShapeType = 'rectangle' | 'circle' | 'arrow';

interface ShapeToolProps {
  isActive: boolean;
  shapeType: ShapeType;
  style: AnnotationStyle;
  onShapeComplete: (shape: ShapeData) => void;
}

interface ShapeData {
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ShapeTool({ isActive, shapeType, style, onShapeComplete }: ShapeToolProps) {
  // TODO: Implement drag-to-create shape logic
  // TODO: Support rectangle, circle, arrow

  return null;
}
