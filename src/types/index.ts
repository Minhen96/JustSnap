// JustSnap TypeScript Type Definitions

// ============================================
// Core Types
// ============================================

export type CaptureMode = 'capture' | 'scrolling' | 'record' | 'live';

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Screenshot {
  id: string;
  imageData: string; // base64 or blob URL
  region: Region;
  timestamp: number;
  mode: CaptureMode;
}

// ============================================
// Annotation Types
// ============================================

export type AnnotationTool =
  | 'pen'
  | 'highlighter'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'text'
  | 'blur'
  | 'sticky'
  | 'eraser'
  | 'none';

export interface AnnotationStyle {
  color: string;
  strokeWidth: number;
  opacity?: number;
}

export interface Annotation {
  id: string;
  tool: AnnotationTool;
  style: AnnotationStyle;
  points?: number[]; // For pen, highlighter
  x?: number; // For shapes, text
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  text?: string; // For text and sticky notes
}

// ============================================
// AI Types
// ============================================

export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
  blocks?: TextBlock[];
}

export interface TextBlock {
  text: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: 'en' | 'zh' | 'ms'; // English, Chinese, Malay
}

export interface TranslationResult {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export interface AISummary {
  summary: string;
  keyPoints: string[];
  timestamp: number;
}

export interface AICodeGeneration {
  framework: 'react' | 'vue' | 'flutter' | 'html' | 'nextjs';
  code: string;
  styles?: string;
  dependencies?: string[];
  fileName: string;
}

// ============================================
// Recording Types
// ============================================

export interface RecordingOptions {
  enableMicrophone: boolean;
  enableSystemAudio: boolean;
  enableWebcam?: boolean;
}

export interface Recording {
  id: string;
  videoData: Blob;
  region: Region;
  duration: number;
  timestamp: number;
  options: RecordingOptions;
}

// ============================================
// Tauri IPC Types
// ============================================

export interface TauriCaptureRequest {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TauriCaptureResponse {
  imageData: number[]; // Vec<u8> from Rust
  width: number;
  height: number;
}

export interface HotkeyConfig {
  key: string;
  modifiers: string[];
}

// ============================================
// UI State Types
// ============================================

export interface SnipState {
  isActive: boolean;
  mode: CaptureMode;
  selectedRegion: Region | null;
  currentTool: AnnotationTool;
  annotations: Annotation[];
  screenshot: Screenshot | null;
}

export interface AppSettings {
  hotkey: HotkeyConfig;
  defaultMode: CaptureMode;
  autoSave: boolean;
  savePath: string;
  theme: 'light' | 'dark' | 'system';
}

// ============================================
// Export Types
// ============================================

export type ExportFormat = 'png' | 'jpg' | 'webp' | 'txt' | 'md' | 'pdf' | 'zip';

export interface ExportOptions {
  format: ExportFormat;
  quality?: number; // For image formats
  includeAnnotations: boolean;
  includeAIResults?: boolean;
}
