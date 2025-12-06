// JustSnap - Translation Panel
// Reference: use_case.md line 80, tech_stack.md line 96

import { useState } from 'react';
import { X, Copy, Languages, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { translateText, type TranslationLanguage } from '../../services/translation.service';

interface TranslationPanelProps {
  onClose: () => void;
}

const LANGUAGES: { code: TranslationLanguage; name: string; flag: string }[] = [
  { code: 'en', name: 'EN', flag: '🇬🇧' },
  { code: 'zh', name: 'CN', flag: '🇨🇳' },
  { code: 'ms', name: 'MY', flag: '🇲🇾' },
];

export function TranslationPanel({ onClose }: TranslationPanelProps) {
  const ocrResult = useAppStore((state) => state.ocrResult);

  const translationResult = useAppStore((state) => state.translationResult);
  const translationLoading = useAppStore((state) => state.translationLoading);
  const translationError = useAppStore((state) => state.translationError);
  const setTranslationLoading = useAppStore((state) => state.setTranslationLoading);
  const setTranslationResult = useAppStore((state) => state.setTranslationResult);
  const setTranslationError = useAppStore((state) => state.setTranslationError);

  const [selectedLanguage, setSelectedLanguage] = useState<TranslationLanguage>('en');
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!ocrResult?.text) {
      setTranslationError('No text to translate');
      return;
    }

    setTranslationLoading(true);
    setTranslationError(null);

    try {
      const result = await translateText(ocrResult.text, selectedLanguage);
      setTranslationResult(result);
    } catch (error) {
      setTranslationError(error instanceof Error ? error.message : 'Translation failed');
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleCopy = async () => {
    if (translationResult?.translatedText) {
      await navigator.clipboard.writeText(translationResult.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasText = ocrResult && ocrResult.text.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Languages className="text-purple-600" size={20} />
            <h2 className="font-semibold text-gray-900">Translate</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          {!hasText ? (
            <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
              No text to translate.
            </p>
          ) : (
            <>
              {/* Language Selector */}
              <div className="flex gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`flex-1 p-2 rounded border transition-all ${
                      selectedLanguage === lang.code
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl">{lang.flag}</div>
                    <div className="text-xs font-medium mt-1">{lang.name}</div>
                  </button>
                ))}
              </div>

              {/* Source Text Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded p-2 max-h-32 overflow-y-auto">
                <p className="text-xs text-gray-600 whitespace-pre-wrap">
                  {ocrResult.text}
                </p>
              </div>

              {/* Translate Button */}
              <button
                onClick={handleTranslate}
                disabled={translationLoading}
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded font-medium transition-colors flex items-center justify-center gap-2"
              >
                {translationLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Translating...
                  </>
                ) : (
                  'Translate'
                )}
              </button>

              {/* Translating Feedback */}
              {translationLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="animate-spin text-blue-600" size={14} />
                    <span className="text-sm font-medium text-blue-700">Processing...</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '100%' }} />
                  </div>
                </div>
              )}

              {/* Error Display */}
              {translationError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  {translationError}
                </p>
              )}

              {/* Translation Result */}
              {translationResult && !translationLoading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {translationResult.detectedSourceLanguage} → {LANGUAGES.find(l => l.code === translationResult.targetLanguage)?.name}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Copy size={12} />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-3 max-h-48 overflow-y-auto">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {translationResult.translatedText}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
