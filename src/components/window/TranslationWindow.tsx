import { useEffect, useState } from 'react';
import { TranslationPanel } from '../ai/TranslationPanel';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function TranslationWindow() {
  const [data, setData] = useState<{ text: string } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const injectedData = (window as any).__TRANSLATION_TEXT__;
    if (injectedData) {
      setData({ text: injectedData });
    } else {
        // Just for safety if no text
        console.warn("No translation text found in window data");
        // Maybe try to read from store if we could share state? No.
        // Fallback to empty
        setData({ text: "" });
    }
    
    // Set background to white
    document.body.style.backgroundColor = 'white';
  }, []);

  const handleClose = async () => {
    console.log("Closing Translation Window...");
    try {
        const win = getCurrentWindow();
        await win.hide(); // Hide visually first
        await win.close();
    } catch (e) {
        console.error("Failed to close via Tauri, trying native close", e);
        window.close();
    }
  };

  if (!data) {
      return (
          <div className="flex h-screen items-center justify-center bg-white">
              <div className="text-gray-500 text-sm">Loading Translation...</div>
          </div>
      );
  }

  return (
    <div className="h-screen bg-white">
      <TranslationPanel 
        onClose={handleClose} 
        initialText={data.text} 
      />
    </div>
  );
}
