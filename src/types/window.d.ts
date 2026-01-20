// JustSnap - Global Window Type Definitions
// Extends the Window interface with Tauri and JustSnap-specific properties

import type { Stage } from 'konva/lib/Stage';

declare global {
  interface Window {
    // Tauri runtime detection
    __TAURI_INTERNALS__?: Record<string, unknown>;
    __TAURI__?: Record<string, unknown>;

    // Konva canvas instance (used in ScreenshotEditor)
    __konvaStage?: Stage;

    // Window-specific data injected by Rust commands
    __STICKY_IMAGE_SRC__?: string;
    __STICKY_ANNOTATIONS__?: string; // JSON string of annotations
    __AI_PANEL_DATA__?: {
      imageSrc: string;
      framework: string;
    };
    __TRANSLATION_TEXT__?: string;
    __WINDOW_TYPE__?: 'app' | 'sticky' | 'ai_panel' | 'translation';
  }
}

export { };
