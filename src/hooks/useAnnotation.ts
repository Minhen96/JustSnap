// JustSnap - Annotation State Management Hook

import { useState } from 'react';
import type { AnnotationTool, Annotation, AnnotationStyle } from '../types';

export function useAnnotation() {
  const [currentTool, setCurrentTool] = useState<AnnotationTool>('none');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentStyle, setCurrentStyle] = useState<AnnotationStyle>({
    color: '#FF0000',
    strokeWidth: 2,
    opacity: 1,
  });

  const addAnnotation = (annotation: Annotation) => {
    setAnnotations([...annotations, annotation]);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter((a) => a.id !== id));
  };

  const clearAnnotations = () => {
    setAnnotations([]);
  };

  const undoLastAnnotation = () => {
    setAnnotations(annotations.slice(0, -1));
  };

  const updateStyle = (style: Partial<AnnotationStyle>) => {
    setCurrentStyle({ ...currentStyle, ...style });
  };

  return {
    currentTool,
    setCurrentTool,
    annotations,
    addAnnotation,
    removeAnnotation,
    clearAnnotations,
    undoLastAnnotation,
    currentStyle,
    updateStyle,
  };
}
