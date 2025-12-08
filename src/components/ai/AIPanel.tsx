// JustSnap - Unified AI Panel Component
// Replaces: AIChatPanel, SummaryPanel, CodeGeneratorPanel

import { ReactNode } from 'react';
import { X } from 'lucide-react';

type PanelWidth = 'normal' | 'wide';

interface AIPanelProps {
  title: string;
  width?: PanelWidth;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

const PANEL_WIDTHS: Record<PanelWidth, string> = {
  normal: 'w-96',
  wide: 'w-[600px]',
};

export function AIPanel({
  title,
  width = 'normal',
  onClose,
  children,
  className = '',
}: AIPanelProps) {
  return (
    <div
      className={`fixed right-4 top-20 bg-white rounded-lg shadow-xl p-6 ${PANEL_WIDTHS[width]} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          title="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Convenience components for specific panel types
interface AIChatPanelProps {
  screenshot: string;
  onClose: () => void;
}

export function AIChatPanel({ screenshot, onClose }: AIChatPanelProps) {
  return (
    <AIPanel title="AI Chat" onClose={onClose}>
      {/* TODO: Implement AI chat interface */}
      {/* TODO: Send screenshot + user question to OpenAI */}
      {/* TODO: Display conversation history */}
      <div className="text-gray-500 text-sm">
        Chat interface coming soon...
      </div>
    </AIPanel>
  );
}

interface SummaryPanelProps {
  summary: {
    summary: string;
    keyPoints: string[];
    timestamp: number;
  } | null;
  isLoading: boolean;
  onClose: () => void;
}

export function SummaryPanel({
  summary,
  isLoading,
  onClose,
}: SummaryPanelProps) {
  return (
    <AIPanel title="AI Summary" onClose={onClose}>
      {isLoading && (
        <div className="text-gray-500">Generating summary...</div>
      )}

      {summary && (
        <>
          <p className="text-gray-700">{summary.summary}</p>
          <div>
            <h4 className="font-medium mb-2">Key Points:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {summary.keyPoints.map((point, i) => (
                <li key={i} className="text-gray-700">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </AIPanel>
  );
}

interface CodeGeneratorPanelProps {
  screenshot: string;
  onClose: () => void;
  framework?: 'react' | 'vue' | 'flutter' | 'html' | 'nextjs';
  onGenerate?: (framework: string) => void;
}

export function CodeGeneratorPanel({
  screenshot,
  onClose,
  framework: initialFramework = 'react',
  onGenerate,
}: CodeGeneratorPanelProps) {
  const [framework, setFramework] = React.useState(initialFramework);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedCode, setGeneratedCode] = React.useState<{
    framework: string;
    code: string;
    styles: string;
    dependencies: string[];
    fileName: string;
  } | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // TODO: Call code generation service
    onGenerate?.(framework);
    // TODO: Display in Monaco Editor
    setIsGenerating(false);
  };

  return (
    <AIPanel title="Generate UI Code" width="wide" onClose={onClose}>
      <div>
        <label className="block mb-2 font-medium">Framework:</label>
        <select
          value={framework}
          onChange={(e) => setFramework(e.target.value as any)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? 'Generating...' : 'Generate Code'}
      </button>

      {generatedCode && (
        <div>
          {/* Monaco Editor will be embedded here */}
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
            <code>{generatedCode.code}</code>
          </pre>
        </div>
      )}
    </AIPanel>
  );
}

import React from 'react';
