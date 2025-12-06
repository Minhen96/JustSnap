import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StickyWindow } from './components/StickyWindow.tsx'
import { getCurrentWindow } from '@tauri-apps/api/window'

function Root() {
  const [isSticky, setIsSticky] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
     const checkLabel = async () => {
         try {
             const win = getCurrentWindow();
             // In Tauri v2, label is a property, but let's be safe
             if (win.label.startsWith('sticky')) {
                 setIsSticky(true);
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

  return isSticky ? <StickyWindow /> : <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
