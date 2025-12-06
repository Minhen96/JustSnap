
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

  const handleClose = async () => {
      const win = getCurrentWindow();
      await win.close();
  };

  if (!imagePath) return <div className="p-4 text-white">Loading Stick...</div>;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent">
        {/* Main Image Layer */}
        <img 
            src={imagePath} 
            alt="Sticky"
            className="absolute top-0 left-0 w-full h-full object-fill select-none"
            style={{ pointerEvents: 'none' }}
        />
        
        {/* Drag Overlay */}
        <div 
           className="absolute inset-0 z-10"
           data-tauri-drag-region 
        />

        {/* Controls */}
        <div className="absolute top-2 right-2 z-50 flex gap-1 pointer-events-auto">
             <div className="px-2 py-1 bg-black/50 text-white text-[10px] rounded backdrop-blur-sm pointer-events-none select-none">
                Pinned
             </div>
             <button 
                onClick={handleClose}
                className="p-1 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-sm cursor-pointer"
                title="Close Pinned Window"
             >
                <X size={14} />
             </button>
        </div>
    </div>
  );
}
