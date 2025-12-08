// JustSnap - Global App State (Zustand Store)
// Manages app-wide state for overlay, capture mode, screenshots

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { CaptureMode, Region, Screenshot, AnnotationTool, Annotation, AnnotationStyle, OCRResult, TranslationResult } from '../types';

interface AppState {
  // Overlay state
  isOverlayActive: boolean;
  currentMode: CaptureMode;

  // Selection state
  selectedRegion: Region | null;
  isSelecting: boolean;

  // Screenshot state
  currentScreenshot: Screenshot | null;
  screenshots: Screenshot[];

  // Annotation state
  currentTool: AnnotationTool;
  annotations: Annotation[];
  annotationStyle: AnnotationStyle;
  annotationHistory: Annotation[][];
  annotationHistoryStep: number;

  // UI state
  showToolbar: boolean;
  isProcessing: boolean;

  // OCR state
  ocrResult: OCRResult | null;
  ocrLoading: boolean;
  ocrProgress: number; // 0-100
  ocrError: string | null;

  // Translation state
  translationResult: TranslationResult | null;
  translationLoading: boolean;
  translationError: string | null;

  // Actions - Overlay
  showOverlay: (mode?: CaptureMode) => void;
  hideOverlay: () => void;
  setMode: (mode: CaptureMode) => void;

  // Actions - Selection
  startSelection: () => void;
  updateSelection: (region: Region) => void;
  finishSelection: () => void;
  cancelSelection: () => void;

  // Actions - Screenshot
  setScreenshot: (screenshot: Screenshot) => void;
  clearScreenshot: () => void;
  addToHistory: (screenshot: Screenshot) => void;

  // Actions - Annotation
  setTool: (tool: AnnotationTool) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  updateAnnotationStyle: (style: Partial<AnnotationStyle>) => void;
  undoAnnotation: () => void;
  redoAnnotation: () => void;

  // Actions - UI
  setProcessing: (isProcessing: boolean) => void;

  // Actions - OCR
  setOCRLoading: (loading: boolean) => void;
  setOCRProgress: (progress: number) => void;
  setOCRResult: (result: OCRResult) => void;
  setOCRError: (error: string | null) => void;
  clearOCR: () => void;

  // Actions - Translation
  setTranslationLoading: (loading: boolean) => void;
  setTranslationResult: (result: TranslationResult) => void;
  setTranslationError: (error: string | null) => void;
  clearTranslation: () => void;

  // Helper actions - State reset
  resetAIState: () => void;
  resetEditorState: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  isOverlayActive: false,
  currentMode: 'capture',
  selectedRegion: null,
  isSelecting: false,
  currentScreenshot: null,
  screenshots: [],
  currentTool: 'rectangle', // Default to rectangle
  annotations: [],
  annotationStyle: {
    color: '#ff0000', // red (#ff0000)
    strokeWidth: 2,
    opacity: 1,
  },
  annotationHistory: [[]],
  annotationHistoryStep: 0,
  showToolbar: false,
  isProcessing: false,
  ocrResult: null,
  ocrLoading: false,
  ocrProgress: 0,
  ocrError: null,

  // Translation state
  translationResult: null,
  translationLoading: false,
  translationError: null,

  // Overlay actions
  showOverlay: (mode = 'capture') =>
    set((state) => {
      state.resetAIState();
      return {
        isOverlayActive: true,
        currentMode: mode,
        selectedRegion: null,
        isSelecting: false,
        showToolbar: false,
        currentScreenshot: null, // Clear previous screenshot to prevent editor overlap
      };
    }),

  hideOverlay: async () => {
    // Call backend to minimize/hide window
    try {
      const isTauri = !!window.__TAURI_INTERNALS__ || '__TAURI__' in window;

      if (isTauri) {
        const { invoke } = await import('@tauri-apps/api/core');
        const { getCurrentWindow } = await import('@tauri-apps/api/window');

        // Explicitly hide the window
        await getCurrentWindow().hide();

        // Also call backend command if needed for other cleanup
        await invoke('hide_overlay');
      }
    } catch (e) {
      console.error('Failed to hide overlay window:', e);
    }



    set((state) => {
      state.resetEditorState();
      return {
        isOverlayActive: false,
        selectedRegion: null,
        isSelecting: false,
        showToolbar: false,
      };
    });
  },

  setMode: (mode) => set({ currentMode: mode }),

  // Selection actions
  startSelection: () => set({ isSelecting: true }),

  updateSelection: (region) => set({ selectedRegion: region }),

  finishSelection: () =>
    set((state) => ({
      isSelecting: false,
      showToolbar: state.selectedRegion !== null,
    })),

  cancelSelection: () =>
    set({
      selectedRegion: null,
      isSelecting: false,
      showToolbar: false,
    }),

  // Screenshot actions
  setScreenshot: (screenshot) =>
    set({
      currentScreenshot: screenshot,
      isOverlayActive: false, // Hide overlay to show main window with screenshot
    }),

  clearScreenshot: () =>
    set((state) => {
      state.resetAIState();
      state.resetEditorState();
      return {};
    }),

