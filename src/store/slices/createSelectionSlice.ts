import type { StateCreator } from 'zustand';
import type { Region } from '../../types';

export interface SelectionState {
    selectedRegion: Region | null;
    isSelecting: boolean;
    isSmartSelectActive: boolean;

    // Actions
    startSelection: () => void;
    updateSelection: (region: Region) => void;
    finishSelection: () => void;
    cancelSelection: () => void;
    toggleSmartSelect: () => void;
}

// We assume the store also has OverlayState (for showToolbar)
export const createSelectionSlice: StateCreator<SelectionState, [], [], SelectionState> = (set, get) => ({
    selectedRegion: null,
    isSelecting: false,
    isSmartSelectActive: true,

    startSelection: () => set({ isSelecting: true }),

    updateSelection: (region) => set({ selectedRegion: region }),

    finishSelection: () => {
        const region = get().selectedRegion;
        // We need to update showToolbar which is in OverlayState
        // We can do this by calling set() with the property if we assume it exists on the store
        // or by calling an action from OverlayState if available.
        // Ideally, we shouldn't couple them too tightly, but showToolbar is UI state dependent on selection.

        set(() => ({
            isSelecting: false,
            showToolbar: region !== null,
        }));
    },

    cancelSelection: () => set(() => ({
        selectedRegion: null,
        isSelecting: false,
        showToolbar: false,
    })),

    toggleSmartSelect: () => set((state) => ({ isSmartSelectActive: !state.isSmartSelectActive })),
});
