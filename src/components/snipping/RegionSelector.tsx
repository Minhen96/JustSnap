// JustSnap - Region Selection Component
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import type { Region } from '../../types';
import { extractText } from '../../services/ocr.service';

interface RegionSelectorProps {
  onDragStart?: () => void;
}

interface WindowInfo {
  id: number;
  title: string;
  app_name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z_order: number; // Lower = closer to user (top-most)
}

export function RegionSelector({ onDragStart }: RegionSelectorProps = {}) {
  const startSelection = useAppStore((state) => state.startSelection);
  const updateSelection = useAppStore((state) => state.updateSelection);
  const finishSelection = useAppStore((state) => state.finishSelection);
  const setScreenshot = useAppStore((state) => state.setScreenshot);
  const isProcessing = useAppStore((state) => state.isProcessing);
  const setProcessing = useAppStore((state) => state.setProcessing);
  const setOCRLoading = useAppStore((state) => state.setOCRLoading);
  const setOCRProgress = useAppStore((state) => state.setOCRProgress);
  const setOCRResult = useAppStore((state) => state.setOCRResult);
  const setOCRError = useAppStore((state) => state.setOCRError);
  const isSmartSelectActive = useAppStore((state) => state.isSmartSelectActive);
  // const toggleSmartSelect = useAppStore((state) => state.toggleSmartSelect); // Removed from store

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Smart Selection State
  const [highlightedWindow, setHighlightedWindow] = useState<WindowInfo | null>(null);
  const lastCheckRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastWindowIdRef = useRef<number | null>(null);
  const callIdRef = useRef<number>(0); // Track API call order to prevent race conditions
  const isCheckingWindowRef = useRef<boolean>(false); // Prevent overlapping window detection calls

  // Handle mouse down - initiate tracking
  // We attach this to the global window as well to catch edge clicks
  const handleMouseDown = (e: React.MouseEvent | MouseEvent) => {
    // If it's a React event, prevent default
    if ('preventDefault' in e) e.preventDefault();
    
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    if (import.meta.env.DEV) console.log('[RegionSelector] MouseDown', { clientX, clientY });

    setIsMouseDown(true);
    setStartPos({ x: clientX, y: clientY });
  };

  // Enforce fullscreen and global listener on mount
  useEffect(() => {
    const enforceFullscreen = async () => {
        try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            await getCurrentWindow().setFullscreen(true);
        } catch (e) {
            console.error('Failed to set fullscreen:', e);
        }
    };
    enforceFullscreen();

    // Force crosshair cursor on document body only (not all elements)
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = 'crosshair';

    // Attach global mousedown listener to catch edge clicks that React might miss
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
        window.removeEventListener('mousedown', handleMouseDown);
        // Restore previous cursor
        document.body.style.cursor = previousCursor;
    };
  }, []);



  // Handle mouse move - update selection or check for smart windows
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;

    // Logic 1: Mouse is UP - Just hovering (Smart Select Mode)
    if (!isMouseDown && isSmartSelectActive) {
      // Logic 1.1: Check for Edge Hover (Frontend Event - Fast Path)
      const EDGE_THRESHOLD = 20;
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (
        clientX <= EDGE_THRESHOLD ||
        clientX >= w - EDGE_THRESHOLD ||
        clientY <= EDGE_THRESHOLD ||
        clientY >= h - EDGE_THRESHOLD
      ) {
        // Invalidate previous async searches to prevent overwrite
        callIdRef.current++;

        // User is hovering the edge -> Select Full Screen
        setHighlightedWindow({
          id: -999, // Special ID for full screen
          title: 'Full Screen',
          app_name: 'System',
          x: 0,
          y: 0,
          width: w,
          height: h,
          z_order: -100,
        });
        return;
      }

      // Very aggressive throttle: only check every 250ms or if moved >30px
      // This minimizes cursor flickering from cursor event toggles
      const now = Date.now();
      const last = lastCheckRef.current;

      if (last) {
        const timeDiff = now - last.time;
        const distDiff = Math.sqrt(Math.pow(clientX - last.x, 2) + Math.pow(clientY - last.y, 2));

        if (timeDiff < 250 && distDiff < 30) {
          return; // Skip this check
        }
      }

      lastCheckRef.current = { x: clientX, y: clientY, time: now };

      // Skip if a window detection is already in progress
      if (isCheckingWindowRef.current) {
        return;
      }

      // Increment call ID to track this specific request
      const currentCallId = ++callIdRef.current;

      // Use async IIFE to avoid blocking
      (async () => {
        // Mark as checking to prevent overlapping calls
        isCheckingWindowRef.current = true;

        const { invoke } = await import('@tauri-apps/api/core');
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const tauriWindow = getCurrentWindow();

        try {
          const scale = window.devicePixelRatio || 1;

          // Convert screen coordinates to physical pixels
          const physicalX = Math.round(clientX * scale);
          const physicalY = Math.round(clientY * scale);

          // Temporarily make overlay click-through
          await tauriWindow.setIgnoreCursorEvents(true);

          // Ask backend: "What window is visible at this exact point?"
          const windowAtPoint = await invoke<WindowInfo | null>('get_window_at_point', {
            x: physicalX,
            y: physicalY,
          });

          // Ignore stale responses
          if (currentCallId !== callIdRef.current) {
            return;
          }

          if (windowAtPoint) {
            // Scale coordinates back to CSS pixels for display
            const scaledWindow = {
              ...windowAtPoint,
              x: windowAtPoint.x / scale,
              y: windowAtPoint.y / scale,
              width: windowAtPoint.width / scale,
              height: windowAtPoint.height / scale,
            };

            lastWindowIdRef.current = windowAtPoint.id;
            setHighlightedWindow(scaledWindow);
          } else {
            lastWindowIdRef.current = null;
            setHighlightedWindow(null);
          }
        } catch (e) {
          console.error('[Smart Select] Error:', e);
          if (currentCallId === callIdRef.current) {
            setHighlightedWindow(null);
          }
        } finally {
          // ALWAYS restore cursor events
          await tauriWindow.setIgnoreCursorEvents(false);

          // Mark as done checking
          isCheckingWindowRef.current = false;
        }
      })();

      return;
    }

    // Logic 2: Mouse is DOWN - Check for Drag
    if (isMouseDown && startPos) {
      // Calculate distance moved
      const dist = Math.sqrt(
        Math.pow(clientX - startPos.x, 2) + Math.pow(clientY - startPos.y, 2)
      );

      const DRAG_THRESHOLD = 5; // pixels

      // Transition to Dragging Mode if moved enough
      if (!isDragging && dist > DRAG_THRESHOLD) {
        setIsDragging(true);
        startSelection(); // Notify store we are really selecting now
        onDragStart?.();
        setHighlightedWindow(null); // Clear highlight when dragging starts
      }

      if (isDragging) {
        // Standard Manual Selection Logic
        const x = Math.min(startPos.x, clientX);
        const y = Math.min(startPos.y, clientY);
        const width = Math.abs(clientX - startPos.x);
        const height = Math.abs(clientY - startPos.y);

        const region = { x, y, width, height };
        setCurrentRegion(region);
        updateSelection(region);
      }
    }
  };

  // Handle mouse up - finish selection or click-capture
  const handleMouseUp = async () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);
    
    if (isDragging) {
      // Finished a manual drag selection
      setIsDragging(false);
      finishSelection();

      if (currentRegion && currentRegion.width > 5 && currentRegion.height > 5) {
        await captureRegion(currentRegion);
      } else {
        // Reset if too small
        setCurrentRegion(null);
        updateSelection({ x: 0, y: 0, width: 0, height: 0 });
      }
    } else {
      // It was a Click (no drag)
      
      // Feature: Check if click was on edge (Full Screen Force)
      const EDGE_THRESHOLD = 20; 
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isEdgeClick = startPos && (
        startPos.x <= EDGE_THRESHOLD || 
        startPos.x >= w - EDGE_THRESHOLD || 
        startPos.y <= EDGE_THRESHOLD || 
        startPos.y >= h - EDGE_THRESHOLD
      );

      if (highlightedWindow || isEdgeClick) {
        // Capture the Smart Window OR Full Screen Force
        
        // Determine target region
        let region: Region;
        
        const isFullScreen = (highlightedWindow?.id === -999) || isEdgeClick;

        if (highlightedWindow && !isEdgeClick) {
             region = {
                x: highlightedWindow.x,
                y: highlightedWindow.y,
                width: highlightedWindow.width,
                height: highlightedWindow.height,
             };
        } else {
             // Fallback/Force to full screen
             region = { x: 0, y: 0, width: w, height: h };
        }

        // Update state immediately for responsiveness
        setCurrentRegion(region);
        
        // SPECIAL CASE: Full Screen
        if (isFullScreen) {
          console.log('[RegionSelector] Triggering Full Screen Capture (Edge/Smart)');
          await captureFullScreen();
        } else {
          await captureRegion(region);
        }
      } else {
        setCurrentRegion(null);
      }
    }
  };

  const captureFullScreen = async () => {
    try {
       setProcessing(true);
       
       const { invoke } = await import('@tauri-apps/api/core');
       
       // Hide border before capturing: Wait for React render + Paint
       await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 30)));

       const base64Data = await invoke<string>('capture_full_screen');
       
       const res = await fetch(`data:image/bmp;base64,${base64Data}`);
       const blob = await res.blob();
       const imageUrl = URL.createObjectURL(blob);
       
       // Align full screen region to pixels as well
       const pixelRatio = window.devicePixelRatio || 1;
       const region = { 
          x: 0, 
          y: 0, 
          width: Math.round(window.innerWidth * pixelRatio) / pixelRatio, 
          height: Math.round(window.innerHeight * pixelRatio) / pixelRatio 
       };

       const screenshot = {
        id: crypto.randomUUID(),
        imageData: imageUrl,
        region,
        timestamp: Date.now(),
        mode: 'capture' as const,
      };
      setScreenshot(screenshot);

      // OCR logic
      console.log('[RegionSelector] Starting OCR...');
      setOCRLoading(true);
      setOCRProgress(0);

      extractText(imageUrl, (progress) => {
        setOCRProgress(progress);
      })
        .then((result) => {
          setOCRResult(result);
        })
        .catch((error) => {
          setOCRError(error instanceof Error ? error.message : 'OCR failed');
        });

    } catch (error) {
      console.error('Failed to capture full screen:', error);
      alert('Failed to capture screen.');
    } finally {
      setProcessing(false);
    }
  };

  // Capture function
  const captureRegion = async (inputRegion: Region) => {
    try {
      setProcessing(true);

      // ALIGNMENT FIX: Snap to physical pixels to prevent sub-pixel blurring (1:1 mapping)
      const pixelRatio = window.devicePixelRatio || 1;
      const region = {
        x: Math.round(inputRegion.x * pixelRatio) / pixelRatio,
        y: Math.round(inputRegion.y * pixelRatio) / pixelRatio,
        width: Math.round(inputRegion.width * pixelRatio) / pixelRatio,
        height: Math.round(inputRegion.height * pixelRatio) / pixelRatio,
      };

      // Hide border before capturing: Wait for React render + Paint
      // Small delay (30ms) is REQUIRED to ensure the overlay is fully removed from the GPU buffer
      // before the native screenshot is taken. 0ms causes intermittent dark captures.
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 30)));

      // Import Tauri API dynamically
      const { invoke } = await import('@tauri-apps/api/core');
      
      const scale = window.devicePixelRatio || 1;
      
      const base64Data = await invoke<string>('capture_screen', {
        x: Math.round(region.x * scale),
        y: Math.round(region.y * scale),
        width: Math.round(region.width * scale),
        height: Math.round(region.height * scale),
      });

      // Convert Base64 string to Blob
      // Note: Backend now returns BMP (uncompressed) for speed, but browsers handle BMP well as image source
      const res = await fetch(`data:image/bmp;base64,${base64Data}`);
      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);

      // Update store
      const screenshot = {
        id: crypto.randomUUID(),
        imageData: imageUrl,
        region,
        timestamp: Date.now(),
        mode: 'capture' as const,
      };
      setScreenshot(screenshot);

      // 🚀 START BACKGROUND OCR IMMEDIATELY
      console.log('[RegionSelector] Starting OCR...');
      setOCRLoading(true);
      setOCRProgress(0);

      extractText(imageUrl, (progress) => {
        setOCRProgress(progress);
      })
        .then((result) => {
          console.log('[RegionSelector] OCR completed:', result);
          setOCRResult(result);
        })
        .catch((error) => {
          console.error('[RegionSelector] OCR failed:', error);
          setOCRError(error instanceof Error ? error.message : 'OCR failed');
        });

    } catch (error) {
      console.error('Failed to capture screen:', error);
      alert('Failed to capture screen. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // SVG Path for the "hole" effect
  const getOverlayPath = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    // Outer full screen
    let path = `M 0 0 H ${w} V ${h} H 0 Z`;

    // Determine which region to cut out (prioritize drag selection)
    // If we have a smart-selected window and we aren't dragging, cut it out too
    const activeRegion = currentRegion || (highlightedWindow && !isDragging ? highlightedWindow : null);

    if (activeRegion) {
      const { x, y, width, height } = activeRegion;
      // Inner hole (counter-clockwise)
      path += ` M ${x} ${y} V ${y + height} H ${x + width} V ${y} Z`;
    }

    return path;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full cursor-crosshair z-50"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}

    >
      {/* Dimming Overlay with Hole - COMPLETELY HIDE WHEN PROCESSING */}
      {!isProcessing && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path 
            d={getOverlayPath()} 
            fill="rgba(0, 0, 0, 0.4)" 
            fillRule="evenodd"
          />
          
          {/* Smart Window Highlight - Show before selection is active, or if matching */}
          {highlightedWindow && !isDragging && (
              <rect
                x={highlightedWindow.x}
                y={highlightedWindow.y}
                width={highlightedWindow.width}
                height={highlightedWindow.height}
                fill="transparent"
                stroke="#60a5fa"
                strokeWidth="2"
                strokeDasharray="4"
                className="animate-pulse" 
              />
          )}
          
          {/* Selection Border - Hide when processing to avoid capturing it */}
          {currentRegion && !isProcessing && (
            <rect
              x={currentRegion.x}
              y={currentRegion.y}
              width={currentRegion.width}
              height={currentRegion.height}
              fill="none"
              stroke="#3b82f6" // blue-500
              strokeWidth="2"
              strokeDasharray="4"
            />
          )}
        </svg>
      )}

      {/* Dimensions Tooltip */}
      {currentRegion && isDragging && (
        <div 
          className="absolute bg-black/75 text-white text-xs px-2 py-1 rounded pointer-events-none"
          style={{ 
            left: currentRegion.x, 
            top: currentRegion.y - 30 > 0 ? currentRegion.y - 30 : currentRegion.y + currentRegion.height + 10 
          }}
        >
          {Math.round(currentRegion.width)} x {Math.round(currentRegion.height)}
        </div>
      )}
    </div>
  );
}
