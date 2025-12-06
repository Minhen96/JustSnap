import { useAppStore } from '../../store/appStore';
import { Toolbar } from './Toolbar';

export function ScreenshotEditor() {
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
    </div>
  );
}
