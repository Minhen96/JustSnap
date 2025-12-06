// JustSnap - Ask React Panel
// Dedicated flow: generate prompt from snip -> generate framework-specific code JSON -> download/copy

import { useEffect, useState } from 'react';
import { useAskReact } from '../../hooks/useAskReact';
import { exportText, generateFileName } from '../../utils/file';
import type { AskFramework } from '../../types';

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
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

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
    setCopyState('idle');
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

  const handleCopy = async () => {
    if (!codeResult?.code) return;
    try {
      await navigator.clipboard.writeText(codeResult.code);
      setCopyState('copied');
    } catch (err) {
      console.error('Copy failed', err);
      setCopyState('error');
    }
  };

  const handleDownload = () => {
    if (!codeResult) return;
    const fileName = generateFileName(`ask-${framework}`);
    const propsText = codeResult.props
      ? Object.entries(codeResult.props)
          .map(([key, val]) => `- ${key}: ${val}`)
          .join('\n')
      : 'None';

    const fileContent = [
      `Ask ${frameworkLabels[framework]} Result: ${codeResult.name}`,
      '',
      `Description: ${codeResult.description}`,
      '',
      `Framework: ${frameworkLabels[framework]}`,
      '',
      `Image analysis used: ${generatedPrompt?.prompt || 'N/A'}`,
      '',
      'Props:',
      propsText,
      '',
      'Styles:',
      codeResult.styles || 'None',
      '',
      'Code:',
      codeResult.code,
    ].join('\n');

    exportText(fileContent, fileName, 'txt');
  };

  // Auto-run code generation when panel opens
  useEffect(() => {
    // Only run once when component mounts or when framework/screenshot changes
    if (isPromptLoading || isCodeLoading || codeResult) return;
    
    const runGeneration = async () => {
      setCopyState('idle');
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
    setCopyState('idle');
    reset();
    
    // Step 1: Generate prompt
    const promptResult = await generatePrompt(userPrompt.trim() || undefined);
    if (!promptResult) return;
    
    // Step 2: Generate code
    await generateCode(promptResult.prompt);
  };

  return (
    <div
      className="fixed inset-0 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 flex flex-col pointer-events-auto overflow-hidden"
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100 select-none cursor-move"
        data-tauri-drag-region
      >
        <div data-tauri-drag-region>
          <h3 className="text-lg font-semibold text-gray-900">Generate {frameworkLabels[framework]} UI code</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1 rounded-md hover:bg-gray-50"
        >
          Close
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
        {/* Preview */}
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img
            src={screenshot}
            alt="Captured screenshot preview"
            className="w-full h-40 object-contain bg-white"
          />
          <div className="absolute bottom-2 right-2 text-[11px] bg-black/70 text-white px-2 py-1 rounded-full">
            Snip attached
          </div>
        </div>

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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  {frameworkLabels[framework]} result
                </p>
                <h4 className="text-base font-semibold text-gray-900">{codeResult.name}</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 text-sm hover:bg-gray-200"
                >
                  {copyState === 'copied' ? 'Copied ✓' : 'Copy code'}
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg bg-gray-50">
              <pre className="overflow-auto p-3 text-sm text-gray-900 whitespace-pre-wrap max-h-[400px]">{codeResult.code}</pre>
            </div>

            {codeResult.styles && (
              <div className="border border-gray-200 rounded-lg bg-white p-3 text-sm text-gray-800">
                <p className="font-semibold mb-1">Styles</p>
                <pre className="whitespace-pre-wrap max-h-[200px] overflow-auto">{codeResult.styles}</pre>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
