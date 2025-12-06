// JustSnap - Main Application Component
import { useEffect, useState, lazy, Suspense } from 'react';
import { useAppStore } from './store/appStore';
import { SnipOverlay } from './components/snipping/SnipOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';

import SearchInput from './components/test';
// Lazy load ScreenshotEditor to prevent initialization issues
const ScreenshotEditor = lazy(() => import('./components/editor/ScreenshotEditor').then(module => ({ default: module.ScreenshotEditor })));

// Check if we're running in Tauri (v1 or v2)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isTauri = !!(window as any).__TAURI_INTERNALS__ || '__TAURI__' in window;

function App() {
  const isActive = useAppStore((state) => state.isOverlayActive);
  const currentScreenshot = useAppStore((state) => state.currentScreenshot);
  
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hotkeyReady, setHotkeyReady] = useState(false);

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
             const bytes = new Uint8Array(e.payload);
             const blob = new Blob([bytes], { type: 'image/png' });
             const url = URL.createObjectURL(blob);
             setImgSrc(url);
           } catch (err) {
             console.error(`Blob Error: ${err}`);
           }
        });

        setHotkeyReady(true);
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

      {/* LAYER 3: Welcome Screen (if Inactive and No Screenshot) */}
      {!isActive && !currentScreenshot && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 transition-colors duration-300">
          <div className="text-center space-y-6 p-8">
            <h1 className="text-6xl font-bold text-gray-800">JustSnap</h1>
            <p className="text-xl text-gray-600">AI-Powered Snipping Tool</p>
            <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
               <p className="mb-4">Status: {hotkeyReady ? 'Ready' : 'Init...'}</p>
               <button
                onClick={() => useAppStore.getState().showOverlay('capture')}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Test Overlay
              </button>

              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    ✓
                  </span>
                  <span>Screen Capture with Annotations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    ✓
                  </span>
                  <span>AI-Powered OCR & Translation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    ✓
                  </span>
                  <span>Screenshot to UI Code</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    ✓
                  </span>
                  <span>Screen Recording & Live Snip</span>
                </div>
              </div>
            </div>

            {/* Test component preview */}
            <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
              <h3 className="text-lg font-semibold mb-3">Test: SearchInput component</h3>
              <SearchInput />
            </div>

            <p className="text-sm text-gray-500">
              Phase 1: Complete ✅ • Phase 2: In Progress 🚧
            </p>
          </div>
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
