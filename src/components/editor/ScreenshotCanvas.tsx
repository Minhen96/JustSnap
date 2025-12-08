// JustSnap - Screenshot Canvas Component
// Renders the screenshot with Konva-based annotation layer

import { CanvasStage } from '../annotation/CanvasStage';
import type { Screenshot, Annotation, AnnotationTool, AnnotationStyle } from '../../types';

interface ScreenshotCanvasProps {
  screenshot: Screenshot;
  annotations: Annotation[];
  currentTool: AnnotationTool;
  currentStyle: AnnotationStyle;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
}

export function ScreenshotCanvas({
  screenshot,
  annotations,
  currentTool,
  currentStyle,
  onAddAnnotation,
  onUpdateAnnotation,
}: ScreenshotCanvasProps) {
  const { x, y, width, height } = screenshot.region;

  return (
    <div
      className="absolute overflow-hidden bg-transparent pointer-events-auto shadow-2xl border border-gray-200"
      style={{
        left: x,
        top: y,
        width,
        height,
        borderRadius: '0.5rem',
      }}
    >
      <CanvasStage
        imageUrl={screenshot.imageData}
        annotations={annotations}
        width={width}
        height={height}
        currentTool={currentTool}
        currentStyle={currentStyle}
        onAddAnnotation={onAddAnnotation}
        onUpdateAnnotation={onUpdateAnnotation}
      />
    </div>
  );
}
