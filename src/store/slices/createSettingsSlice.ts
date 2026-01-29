import type { StateCreator } from 'zustand';
import type { AnnotationTool } from '../../types';
import {
    type ToolbarConfig,
    type ToolbarItemId,
    type ToolbarGroupId,
    DEFAULT_TOOLBAR_CONFIG
} from '../toolbarConfig';

export interface SettingsState {
    theme: 'light' | 'dark' | 'system';
    savePath: string | null;
    autoSave: boolean;
    hotkeys: Record<string, string>;
    toolbarConfig: ToolbarConfig;
    defaultTool: AnnotationTool;
    colorPalette: string[];
    defaultStrokeWidth: number;
    autoCloseAfterCopy: boolean;
    autoCloseAfterSave: boolean;

    // Actions
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setSavePath: (path: string) => void;
    setAutoSave: (enabled: boolean) => void;
    setHotkey: (action: string, hotkey: string) => void;
    setDefaultTool: (tool: AnnotationTool) => void;
    setColorPalette: (colors: string[]) => void;
    setDefaultStrokeWidth: (width: number) => void;
    setAutoCloseAfterCopy: (enabled: boolean) => void;
    setAutoCloseAfterSave: (enabled: boolean) => void;

    // Toolbar customization
    setToolbarItemEnabled: (groupId: ToolbarGroupId, itemId: ToolbarItemId, enabled: boolean) => void;
    reorderToolbarItems: (groupId: ToolbarGroupId, newOrder: ToolbarItemId[]) => void;
    resetToolbarConfig: () => void;
}

export const createSettingsSlice: StateCreator<SettingsState> = (set) => ({
    theme: 'system',
    savePath: null,
    autoSave: false,
    hotkeys: {
        'capture': 'Ctrl+Shift+S',
    },
    toolbarConfig: DEFAULT_TOOLBAR_CONFIG,
    defaultTool: 'rectangle',
    colorPalette: ['#FF0000', '#00FF00', '#0000FF', '#000000'],
    defaultStrokeWidth: 4,
    autoCloseAfterCopy: true,
    autoCloseAfterSave: true,

    setTheme: (theme) => set({ theme }),
    setSavePath: (savePath) => set({ savePath }),
    setAutoSave: (autoSave) => set({ autoSave }),
    setHotkey: (action, hotkey) =>
        set((state) => ({
            hotkeys: { ...state.hotkeys, [action]: hotkey }
        })),
    setDefaultTool: (tool) => set({ defaultTool: tool }),
    setColorPalette: (colors) => set({ colorPalette: colors }),
    setDefaultStrokeWidth: (width) => set({ defaultStrokeWidth: width }),
    setAutoCloseAfterCopy: (enabled) => set({ autoCloseAfterCopy: enabled }),
    setAutoCloseAfterSave: (enabled) => set({ autoCloseAfterSave: enabled }),

    setToolbarItemEnabled: (groupId, itemId, enabled) =>
        set((state) => ({
            toolbarConfig: {
                ...state.toolbarConfig,
                groups: state.toolbarConfig.groups.map((group) =>
                    group.id === groupId
                        ? {
                            ...group,
                            items: group.items.map((item) =>
                                item.id === itemId ? { ...item, enabled } : item
                            ),
                        }
                        : group
                ),
            },
        })),

    reorderToolbarItems: (groupId, newOrder) =>
        set((state) => ({
            toolbarConfig: {
                ...state.toolbarConfig,
                groups: state.toolbarConfig.groups.map((group) =>
                    group.id === groupId
                        ? {
                            ...group,
                            items: newOrder.map((id) =>
                                group.items.find((item) => item.id === id)!
                            ),
                        }
                        : group
                ),
            },
        })),

    resetToolbarConfig: () => set({ toolbarConfig: DEFAULT_TOOLBAR_CONFIG }),
});
