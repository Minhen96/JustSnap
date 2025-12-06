// JustSnap - Ask React Panel
// Dedicated flow: generate prompt from snip -> generate React code JSON -> download/copy

import { useState } from 'react';
import { useAskReact } from '../../hooks/useAskReact';
import { exportText, generateFileName } from '../../utils/file';

interface AskReactPanelProps {
  screenshot: string; // base64 or object URL
  onClose: () => void;
}

export function AskReactPanel({ screenshot, onClose }: AskReactPanelProps) {
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
  } = useAskReact(screenshot);

  const handleGeneratePrompt = async () => {
    setCopyState('idle');
    await generatePrompt(userPrompt.trim() || undefined);
  };

  const handleGenerateCode = async () => {
    if (!generatedPrompt) return;
    setCopyState('idle');
    await generateCode(generatedPrompt.prompt);
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
    const fileName = generateFileName('ask-react');
    const propsText = codeResult.props
      ? Object.entries(codeResult.props)
          .map(([key, val]) => `- ${key}: ${val}`)
          .join('\n')
      : 'None';

    const fileContent = [
      `Ask React Result: ${codeResult.name}`,
      '',
      `Description: ${codeResult.description}`,
      '',
      `Prompt Used: ${generatedPrompt?.prompt || 'N/A'}`,
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

  return (
    <div className="fixed right-4 top-20 w-[440px] max-h-[80vh] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Ask React</p>
          <h3 className="text-lg font-semibold text-gray-900">Generate React from this snip</h3>
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

        {/* User prompt input */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">Optional guidance</label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Tell Ask React what you want (e.g., “create reusable card with CTA”)"
            className="w-full min-h-[80px] p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGeneratePrompt}
            disabled={isPromptLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
          >
            {isPromptLoading ? 'Generating prompt...' : 'Generate prompt'}
          </button>
          <button
            onClick={handleGenerateCode}
            disabled={!generatedPrompt || isCodeLoading}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
          >
            {isCodeLoading ? 'Generating code...' : 'Generate React code'}
          </button>
        </div>

        {/* Status */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Step 1</p>
            <p className="font-semibold text-gray-800">Prompt</p>
            <p className="text-gray-600 text-sm mt-1">
              {generatedPrompt
                ? 'Prompt ready'
                : isPromptLoading
                ? 'Analyzing snip...'
                : 'Awaiting generation'}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Step 2</p>
            <p className="font-semibold text-gray-800">React Code JSON</p>
            <p className="text-gray-600 text-sm mt-1">
              {codeResult
                ? 'Code ready'
                : isCodeLoading
                ? 'Generating...'
                : 'Requires prompt'}
            </p>
          </div>
        </div>

        {/* Output */}
        {generatedPrompt && (
          <div className="border border-blue-100 bg-blue-50 rounded-lg p-3">
            <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold mb-1">Generated prompt</p>
            <p className="text-sm text-blue-900 whitespace-pre-wrap">{generatedPrompt.prompt}</p>
          </div>
        )}

        {codeResult && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Component</p>
                <h4 className="text-base font-semibold text-gray-900">{codeResult.name}</h4>
                <p className="text-sm text-gray-600">{codeResult.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 text-sm hover:bg-gray-200"
                >
                  {copyState === 'copied' ? 'Copied' : 'Copy code'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-500"
                >
                  Download .txt
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg bg-gray-50">
              <pre className="overflow-auto p-3 text-sm text-gray-900 whitespace-pre-wrap">{codeResult.code}</pre>
            </div>

            {codeResult.styles && (
              <div className="border border-gray-200 rounded-lg bg-white p-3 text-sm text-gray-800">
                <p className="font-semibold mb-1">Styles</p>
                <pre className="whitespace-pre-wrap">{codeResult.styles}</pre>
              </div>
            )}

            {codeResult.props && (
              <div className="border border-gray-200 rounded-lg bg-white p-3 text-sm text-gray-800">
                <p className="font-semibold mb-1">Props</p>
                <ul className="list-disc pl-5 space-y-1">
                  {Object.entries(codeResult.props).map(([key, val]) => (
                    <li key={key}>
                      <span className="font-semibold">{key}</span>: {val}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
}
