// JustSnap - Region Selection Component
// Reference: use_case.md lines 42-52, SC-01

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
  x: number;
  y: number;
  width: number;
  height: number;
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

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Smart Selection State
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [highlightedWindow, setHighlightedWindow] = useState<WindowInfo | null>(null);

  // Load windows on mount
  useEffect(() => {
    const loadWindows = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const wins = await invoke<WindowInfo[]>('get_windows');
        const scale = window.devicePixelRatio || 1;
        const scaledWins = wins.map((w) => ({
          ...w,
          x: w.x / scale,
          y: w.y / scale,
          width: w.width / scale,
          height: w.height / scale,
        }));
        setWindows(scaledWins);
      } catch (e) {
        console.error('Failed to get windows', e);
      }
    };
    loadWindows();
  }, []);

  // Handle mouse down - initiate tracking
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const { clientX, clientY } = e;
    
    setIsMouseDown(true);
    setStartPos({ x: clientX, y: clientY });
    
    // Don't start selection immediately. content with just setting start pos.
    // If we have a highlighted window, we might capture it on MouseUp if no drag occurs.
  };

  // Handle mouse move - update selection or check for smart windows
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;

    // Logic 1: Mouse is UP - Just hovering
    if (!isMouseDown) {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      // Smart Window Detection
      // Logic: Iterate through windows.
      // Fix for "Selecting Behind":
      // The previous "isFullyOnScreen" check was too strict. If a top window was slightly 
      // off-screen (shadows, maximized), it was ignored, causing fall-through to the background.
      // New Logic: 
      // 1. Find ALL windows containing the mouse.
      // 2. Sort by Area (Smallest First). 
      //    (Assumption: Foreground windows are usually smaller than the background/desktop).
      
      const candidates = windows.filter(w => 
        clientX >= w.x && clientX <= w.x + w.width &&
        clientY >= w.y && clientY <= w.y + w.height
      );

      if (candidates.length > 0) {
        // SORT: Smallest Area First
        candidates.sort((a, b) => (a.width * a.height) - (b.width * b.height));
        
        // Pick the Smallest valid candidate immediately
        setHighlightedWindow(candidates[0]);
      } else {
        setHighlightedWindow(null);
      }
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
      if (highlightedWindow) {
        // Capture the Smart Window
        const region = {
          x: highlightedWindow.x,
          y: highlightedWindow.y,
          width: highlightedWindow.width,
          height: highlightedWindow.height,
        };
        // Update state immediately for responsiveness
        setCurrentRegion(region);
        await captureRegion(region);
      } else {
        setCurrentRegion(null);
      }
    }
  };

  // Capture function
  const captureRegion = async (region: Region) => {
    try {
      setProcessing(true);

      // Hide border before capturing: Wait for React render + Paint
      // Small delay (30ms) is REQUIRED to ensure the overlay is fully removed from the GPU buffer
      // before the native screenshot is taken. 0ms causes intermittent dark captures.
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 30)));



      // Import Tauri API dynamically
      const { invoke } = await import('@tauri-apps/api/core');
      
      // Call Rust command
      // Note: Rust expects integers and physical pixels, scaling handled if needed
      // (Usually xcap handles logical/physical, but let's stick to simple first)
      const scale = window.devicePixelRatio || 1;
      
      const imageData = await invoke<number[]>('capture_screen', {
        x: Math.round(region.x * scale),
        y: Math.round(region.y * scale),
        width: Math.round(region.width * scale),
        height: Math.round(region.height * scale),
      });

      // Convert raw bytes to Blob/URL
      const u8Array = new Uint8Array(imageData);
      const blob = new Blob([u8Array], { type: 'image/png' });
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
  // Outer rectangle (clockwise) + Inner rectangle (counter-clockwise)
  const getOverlayPath = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    // Outer full screen
    let path = `M 0 0 H ${w} V ${h} H 0 Z`;

    if (currentRegion) {
      const { x, y, width, height } = currentRegion;
      // Inner hole (counter-clockwise to create hole with fill-rule="evenodd")
      path += ` M ${x} ${y} V ${y + height} H ${x + width} V ${y} Z`;
    }

    return path;
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-crosshair"
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
