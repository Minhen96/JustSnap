import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StickyWindow } from './components/StickyWindow.tsx'
import { AIPanelWindow } from './components/AIPanelWindow.tsx'
import { TranslationWindow } from './components/TranslationWindow.tsx'
import { getCurrentWindow } from '@tauri-apps/api/window'

type WindowType = 'app' | 'sticky' | 'ai_panel' | 'translation_panel';

function Root() {
  const [windowType, setWindowType] = useState<WindowType>('app');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const detectWindowType = async () => {
      try {
        const win = getCurrentWindow();
        const label = win.label;

        console.log('[Main] Window label:', label);

        // Detect window type based on label prefix
        if (label.startsWith('sticky')) {
          setWindowType('sticky');
        } else if (label.startsWith('ai_panel')) {
          setWindowType('ai_panel');
        } else if (label.startsWith('translation')) {
          setWindowType('translation_panel');
        } else {
          // Default to main app (label is 'main')
          setWindowType('app');
        }
      } catch (e) {
        console.error('[Main] Window detection failed:', e);
        // Fallback to app on error
        setWindowType('app');
      } finally {
        setReady(true);
      }
    };

    detectWindowType();
  }, []);

  // Don't render until we know what type of window this is
  if (!ready) return null;

  // Render appropriate component based on window type
  if (windowType === 'ai_panel') return <AIPanelWindow />;
  if (windowType === 'translation_panel') return <TranslationWindow />;
  if (windowType === 'sticky') return <StickyWindow />;

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
