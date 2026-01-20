import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { createSettingsSlice, type SettingsState } from '../createSettingsSlice';

const useTestStore = create<SettingsState>((...a) => ({
    ...createSettingsSlice(...a),
}));

describe('Settings Slice', () => {
    it('should have default state', () => {
        const state = useTestStore.getState();
        expect(state.theme).toBe('system');
        expect(state.autoSave).toBe(false);
    });

    it('should update theme', () => {
        const store = useTestStore;
        store.getState().setTheme('dark');
        expect(store.getState().theme).toBe('dark');
    });

    it('should update save path', () => {
        const store = useTestStore;
        store.getState().setSavePath('C:/Test');
        expect(store.getState().savePath).toBe('C:/Test');
    });

    it('should toggle auto save', () => {
        const store = useTestStore;
        store.getState().setAutoSave(true);
        expect(store.getState().autoSave).toBe(true);
    });

    it('should update hotkeys', () => {
        const store = useTestStore;
        store.getState().setHotkey('capture', 'Ctrl+A');
        expect(store.getState().hotkeys['capture']).toBe('Ctrl+A');
    });
});
