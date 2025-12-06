
import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { AskReactPanel } from './ai/AskReactPanel';
import type { AskFramework } from '../types';

interface AIPanelData {
  imageSrc: string;
  framework: AskFramework;
}

export function AIPanelWindow() {
  const [data, setData] = useState<AIPanelData | null>(null);

  useEffect(() => {
    // Force white background for this window
    document.body.style.backgroundColor = 'white';

    // Read cached image from window object injected by Rust
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const injectedData = (window as any).__AI_PANEL_DATA__;
    if (injectedData) {
      setData(injectedData);
    } else {
        console.warn("AI Panel Data missing!");
        // Fallback or retry?
    }
  }, []);

  const handleClose = async () => {
    console.log("Closing AI Panel Window...");
    try {
        const win = getCurrentWindow();
        await win.hide(); // Hide visually first to avoid stuck white box
        await win.close();
    } catch (e) {
        console.error("Failed to close via Tauri, trying native close", e);
        window.close();
    }
  };

  if (!data) {
      return (
          <div className="flex items-center justify-center h-screen w-screen bg-white text-gray-500">
              Loading AI Context...
          </div>
      );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-white">
        <AskReactPanel 
            screenshot={data.imageSrc} 
            initialFramework={data.framework}
            onClose={handleClose}
        />
    </div>
  );
}
