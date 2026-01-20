// JustSnap - Global App State (Zustand Store)
// Refactored to Slice Pattern

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { devtools, persist } from 'zustand/middleware';

import { type AppState } from './types';
import { createSettingsSlice } from './slices/createSettingsSlice';
import { createOverlaySlice } from './slices/createOverlaySlice';
import { createSelectionSlice } from './slices/createSelectionSlice';
import { createScreenshotSlice } from './slices/createScreenshotSlice';
import { createAnnotationSlice } from './slices/createAnnotationSlice';
import { createAISlice } from './slices/createAISlice';

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        ...createSettingsSlice(...a),
        ...createOverlaySlice(...a),
        ...createSelectionSlice(...a),
        ...createScreenshotSlice(...a),
        ...createAnnotationSlice(...a),
        ...createAISlice(...a),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          theme: state.theme,
          savePath: state.savePath,
          autoSave: state.autoSave,
          hotkeys: state.hotkeys,
          // We can persist other things if we want, like annotationStyle
        }),
      }
    )
  )
);

// Selectors for common state combinations (Backward Compatibility)

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
      set: state.setScreenshot,
      clear: state.clearScreenshot,
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
