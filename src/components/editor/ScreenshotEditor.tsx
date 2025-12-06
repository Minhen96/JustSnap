import { useEffect, useState, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useAppStore } from '../../store/appStore';
import { useAnnotation } from '../../hooks/useAnnotation';
import { CanvasStage } from '../annotation/CanvasStage';
import { AnnotationToolbar } from '../annotation/AnnotationToolbar';
import { AskReactPanel } from '../ai/AskReactPanel';

export function ScreenshotEditor() {
  const [showAskReact, setShowAskReact] = useState(false);
  const currentScreenshot = useAppStore((state) => state.currentScreenshot);
  const clearScreenshot = useAppStore((state) => state.clearScreenshot);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const {
    currentTool,
    setCurrentTool,
    annotations,
    addAnnotation,
    updateAnnotation,
    undo,
    redo,
    canUndo,
    canRedo,
    currentStyle,
    updateStyle,
  } = useAnnotation();

  // Calculate canvas dimensions based on screenshot
  useEffect(() => {
    if (!currentScreenshot) return;

    // Use original region dimensions
    setDimensions({ 
      width: currentScreenshot.region.width, 
      height: currentScreenshot.region.height 
    });
  }, [currentScreenshot]);

  const handleClose = useCallback(async () => {
    clearScreenshot();
    await getCurrentWindow().hide();
  }, [clearScreenshot]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'p':
            setCurrentTool('pen');
            break;
          case 'h':
            setCurrentTool('highlighter');
            break;
          case 'r':
            setCurrentTool('rectangle');
            break;
          case 'c':
            setCurrentTool('circle');
            break;
          case 'a':
            setCurrentTool('arrow');
            break;
          case 't':
            setCurrentTool('text');
            break;
          case 'b':
            setCurrentTool('blur');
            break;
          case 'escape':
            handleClose();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setCurrentTool, handleClose]);

  const exportCanvasAsDataURL = useCallback(() => {
    const stage = (window as any).__konvaStage;
    if (stage) {
      return stage.toDataURL({ pixelRatio: 2 });
    }
    return currentScreenshot?.imageData || '';
  }, [currentScreenshot]);

  const handleCopy = useCallback(async () => {
    console.log('Copy to clipboard');
    try {
      const dataURL = exportCanvasAsDataURL();

      // Convert data URL to blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // Copy to clipboard using Clipboard API
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        console.log('Copied to clipboard successfully!');
      } else {
        console.warn('Clipboard API not supported');
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [exportCanvasAsDataURL]);

  const handleSave = useCallback(async () => {
    console.log('Save as image');
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const path = await invoke<string>('open_save_dialog');

      if (path) {
        const dataURL = exportCanvasAsDataURL();

        // Convert data URL to base64
        const base64Data = dataURL.split(',')[1];

        // Convert base64 to bytes
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Save via Tauri command
        await invoke('save_image', {
          path,
          imageData: Array.from(bytes)
        });

        console.log('Saved to:', path);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, [exportCanvasAsDataURL]);

  const handleStick = useCallback(async () => {
    console.log('Stick on screen - set always on top');
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const window = getCurrentWindow();
      await window.setAlwaysOnTop(true);

      // Optional: Show toast notification
      alert('Window is now pinned on top! Click again to unpin.');

      // TODO: Toggle state and allow unpinning
    } catch (error) {
      console.error('Failed to stick window:', error);
    }
  }, []);



  if (!currentScreenshot) return null;

  // Calculate positions
  const { x, y, width, height } = currentScreenshot.region;
  
  // Constants for toolbar spacing
  const TOOLBAR_HEIGHT = 60; 
  const TOOLBAR_WIDTH_EST = 850; // Increased to ensure full visibility
  const MARGIN = 10;

  // Vertical Position
  // Default: Above the region
  let toolbarTop = y - TOOLBAR_HEIGHT - MARGIN;
  
  // If not enough space above, try below
  if (toolbarTop < MARGIN) {
    toolbarTop = y + height + MARGIN;
    
    // If not enough space below (e.g. full height selection), put it inside at the top
    if (toolbarTop + TOOLBAR_HEIGHT > window.innerHeight - MARGIN) {
       toolbarTop = MARGIN + 10; // Slight offset inside
    }
  }

  // Horizontal Position
  // Default: Aligned with left of region
  let toolbarLeft = x;

  // Check right edge
  if (toolbarLeft + TOOLBAR_WIDTH_EST > window.innerWidth - MARGIN) {
    toolbarLeft = window.innerWidth - TOOLBAR_WIDTH_EST - MARGIN;
  }

  // Check left edge (safety)
  if (toolbarLeft < MARGIN) {
    toolbarLeft = MARGIN;
  }

  return (
    <div className="fixed inset-0 z-40 bg-transparent overflow-hidden animate-fadeIn pointer-events-none">
      {/* Background Pattern - Optional, maybe remove or make very subtle */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Main Canvas Area */}
      <div
        className="absolute shadow-2xl rounded-lg overflow-hidden border border-gray-200 bg-white pointer-events-auto"
        style={{ 
          left: x,
          top: y,
          width: dimensions.width, 
          height: dimensions.height 
        }}
      >
        <CanvasStage
          imageUrl={currentScreenshot.imageData}
          annotations={annotations}
          width={dimensions.width}
          height={dimensions.height}
          currentTool={currentTool}
          currentStyle={currentStyle}
          onAddAnnotation={addAnnotation}
          onUpdateAnnotation={updateAnnotation}
        />
      </div>

      {/* Annotation Toolbar */}
      <div className="pointer-events-auto">
        <AnnotationToolbar
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          currentColor={currentStyle.color}
          onColorChange={(color) => updateStyle({ color })}
          strokeWidth={currentStyle.strokeWidth}
          onStrokeWidthChange={(strokeWidth) => updateStyle({ strokeWidth })}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onCopy={handleCopy}
          onSave={handleSave}
          onStick={handleStick}
          onClose={handleClose}
          className="" // Override default positioning
          style={{
            top: toolbarTop,
            left: toolbarLeft,
            transform: 'none' // Remove centering transform
          }}
        />
      </div>

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
