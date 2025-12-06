// JustSnap - Ask React Panel
// Dedicated flow: generate prompt from snip -> generate framework-specific code JSON -> download/copy

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useAskReact } from '../../hooks/useAskReact';
import { exportText, generateFileName } from '../../utils/file';
import type { AskFramework } from '../../types';

interface AskReactPanelProps {
  screenshot: string; // base64 or object URL
  onClose: () => void;
  initialFramework?: AskFramework;
  autoRun?: boolean;
}

export function AskReactPanel({
  screenshot,
  onClose,
  initialFramework = 'react',
  autoRun = false,
}: AskReactPanelProps) {
  const [framework, setFramework] = useState<AskFramework>(initialFramework);
  const [userPrompt, setUserPrompt] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [autoRunRequested, setAutoRunRequested] = useState(autoRun);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 60 });
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number; dragging: boolean }>({
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    dragging: false,
  });

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
    setAutoRunRequested(autoRun);
  }, [initialFramework, autoRun]);

  // Initialize position near top-right after first render
  useEffect(() => {
    const width = 460; // panel width estimate
    const margin = 24;
    const x = Math.max(margin, window.innerWidth - width - margin);
    const y = 60;
    setPosition({ x, y });
  }, []);

  // Drag handling
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragState.current.dragging) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      const width = 460;
      const height = 520;
      const margin = 8;
      const nextX = Math.min(Math.max(margin, dragState.current.originX + dx), window.innerWidth - width - margin);
      const nextY = Math.min(Math.max(margin, dragState.current.originY + dy), window.innerHeight - margin - height);
      setPosition({ x: nextX, y: nextY });
    };

    const handleUp = () => {
      if (dragState.current.dragging) {
        dragState.current.dragging = false;
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  const startDrag = (e: ReactMouseEvent) => {
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
      dragging: true,
    };
  };

  const frameworkLabels: Record<AskFramework, string> = {
    react: 'React',
    vue: 'Vue',
    flutter: 'Flutter',
  };
  const frameworkOptions: Array<{ value: AskFramework; label: string; hint: string }> = [
    { value: 'react', label: 'React', hint: 'TSX + Tailwind' },
    { value: 'vue', label: 'Vue', hint: 'Vue 3 SFC' },
    { value: 'flutter', label: 'Flutter', hint: 'Dart widget' },
  ];

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

  // Auto-run pipeline when triggered externally (toolbar)
  useEffect(() => {
    if (!autoRunRequested) return;
    if (isPromptLoading || generatedPrompt) return;
    setCopyState('idle');
    reset();
    void generatePrompt(userPrompt.trim() || undefined);
  }, [autoRunRequested, isPromptLoading, generatedPrompt, generatePrompt, reset, userPrompt]);

  useEffect(() => {
    if (!autoRunRequested) return;
    if (!generatedPrompt || codeResult || isCodeLoading) return;
    void generateCode(generatedPrompt.prompt);
  }, [autoRunRequested, generatedPrompt, codeResult, isCodeLoading, generateCode]);

  useEffect(() => {
    if (autoRunRequested && codeResult) {
      setAutoRunRequested(false);
    }
  }, [autoRunRequested, codeResult]);

  return (
    <div
      className="fixed w-[440px] max-h-[80vh] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 flex flex-col pointer-events-auto"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-move select-none"
        onMouseDown={startDrag}
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Ask AI</p>
          <h3 className="text-lg font-semibold text-gray-900">Generate UI code from this snip</h3>
          <p className="text-sm text-gray-600">Pick React, Vue, or Flutter and run analysis + code generation.</p>
        </div>
        <button
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
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

        {/* Framework selector + optional guidance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Target framework</label>
            <div className="relative">
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value as AskFramework)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {frameworkOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.hint}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-2.5 text-gray-500 text-xs">v</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Optional guidance</label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Add notes (e.g., make the card reusable with CTA)"
              className="w-full min-h-[80px] p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGeneratePrompt}
            disabled={isPromptLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
          >
            {isPromptLoading ? 'Analyzing...' : 'Analyze snip'}
          </button>
          <button
            onClick={handleGenerateCode}
            disabled={!generatedPrompt || isCodeLoading}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
          >
            {isCodeLoading ? 'Generating code...' : `Generate ${frameworkLabels[framework]} code`}
          </button>
        </div>

        {/* Status */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Step 1</p>
            <p className="font-semibold text-gray-800">Image analysis</p>
            <p className="text-gray-600 text-sm mt-1">
              {generatedPrompt
                ? 'Analysis ready'
                : isPromptLoading
                ? 'Analyzing snip...'
                : 'Awaiting generation'}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Step 2</p>
            <p className="font-semibold text-gray-800">{frameworkLabels[framework]} code JSON</p>
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
            <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold mb-1">Generated analysis</p>
            <p className="text-sm text-blue-900 whitespace-pre-wrap">{generatedPrompt.prompt}</p>
          </div>
        )}

        {codeResult && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  {frameworkLabels[framework]} result
                </p>
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
