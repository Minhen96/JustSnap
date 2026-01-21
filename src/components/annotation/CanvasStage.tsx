// JustSnap - Konva Canvas Stage for Annotations
// Reference: use_case.md lines 64-93 (Screen Capture toolbar)

import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Rect, Ellipse, Arrow, Text } from 'react-konva';
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
  onTextEditingChange?: (isEditing: boolean) => void;
}

export function CanvasStage({
  imageUrl,
  annotations,
  width,
  height,
  currentTool,
  currentStyle,
  onAddAnnotation,
  onTextEditingChange
}: CanvasStageProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Expose stage ref to parent via callback
  useEffect(() => {
    if (stageRef.current) {
      // Store stage ref for export purposes
      (window as any).__konvaStage = stageRef.current;
    }

    // Cleanup on unmount
    return () => {
      (window as any).__konvaStage = undefined;
    };
  }, []);

  // Load the screenshot image
  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
    };

    // Cleanup on unmount or when imageUrl changes
    return () => {
      img.onload = null;
      img.onerror = null;
      // Clear src to help garbage collection
      img.src = '';
    };
  }, [imageUrl]);

  // Focus text input when editing
  useEffect(() => {
    if (editingTextId && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [editingTextId]);

  // Debug logging for text input state
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[Text Input State]', {
        editingTextId,
        textPosition,
        textInput,
        shouldShow: !!(editingTextId && textPosition)
      });
    }
  }, [editingTextId, textPosition, textInput]);

  // Global keyboard listener for text tool
  useEffect(() => {
    if (!editingTextId || currentTool !== 'text') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (import.meta.env.DEV) {
        console.log('[Global Keyboard] Key:', e.key);
      }

      // Prevent this event from reaching parent shortcuts
      e.stopPropagation();
      
      if (e.key === 'Enter') {
        e.preventDefault();
        handleTextSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleTextCancel();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setTextInput(prev => prev.slice(0, -1));
      } else if (e.key.length === 1) {
        // Single character key (letter, number, symbol)
        e.preventDefault();
        setTextInput(prev => prev + e.key);
      }
    };

    // Use capture phase to intercept before parent handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [editingTextId, currentTool, textInput]);

  // Auto-commit text when switching tools
  useEffect(() => {
    // If tool changed away from text and there's text being edited
    if (currentTool !== 'text' && editingTextId) {
      if (textPosition && textInput.trim()) {
        // Commit the text if there's actual content
        if (import.meta.env.DEV) {
          console.log('[Text Tool] Auto-committing text due to tool change');
        }
        const newAnnotation: Annotation = {
          id: crypto.randomUUID(),
          tool: 'text',
          style: { ...currentStyle },
          x: textPosition.x,
          y: textPosition.y,
          text: textInput,
        };
        onAddAnnotation(newAnnotation);
      } else {
        // Just clear the state if no text was typed
        if (import.meta.env.DEV) {
          console.log('[Text Tool] Clearing empty text due to tool change');
        }
      }
      setEditingTextId(null);
      setTextInput('');
      setTextPosition(null);
    }
  }, [currentTool]);

  // Notify parent when text editing state changes
  useEffect(() => {
    if (onTextEditingChange) {
      onTextEditingChange(!!editingTextId);
    }
  }, [editingTextId, onTextEditingChange]);

  // Handle mouse down - start drawing
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (currentTool === 'none') return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Special handling for text tool - click to place
    if (currentTool === 'text') {
      if (import.meta.env.DEV) {
        console.log('[Text Tool] Clicked at:', pos);
      }

      // If there's existing text being edited, commit it first
      if (editingTextId && textPosition && textInput.trim()) {
        const newAnnotation: Annotation = {
          id: crypto.randomUUID(),
          tool: 'text',
          style: { ...currentStyle },
          x: textPosition.x,
          y: textPosition.y,
          text: textInput,
        };
        onAddAnnotation(newAnnotation);
      }
      
      // Start new text at clicked position
      setTextPosition({ x: pos.x, y: pos.y });
      setTextInput('');
      setEditingTextId('new');
      if (import.meta.env.DEV) {
        console.log('[Text Tool] State set, should show input');
      }
      return;
    }

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

  // Handle text input submission
  const handleTextSubmit = () => {
    if (!textPosition || !textInput.trim()) {
      // Only clear if there's no text - allow empty cancel
      if (!textInput.trim()) {
        setEditingTextId(null);
        setTextInput('');
        setTextPosition(null);
      }
      return;
    }

    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      tool: 'text',
      style: { ...currentStyle },
      x: textPosition.x,
      y: textPosition.y,
      text: textInput,
    };

    onAddAnnotation(newAnnotation);
    setEditingTextId(null);
    setTextInput('');
    setTextPosition(null);
  };

  // Handle text input cancel
  const handleTextCancel = () => {
    setEditingTextId(null);
    setTextInput('');
    setTextPosition(null);
  };

  // Render individual annotation (memoized to prevent re-creation on every render)
  const renderAnnotation = useCallback((annotation: Annotation) => {
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
          <Ellipse
            key={id}
            x={x + width / 2}
            y={y + height / 2}
            radiusX={Math.abs(width) / 2}
            radiusY={Math.abs(height) / 2}
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
        // Optimized blur effect using a single semi-transparent rectangle
        // This replaces hundreds of individual rects with just one
        return (
          <Rect
            key={id}
            x={x}
            y={y}
            width={width}
            height={height}
            fill="#000000"
            opacity={0.8}
          />
        );

      case 'text':
        return (
          <Text
            key={id}
            x={x}
            y={y}
            text={text}
            fontSize={24}
            fontFamily="Arial"
            fill={color}
            opacity={opacity}
          />
        );

      default:
        return null;
    }
  }, []); // Empty deps - function doesn't depend on any props or state

  // Get device pixel ratio for high-DPI displays
  // Force at least 2x supersampling to ensure crisp text and image rendering
  const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);

  // Configure canvas context for maximum quality
  useEffect(() => {
    if (stageRef.current) {
      const canvas = stageRef.current.getStage().container().querySelector('canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Set highest quality rendering hints
          ctx.imageSmoothingQuality = 'high';
          ctx.imageSmoothingEnabled = true;
        }
      }
    }
  }, [image]);

  return (
    <div style={{ position: 'relative' }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        // Scale for high-DPI displays to ensure crisp rendering
        scaleX={1}
        scaleY={1}
        // Use actual device pixel ratio for retina displays
        pixelRatio={pixelRatio}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer
          // Force high quality rendering
          imageSmoothingEnabled={true}
        >
          {/* Background screenshot image */}
          {image && (
            <KonvaImage
              image={image}
              width={width}
              height={height}
              // Maximum quality image rendering
              imageSmoothingEnabled={true}
              // Prevent blurriness from fractional positioning
              x={Math.round(0)}
              y={Math.round(0)}
            />
          )}

          {/* Render all saved annotations */}
          {annotations.map(renderAnnotation)}

          {/* Render current annotation being drawn */}
          {currentAnnotation && renderAnnotation(currentAnnotation)}
        </Layer>
      </Stage>

      {/* Text Input Overlay - Live preview while typing */}
      {editingTextId && textPosition && (
        <div
          style={{
            position: 'absolute',
            left: textPosition.x,
            top: textPosition.y,
            fontSize: '24px',
            fontFamily: 'Arial',
            color: currentStyle.color,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 9999,
          }}
        >
          {textInput || '|'} {/* Show cursor when empty */}
        </div>
      )}
    </div>
  );
}
