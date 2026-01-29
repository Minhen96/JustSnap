// JustSnap - Window Management Utilities
// Centralized window hide/show/close logic for consistent UX

import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * Hide window and execute cleanup callback
 * @param onCleanup - Optional cleanup function to run after hiding
 * @param delay - Delay in ms before running cleanup (for animations)
 */
export async function hideAndCleanup(
  onCleanup?: () => void | Promise<void>,
  delay: number = 0
): Promise<void> {
  const win = getCurrentWindow();
  await win.hide();

  if (onCleanup) {
    if (delay > 0) {
      setTimeout(async () => {
        await Promise.resolve(onCleanup());
      }, delay);
    } else {
      await Promise.resolve(onCleanup());
    }
  }
}

/**
 * Hide window, show it back with feedback message, then cleanup
 * Used for operations that need to show user feedback
 * @param operation - Async operation to perform
 * @param successMessage - Message to show on success
 * @param errorMessage - Message to show on error
 * @param onSuccess - Callback to run after success
 */
export async function hidePerformShowFeedback(
  operation: () => Promise<void>,
  successMessage: string,
  errorMessage: string,
  onSuccess?: () => void | Promise<void>
): Promise<{ success: boolean; message: string }> {
  const win = getCurrentWindow();

  try {
    await win.hide();
    await operation();

    // Show back with success feedback
    await win.show();

    if (onSuccess) {
      setTimeout(async () => {
        await Promise.resolve(onSuccess());
      }, 1500);
    }

    return { success: true, message: successMessage };
  } catch (error) {
    console.error('Operation failed:', error);
    await win.show();
    return { success: false, message: errorMessage };
  }
}

/**
 * Hide immediately, perform operation in background, cleanup on success
 * Used for instant-feel operations (copy, stick, etc.)
 * @param operation - Async operation to perform
 * @param onSuccess - Callback to run after success
 * @param onError - Callback to run on error (window will be shown)
 */
export async function hideImmediatelyThenPerform(
  operation: () => Promise<void>,
  onSuccess?: () => void | Promise<void>,
  onError?: (error: unknown) => void | Promise<void>
): Promise<void> {
  const win = getCurrentWindow();

  try {
    await win.hide();
    await operation();

    if (onSuccess) {
      await Promise.resolve(onSuccess());
    }
  } catch (error) {
    console.error('Operation failed:', error);
    await win.show();

    if (onError) {
      await Promise.resolve(onError(error));
    }
  }
}

/**
 * Snap the main window to the monitor containing the screenshot.
 * This ensures the window adopts the correct DPI of that monitor.
 * @param region The logical region of the screenshot
 */
export async function snapWindowToScreenshot(region: { x: number, y: number, width: number, height: number }): Promise<void> {
  const { availableMonitors, getCurrentWindow, LogicalPosition } = await import('@tauri-apps/api/window');
  const win = getCurrentWindow();

  // Find monitor containing the center of screenshot
  const monitors = await availableMonitors();
  const centerX = region.x + region.width / 2;
  const centerY = region.y + region.height / 2;

  console.log('[windowManager] Screenshot region:', region);
  console.log('[windowManager] Screenshot center (logical):', centerX, centerY);
  console.log('[windowManager] Available monitors:', monitors.map(m => ({
    name: m.name,
    pos: m.position,
    size: m.size,
    scale: m.scaleFactor
  })));

  // Determine target monitor by finding the one with the closest center point in Logical Space
  // We convert Monitor Physical coordinates to Logical to match the Screenshot Region
  const bestMonitor = monitors.sort((a, b) => {
    const scaleA = a.scaleFactor || 1;
    const scaleB = b.scaleFactor || 1;

    // Monitor A Center (Logical)
    // Note: This assumes Monitor Position (Physical) starts at (0,0) of that specific monitor in Logical space?
    // No, on Windows, Logical coordinates are global.
    // However, Tauri returns Position in Physical pixels relative to global Virtual Screen top-left (usually).
    // So dividing by scaleFactor is generally the correct way to get the global Logical coordinate.
    const aX = a.position.x / scaleA;
    const aY = a.position.y / scaleA;
    const aW = a.size.width / scaleA;
    const aH = a.size.height / scaleA;
    const aCx = aX + aW / 2;
    const aCy = aY + aH / 2;

    // Monitor B Center (Logical)
    const bX = b.position.x / scaleB;
    const bY = b.position.y / scaleB;
    const bW = b.size.width / scaleB;
    const bH = b.size.height / scaleB;
    const bCx = bX + bW / 2;
    const bCy = bY + bH / 2;

    // Distance from Screenshot Center (Logical)
    const distA = Math.hypot(centerX - aCx, centerY - aCy);
    const distB = Math.hypot(centerX - bCx, centerY - bCy);

    console.log('[windowManager] Monitor', a.name, 'center:', aCx, aCy, 'dist:', distA);
    console.log('[windowManager] Monitor', b.name, 'center:', bCx, bCy, 'dist:', distB);

    return distA - distB;
  })[0] || monitors[0];

  if (bestMonitor) {
    console.log('[windowManager] Selected monitor:', bestMonitor.name, 'at', bestMonitor.position, 'scale:', bestMonitor.scaleFactor);

    // We must exit fullscreen first to move/resize
    await win.setFullscreen(false);
    await win.setDecorations(false);

    // Calculate Logical Position for target monitor
    // We use the monitor's physical position converted to logical
    const scale = bestMonitor.scaleFactor || 1;
    const logicalX = bestMonitor.position.x / scale;
    const logicalY = bestMonitor.position.y / scale;

    // Move window to top-left of target monitor (Logical)
    await win.setPosition(new LogicalPosition(logicalX, logicalY));

    // Re-enable fullscreen (should snap to *that* monitor)
    await win.setFullscreen(true);
  }
}

/**
 * Restore window to span all monitors (custom fullscreen) or standard fullscreen
 */
export async function restoreOverlayFullscreen(): Promise<void> {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const win = getCurrentWindow();
  await win.setFullscreen(true);
}
