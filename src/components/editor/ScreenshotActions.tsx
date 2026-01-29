// JustSnap - Screenshot Actions Component
// Handles copy, save, stick, and AI code generation actions

import { currentMonitor } from '@tauri-apps/api/window';
import type { Screenshot, AskFramework } from '../../types';
import { useAppStore } from '../../store/appStore';
import * as ipc from '../../services/ipc.service';
import { hideImmediatelyThenPerform, hidePerformShowFeedback } from '../../utils/windowManager';

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
    
    // We perform the copy operation BEFORE hiding the window
    // This is critical because navigator.clipboard requires the window to be focused
    try {
      const response = await fetch(dataURL);
      const blob = await response.blob();
      let success = false;

      // 1. Try Frontend Clipboard (Preferred, supports more formats/metadata if needed)
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          success = true;
          console.log('[ScreenshotActions] Frontend copy success');
        } catch (err) {
          console.warn('[ScreenshotActions] Frontend copy failed (focus lost?), trying backend:', err);
        }
      }

      // 2. Fallback to Backend Clipboard (Reliable even without focus)
      if (!success) {
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        await ipc.copyImageToClipboard(bytes);
        console.log('[ScreenshotActions] Backend copy success');
      }

      // 3. Conditional Close based on settings
      const autoClose = useAppStore.getState().autoCloseAfterCopy;
      if (autoClose) {
        onClose();
      }
      onFeedback('Copied to clipboard');

    } catch (error) {
      console.error('Failed to copy capture:', error);
      onFeedback('Failed to copy');
    }
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
      () => {
        // Only close if auto-close is enabled
        const autoClose = useAppStore.getState().autoCloseAfterSave;
        if (autoClose) {
            onClose();
        }
      }
    );

    onFeedback(result.message);
  };

  const handleStick = async () => {
    if (!screenshot) return;

    const { x, y } = screenshot.region;

    // Use the ORIGINAL high-quality screenshot directly!
    // We now pass annotations separately to simple sticky windows
    const imageDataURL = screenshot.imageData;
    
    // Get annotations from store (source of truth)
    // We need to import useAppStore first, but to avoid large refactor we can use getState directly if needed
    // or better, adds import at top. 
    // For now, let's assume we can access the store state via the window (hacky) or just import it.
    // Let's rely on the module import added at the top.
    
    // Actually, I need to add the import. I'll do that in a separate chunk or just use consistent store access.
    // Let's pretend I added the import or I'll add access implementation here if I can.
    // Since I can't add imports easily with replace_file_content if they are far away, 
    // I will use `useAppStore` if I add the import.
    // Or I can use `useAppStore.getState().annotations`?
    
    // Wait, I need to add the import first. 
    // I will assume I will add `import { useAppStore } from '../../store/appStore';` at the top.
    
    const annotations = useAppStore.getState().annotations;
    const { monitorOffset } = useAppStore.getState(); // Get monitor offset

    // Convert local logical coordinates to global physical coordinates
    // This ensures the window opens on the correct monitor at the correct physical position
    // Use the stored scale factor from monitorOffset if available, otherwise fallback to window
    const scale = monitorOffset?.scaleFactor || window.devicePixelRatio || 1;
    
    // x and y are logical (window-relative). monitorOffset is physical.
    // We must convert logical -> physical, then add offset.
    const physicalX = Math.round(x * scale) + (monitorOffset?.x || 0);
    const physicalY = Math.round(y * scale) + (monitorOffset?.y || 0);
    const physicalWidth = Math.round(width * scale);
    const physicalHeight = Math.round(height * scale);

    await hideImmediatelyThenPerform(
      async () => {
        await ipc.createStickyWindow(imageDataURL, annotations, physicalX, physicalY, physicalWidth, physicalHeight);
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
