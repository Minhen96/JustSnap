// JustSnap - Ask React Panel
// Dedicated flow: generate prompt from snip -> generate framework-specific code JSON -> download/copy

import { useEffect, useState } from 'react';
import { useAskReact } from '../../hooks/useAskReact';
import type { AskFramework } from '../../types';
import { AIPanelHeader } from './AIPanelHeader';
import { ScreenshotPreview } from './ScreenshotPreview';
import { CodeOutput } from './CodeOutput';
import { AIPanelResizeHandle } from './AIPanelResizeHandle';

interface AskReactPanelProps {
  screenshot: string; // base64 or object URL
  onClose: () => void;
  initialFramework?: AskFramework;
}

export function AskReactPanel({
  screenshot,
  onClose,
  initialFramework = 'react',
}: AskReactPanelProps) {
  const [framework, setFramework] = useState<AskFramework>(initialFramework);
  const [userPrompt, setUserPrompt] = useState('');

  const {
    generatedPrompt,
    codeResult,
    isPromptLoading,
    isCodeLoading,
    error,
    generatePrompt,
    generateCode,
    reset,
  } = useAskReact(screenshot, framework);

  useEffect(() => {
    reset();
  }, [framework, reset]);

  useEffect(() => {
    setFramework(initialFramework);
  }, [initialFramework]);

  const frameworkLabels: Record<AskFramework, string> = {
    react: 'React',
    vue: 'Vue',
    flutter: 'Flutter',
  };

  // Auto-run code generation when panel opens
  useEffect(() => {
    // Only run once when component mounts or when framework/screenshot changes
    if (isPromptLoading || isCodeLoading || codeResult) return;

    const runGeneration = async () => {
      // Step 1: Generate prompt
      const promptResult = await generatePrompt(userPrompt.trim() || undefined);
      if (!promptResult) return;

      // Step 2: Generate code immediately after prompt
      await generateCode(promptResult.prompt);
    };

    void runGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framework, screenshot]); // Only re-run when framework or screenshot changes

  const handleRegenerate = async () => {
    reset();

    // Step 1: Generate prompt
    const promptResult = await generatePrompt(userPrompt.trim() || undefined);
    if (!promptResult) return;

    await generateCode(promptResult.prompt);
  };

  return (
    <div className="fixed inset-0 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 flex flex-col pointer-events-auto overflow-hidden">
      <AIPanelHeader
        title={`Generate ${frameworkLabels[framework]} UI code`}
        subtitle="Autosaved to desktop"
        onClose={onClose}
      />

      <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
        <ScreenshotPreview screenshot={screenshot} />

        {/* Optional guidance - Full width */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">Optional guidance</label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Add notes (e.g., make the card reusable with CTA)"
            className="w-full min-h-[80px] p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Actions - Only Generate button */}
        <div>
          <button
            onClick={handleRegenerate}
            disabled={isPromptLoading || isCodeLoading}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-60 hover:bg-blue-700 transition-colors"
          >
            {isPromptLoading || isCodeLoading ? 'Generating code...' : `Generate ${frameworkLabels[framework]} code`}
          </button>
        </div>

        {/* Loading State */}
        {(isPromptLoading || isCodeLoading) && !codeResult && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm text-gray-600">
                {isPromptLoading ? 'Analyzing screenshot...' : 'Generating code...'}
              </p>
            </div>
          </div>
        )}

        {/* Code Output */}
        {codeResult && (
          <CodeOutput codeResult={codeResult} frameworkLabel={frameworkLabels[framework]} />
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      <AIPanelResizeHandle />
    </div>
  );
}
