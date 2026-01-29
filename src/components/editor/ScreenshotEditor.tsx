import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { ScreenshotCanvas } from './ScreenshotCanvas';
import { AnnotationToolbar } from '../annotation/AnnotationToolbar';
import { ScreenshotFeedback } from './ScreenshotFeedback';
import { AskReactPanel } from '../ai/AskReactPanel';
import { useScreenshotKeyboard } from '../../hooks/useScreenshotKeyboard';
import { useScreenshotActions } from './ScreenshotActions';
import { hideAndCleanup } from '../../utils/windowManager';
import type { AskFramework } from '../../types';

export function ScreenshotEditor() {
  const [showAskReact, setShowAskReact] = useState(false);
  const [initialAskFramework] = useState<AskFramework>('react');
  const [askPanelImage, setAskPanelImage] = useState<string | null>(null);
  const currentScreenshot = useAppStore((state) => state.currentScreenshot);
  const clearScreenshot = useAppStore((state) => state.clearScreenshot);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Auto-dismiss feedback after 2 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Get state values
  const currentTool = useAppStore((state) => state.currentTool);
  const annotations = useAppStore((state) => state.annotations);
  const currentStyle = useAppStore((state) => state.annotationStyle);
  const canUndo = useAppStore((state) => state.annotationHistoryStep > 0);
  const canRedo = useAppStore((state) => state.annotationHistoryStep < state.annotationHistory.length - 1);

  // Get action functions (these never change)
  const setCurrentTool = useAppStore((state) => state.setTool);
  const addAnnotation = useAppStore((state) => state.addAnnotation);
  const updateAnnotation = useAppStore((state) => state.updateAnnotation);
  const updateStyle = useAppStore((state) => state.updateAnnotationStyle);
  const undo = useAppStore((state) => state.undoAnnotation);
  const redo = useAppStore((state) => state.redoAnnotation);

  // Calculate canvas dimensions based on screenshot
  useEffect(() => {
    if (!currentScreenshot) return;

    // Use original region dimensions
    setDimensions({
      width: currentScreenshot.region.width,
      height: currentScreenshot.region.height
    });
  }, [currentScreenshot]);

  // Window Snapping Logic (Fix for mixed-DPI blur)
  useEffect(() => {
    if (currentScreenshot) {
      import('../../utils/windowManager').then(({ snapWindowToScreenshot, restoreOverlayFullscreen }) => {
        // Snap to monitor where screenshot was taken
        snapWindowToScreenshot(currentScreenshot.region);
        
        // Restore fullscreen on cleanup
        return () => {
          restoreOverlayFullscreen();
        };
      });
    }
  }, []); // Run once on mount

  // Reset cursor to default when editor mounts
  useEffect(() => {
    document.body.style.cursor = 'default';
    return () => {
      // Clean up on unmount
      document.body.style.cursor = '';
    };
  }, []);

  const handleClose = async () => {
    await hideAndCleanup(() => {
      clearScreenshot();
      setFeedback(null);
      setAskPanelImage(null);
      setShowAskReact(false);
    }, 100);
  };

  // Screenshot actions hook
  const { handleCopy, handleSave, handleStick, handleGenerateAiCode } = useScreenshotActions({
    screenshot: currentScreenshot!,
    width: dimensions.width,
    height: dimensions.height,
    onFeedback: setFeedback,
    onClose: handleClose,
  });

  // Keyboard shortcuts hook
  useScreenshotKeyboard({
    onUndo: undo,
    onRedo: redo,
    onSetTool: setCurrentTool,
    onClose: handleClose,
    onCopy: handleCopy,
    onSave: handleSave,
    onStick: handleStick,
  });



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
      {currentScreenshot && (
        <ScreenshotCanvas
          screenshot={currentScreenshot}
          annotations={annotations}
          currentTool={currentTool}
          currentStyle={currentStyle}
          onAddAnnotation={addAnnotation}
          onUpdateAnnotation={updateAnnotation}
        />
      )}

      {/* Annotation Toolbar */}
      {currentScreenshot && (
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

      {/* Feedback Toast */}
      <ScreenshotFeedback message={feedback} />

      {showAskReact && (
        <AskReactPanel
          screenshot={currentScreenshot?.imageData || askPanelImage || ''}
          initialFramework={initialAskFramework}
          onClose={() => {
            setShowAskReact(false);
            setAskPanelImage(null);

            // Close window completely
            void handleClose();
          }}
        />
      )}
    </div>
  );
}
