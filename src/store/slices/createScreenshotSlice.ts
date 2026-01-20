import type { StateCreator } from 'zustand';
import type { Screenshot } from '../../types';

export interface ScreenshotState {
    currentScreenshot: Screenshot | null;

    // Actions
    setScreenshot: (screenshot: Screenshot) => void;
    clearScreenshot: () => void;
}

export const createScreenshotSlice: StateCreator<ScreenshotState, [], [], ScreenshotState> = (set, get) => ({
    currentScreenshot: null,

    setScreenshot: (screenshot) =>
        set(() => ({
            currentScreenshot: screenshot,
            isOverlayActive: false, // Close overlay when we have a screenshot
        })),

    clearScreenshot: () => {
        // Call resetAIState() and resetEditorState()
        const state = get() as any;
        if (state.resetAIState) state.resetAIState();

        // resetEditorState also clears screenshot in AnnotationSlice logic, but we can double check
        if (state.resetEditorState) state.resetEditorState();
        else set({ currentScreenshot: null }); // Fallback
    },
});
