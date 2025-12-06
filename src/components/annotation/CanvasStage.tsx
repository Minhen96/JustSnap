// JustSnap - Konva Canvas Stage for Annotations
// Reference: use_case.md lines 64-93 (Screen Capture toolbar)

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Rect, Circle, Arrow, Text } from 'react-konva';
import type Konva from 'konva';
import type { Annotation, AnnotationTool, AnnotationStyle } from '../../types';

interface CanvasStageProps {
  imageUrl: string;
  annotations: Annotation[];
  width: number;
  height: number;
  currentTool: AnnotationTool;
  currentStyle: AnnotationStyle;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
}

export function CanvasStage({
  imageUrl,
  annotations,
  width,
  height,
  currentTool,
  currentStyle,
  onAddAnnotation,
  onUpdateAnnotation
}: CanvasStageProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Expose stage ref to parent via callback
  useEffect(() => {
    if (stageRef.current && onUpdateAnnotation) {
      // Store stage ref for export purposes
      (window as any).__konvaStage = stageRef.current;
    }
  }, [onUpdateAnnotation]);

  // Load the screenshot image
  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [imageUrl]);

  // Handle mouse down - start drawing
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool === 'none' || currentTool === 'select') return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    setIsDrawing(true);

    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      tool: currentTool,
      style: { ...currentStyle },
      x: pos.x,
      y: pos.y,
    };

    // Initialize based on tool type
    if (currentTool === 'pen' || currentTool === 'highlighter') {
      newAnnotation.points = [pos.x, pos.y];
    } else if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'blur') {
      newAnnotation.width = 0;
      newAnnotation.height = 0;
    } else if (currentTool === 'arrow') {
      newAnnotation.points = [pos.x, pos.y, pos.x, pos.y];
    }

    setCurrentAnnotation(newAnnotation);
  };

  // Handle mouse move - continue drawing
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || !currentAnnotation) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Update annotation based on tool type
    if (currentTool === 'pen' || currentTool === 'highlighter') {
      const points = currentAnnotation.points || [];
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [...points, pos.x, pos.y],
      });
    } else if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'blur') {
      const width = pos.x - (currentAnnotation.x || 0);
      const height = pos.y - (currentAnnotation.y || 0);
      setCurrentAnnotation({
        ...currentAnnotation,
        width,
        height,
      });
    } else if (currentTool === 'arrow') {
      const points = currentAnnotation.points || [];
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [points[0], points[1], pos.x, pos.y],
      });
    }
  };

  // Handle mouse up - finish drawing
  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;

    setIsDrawing(false);
    onAddAnnotation(currentAnnotation);
    setCurrentAnnotation(null);
  };

  // Render individual annotation
  const renderAnnotation = (annotation: Annotation) => {
    const { id, tool, style, x = 0, y = 0, width = 0, height = 0, points = [], text = '' } = annotation;
    const { color, strokeWidth, opacity = 1 } = style;

    switch (tool) {
      case 'pen':
        return (
          <Line
            key={id}
            points={points}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );

      case 'highlighter':
        return (
          <Line
            key={id}
            points={points}
            stroke={color}
            strokeWidth={strokeWidth * 3}
            opacity={0.3}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );

      case 'rectangle':
        return (
          <Rect
            key={id}
            x={x}
            y={y}
            width={width}
            height={height}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
        );

      case 'circle':
        return (
          <Circle
            key={id}
            x={x + width / 2}
            y={y + height / 2}
            radius={Math.sqrt(width * width + height * height) / 2}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
        );

      case 'arrow':
        return (
          <Arrow
            key={id}
            points={points}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            pointerLength={10}
            pointerWidth={10}
          />
        );

      case 'blur':
        return (
          <Rect
            key={id}
            x={x}
            y={y}
            width={width}
            height={height}
            fill="rgba(0, 0, 0, 0.5)"
            opacity={opacity}
          />
        );

      case 'text':
        return (
          <Text
            key={id}
            x={x}
            y={y}
            text={text}
            fontSize={20}
            fill={color}
            opacity={opacity}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {/* Background screenshot image */}
        {image && (
          <KonvaImage
            image={image}
            width={width}
            height={height}
          />
        )}

        {/* Render all saved annotations */}
        {annotations.map(renderAnnotation)}

        {/* Render current annotation being drawn */}
        {currentAnnotation && renderAnnotation(currentAnnotation)}
      </Layer>
    </Stage>
  );
}
