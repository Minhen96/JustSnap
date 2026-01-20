import type { StateCreator } from 'zustand';

export interface SettingsState {
    theme: 'light' | 'dark' | 'system';
    savePath: string | null;
    autoSave: boolean;
    hotkeys: Record<string, string>;

    // Actions
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setSavePath: (path: string) => void;
    setAutoSave: (enabled: boolean) => void;
    setHotkey: (action: string, hotkey: string) => void;
}

export const createSettingsSlice: StateCreator<SettingsState> = (set) => ({
    theme: 'system',
    savePath: null,
    autoSave: false,
    hotkeys: {
        'capture': 'Ctrl+Shift+S',
    },

    setTheme: (theme) => set({ theme }),
    setSavePath: (savePath) => set({ savePath }),
    setAutoSave: (autoSave) => set({ autoSave }),
    setHotkey: (action, hotkey) =>
        set((state) => ({
            hotkeys: { ...state.hotkeys, [action]: hotkey }
        })),
});
