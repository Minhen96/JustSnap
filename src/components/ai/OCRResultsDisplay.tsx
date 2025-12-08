// JustSnap - OCR Results Display Component
// Shows extracted text with confidence scores and blocks

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { OCRResult } from '../../types';
import { getConfidenceColor, getConfidenceLabel, formatConfidencePercent } from '../../utils/confidence';

interface OCRResultsDisplayProps {
  ocrResult: OCRResult;
}

export function OCRResultsDisplay({ ocrResult }: OCRResultsDisplayProps) {
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

  return (
    <>
      {/* Confidence Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(
            ocrResult.confidence
          )}`}
        >
          {getConfidenceLabel(ocrResult.confidence)} Confidence (
          {formatConfidencePercent(ocrResult.confidence)})
        </span>
        {ocrResult.confidence < 0.7 && (
          <span className="text-xs text-gray-500">Auto-retry applied</span>
        )}
      </div>

      {/* Extracted Text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Extracted Text</label>
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
                    className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(
                      block.confidence
                    )}`}
                  >
                    {formatConfidencePercent(block.confidence)}
                  </span>
                </div>
                <p className="text-sm text-gray-900 font-mono">{block.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
