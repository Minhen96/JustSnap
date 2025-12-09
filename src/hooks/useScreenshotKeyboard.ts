// JustSnap - Screenshot Editor Keyboard Shortcuts Hook
// Handles all keyboard shortcuts for the screenshot editor

import { useEffect } from 'react';
import type { AnnotationTool } from '../types';

interface UseScreenshotKeyboardProps {
  onUndo: () => void;
  onRedo: () => void;
  onSetTool: (tool: AnnotationTool) => void;
  onClose: () => void;
  onCopy?: () => void;
  onSave?: () => void;
  enabled?: boolean;
}

/**
 * Hook to handle keyboard shortcuts for screenshot editor
 *
 * Shortcuts:
 * - Ctrl+Z: Undo
 * - Ctrl+Y: Redo
 * - Ctrl+C: Copy
 * - Ctrl+S: Save
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
  onCopy,
  onSave,
  enabled = true,
}: UseScreenshotKeyboardProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Copy shortcut
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        onCopy?.();
        return;
      }

      // Save shortcut
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave?.();
        return;
      }

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
            // If just 'c' is pressed (no ctrl), it selects circle tool
            // But usually circle tool is handled below.
            // If the user wants specific key for copy without ctrl, that's different.
            // But they asked for Ctrl+C.
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
  }, [enabled, onUndo, onRedo, onSetTool, onClose, onCopy, onSave]);
}
