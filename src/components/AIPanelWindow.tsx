
import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { AskReactPanel } from './ai/AskReactPanel';
import type { AskFramework } from '../types';

interface AIPanelData {
  imageSrc: string;
  framework: AskFramework;
}

export function AIPanelWindow() {
  const [data, setData] = useState<AIPanelData | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Force transparent background for this window to avoid white box
    document.body.style.backgroundColor = 'transparent';

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
    // 1. Immediately hide React content (makes window visually transparent/empty)
    setIsVisible(false);

    // 2. Small delay to allow React to paint the empty frame, then close the window
    setTimeout(async () => {
        try {
            // Invoke backend command ensuring window is closed
            await invoke('close_window');
        } catch (e) {
            console.error("Failed to close via command", e);
            const win = getCurrentWindow();
            win.close(); 
        }
    }, 50);
  };

  if (!data) {
      return (
          <div className="flex items-center justify-center h-screen w-screen bg-transparent text-gray-500">
             {/* Loading... */}
          </div>
      );
  }

  if (!isVisible) return null;

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent">
        <AskReactPanel 
            screenshot={data.imageSrc} 
            initialFramework={data.framework}
            onClose={handleClose}
        />
    </div>
  );
}
