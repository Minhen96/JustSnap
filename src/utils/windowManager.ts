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
