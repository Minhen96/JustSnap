// JustSnap - Main Application Component
import { useEffect, useState, lazy, Suspense } from 'react';
import { useAppStore } from './store/appStore';
import { SnipOverlay } from './components/snipping/SnipOverlay';
import { ErrorBoundary } from './components/window/ErrorBoundary';


// Lazy load ScreenshotEditor to prevent initialization issues
const ScreenshotEditor = lazy(() => import('./components/editor/ScreenshotEditor').then(module => ({ default: module.ScreenshotEditor })));

// Check if we're running in Tauri (v1 or v2)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isTauri = !!(window as any).__TAURI_INTERNALS__ || '__TAURI__' in window;

function App() {
  const isActive = useAppStore((state) => state.isOverlayActive);
  const currentScreenshot = useAppStore((state) => state.currentScreenshot);
  
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // Preload ScreenshotEditor in background
  useEffect(() => {
    const timer = setTimeout(() => {
      import('./components/editor/ScreenshotEditor').catch(err => {
        console.warn('Failed to preload ScreenshotEditor:', err);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    // Force CSS Reset to transparent
    document.body.style.backgroundColor = 'transparent';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    const setup = async () => {
      // DEBUG: Force clear screenshot on startup to prevent stuck Suspense
      useAppStore.getState().clearScreenshot();
      
      if (!isTauri) return;

      // Tauri Setup
      try {
        const { listen } = await import('@tauri-apps/api/event');
        
        await listen('hotkey-triggered', async () => {
           console.log('[App] Hotkey triggered!');

           const state = useAppStore.getState();

           // STEP 1: Reset state (clear any active screenshot/annotations)
           // We do NOT hide the window here because the backend just showed it.
           state.clearScreenshot();

           // STEP 2: Always open fresh overlay
           console.log('[App] Opening fresh overlay...');

           // Clear previous image
           setImgSrc(null);

           // Setup window for capture
           const { getCurrentWindow } = await import('@tauri-apps/api/window');
           const win = getCurrentWindow();

           try {
             // Backend handles window size/position/fullscreen
             await win.setFocus();
             // Ensure window captures mouse events (fix for "can't click" issue)
             await win.setIgnoreCursorEvents(false);

           } catch (err) {
             console.error('[App] Window setup failed:', err);
           }

           // Activate overlay
           state.showOverlay('capture');
           console.log('[App] Overlay activated');
        });

        await listen('screen-capture-ready', (e: any) => {
           try {
             if (typeof e.payload === 'string') {
               // Faster path: Base64 string (now JPEG from backend)
               setImgSrc(`data:image/jpeg;base64,${e.payload}`);
             } else {
               // Legacy path: byte array
               const bytes = new Uint8Array(e.payload);
               const blob = new Blob([bytes], { type: 'image/png' });
               const url = URL.createObjectURL(blob);
               setImgSrc(url);
             }
           } catch (err) {
             console.error(`Blob/Image Error: ${err}`);
           }
        });

        // Handle race condition: If hotkey was pressed before we were ready
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const win = getCurrentWindow();
          if (await win.isVisible()) {
            console.log('[App] Window already visible - forcing capture mode');
            useAppStore.getState().showOverlay('capture');
          }
        } catch (err) {
          console.error('[App] Initial visibility check failed:', err);
        }

      } catch (e) {
        console.error("Error: " + e);
        alert("App Setup Error: " + e);
      }
    };
    setup();
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      backgroundColor: 'transparent' 
    }}>
      
      {/* LAYER 1: Background Image (Fake Transparency) */}
      {imgSrc && (
        <img 
          src={imgSrc} 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0, 
            pointerEvents: 'none'
          }}
          alt="Background"
        />
      )}

      {/* LAYER 2: SnipOverlay */}
      {isActive && !currentScreenshot && (
        <div className="absolute inset-0 z-30">
          <ErrorBoundary>
            <SnipOverlay />
          </ErrorBoundary>
        </div>
      )}
      
      {/* LAYER 3: Screenshot Editor */}
      {currentScreenshot && (
        <div className="absolute inset-0 z-40">
          <ErrorBoundary>
            <Suspense fallback={null}>
              <ScreenshotEditor />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}

export default App;