  addToHistory: (screenshot) =>
    set((state) => ({
      screenshots: [screenshot, ...state.screenshots].slice(0, 10), // Keep last 10
    })),

  // Annotation actions
  setTool: (tool) => set({ currentTool: tool }),

  addAnnotation: (annotation) =>
    set((state) => {
      const newAnnotations = [...state.annotations, annotation];
      const newHistory = [...state.annotationHistory.slice(0, state.annotationHistoryStep + 1), newAnnotations];
      return {
        annotations: newAnnotations,
        annotationHistory: newHistory,
        annotationHistoryStep: state.annotationHistoryStep + 1,
      };
    }),

  updateAnnotation: (id, updates) =>
    set((state) => ({
      annotations: state.annotations.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  removeAnnotation: (id) =>
    set((state) => {
      const newAnnotations = state.annotations.filter((a) => a.id !== id);
      const newHistory = [...state.annotationHistory.slice(0, state.annotationHistoryStep + 1), newAnnotations];
      return {
        annotations: newAnnotations,
        annotationHistory: newHistory,
        annotationHistoryStep: state.annotationHistoryStep + 1,
      };
    }),

  clearAnnotations: () =>
    set({
      annotations: [],
      annotationHistory: [[]],
      annotationHistoryStep: 0,
    }),

  updateAnnotationStyle: (style) =>
    set((state) => ({
      annotationStyle: { ...state.annotationStyle, ...style },
    })),

  undoAnnotation: () =>
    set((state) => {
      if (state.annotationHistoryStep > 0) {
        return {
          annotationHistoryStep: state.annotationHistoryStep - 1,
          annotations: state.annotationHistory[state.annotationHistoryStep - 1] || [],
        };
      }
      return {}; // No update
    }),

  redoAnnotation: () =>
    set((state) => {
      if (state.annotationHistoryStep < state.annotationHistory.length - 1) {
        return {
          annotationHistoryStep: state.annotationHistoryStep + 1,
          annotations: state.annotationHistory[state.annotationHistoryStep + 1],
        };
      }
      return {}; // No update
    }),

  // UI actions
  setProcessing: (isProcessing) => set({ isProcessing }),

  // OCR actions
  setOCRLoading: (loading) => set({ ocrLoading: loading }),
  setOCRProgress: (progress) => set({ ocrProgress: progress }),
  setOCRResult: (result) =>
    set({ ocrResult: result, ocrLoading: false, ocrProgress: 100, ocrError: null }),
  setOCRError: (error) =>
    set({ ocrError: error, ocrLoading: false, ocrProgress: 0 }),
  clearOCR: () =>
    set({ ocrResult: null, ocrLoading: false, ocrProgress: 0, ocrError: null }),

  // Translation actions
  setTranslationLoading: (loading) => set({ translationLoading: loading }),
  setTranslationResult: (result) =>
    set({ translationResult: result, translationLoading: false, translationError: null }),
  setTranslationError: (error) =>
    set({ translationError: error, translationLoading: false }),
  clearTranslation: () =>
    set({ translationResult: null, translationLoading: false, translationError: null }),

  // Helper actions - State reset
  resetAIState: () =>
    set({
      ocrResult: null,
      ocrLoading: false,
      ocrProgress: 0,
      ocrError: null,
      translationResult: null,
      translationLoading: false,
      translationError: null,
    }),

  resetEditorState: () =>
    set({
      currentScreenshot: null,
      annotations: [],
      annotationHistory: [[]],
      annotationHistoryStep: 0,
      currentTool: 'rectangle',
    }),
}));

// Selectors for common state combinations
export const useOverlayState = () =>
  useAppStore(
    useShallow((state) => ({
      isActive: state.isOverlayActive,
      mode: state.currentMode,
      show: state.showOverlay,
      hide: state.hideOverlay,
      setMode: state.setMode,
    }))
  );

export const useSelectionState = () =>
  useAppStore(
    useShallow((state) => ({
      region: state.selectedRegion,
      isSelecting: state.isSelecting,
      start: state.startSelection,
      update: state.updateSelection,
      finish: state.finishSelection,
      cancel: state.cancelSelection,
    }))
  );

export const useScreenshotState = () =>
  useAppStore(
    useShallow((state) => ({
      current: state.currentScreenshot,
      history: state.screenshots,
      set: state.setScreenshot,
      clear: state.clearScreenshot,
      addToHistory: state.addToHistory,
    }))
  );

export const useAnnotationState = () =>
  useAppStore(
    useShallow((state) => ({
      tool: state.currentTool,
      annotations: state.annotations,
      style: state.annotationStyle,
      canUndo: state.annotationHistoryStep > 0,
      canRedo: state.annotationHistoryStep < state.annotationHistory.length - 1,
      setTool: state.setTool,
      add: state.addAnnotation,
      update: state.updateAnnotation,
      remove: state.removeAnnotation,
      clear: state.clearAnnotations,
      updateStyle: state.updateAnnotationStyle,
      undo: state.undoAnnotation,
      redo: state.redoAnnotation,
    }))
  );
