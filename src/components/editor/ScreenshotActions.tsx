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
  const exportCanvasAsDataURL = async (): Promise<string> => {
    // 1. Find the Background Canvas (The Screenshot itself)
    const bgCanvas = document.querySelector('.background-canvas') as HTMLCanvasElement;
    
    // 2. Get the Konva Stage (Annotations)
    const stage = window.__konvaStage;

    console.log('[exportCanvasAsDataURL] DEBUG', {
      bgCanvasFound: !!bgCanvas,
      bgCanvasWidth: bgCanvas?.width,
      bgCanvasHeight: bgCanvas?.height,
      stageFound: !!stage,
      stageWidth: stage?.width(),
      stageHeight: stage?.height(),
      screenshotDataLength: screenshot.imageData?.length
    });

    if (!bgCanvas || bgCanvas.width === 0) {
      console.warn('Background canvas not found or empty, returning raw image data');
      return screenshot.imageData || '';
    }

    // 3. Create a Composite Canvas matching background resolution (physical pixels)
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = bgCanvas.width;
    compositeCanvas.height = bgCanvas.height;
    
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return screenshot.imageData || '';
    
    // 4. Draw Background (pixel-perfect, no smoothing)
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bgCanvas, 0, 0);

    // 5. Draw Annotations (if any, scaled to match physical resolution)
    if (stage) {
      // Calculate scale to match annotation layer to background resolution exactly
      const scaleX = bgCanvas.width / stage.width();
      const scaleY = bgCanvas.height / stage.height();
      // Use scaleX since aspect ratio should be maintained
      const scale = scaleX; 
      
      console.log('[exportCanvasAsDataURL] Annotation scale:', { 
        scaleX, scaleY, scale,
        expectedWidth: stage.width() * scale,
        expectedHeight: stage.height() * scale
      });
      
      const annotationDataURL = stage.toDataURL({
        pixelRatio: scale, 
        mimeType: 'image/png',
        quality: 1.0
      });

      // Load and draw annotations
      const annotationImg = new Image();
      await new Promise<void>((resolve) => {
        annotationImg.onload = () => {
          console.log('[exportCanvasAsDataURL] Annotation image loaded:', 
            annotationImg.width, 'x', annotationImg.height,
            'composite:', compositeCanvas.width, 'x', compositeCanvas.height
          );
          resolve();
        };
        annotationImg.onerror = () => {
          console.error('[exportCanvasAsDataURL] Failed to load annotation image');
          resolve();
        };
        annotationImg.src = annotationDataURL;
      });
      
      // Draw annotation at natural size (should match composite if scale is correct)
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(annotationImg, 0, 0);
    }

    console.log('[exportCanvasAsDataURL] Final composite:', compositeCanvas.width, 'x', compositeCanvas.height);
    return compositeCanvas.toDataURL('image/png');
  };

  const handleCopy = async () => {
    const dataURL = await exportCanvasAsDataURL();
    
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
    const dataURL = await exportCanvasAsDataURL();

    // Convert to bytes immediately (before hiding)
    const response = await fetch(dataURL);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const result = await hidePerformShowFeedback(
      async () => {
        const path = await ipc.openSaveDialog('screenshot.png');
        if (path) {
          await ipc.saveImage(bytes, path);
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
    const { monitorOffset } = useAppStore.getState();

    // The screenshot region x,y are already in screen coordinates (from the overlay)
    // We add the monitor offset to get global screen position
    const screenX = x + (monitorOffset?.x || 0);
    const screenY = y + (monitorOffset?.y || 0);
    
    // Get image physical dimensions for native sizing
    const scale = monitorOffset?.scaleFactor || window.devicePixelRatio || 1;
    const nativeWidth = Math.round(width * scale);
    const nativeHeight = Math.round(height * scale);

    console.log('[handleStick] DEBUG', {
      regionX: x, regionY: y,
      screenX, screenY,
      logicalWidth: width, logicalHeight: height,
      scale,
      nativeWidth, nativeHeight,
      monitorOffset: monitorOffset
    });

    await hideImmediatelyThenPerform(
      async () => {
        // Position uses screen coordinates, size uses logical dimensions
        await ipc.createStickyWindow(imageDataURL, annotations, screenX, screenY, width, height, nativeWidth, nativeHeight);
      },
      () => onClose(),
      (error) => {
        console.error('Stick failed', error);
        onFeedback(`Pin failed: ${error}`);
      }
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

    const dataURL = await exportCanvasAsDataURL();

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
