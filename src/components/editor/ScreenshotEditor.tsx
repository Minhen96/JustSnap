import { useEffect, useState, useCallback } from 'react';
import { LogicalSize, LogicalPosition, currentMonitor, getCurrentWindow } from '@tauri-apps/api/window';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAnnotation } from '../../hooks/useAnnotation';
import { CanvasStage } from '../annotation/CanvasStage';
import { AnnotationToolbar } from '../annotation/AnnotationToolbar';
import { AskReactPanel } from '../ai/AskReactPanel';
import type { AskFramework } from '../../types';

export function ScreenshotEditor() {
  const [showAskReact, setShowAskReact] = useState(false);
  const [initialAskFramework, setInitialAskFramework] = useState<AskFramework>('react');
  const [askPanelImage, setAskPanelImage] = useState<string | null>(null);
  const [editorHidden, setEditorHidden] = useState(false);
  const currentScreenshot = useAppStore((state) => state.currentScreenshot);
  const clearScreenshot = useAppStore((state) => state.clearScreenshot);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  // const isPinned = false; // Disabled internal stick
  // We now use separate windows. Keeping isPinned=false allows code structure to remain valid.
  const isPinned = false;

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

  // Restore window logic helper
  const restoreWindow = useCallback(async () => {
    const win = getCurrentWindow();
    const monitor = await currentMonitor();
    if (monitor) {
       // We use physical size because currentMonitor returns physical
       // But setSize uses Logical by default unless specified? 
       // Actually monitor.size is PhysicalSize.
       // It's safer to use setFullscreen(true) for overlay apps or explicitly set size.
       // For this app, let's try setting it to the monitor size.
       // NOTE: This assumes the app is meant to be a full-screen overlay.
       // If it fails, we might need a specific 'reset_window' command in Rust.
       await win.setSize(new LogicalSize(monitor.size.width / monitor.scaleFactor, monitor.size.height / monitor.scaleFactor));
       await win.setPosition(new LogicalPosition(0, 0));
       await win.setAlwaysOnTop(true); // Reset to default overlay behavior (usually on top when active)
    }
  }, []);

  const shrinkWindowForPanelOnly = useCallback(async () => {
    const win = getCurrentWindow();
    const monitor = await currentMonitor();
    const width = 520;
    const height = 620;
    const margin = 24;
    if (monitor) {
      const logicalWidth = monitor.size.width / monitor.scaleFactor;
      const logicalHeight = monitor.size.height / monitor.scaleFactor;
      const posX = Math.max(margin, logicalWidth - width - margin);
      const posY = Math.max(margin, 60);
      await win.setSize(new LogicalSize(width, height));
      await win.setPosition(new LogicalPosition(posX, posY));
      await win.setAlwaysOnTop(false); // allow interacting with other apps
    } else {
      await win.setSize(new LogicalSize(width, height));
      await win.setPosition(new LogicalPosition(margin, margin));
      await win.setAlwaysOnTop(false);
    }
  }, []);

  // Calculate canvas dimensions based on screenshot
  useEffect(() => {
    if (!currentScreenshot) return;

    // Use original region dimensions
    setDimensions({ 
      width: currentScreenshot.region.width, 
      height: currentScreenshot.region.height 
    });
  }, [currentScreenshot]);

  // If editor was hidden for panel-only mode and we get a new screenshot, restore full window
  useEffect(() => {
    if (!editorHidden && currentScreenshot) {
      restoreWindow();
    }
  }, [editorHidden, currentScreenshot, restoreWindow]);

  const closeOverlayAndReset = useCallback(async () => {
    const win = getCurrentWindow();
    await win.hide();
    
    // Slight delay to allow hide animation if any, then reset
    setTimeout(async () => {
        clearScreenshot();
        setFeedback(null);
        setEditorHidden(false);
        setAskPanelImage(null);
    }, 100);
  }, [clearScreenshot]);

  const handleClose = useCallback(async () => {
    // If AI panel is open, keep overlay visible for the panel and hide editor UI instead
    if (showAskReact && (askPanelImage || currentScreenshot?.imageData)) {
      if (!askPanelImage && currentScreenshot?.imageData) {
        setAskPanelImage(currentScreenshot.imageData);
      }
      setEditorHidden(true);
      await shrinkWindowForPanelOnly();
      return;
    }
    await closeOverlayAndReset();
  }, [askPanelImage, closeOverlayAndReset, currentScreenshot, showAskReact, shrinkWindowForPanelOnly]);

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
    const win = getCurrentWindow();
    try {
      // 1. Hide immediately for "instant" feel
      await win.hide();
      
      const dataURL = exportCanvasAsDataURL();
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // Try frontend clipboard first
      let success = false;
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          success = true;
        } catch (err) {
          console.warn('Frontend clipboard failed, trying backend:', err);
        }
      }

      if (!success) {
        // Fallback to backend
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('copy_image_to_clipboard', { imageData: Array.from(bytes) });
      }

      // 2. Finalize
      handleClose(); 

    } catch (error) {
      console.error('Failed to copy:', error);
      // If failed, we must show the window again to inform user
      await win.show();
      setFeedback('Failed to copy');
    }
  }, [exportCanvasAsDataURL, handleClose]);

  const handleSave = useCallback(async () => {
    try {
      const win = getCurrentWindow();
      // Hide window temporarily so user can see/interact with save dialog/desktop if needed
      // But we need the dataURL first!
      const dataURL = exportCanvasAsDataURL();
      
      // Convert to bytes immediately
      const response = await fetch(dataURL);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Hide window to unblock view/interaction
      await win.hide();

      const { invoke } = await import('@tauri-apps/api/core');
      const path = await invoke<string | null>('open_save_dialog');

      if (path) {
        // Save via Tauri command
        await invoke('save_image', {
          path,
          imageData: Array.from(bytes) // camelCase maps to snake_case in Rust (image_data)
        });
        
        // Show window briefly to show feedback? Or just close?
        // User asked to "do action with folder", implies they might want to open it.
        // For now, let's just show feedback then close.
        await win.show(); // Show back up to display toast
        setFeedback(`Saved to ${path}`);
        setTimeout(handleClose, 1500); 
      } else {
        // User cancelled, show window again so they don't get lost
        await win.show();
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setFeedback('Failed to save image');
      // Ensure window is back if error
      await getCurrentWindow().show();
    }
  }, [exportCanvasAsDataURL, handleClose]);

  const handleStick = useCallback(async () => {
     if (!currentScreenshot) return;
     const win = getCurrentWindow();
     try {
         await win.hide();
         
         const dataURL = exportCanvasAsDataURL();
         
         const { invoke } = await import('@tauri-apps/api/core');
         // No need to save to disk, we pass the data URL directly
         // path -> image_src
         
         const { x, y } = currentScreenshot.region;
         const { width, height } = dimensions;
         
         await invoke('create_sticky_window', { 
            imageSrc: dataURL,
            x, y, width, height 
         });
         
         // Close the main editor window (resetting for next capture)
         handleClose();
     } catch (e) {
         console.error("Stick failed", e);
         await win.show();
     }
  }, [currentScreenshot, dimensions, exportCanvasAsDataURL, handleClose]);

  const handleGenerateAiCode = useCallback(
    (framework: AskFramework) => {
      setInitialAskFramework(framework);
      setEditorHidden(false);
      if (currentScreenshot?.imageData) {
        setAskPanelImage(currentScreenshot.imageData);
      }
      setShowAskReact(true);
    },
    [currentScreenshot]
  );



  if (!currentScreenshot && !askPanelImage) return null;

  // Calculate positions (guard for missing screenshot when panel is open)
  const region = currentScreenshot?.region || { x: 0, y: 0, width: dimensions.width, height: dimensions.height };
  const { x, y } = region;
  // Constants for toolbar spacing
  const TOOLBAR_HEIGHT = 60; 
  const TOOLBAR_WIDTH_EST = 850; // Increased to ensure full visibility
  const MARGIN = 10;

  // Vertical Position
  // Default: Above the region
  let toolbarTop = y - TOOLBAR_HEIGHT - MARGIN;
  
  // If not enough space above, try below
  if (toolbarTop < MARGIN) {
    toolbarTop = y + region.height + MARGIN;
    
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
        className={`absolute overflow-hidden bg-transparent pointer-events-auto ${isPinned ? 'cursor-move' : 'shadow-2xl border border-gray-200'}`}
        style={{ 
          left: isPinned ? 0 : x,
          top: isPinned ? 0 : y,
          width: isPinned ? '100%' : dimensions.width, 
          height: isPinned ? '100%' : dimensions.height,
          borderRadius: isPinned ? 0 : '0.5rem'
        }}
        data-tauri-drag-region={isPinned ? "true" : undefined}
      >
        {isPinned && (
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
        )}
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

      {/* Annotation Toolbar - Only show if NOT pinned */}
      {/* Annotation Toolbar & Sidebar - Only show if NOT pinned */}
      {!isPinned && currentScreenshot && !editorHidden && (
        <>
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
              onGenerateAiCode={handleGenerateAiCode}
              isPinned={isPinned}
              onClose={handleClose}
              className="" // Override default positioning
              style={{
                top: toolbarTop,
                left: toolbarLeft,
                transform: 'none' // Remove centering transform
              }}
            />
          </div>

        </>
      )}

      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-black/80 text-white px-6 py-3 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2">
                <span className="text-sm font-medium">{feedback}</span>
            </div>
        </div>
      )}

      {showAskReact && (
        <AskReactPanel
          screenshot={currentScreenshot?.imageData || askPanelImage || ''}
          initialFramework={initialAskFramework}
          onClose={() => {
            setShowAskReact(false);
            setAskPanelImage(null);
            if (!currentScreenshot || editorHidden) {
              void closeOverlayAndReset();
            }
          }}
        />
      )}
    </div>
  );
}
