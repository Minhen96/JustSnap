// JustSnap - Screenshot Actions Component
// Handles copy, save, stick, and AI code generation actions

import { currentMonitor } from '@tauri-apps/api/window';
import type { Screenshot, AskFramework } from '../../types';
import * as ipc from '../../services/ipc.service';
import { hideAndCleanup, hideImmediatelyThenPerform, hidePerformShowFeedback } from '../../utils/windowManager';

interface ScreenshotActionsProps {
  screenshot: Screenshot;
  width: number;
  height: number;
  onFeedback: (message: string) => void;
  onClose: () => void;
}

/**
 * Custom hook that provides all screenshot action handlers
 */
export function useScreenshotActions({
  screenshot,
  width,
  height,
  onFeedback,
  onClose,
}: ScreenshotActionsProps) {
  const exportCanvasAsDataURL = (useMaxQuality: boolean = false): string => {
    const stage = window.__konvaStage;
    if (stage) {
      const devicePixelRatio = window.devicePixelRatio || 1;

      // For sticky windows without annotations, we use original
      // For copy/save/with annotations, use appropriate quality
      let pixelRatio: number;
      if (useMaxQuality) {
        // Maximum quality for save/copy operations
        const supersamplingRatio = 4;
        pixelRatio = Math.max(devicePixelRatio * 2, supersamplingRatio);
      } else {
        // For sticky with annotations, use 2x to balance quality and file size
        // This prevents the "too much compression" issue from 4x exports
        pixelRatio = Math.max(devicePixelRatio, 2);
      }

      return stage.toDataURL({
        pixelRatio,
        mimeType: 'image/png',
        quality: 1.0
      });
    }
    return screenshot.imageData || '';
  };

  const handleCopy = async () => {
    const dataURL = exportCanvasAsDataURL(true); // Use max quality for copy

    await hideImmediatelyThenPerform(
      async () => {
        const response = await fetch(dataURL);
        const blob = await response.blob();

        // Try frontend clipboard first
        let success = false;
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            success = true;
          } catch (err) {
            console.warn('Frontend clipboard failed, trying backend:', err);
          }
        }

        if (!success) {
          // Fallback to backend
          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          await ipc.copyImageToClipboard(bytes);
        }
      },
      () => onClose(),
      (error) => {
        console.error('Failed to copy:', error);
        onFeedback('Failed to copy');
      }
    );
  };

  const handleSave = async () => {
    const dataURL = exportCanvasAsDataURL(true); // Use max quality for save

    // Convert to bytes immediately (before hiding)
    const response = await fetch(dataURL);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const result = await hidePerformShowFeedback(
      async () => {
        const path = await ipc.openSaveDialog('screenshot.png');
        if (path) {
          await ipc.saveImage(bytes, path, 'png');
        } else {
          throw new Error('Save cancelled');
        }
      },
      'Image saved successfully',
      'Failed to save image',
      () => onClose()
    );

    onFeedback(result.message);
  };

  const handleStick = async () => {
    if (!screenshot) return;

    const { x, y } = screenshot.region;

    // Check if there are annotations - if yes, export canvas; if no, use original
    const stage = window.__konvaStage;
    const hasAnnotations = stage && stage.find('Line, Rect, Ellipse, Arrow, Text').length > 0;

    let imageDataURL: string;
    if (hasAnnotations) {
      // Has annotations - must export canvas to include them
      imageDataURL = exportCanvasAsDataURL();
    } else {
      // No annotations - use ORIGINAL high-quality screenshot directly!
      // This bypasses canvas recompression and preserves original quality
      imageDataURL = screenshot.imageData;
    }

    await hideImmediatelyThenPerform(
      async () => {
        await ipc.createStickyWindow(imageDataURL, x, y, width, height);
      },
      () => onClose(),
      (error) => console.error('Stick failed', error)
    );
  };

  const handleGenerateAiCode = async (framework: AskFramework) => {
    // Get current screen metrics to position the new window
    const monitor = await currentMonitor();
    if (!monitor) return;

    const scaleFactor = monitor.scaleFactor;
    const logicalWidth = monitor.size.width / scaleFactor;

    // Position at Top-Right
    const panelWidth = 520;
    const panelHeight = 620;
    const margin = 24;

    const x = Math.max(margin, logicalWidth - panelWidth - margin);
    const y = 60; // Top margin

    const dataURL = exportCanvasAsDataURL();

    if (dataURL) {
      await ipc.createAIPanelWindow(dataURL, framework, x, y, panelWidth, panelHeight);
      onClose();
    }
  };

  return {
    handleCopy,
    handleSave,
    handleStick,
    handleGenerateAiCode,
  };
}
