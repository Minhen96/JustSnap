// JustSnap - Main Application Component
import { useEffect, useState, lazy, Suspense } from 'react';
import { useAppStore } from './store/appStore';
import { SnipOverlay } from './components/snipping/SnipOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';


// Lazy load ScreenshotEditor to prevent initialization issues
const ScreenshotEditor = lazy(() => import('./components/editor/ScreenshotEditor').then(module => ({ default: module.ScreenshotEditor })));

// Check if we're running in Tauri (v1 or v2)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isTauri = !!(window as any).__TAURI_INTERNALS__ || '__TAURI__' in window;

function App() {
  const isActive = useAppStore((state) => state.isOverlayActive);
  const currentScreenshot = useAppStore((state) => state.currentScreenshot);
  
  const [imgSrc, setImgSrc] = useState<string | null>(null);


  useEffect(() => {
    // Force CSS Reset to transparent
    document.body.style.backgroundColor = 'transparent';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    const setup = async () => {
      if (!isTauri) return;
      try {
        const { listen } = await import('@tauri-apps/api/event');
        
        await listen('hotkey-triggered', () => {
           useAppStore.getState().showOverlay('capture');
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


      } catch (e) {
        console.error("Error: " + e);
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
      {isActive && imgSrc && (
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

      {/* LAYER 2: Loading Screen (if Active but No Image) */}
      {isActive && !imgSrc && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-600 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Capturing Screen...</h2>
            <p>Please wait...</p>
          </div>
        </div>
      )}



      {/* LAYER 4: SnipOverlay */}
      {isActive && (
        <div className="absolute inset-0 z-30">
          <ErrorBoundary>
            <SnipOverlay />
          </ErrorBoundary>
        </div>
      )}
      
      {/* LAYER 5: Screenshot Editor */}
      {currentScreenshot && !isActive && (
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
