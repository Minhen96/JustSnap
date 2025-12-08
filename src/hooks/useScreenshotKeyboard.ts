// JustSnap - Screenshot Editor Keyboard Shortcuts Hook
// Handles all keyboard shortcuts for the screenshot editor

import { useEffect } from 'react';
import type { AnnotationTool } from '../types';

interface UseScreenshotKeyboardProps {
  onUndo: () => void;
  onRedo: () => void;
  onSetTool: (tool: AnnotationTool) => void;
  onClose: () => void;
  enabled?: boolean;
}

/**
 * Hook to handle keyboard shortcuts for screenshot editor
 *
 * Shortcuts:
 * - Ctrl+Z: Undo
 * - Ctrl+Y: Redo
 * - P: Pen tool
 * - H: Highlighter tool
 * - R: Rectangle tool
 * - C: Circle tool
 * - A: Arrow tool
 * - T: Text tool
 * - B: Blur tool
 * - Escape: Close editor
 */
export function useScreenshotKeyboard({
  onUndo,
  onRedo,
  onSetTool,
  onClose,
  enabled = true,
}: UseScreenshotKeyboardProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo shortcuts
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        onUndo();
        return;
      }

      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        onRedo();
        return;
      }

      // Tool shortcuts (only if no modifiers are pressed)
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'p':
            onSetTool('pen');
            break;
          case 'h':
            onSetTool('highlighter');
            break;
          case 'r':
            onSetTool('rectangle');
            break;
          case 'c':
            onSetTool('circle');
            break;
          case 'a':
            onSetTool('arrow');
            break;
          case 't':
            onSetTool('text');
            break;
          case 'b':
            onSetTool('blur');
            break;
          case 'escape':
            onClose();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onUndo, onRedo, onSetTool, onClose]);
}
