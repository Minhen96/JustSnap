// JustSnap - Annotation State Management Hook

import { useState, useCallback } from 'react';
import type { AnnotationTool, Annotation, AnnotationStyle } from '../types';

export function useAnnotation() {
  const [currentTool, setCurrentTool] = useState<AnnotationTool>('rectangle');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentStyle, setCurrentStyle] = useState<AnnotationStyle>({
    color: '#ef4444', // red-500
    strokeWidth: 3,
    opacity: 1,
  });

  // Undo/Redo history
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  const addAnnotation = useCallback((annotation: Annotation) => {
    const newAnnotations = [...annotations, annotation];
    setAnnotations(newAnnotations);

    // Add to history
    setHistory(h => [...h.slice(0, historyStep + 1), newAnnotations]);
    setHistoryStep(s => s + 1);
  }, [annotations, historyStep]);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations(prev =>
      prev.map(a => a.id === id ? { ...a, ...updates } : a)
    );
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    const newAnnotations = annotations.filter((a) => a.id !== id);
    setAnnotations(newAnnotations);

    // Add to history
    setHistory(h => [...h.slice(0, historyStep + 1), newAnnotations]);
    setHistoryStep(s => s + 1);
  }, [annotations, historyStep]);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    setHistory([[]]);
    setHistoryStep(0);
  }, []);

  const undo = useCallback(() => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setAnnotations(history[historyStep - 1] || []);
    }
  }, [historyStep, history]);

  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setAnnotations(history[historyStep + 1]);
    }
  }, [historyStep, history]);

  const updateStyle = useCallback((style: Partial<AnnotationStyle>) => {
    setCurrentStyle(prev => ({ ...prev, ...style }));
  }, []);

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;

  return {
    currentTool,
    setCurrentTool,
    annotations,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
    undo,
    redo,
    canUndo,
    canRedo,
    currentStyle,
    updateStyle,
  };
}
