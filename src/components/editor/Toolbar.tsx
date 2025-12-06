import {
  Pencil,
  Square,
  Circle,
  ArrowRight,
  Type,
  Eraser,
  Download,
  Copy,
  X,
  Undo,
  Redo,
  MousePointer2,
  ScanText
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import type { AnnotationTool } from '../../types';
import { extractText } from '../../services/ocr.service';
import { OCRPanel } from '../ai/OCRPanel';

export function Toolbar() {
  const currentTool = useAppStore((state) => state.currentTool);
  const setTool = useAppStore((state) => state.setTool);
  const hideOverlay = useAppStore((state) => state.hideOverlay);
  const currentScreenshot = useAppStore((state) => state.currentScreenshot);
  const ocrLoading = useAppStore((state) => state.ocrLoading);
  const ocrResult = useAppStore((state) => state.ocrResult);
  const setOCRLoading = useAppStore((state) => state.setOCRLoading);
  const setOCRProgress = useAppStore((state) => state.setOCRProgress);
  const setOCRResult = useAppStore((state) => state.setOCRResult);
  const setOCRError = useAppStore((state) => state.setOCRError);

  const [showOCRPanel, setShowOCRPanel] = useState(false);

  const tools: { id: AnnotationTool; icon: React.ElementType; label: string }[] = [
    { id: 'rectangle', icon: Square, label: 'Rect' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
    { id: 'none', icon: MousePointer2, label: 'Select' },
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  const handleCopy = async () => {
    // TODO: Implement copy to clipboard
    console.log('Copy to clipboard');
  };

  const handleSave = async () => {
    // TODO: Implement save to file
    console.log('Save to file');
  };

  const handleOCR = async () => {
    // If OCR already complete, show panel
    if (ocrResult) {
      setShowOCRPanel(true);
      return;
    }

    // If already loading, show panel to see progress
    if (ocrLoading) {
      setShowOCRPanel(true);
      return;
    }

    // Start OCR
    if (!currentScreenshot?.imageData) {
      console.error('No screenshot available for OCR');
      return;
    }

    setOCRLoading(true);
    setShowOCRPanel(true);

    try {
      const result = await extractText(
        currentScreenshot.imageData,
        (progress) => setOCRProgress(progress)
      );
      setOCRResult(result);
    } catch (error) {
      console.error('OCR failed:', error);
      setOCRError(error instanceof Error ? error.message : 'OCR failed');
    }
  };

  return (
    <>
      {/* OCR Results Panel */}
      {showOCRPanel && <OCRPanel onClose={() => setShowOCRPanel(false)} />}

      {/* Toolbar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-2 flex items-center gap-2 border border-white/20 animate-slideUp z-50">
      {/* Tools Group */}
      <div className="flex items-center gap-1 pr-4 border-r border-gray-200">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setTool(tool.id)}
            className={`
              p-2.5 rounded-xl transition-all duration-200 group relative
              ${currentTool === tool.id 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }
            `}
            title={tool.label}
          >
            <tool.icon size={20} />
            
            {/* Tooltip */}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {tool.label}
            </span>
          </button>
        ))}
      </div>

      {/* Actions Group */}
      <div className="flex items-center gap-1 pl-2">
        <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" title="Undo">
          <Undo size={20} />
        </button>
        <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" title="Redo">
          <Redo size={20} />
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* OCR Button with Border Loading Animation */}
        <button
          onClick={handleOCR}
          className={`
            relative p-2.5 rounded-xl transition-all duration-200 group
            ${ocrResult
              ? 'text-green-600 hover:bg-green-50'
              : ocrLoading
              ? 'text-blue-600 hover:bg-blue-50'
              : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
            }
          `}
          title={ocrResult ? 'View OCR Results (Ready)' : ocrLoading ? 'OCR Processing...' : 'Extract Text (OCR)'}
        >
          {/* Border Loading Animation */}
          {ocrLoading && (
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <div className="absolute inset-0 border-2 border-transparent rounded-xl animate-spin-slow"
                style={{
                  borderTopColor: '#3b82f6',
                  borderRightColor: '#3b82f6',
                  animation: 'spin 2s linear infinite'
                }}
              />
            </div>
          )}

          {/* Ready Indicator */}
          {ocrResult && !ocrLoading && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}

          <ScanText size={20} className="relative z-10" />

          {/* Tooltip */}
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {ocrResult ? 'View OCR Results' : ocrLoading ? 'Processing...' : 'Extract Text'}
          </span>
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        <button 
          onClick={handleCopy}
          className="p-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors" 
          title="Copy to Clipboard"
        >
          <Copy size={20} />
        </button>
        
        <button 
          onClick={handleSave}
          className="p-2.5 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl transition-colors" 
          title="Save Image"
        >
          <Download size={20} />
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        <button 
          onClick={hideOverlay}
          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors" 
          title="Close"
        >
          <X size={20} />
        </button>
      </div>
    </div>
    </>
  );
}
