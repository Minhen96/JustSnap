import type { StateCreator } from 'zustand';
import type { Annotation, AnnotationTool, AnnotationStyle } from '../../types';

export interface AnnotationState {
    currentTool: AnnotationTool;
    annotations: Annotation[];
    annotationStyle: AnnotationStyle;
    annotationHistory: Annotation[][];
    annotationHistoryStep: number;

    // Actions
    setTool: (tool: AnnotationTool) => void;
    addAnnotation: (annotation: Annotation) => void;
    updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
    removeAnnotation: (id: string) => void;
    clearAnnotations: () => void;
    updateAnnotationStyle: (style: Partial<AnnotationStyle>) => void;
    undoAnnotation: () => void;
    redoAnnotation: () => void;
    resetEditorState: () => void;
}

export const createAnnotationSlice: StateCreator<AnnotationState, [], [], AnnotationState> = (set) => ({
    currentTool: 'rectangle',
    annotations: [],
    annotationStyle: {
        color: '#ff0000',
        strokeWidth: 2,
        opacity: 1,
    },
    annotationHistory: [[]],
    annotationHistoryStep: 0,

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
            // Note: Update usually usually doesn't push to history in this app usage (live dragging), 
            // but if we want it to be undoable, we should. 
            // Current appStore.ts implementation did NOT update history on 'updateAnnotation'.
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
            return {};
        }),

    redoAnnotation: () =>
        set((state) => {
            if (state.annotationHistoryStep < state.annotationHistory.length - 1) {
                return {
                    annotationHistoryStep: state.annotationHistoryStep + 1,
                    annotations: state.annotationHistory[state.annotationHistoryStep + 1],
                };
            }
            return {};
        }),

    resetEditorState: () =>
        set({
            annotations: [],
            annotationHistory: [[]],
            annotationHistoryStep: 0,
            currentTool: 'rectangle',
            currentScreenshot: null,
        } as any),
});
