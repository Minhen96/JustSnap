import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Toolbar } from './Toolbar';
import { AskReactPanel } from '../ai/AskReactPanel';

export function ScreenshotEditor() {
  const [showAskReact, setShowAskReact] = useState(false);
  const currentScreenshot = useAppStore((state) => state.currentScreenshot);

  if (!currentScreenshot) return null;

  return (
    <div className="fixed inset-0 z-40 bg-gray-100 flex items-center justify-center overflow-hidden animate-fadeIn">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }} 
      />

      {/* Main Canvas Area */}
      <div className="relative shadow-2xl rounded-lg overflow-hidden max-w-[90vw] max-h-[85vh] border border-gray-200 bg-white">
        <img 
          src={currentScreenshot.imageData} 
          alt="Screenshot" 
          className="max-w-full max-h-full object-contain block"
        />
        
        {/* Annotation Canvas Layer will go here */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Konva Stage placeholder */}
        </div>
      </div>

      {/* Floating Toolbar */}
      <Toolbar />

      {/* Sidebar actions */}
      <div className="fixed right-6 top-28 z-40 flex flex-col gap-3">
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-3">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">AI Actions</p>
          <button
            onClick={() => setShowAskReact(true)}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition"
          >
            Ask React
          </button>
          <p className="text-[11px] text-gray-500 mt-2">
            Send this snip to Ask React for prompt + code JSON.
          </p>
        </div>
      </div>

      {showAskReact && (
        <AskReactPanel screenshot={currentScreenshot.imageData} onClose={() => setShowAskReact(false)} />
      )}
    </div>
  );
}
