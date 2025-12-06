// JustSnap - OCR Results Panel
// Displays OCR extracted text with confidence scores

import { X, Copy, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../store/appStore';

interface OCRPanelProps {
  onClose: () => void;
}

export function OCRPanel({ onClose }: OCRPanelProps) {
  const ocrResult = useAppStore((state) => state.ocrResult);
  const ocrLoading = useAppStore((state) => state.ocrLoading);
  const ocrProgress = useAppStore((state) => state.ocrProgress);
  const ocrError = useAppStore((state) => state.ocrError);

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!ocrResult?.text) return;

    try {
      await navigator.clipboard.writeText(ocrResult.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const confidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const confidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

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
        {ocrLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
              <div
                className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                Processing Image...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {ocrProgress < 33
                  ? 'Analyzing text...'
                  : ocrProgress < 66
                  ? 'Optimizing accuracy...'
                  : 'Finalizing results...'}
              </p>
              <div className="mt-3 w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

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
        {ocrResult && !ocrLoading && !ocrError && (
          <>
            {/* Confidence Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${confidenceColor(
                  ocrResult.confidence
                )}`}
              >
                {confidenceLabel(ocrResult.confidence)} Confidence (
                {(ocrResult.confidence * 100).toFixed(0)}%)
              </span>
              {ocrResult.confidence < 0.7 && (
                <span className="text-xs text-gray-500">
                  Auto-retry applied
                </span>
              )}
            </div>

            {/* Extracted Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Extracted Text
                </label>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-900 whitespace-pre-wrap font-mono leading-relaxed">
                  {ocrResult.text || 'No text detected'}
                </p>
              </div>
            </div>

            {/* Text Blocks (if available) */}
            {ocrResult.blocks && ocrResult.blocks.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Detected Blocks ({ocrResult.blocks.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {ocrResult.blocks.map((block, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          Block {index + 1}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${confidenceColor(
                            block.confidence
                          )}`}
                        >
                          {(block.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 font-mono">
                        {block.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
