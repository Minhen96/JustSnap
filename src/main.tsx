import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StickyWindow } from './components/StickyWindow.tsx'
import { AIPanelWindow } from './components/AIPanelWindow.tsx'
import { TranslationWindow } from './components/TranslationWindow.tsx'
import { getCurrentWindow } from '@tauri-apps/api/window'

function Root() {
  const [windowType, setWindowType] = useState(() => {
      try {
        if (window.location.hash === '#ai_panel') return 'ai_panel';
        if (window.location.hash === '#translation_panel') return 'translation_panel';

        const params = new URLSearchParams(window.location.search);
        if (params.get('window') === 'ai_panel') return 'ai_panel';
        if (params.get('window') === 'translation_panel') return 'translation_panel';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).__AI_PANEL_DATA__) return 'ai_panel';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).__TRANSLATION_TEXT__) return 'translation_panel';
      } catch(e) { console.error(e); }
      return 'app';
  });

  const [isSticky, setIsSticky] = useState(false);
  const [ready, setReady] = useState(windowType !== 'app'); // Ready if known special window

  useEffect(() => {
     if (windowType !== 'app') return; // Already identified

     const checkLabel = async () => {
         try {
             const win = getCurrentWindow();
             const label = win.label;
             
             // Check sticky
             if (label.startsWith('sticky')) {
                 setIsSticky(true);
             } 
             // Fallback label checks
             else if (label.startsWith('ai_panel')) {
                 setWindowType('ai_panel');
             }
             else if (label.startsWith('translation')) {
                 setWindowType('translation_panel');
             }
         } catch (e) {
             console.error("Window check failed", e);
         } finally {
             setReady(true);
         }
     };
     checkLabel();
  }, [windowType]);

  if (windowType === 'ai_panel') return <AIPanelWindow />;
  if (windowType === 'translation_panel') return <TranslationWindow />;
  
  if (!ready) return null; // Render nothing while checking (or transparent)
  if (isSticky) return <StickyWindow />;

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
