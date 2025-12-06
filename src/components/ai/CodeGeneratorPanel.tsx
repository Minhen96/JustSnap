// JustSnap - Code Generator Panel (Signature Feature)
// Reference: use_case.md SC-13, feature_list.md lines 109-123

import { useState } from 'react';
import type { AICodeGeneration } from '../../types';

interface CodeGeneratorPanelProps {
  screenshot: string;
  onClose: () => void;
}

export function CodeGeneratorPanel({ screenshot, onClose }: CodeGeneratorPanelProps) {
  const [framework, setFramework] = useState<'react' | 'vue' | 'flutter' | 'html' | 'nextjs'>('react');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<AICodeGeneration | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // TODO: Call code generation service
    // TODO: Display in Monaco Editor
    setIsGenerating(false);
  };

  return (
    <div className="fixed right-4 top-20 w-[600px] bg-white rounded-lg shadow-xl p-4">
      <h3 className="font-semibold mb-4">Generate UI Code</h3>

      <div className="mb-4">
        <label className="block mb-2">Framework:</label>
        <select
          value={framework}
          onChange={(e) => setFramework(e.target.value as any)}
          className="w-full p-2 border rounded"
        >
          <option value="react">React + JSX</option>
          <option value="vue">Vue</option>
          <option value="flutter">Flutter</option>
          <option value="html">HTML + Tailwind</option>
          <option value="nextjs">Next.js</option>
        </select>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate Code'}
      </button>

      {generatedCode && (
        <div className="mt-4">
          {/* Monaco Editor will be embedded here */}
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <code>{generatedCode.code}</code>
          </pre>
        </div>
      )}

      <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">
        Close
      </button>
    </div>
  );
}
