import { StrictMode, useEffect, useState, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getCurrentWindow } from '@tauri-apps/api/window'

// CRITICAL DEBUG: Global Error Handler
window.onerror = function(message, source, lineno, _colno, _error) {
  alert(`Global Error: ${message}\nSource: ${source}:${lineno}`);
  return false;
};
window.onunhandledrejection = function(event) {
  alert(`Unhandled Promise Rejection: ${event.reason}`);
};

// Lazy load window components - each window only loads its necessary code
const StickyWindow = lazy(() => import('./components/window/StickyWindow.tsx').then(m => ({ default: m.StickyWindow })));
const AIPanelWindow = lazy(() => import('./components/window/AIPanelWindow.tsx').then(m => ({ default: m.AIPanelWindow })));
const TranslationWindow = lazy(() => import('./components/window/TranslationWindow.tsx').then(m => ({ default: m.TranslationWindow })));
const WelcomeScreen = lazy(() => import('./components/welcome/WelcomeScreen.tsx').then(m => ({ default: m.WelcomeScreen })));

type WindowType = 'app' | 'sticky' | 'ai_panel' | 'translation_panel' | 'welcome';

function Root() {
  const [windowType, setWindowType] = useState<WindowType>('app');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const detectWindowType = async () => {
      try {
        // Try to get window type from injected variable first (more reliable)
        const injectedType = window.__WINDOW_TYPE__;

        if (injectedType) {
          if (import.meta.env.DEV) {
            console.log('[Main] Window type (injected):', injectedType);
          }
          // Map injected type to component type
          if (injectedType === 'translation') {
            setWindowType('translation_panel');
          } else {
            setWindowType(injectedType);
          }
        } else {
          // Fallback: detect from window label (for main window)
          const win = getCurrentWindow();
          const label = win.label;

          if (import.meta.env.DEV) {
            console.log('[Main] Window label (fallback):', label);
          }

          // Detect window type based on label prefix
          if (label.startsWith('sticky')) {
            setWindowType('sticky');
          } else if (label.startsWith('ai_panel')) {
            setWindowType('ai_panel');
          } else if (label.startsWith('translation')) {
            setWindowType('translation_panel');
          } else if (label === 'welcome') {
            setWindowType('welcome');
          } else {
            // Default to main app (label is 'main')
            setWindowType('app');
          }
        }
      } catch (e) {
        console.error('[Main] Window detection failed:', e);
        // Fallback to app on error
        setWindowType('app');
      } finally {
        setReady(true);
      }
    };

    // Race detection against a shorter timeout
    const timeoutPromise = new Promise<void>((_, reject) => 
       setTimeout(() => reject(new Error('Timeout')), 200)
    );

    Promise.race([detectWindowType(), timeoutPromise]).catch(() => {
      // If detection fails or times out, we're likely the main app window
      if (import.meta.env.DEV) console.log('[Main] Detection timeout, assuming "app" window');
      setWindowType('app');
      setReady(true);
    });
  }, []);

  // Don't render until we know what type of window this is
  if (!ready) return null;

  // Render appropriate component based on window type with lazy loading
  // This ensures each window only loads its necessary code bundle
  if (windowType === 'ai_panel') {
    return (
      <Suspense fallback={null}>
        <AIPanelWindow />
      </Suspense>
    );
  }

  if (windowType === 'translation_panel') {
    return (
      <Suspense fallback={null}>
        <TranslationWindow />
      </Suspense>
    );
  }

  if (windowType === 'sticky') {
    return (
      <Suspense fallback={null}>
        <StickyWindow />
      </Suspense>
    );
  }

  if (windowType === 'welcome') {
    return (
      <Suspense fallback={null}>
        <WelcomeScreen />
      </Suspense>
    );
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
