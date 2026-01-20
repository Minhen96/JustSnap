import type { StateCreator } from 'zustand';
import type { OCRResult, TranslationResult } from '../../types';

export interface AIState {
    // OCR state
    ocrResult: OCRResult | null;
    ocrLoading: boolean;
    ocrProgress: number; // 0-100
    ocrError: string | null;

    // Translation state
    translationResult: TranslationResult | null;
    translationLoading: boolean;
    translationError: string | null;

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

    // Helper actions
    resetAIState: () => void;
}

export const createAISlice: StateCreator<AIState, [], [], AIState> = (set) => ({
    ocrResult: null,
    ocrLoading: false,
    ocrProgress: 0,
    ocrError: null,

    translationResult: null,
    translationLoading: false,
    translationError: null,

    setOCRLoading: (loading) => set({ ocrLoading: loading }),
    setOCRProgress: (progress) => set({ ocrProgress: progress }),
    setOCRResult: (result) =>
        set({ ocrResult: result, ocrLoading: false, ocrProgress: 100, ocrError: null }),
    setOCRError: (error) =>
        set({ ocrError: error, ocrLoading: false, ocrProgress: 0 }),
    clearOCR: () =>
        set({ ocrResult: null, ocrLoading: false, ocrProgress: 0, ocrError: null }),

    setTranslationLoading: (loading) => set({ translationLoading: loading }),
    setTranslationResult: (result) =>
        set({ translationResult: result, translationLoading: false, translationError: null }),
    setTranslationError: (error) =>
        set({ translationError: error, translationLoading: false }),
    clearTranslation: () =>
        set({ translationResult: null, translationLoading: false, translationError: null }),

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
});
