// JustSnap - Code Preview Component
// Preview generated UI code with export options

import { MonacoEditor } from './MonacoEditor';
import type { AICodeGeneration } from '../../types';

interface CodePreviewProps {
  codeGen: AICodeGeneration;
  onExport: () => void;
  onClose: () => void;
}

export function CodePreview({ codeGen, onExport, onClose }: CodePreviewProps) {
  const getLanguage = (framework: string) => {
    switch (framework) {
      case 'react':
      case 'nextjs':
        return 'typescript';
      case 'vue':
        return 'vue';
      case 'flutter':
        return 'dart';
      case 'html':
        return 'html';
      default:
        return 'typescript';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-[800px] h-[600px] p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Generated Code - {codeGen.framework}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <MonacoEditor code={codeGen.code} language={getLanguage(codeGen.framework)} readOnly />

        <div className="mt-4 flex gap-2">
          <button onClick={onExport} className="px-4 py-2 bg-blue-500 text-white rounded">
            Export as ZIP
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
