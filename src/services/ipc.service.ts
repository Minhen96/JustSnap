// JustSnap IPC Service - Tauri Command Wrapper
// Provides type-safe communication between React and Rust

import { invoke } from '@tauri-apps/api/core';
import type {
  TauriCaptureRequest,
  TauriCaptureResponse,
  Region,
  HotkeyConfig,
} from '../types';

/**
 * Screen Capture Commands
 */

export async function captureScreen(region: Region): Promise<Uint8Array> {
  const request: TauriCaptureRequest = {
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
  };

  const response = await invoke<TauriCaptureResponse>('capture_screen', request);
  return new Uint8Array(response.imageData);
}

export async function captureFullScreen(): Promise<Uint8Array> {
  const response = await invoke<TauriCaptureResponse>('capture_full_screen');
  return new Uint8Array(response.imageData);
}

/**
 * Hotkey Commands
 */

export async function registerHotkey(config: HotkeyConfig): Promise<void> {
  await invoke('register_hotkey', { config });
}

export async function unregisterHotkey(): Promise<void> {
  await invoke('unregister_hotkey');
}

/**
 * Overlay Window Commands
 */

export async function showOverlay(): Promise<void> {
  await invoke('show_overlay');
}

export async function hideOverlay(): Promise<void> {
  await invoke('hide_overlay');
}

/**
 * File System Commands
 */

export async function saveImage(
  imageData: Uint8Array,
  fileName: string,
  format: 'png' | 'jpg' | 'webp'
): Promise<string> {
  const path = await invoke<string>('save_image', {
    imageData: Array.from(imageData),
    fileName,
    format,
  });
  return path;
}

export async function saveText(content: string, fileName: string): Promise<string> {
  const path = await invoke<string>('save_text', { content, fileName });
  return path;
}

export async function openSaveDialog(defaultName: string): Promise<string | null> {
  const path = await invoke<string | null>('open_save_dialog', { defaultName });
  return path;
}

/**
 * Clipboard Commands
 */

export async function copyImageToClipboard(imageData: Uint8Array): Promise<void> {
  await invoke('copy_image_to_clipboard', {
    imageData: Array.from(imageData),
  });
}

export async function copyTextToClipboard(text: string): Promise<void> {
  await invoke('copy_text_to_clipboard', { text });
}

export async function saveTempImage(imageData: Uint8Array): Promise<string> {
  const path = await invoke<string>('save_temp_image', {
    imageData: Array.from(imageData),
  });
  return path;
}

/**
 * Multi-Window Commands
 */

export async function createStickyWindow(
  imageSrc: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  await invoke('create_sticky_window', { imageSrc, x, y, width, height });
}

export async function createAIPanelWindow(
  imageSrc: string,
  framework: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  await invoke('create_ai_panel_window', { imageSrc, framework, x, y, width, height });
}

export async function createTranslationWindow(
  text: string,
  x: number,
  y: number
): Promise<void> {
  await invoke('create_translation_window', { text, x, y });
}

export async function closeWindow(): Promise<void> {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const window = getCurrentWindow();
  await invoke('close_window', { window });
}

/**
 * Window Detection Commands
 */

export interface WindowInfo {
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function getWindowAtPosition(x: number, y: number): Promise<WindowInfo | null> {
  const window = await invoke<WindowInfo | null>('get_window_at_position', { x, y });
  return window;
}

export async function getAllWindows(): Promise<WindowInfo[]> {
  const windows = await invoke<WindowInfo[]>('get_all_windows');
  return windows;
}

/**
 * Multi-Monitor Commands
 */

export interface MonitorInfo {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor: number;
  isPrimary: boolean;
}

export async function getAllMonitors(): Promise<MonitorInfo[]> {
  const monitors = await invoke<MonitorInfo[]>('get_all_monitors');
  return monitors;
}

/**
 * App Settings Commands
 */

export async function getSettings(): Promise<Record<string, unknown>> {
  const settings = await invoke<Record<string, unknown>>('get_settings');
  return settings;
}

export async function saveSettings(settings: Record<string, unknown>): Promise<void> {
  await invoke('save_settings', { settings });
}

/**
 * System Tray Commands (Future)
 */

export async function showInTray(): Promise<void> {
  await invoke('show_in_tray');
}

export async function hideFromTray(): Promise<void> {
  await invoke('hide_from_tray');
}

/**
 * Error handling wrapper
 * Wraps Tauri invoke calls with consistent error handling
 */

export async function invokeWithErrorHandling<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    console.error(`Tauri command "${command}" failed:`, error);
    throw new Error(`Failed to execute ${command}: ${error}`);
  }
}
