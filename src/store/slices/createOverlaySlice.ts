import type { StateCreator } from 'zustand';
import type { CaptureMode } from '../../types';

export interface OverlayState {
    isOverlayActive: boolean;
    currentMode: CaptureMode;
    showToolbar: boolean; // Part of overlay logic? Yes.
    isProcessing: boolean;

    // Actions
    showOverlay: (mode?: CaptureMode) => void;
    hideOverlay: () => Promise<void>;
    setMode: (mode: CaptureMode) => void;
    toggleToolbar: (show: boolean) => void;
    setProcessing: (isProcessing: boolean) => void;
}

// We'll use a generic type P (Parent Store) that at least contains OverlayState
// and any other slices we interact with (e.g. resetAIState)
export const createOverlaySlice: StateCreator<OverlayState, [], [], OverlayState> = (set, get) => ({
    isOverlayActive: false,
    currentMode: 'capture',
    showToolbar: false,
    isProcessing: false,

    showOverlay: (mode = 'capture') => {
        // Call resetAIState() from AI slice
        const state = get() as any;
        if (state.resetAIState) state.resetAIState();

        set({
            isOverlayActive: true,
            currentMode: mode,
            showToolbar: false,
            currentScreenshot: null
        } as any);
    },

    hideOverlay: async () => {
        try {
            const isTauri = !!(window as any).__TAURI_INTERNALS__ || '__TAURI__' in window;

            if (isTauri) {
                const { invoke } = await import('@tauri-apps/api/core');
                const { getCurrentWindow } = await import('@tauri-apps/api/window');

                await getCurrentWindow().hide();
                await invoke('hide_overlay');
            }
        } catch (e) {
            console.error('Failed to hide overlay window:', e);
        }

        // Call resetEditorState()
        const state = get() as any;
        if (state.resetEditorState) state.resetEditorState();

        set({
            isOverlayActive: false,
            showToolbar: false,
        });
    },

    setMode: (mode) => set({ currentMode: mode }),
    toggleToolbar: (show) => set({ showToolbar: show }),
    setProcessing: (isProcessing) => set({ isProcessing }),
});
