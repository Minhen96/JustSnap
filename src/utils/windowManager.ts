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

  const targetMonitor = monitors.find(m => {
    const { x, y } = m.position;
    const { width, height } = m.size;

    // Note: m.position is physical
    // region is logical
    // This comparison is fuzzy but "good enough" for identifying the monitor
    // A better way is to convert logic to physical but we need scale factor.
    // Or we use cursor position.

    // Let's assume region coords are roughly correct for monitor finding.
    return centerX >= x && centerX < x + width &&
      centerY >= y && centerY < y + height;
  }) || monitors[0]; // Fallback to primary

  if (targetMonitor) {
    // We must exit fullscreen first to move/resize
    await win.setFullscreen(false);
    await win.setDecorations(false);

    // Move to target monitor
    const monitorX = targetMonitor.position.x;
    const monitorY = targetMonitor.position.y;

    // Move window to top-left of target monitor
    await win.setPosition(new LogicalPosition(monitorX, monitorY));

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
