import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StickyWindow } from './components/StickyWindow.tsx'
import { AIPanelWindow } from './components/AIPanelWindow.tsx'
import { getCurrentWindow } from '@tauri-apps/api/window'

function Root() {
  const [isSticky, setIsSticky] = useState(false);
  const [isAIPanel, setIsAIPanel] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
     const checkLabel = async () => {
         try {
             // Check URL Params first (Fastest/Synchronous)
             const urlParams = new URLSearchParams(window.location.search);
             const windowType = urlParams.get('window');
             if (windowType === 'ai_panel') {
                 setIsAIPanel(true);
                 setReady(true);
                 return;
             }

             // Check for injected data (Backup)
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             if ((window as any).__AI_PANEL_DATA__) {
                 setIsAIPanel(true);
                 setReady(true);
                 return;
             }

             const win = getCurrentWindow();
             const label = win.label;
             if (label.startsWith('sticky')) {
                 setIsSticky(true);
             } else if (label.startsWith('ai_panel')) {
                 setIsAIPanel(true);
             }
         } catch (e) {
             console.error("Failed to get window label", e);
         } finally {
             setReady(true);
         }
     };
     checkLabel();
  }, []);

  // Avoid rendering App (and its listeners) until we know who we are
  if (!ready) return null;

  if (isSticky) return <StickyWindow />;
  if (isAIPanel) return <AIPanelWindow />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
