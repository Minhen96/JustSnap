// JustSnap - OCR Results Panel
// Displays OCR extracted text with confidence scores

import { X, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { OCRLoadingState } from './OCRLoadingState';
import { OCRResultsDisplay } from './OCRResultsDisplay';

interface OCRPanelProps {
  onClose: () => void;
}

export function OCRPanel({ onClose }: OCRPanelProps) {
  const ocrResult = useAppStore((state) => state.ocrResult);
  const ocrLoading = useAppStore((state) => state.ocrLoading);
  const ocrProgress = useAppStore((state) => state.ocrProgress);
  const ocrError = useAppStore((state) => state.ocrError);

  return (
    <div className="fixed right-4 top-4 w-96 max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 text-sm font-bold">OCR</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Text Recognition</h3>
            {ocrResult && (
              <p className="text-xs text-gray-500">English</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading State */}
        {ocrLoading && <OCRLoadingState progress={ocrProgress} />}

        {/* Error State */}
        {ocrError && !ocrLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">OCR Failed</p>
              <p className="text-xs text-gray-500 mt-1">{ocrError}</p>
            </div>
          </div>
        )}

        {/* Results State */}
        {ocrResult && !ocrLoading && !ocrError && <OCRResultsDisplay ocrResult={ocrResult} />}
      </div>
    </div>
  );
}
