
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';

interface Dimensions {
  width: number;
  height: number;
}

export function StickyWindow() {
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });

  useEffect(() => {
    // 1. Get the injected image data URL
    // No file system access needed
    const src = (window as any).__STICKY_IMAGE_SRC__;
    console.log("Sticky Source Found:", !!src);
    
    if (src) {
       setImagePath(src);
       
       const img = new Image();
       img.onload = () => {
           console.log("Sticky Image Loaded:", img.width, img.height);
           setAspectRatio(img.width / img.height);
           const w = window.innerWidth;
           const h = window.innerHeight;
           setDimensions({ width: w, height: h });
       };
       img.onerror = (e) => {
           console.error("Sticky Image Failed:", e);
       };
       img.src = src;
    } else {
       console.error("No sticky path found on window object");
    }

    // 2. Setup Resize Listener (Same logic as ScreenshotEditor)
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = async () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Immediate fill
        setDimensions({ width, height });

        const currentRatio = width / height;

        // Debounced Snap
        if (aspectRatio && Math.abs(currentRatio - aspectRatio) > 0.02) {
             clearTimeout(resizeTimeout);
             resizeTimeout = setTimeout(async () => {
                 const newHeight = Math.round(width / aspectRatio);
                 const win = getCurrentWindow();
                 try {
                     await win.setSize(new LogicalSize(width, newHeight));
                 } catch (e) { console.error(e); }
             }, 100); 
        }
    };

    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimeout);
    };
  }, [aspectRatio]);

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(true);

  const handleDrag = () => {
     // @ts-expect-error - startDragging is available in Tauri v2
     getCurrentWindow().startDragging();
  };
  
  const handleResizeStart = () => {
    // @ts-expect-error - startResizing is available in Tauri v2
    getCurrentWindow().startResizing('BottomRight');
  };

  const handleTogglePin = async () => {
      const win = getCurrentWindow();
      const newState = !isPinned;
      setIsPinned(newState);
      await win.setAlwaysOnTop(newState);
  };

  const handleClose = async () => {
      console.log("Closing Sticky Window...");
      try {
        await invoke('close_window');
      } catch (e) {
        console.error("Failed to close sticky window via command", e);
        const win = getCurrentWindow();
        await win.close();
      }
  };

  if (!imagePath) return <div className="p-4 text-white">Loading Stick...</div>;

  return (
    <div 
        className="relative w-screen h-screen overflow-hidden bg-transparent group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
        {/* Main Image Layer */}
        <img 
            src={imagePath} 
            alt="Sticky"
            className="absolute top-0 left-0 w-full h-full object-fill select-none pointer-events-none"
        />
        
        {/* Drag Overlay - Middle Layer */}
        <div 
           className="absolute inset-0 z-10 cursor-move"
           onMouseDown={handleDrag}
        />

        {/* Controls - Top Layer (z-50) */}
        <div 
            className={`absolute top-2 right-2 z-50 flex gap-2 pointer-events-auto transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
             {/* Pin Toggle Button */}
             <button
                onClick={handleTogglePin}
                className={`p-1.5 rounded-full backdrop-blur-sm transition-colors cursor-pointer ${
                    isPinned 
                    ? 'bg-blue-600/80 text-white hover:bg-blue-700' 
                    : 'bg-black/50 text-gray-300 hover:bg-black/70 hover:text-white'
                }`}
                title={isPinned ? "Unpin (Disable Always On Top)" : "Pin (Always On Top)"}
             >
                <div className={`transform transition-transform ${isPinned ? 'rotate-45' : 'rotate-0'}`}>
                    {/* Simple Pin Icon SVG */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="17" x2="12" y2="22"></line>
                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                    </svg>
                </div>
             </button>

             {/* Close Button */}
             <button 
                onClick={handleClose}
                className="p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-sm cursor-pointer"
                title="Close"
             >
                <X size={14} />
             </button>
        </div>

        {/* Resize Handle - Only visible on hover */}
        {isHovered && (
             <div 
                onMouseDown={handleResizeStart}
                className="absolute bottom-0 right-0 p-1 cursor-se-resize z-50 text-white/80 hover:text-white drop-shadow-md"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15l-6 6" />
                    <path d="M21 9l-12 12" />
                </svg>
            </div>
        )}
    </div>
  );
}
