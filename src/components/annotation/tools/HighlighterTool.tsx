// JustSnap - Highlighter Annotation Tool
// Reference: use_case.md SC-04

import type { AnnotationStyle } from '../../../types';

interface HighlighterToolProps {
  isActive: boolean;
  style: AnnotationStyle;
  onDrawComplete: (points: number[]) => void;
}

export function HighlighterTool({ isActive, style, onDrawComplete }: HighlighterToolProps) {
  // TODO: Implement highlighter with semi-transparent strokes
  // Similar to PenTool but with different opacity

  return null;
}
