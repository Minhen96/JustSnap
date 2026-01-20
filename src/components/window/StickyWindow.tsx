
import { useEffect, useState } from 'react';
import { X, Copy, Save } from 'lucide-react';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { Stage, Layer, Line, Rect, Ellipse, Arrow, Text } from 'react-konva';
import type { Annotation } from '../../types';

interface Dimensions {
  width: number;
  height: number;
}

export function StickyWindow() {
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [initialDimensions, setInitialDimensions] = useState<Dimensions | null>(null);
  const [scaleFactor, setScaleFactor] = useState<number>(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  useEffect(() => {
    // 1. Get the injected image data URL
    // No file system access needed
    const src = (window as any).__STICKY_IMAGE_SRC__;
    console.log("Sticky Source Found:", !!src);
    
    if (src) {
       setImagePath(src);
       
       const img = new Image();
       img.onload = () => {
           const w = window.innerWidth;
           const h = window.innerHeight;
           
           // Store the initial logical dimensions (Scale 1.0 for annotations)
           // If not set yet, set it now.
           setInitialDimensions(prev => prev || { width: w, height: h });

           const dpr = window.devicePixelRatio || 1;
           const physicalWindowWidth = w * dpr;
           const physicalScale = physicalWindowWidth / img.width;

           if (import.meta.env.DEV) {
             console.log("Phys-to-Phys Scale:", physicalScale);
             console.log("Initial Dimensions:", w, h);
           }

           setImageNaturalSize({ width: img.width, height: img.height });
           setAspectRatio(img.width / img.height);
           setDimensions({ width: w, height: h });
           setScaleFactor(physicalScale);
       };
       img.onerror = (e) => {
           console.error("Sticky Image Failed:", e);
       };
       img.src = src;
    } else {
       console.error("No sticky path found on window object");
    }

    // Load Annotations
    try {
      const annotationsJson = (window as any).__STICKY_ANNOTATIONS__;
      if (annotationsJson) {
        const parsed = JSON.parse(annotationsJson);
        setAnnotations(parsed);
      }
    } catch (e) {
      console.error("Failed to load sticky annotations:", e);
    }

    // 2. Setup Resize Listener (Same logic as ScreenshotEditor)
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = async () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Immediate fill
        setDimensions({ width, height });

        // Recalculate scale factor for rendering quality adjustment
        if (imageNaturalSize.width > 0) {
            const dpr = window.devicePixelRatio || 1;
            const scaleX = (width * dpr) / imageNaturalSize.width;
            const scaleY = (height * dpr) / imageNaturalSize.height;
            setScaleFactor(Math.min(scaleX, scaleY));
        }

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

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C (Copy)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }

      // Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }

      // Escape (Close)
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imagePath]); // Add imagePath dependency since actions depend on it

  const handleDrag = () => {
     getCurrentWindow().startDragging();
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

  const handleCopy = async () => {
      if (!imagePath) return;
      try {
         const response = await fetch(imagePath);
         const blob = await response.blob();
         
         // Prioritize Backend COPY
         // Frontend clipboard API (navigator.clipboard) is flaky in some Tauri window contexts (especially sticky/alwaysOnTop)
         // The backend command is reliable.
         try {
             const buffer = await blob.arrayBuffer();
             const bytes = new Uint8Array(buffer);
             await invoke('copy_image_to_clipboard', { imageData: Array.from(bytes) });
             setFeedback("Copied!");
         } catch (backendErr) {
             console.warn("Backend copy failed, trying frontend fallback", backendErr);
             
             // Fallback to Frontend
             try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                setFeedback("Copied!");
             } catch (frontendErr) {
                 console.error("Frontend copy also failed", frontendErr);
                 setFeedback("Copy Failed");
             }
         }
      } catch (e) {
          console.error("Copy failed (fetch)", e);
          setFeedback("Copy Failed");
      }
      setTimeout(() => setFeedback(null), 2000);
  };

  const handleSave = async () => {
      if (!imagePath) return;
      try {
          const response = await fetch(imagePath);
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);

          const win = getCurrentWindow();
          
          // CRITICAL: To make the Native Save Dialog appear on top, 
          // we must temporarily disable AlwaysOnTop if it's enabled.
          // Otherwise the dialog might open *behind* this window.
          const wasPinned = isPinned;
          if (wasPinned) {
              await win.setAlwaysOnTop(false);
          }

          // Force focus to the window so the dialog spawns correctly
          await win.setFocus();

          // Open dialog (this awaits until user picks file or cancels)
          const path = await invoke<string | null>('open_save_dialog');
          
          // Restore pinned state immediately
          if (wasPinned) {
              await win.setAlwaysOnTop(true);
          }

          if (path) {
              await invoke('save_image', {
                  path,
                  imageData: Array.from(bytes)
              });
              setFeedback("Saved!");
          }
      } catch (e) {
          console.error("Save failed", e);
          setFeedback("Save Failed");
      }
      setTimeout(() => setFeedback(null), 2000);
  };

  const renderAnnotation = (annotation: Annotation) => {
    const { id, tool, style, x = 0, y = 0, width = 0, height = 0, points = [], text = '' } = annotation;
    const { color, strokeWidth, opacity = 1 } = style;

    switch (tool) {
      case 'pen':
        return <Line key={id} points={points} stroke={color} strokeWidth={strokeWidth} opacity={opacity} tension={0.5} lineCap="round" lineJoin="round" />;
      case 'highlighter':
        return <Line key={id} points={points} stroke={color} strokeWidth={strokeWidth * 3} opacity={0.3} tension={0.5} lineCap="round" lineJoin="round" />;
      case 'rectangle':
        return <Rect key={id} x={x} y={y} width={width} height={height} stroke={color} strokeWidth={strokeWidth} opacity={opacity} />;
      case 'circle':
        return <Ellipse key={id} x={x + width / 2} y={y + height / 2} radiusX={Math.abs(width) / 2} radiusY={Math.abs(height) / 2} stroke={color} strokeWidth={strokeWidth} opacity={opacity} />;
      case 'arrow':
        return <Arrow key={id} points={points} stroke={color} strokeWidth={strokeWidth} opacity={opacity} pointerLength={10} pointerWidth={10} />;
      case 'blur':
        return <Rect key={id} x={x} y={y} width={width} height={height} fill="#000000" opacity={0.8} />;
      case 'text':
        return <Text key={id} x={x} y={y} text={text} fontSize={24} fontFamily="Arial" fill={color} opacity={opacity} />;
      default:
        return null;
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
            className="absolute top-0 left-0 w-full h-full object-contain select-none pointer-events-none"
            style={{
              // Adaptive rendering based on scale:
              // - At 1:1 or smaller (or slight upscale): Use pixelated/crisp-edges (sharp)
              // - When scaled up significantly (> 10%): Use high-quality smoothing
              imageRendering: scaleFactor < 1.1 ? 'pixelated' : 'high-quality',
              WebkitFontSmoothing: 'antialiased',
              // Dynamic sharpening - more at larger scales
              filter: scaleFactor > 1.2
                ? 'contrast(1.02) saturate(1.08) brightness(1.01)'  // Scaled up: more sharpening
                : 'contrast(1.01) saturate(1.05)',                   // Normal: subtle
              // Prevent subpixel rendering issues
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              // Force GPU acceleration for crisp rendering
              willChange: 'transform',
            } as React.CSSProperties}
            // Prevent browser image interpolation quality loss
            draggable={false}
        />

        {/* Vector Annotation Layer - Overlaid on top */}
        {annotations.length > 0 && dimensions.width > 0 && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <Stage
               width={dimensions.width}
               height={dimensions.height}
               scaleX={initialDimensions ? dimensions.width / initialDimensions.width : 1}
               scaleY={initialDimensions ? dimensions.height / initialDimensions.height : 1}
            >
              <Layer>
                {annotations.map(renderAnnotation)}
              </Layer>
            </Stage>
          </div>
        )}
        
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

             {/* Copy Button */}
             <button 
                onClick={handleCopy}
                className="p-1.5 bg-black/50 hover:bg-blue-500 text-white rounded-full transition-colors backdrop-blur-sm cursor-pointer"
                title="Copy to Clipboard"
             >
                <Copy size={14} />
             </button>

             {/* Save Button */}
             <button 
                onClick={handleSave}
                className="p-1.5 bg-black/50 hover:bg-purple-500 text-white rounded-full transition-colors backdrop-blur-sm cursor-pointer"
                title="Save as Image"
             >
                <Save size={14} />
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
                className="absolute bottom-0 right-0 p-1 z-50 text-white/80 hover:text-white drop-shadow-md pointer-events-none"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15l-6 6" />
                    <path d="M21 9l-12 12" />
                </svg>
            </div>
        )}

        {/* Toast Feedback */}
        {feedback && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60] animate-in fade-in duration-300 pointer-events-none">
              <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                  {feedback}
              </div>
          </div>
        )}
    </div>
  );
}
