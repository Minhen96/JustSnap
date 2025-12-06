// JustSnap - Konva Canvas Stage for Annotations
// Reference: use_case.md lines 64-93 (Screen Capture toolbar)

import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import type { Annotation } from '../../types';

interface CanvasStageProps {
  imageUrl: string;
  annotations: Annotation[];
  width: number;
  height: number;
}

export function CanvasStage({ imageUrl, annotations, width, height }: CanvasStageProps) {
  // TODO: Load image for Konva
  // TODO: Render annotation layers
  // TODO: Handle tool interactions

  return (
    <Stage width={width} height={height}>
      <Layer>
        {/* Background image will be rendered here */}
        {/* Annotation shapes will be rendered here */}
      </Layer>
    </Stage>
  );
}
