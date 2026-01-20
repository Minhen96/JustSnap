import type { SettingsState } from './slices/createSettingsSlice';
import type { OverlayState } from './slices/createOverlaySlice';
import type { SelectionState } from './slices/createSelectionSlice';
import type { ScreenshotState } from './slices/createScreenshotSlice';
import type { AnnotationState } from './slices/createAnnotationSlice';
import type { AIState } from './slices/createAISlice';

export type AppState = SettingsState & OverlayState & SelectionState & ScreenshotState & AnnotationState & AIState;
