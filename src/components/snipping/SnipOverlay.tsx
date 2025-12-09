// JustSnap - Fullscreen Overlay Component
// Reference: use_case.md lines 22-36

import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { RegionSelector } from './RegionSelector';
import type { CaptureMode } from '../../types';

export function SnipOverlay() {
  const mode = useAppStore((state) => state.currentMode);
  const setMode = useAppStore((state) => state.setMode);
  const isProcessing = useAppStore((state) => state.isProcessing);
  const [isSelecting, setIsSelecting] = useState(false);

  // Handle ESC key to cancel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useAppStore.getState().hideOverlay();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []); // Empty deps - event listener accesses store directly

  return (
    <div className="fixed inset-0 z-50 animate-fadeIn">
      {/* Darkened overlay background is now handled by RegionSelector for better control */}
      {mode !== 'capture' && <div className="absolute inset-0 bg-black/40" />}

      {/* Mode Selector Bar - Top - Hide when selecting or processing */}
      {!isSelecting && !isProcessing && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 bg-white rounded-lg shadow-2xl p-2 z-10 animate-slideDown">
        <ModeButton
          mode="capture"
          currentMode={mode}
          onClick={() => setMode('capture')}
          icon="📸"
        >
          Capture
        </ModeButton>
        <ModeButton
          mode="scrolling"
          currentMode={mode}
          onClick={() => setMode('scrolling')}
          icon="📜"
        >
          Scrolling
        </ModeButton>
        <ModeButton
          mode="record"
          currentMode={mode}
          onClick={() => setMode('record')}
          icon="🎥"
        >
          Record
        </ModeButton>
        <ModeButton mode="live" currentMode={mode} onClick={() => setMode('live')} icon="👁️" disabled>
          Live
        </ModeButton>
      </div>
      )}

      {/* Hint text - Hide when processing */}
      {!isProcessing && (
      <div className="absolute top-24 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-4 py-2 rounded-lg animate-fadeIn">
        Click and drag to select area • Press ESC to cancel
      </div>
      )}

      {/* Region selector */}
      <div className="absolute inset-0 cursor-crosshair">
        {mode === 'capture' && <RegionSelector onDragStart={() => setIsSelecting(true)} />}
        {mode !== 'capture' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-lg bg-black/70 px-6 py-4 rounded-lg">
            {mode === 'scrolling' && '📜 Scrolling Screenshot - Coming in Phase 3'}
            {mode === 'record' && '🎥 Screen Recording - Coming in Phase 3'}
            {mode === 'live' && '👁️ Live Snip - Coming in Phase 3'}
          </div>
        )}
      </div>
    </div>
  );
}

interface ModeButtonProps {
  mode: CaptureMode;
  currentMode: CaptureMode;
  onClick: () => void;
  icon: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function ModeButton({ mode, currentMode, onClick, icon, children, disabled }: ModeButtonProps) {
  const isActive = mode === currentMode;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2
        ${isActive ? 'bg-blue-500 text-white shadow-md scale-105' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
      `}
    >
      <span>{icon}</span>
      <span>{children}</span>
    </button>
  );
}
