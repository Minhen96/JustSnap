// JustSnap - Region Selection Component
// Reference: use_case.md lines 42-52, SC-01

import { useState, useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import type { Region } from '../../types';
import { extractText } from '../../services/ocr.service';

interface RegionSelectorProps {
  onDragStart?: () => void;
}

export function RegionSelector({ onDragStart }: RegionSelectorProps = {}) {
  const startSelection = useAppStore((state) => state.startSelection);
  const updateSelection = useAppStore((state) => state.updateSelection);
  const finishSelection = useAppStore((state) => state.finishSelection);
  const setScreenshot = useAppStore((state) => state.setScreenshot);
  const setProcessing = useAppStore((state) => state.setProcessing);
  const setOCRLoading = useAppStore((state) => state.setOCRLoading);
  const setOCRProgress = useAppStore((state) => state.setOCRProgress);
  const setOCRResult = useAppStore((state) => state.setOCRResult);
  const setOCRError = useAppStore((state) => state.setOCRError);

  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse down - start selection
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const { clientX, clientY } = e;
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
    startSelection();
    onDragStart?.(); // Notify parent that dragging started
    
    // Initial zero-size region
    const region = { x: clientX, y: clientY, width: 0, height: 0 };
    setCurrentRegion(region);
    updateSelection(region);
  };

  // Handle mouse move - update selection
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !startPos) return;

    const { clientX, clientY } = e;
    
    // Calculate region based on start and current position
    // Allow dragging in any direction (negative width/height handling)
    const x = Math.min(startPos.x, clientX);
    const y = Math.min(startPos.y, clientY);
    const width = Math.abs(clientX - startPos.x);
    const height = Math.abs(clientY - startPos.y);

    const region = { x, y, width, height };
    setCurrentRegion(region);
    updateSelection(region);
  };

  // Handle mouse up - finish selection and capture
  const handleMouseUp = async () => {
    if (!isDragging || !currentRegion) return;

    setIsDragging(false);
    finishSelection();

    // Only capture if region is large enough (avoid accidental clicks)
    if (currentRegion.width > 10 && currentRegion.height > 10) {
      await captureRegion(currentRegion);
    } else {
      // Reset if too small
      setCurrentRegion(null);
      updateSelection({ x: 0, y: 0, width: 0, height: 0 }); // Reset store
    }
  };

  // Capture function
  const captureRegion = async (region: Region) => {
    try {
      setProcessing(true);

      // Import Tauri API dynamically
      const { invoke } = await import('@tauri-apps/api/core');
      
      // Call Rust command
      // Note: Rust expects integers and physical pixels, so we must scale by devicePixelRatio
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
      {/* Dimming Overlay with Hole */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path 
          d={getOverlayPath()} 
          fill="rgba(0, 0, 0, 0.4)" 
          fillRule="evenodd"
        />
        
        {/* Selection Border */}
        {currentRegion && (
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
