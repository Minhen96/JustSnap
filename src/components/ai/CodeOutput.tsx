// JustSnap - Code Output Component
// Displays generated code with copy functionality

import { useState } from 'react';
import type { AskFrameworkCodeResult } from '../../types';

interface CodeOutputProps {
  codeResult: AskFrameworkCodeResult;
  frameworkLabel: string;
}

export function CodeOutput({ codeResult, frameworkLabel }: CodeOutputProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopy = async () => {
    if (!codeResult?.code) return;
    try {
      await navigator.clipboard.writeText(codeResult.code);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch (err) {
      console.error('Copy failed', err);
      setCopyState('error');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
            {frameworkLabel} result
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
        <pre className="overflow-auto p-3 text-sm text-gray-900 whitespace-pre-wrap max-h-[400px]">
          {codeResult.code}
        </pre>
      </div>

      {codeResult.styles && (
        <div className="border border-gray-200 rounded-lg bg-white p-3 text-sm text-gray-800">
          <p className="font-semibold mb-1">Styles</p>
          <pre className="whitespace-pre-wrap max-h-[200px] overflow-auto">
            {codeResult.styles}
          </pre>
        </div>
      )}
    </div>
  );
}
