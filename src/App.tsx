// JustSnap - Main Application Component
import { useEffect, useState } from 'react';
import { useAppStore } from './store/appStore';
import { SnipOverlay } from './components/snipping/SnipOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScreenshotEditor } from './components/editor/ScreenshotEditor';
import SearchInput from './components/test';

// Check if we're running in Tauri (v1 or v2)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isTauri = !!(window as any).__TAURI_INTERNALS__ || '__TAURI__' in window;

function App() {
  const isActive = useAppStore((state) => state.isOverlayActive);
  const [hotkeyReady, setHotkeyReady] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLogs(prev => [...prev.slice(-4), msg]);
  };

  // Listen for hotkey events from Rust
  useEffect(() => {
    addLog('App mounted. Init listener...');
    
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      try {
        if (!isTauri) {
            addLog('Not in Tauri mode');
            return;
        }

        addLog('Importing Tauri API...');
        const { listen } = await import('@tauri-apps/api/event');
        addLog('API imported. Registering...');
        
        unlisten = await listen('hotkey-triggered', () => {
          addLog('EVENT RECEIVED: hotkey-triggered');
          useAppStore.getState().showOverlay('capture');
        });
        
        addLog('Listener registered!');
        setHotkeyReady(true);
      } catch (error) {
        addLog(`Error: ${error}`);
      }
    };

    setupListener();

    // Cleanup
    return () => {
      if (unlisten) unlisten();
    };
  }, []); // Empty dependency array - only run once

  // Simulate hotkey ready after mount (Rust registers it on startup)
  useEffect(() => {
    const timer = setTimeout(() => {
      setHotkeyReady(true);
      console.log('Hotkey ready!');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const currentScreenshot = useAppStore((state) => state.currentScreenshot);

  return (
    <>
      {/* Main welcome screen - Hide if overlay is active OR if we have a screenshot */}
      {!isActive && !currentScreenshot && (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 transition-colors duration-300">
        <div className="text-center space-y-6 p-8">
          <h1 className="text-6xl font-bold text-gray-800">JustSnap</h1>
          <p className="text-xl text-gray-600">AI-Powered Snipping Tool</p>

          <div className="space-y-4 mt-8">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
              <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>

              {/* Hotkey status */}
              <div className="mb-4 flex items-center justify-center gap-2">
                {hotkeyReady ? (
                  <>
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-sm text-green-600">Hotkey Ready!</span>
                  </>
                ) : (
                  <>
                    <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                    <span className="text-sm text-yellow-600">Initializing...</span>
                  </>
                )}
              </div>

              <p className="text-gray-700 mb-4">
                Press{' '}
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded font-mono">
                  Ctrl+Shift+S
                </kbd>{' '}
                to start snipping
              </p>

              {/* Test button for development */}
              <button
                onClick={() => useAppStore.getState().showOverlay('capture')}
                className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                🧪 Test Overlay (Dev Only)
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

      {/* Overlay - shows when hotkey is pressed or test button clicked */}
      {/* Overlay - shows when hotkey is pressed or test button clicked */}
      {isActive && (
        <ErrorBoundary>
          <SnipOverlay />
        </ErrorBoundary>
      )}
      
      {/* Screenshot Editor - shows when a screenshot is captured */}
      {currentScreenshot && (
        <ErrorBoundary>
          <ScreenshotEditor />
        </ErrorBoundary>
      )}

      {/* Debug Info - Remove in production */}
      {/* <div className="fixed bottom-2 right-2 bg-black/80 text-white text-xs p-4 rounded z-[100] max-w-md overflow-auto max-h-40 font-mono">
        <div className="font-bold border-b border-gray-600 mb-2">Debug Log:</div>
        {debugLogs.map((log, i) => (
          <div key={i} className="mb-1">{log}</div>
        ))}
        <div className="mt-2 text-gray-400">
          Tauri: {isTauri ? 'Yes' : 'No'} | Active: {isActive ? 'Yes' : 'No'}
        </div>
      </div> */}
    </>
  );
}

export default App;
