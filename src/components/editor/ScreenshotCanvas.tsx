// JustSnap - Screenshot Canvas Component
// Renders the screenshot with Konva-based annotation layer

import React from 'react';
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

// Helper: Canvas-based image renderer for pixel-perfect display (Copied from StickyWindow)
function CanvasImage({ imagePath, dimensions }: { imagePath: string, dimensions: { width: number, height: number } }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  React.useEffect(() => {
    if (!canvasRef.current || !imagePath) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      // Set canvas to image's natural size (physical pixels)
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image at 1:1 pixel ratio
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0);
    };
    img.src = imagePath;
  }, [imagePath]);
  
  return (
    <canvas 
      ref={canvasRef}
      className="absolute top-0 left-0 select-none pointer-events-none"
      style={{
        // Scale canvas to fit window using CSS (this doesn't affect pixel data)
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        imageRendering: 'pixelated',
        objectFit: 'contain' 
      }}
    />
  );
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
      className="absolute overflow-hidden bg-transparent pointer-events-auto"
      style={{
        left: x,
        top: y,
        width,
        height,
        borderRadius: '0.5rem',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Canvas-based Image Rendering (Matches StickyWindow for pixel-perfect sharpness) */}
      <CanvasImage 
        imagePath={screenshot.imageData}
        dimensions={{ width, height }}
      />

      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
        <CanvasStage
          imageUrl="" // Don't render image inside Konva
          annotations={annotations}
          width={width}
          height={height}
          currentTool={currentTool}
          currentStyle={currentStyle}
          onAddAnnotation={onAddAnnotation}
          onUpdateAnnotation={onUpdateAnnotation}
        />
      </div>
    </div>
  );
}
