// JustSnap - AI Panel Resize Handle Component
// Bottom-right resize handle for Tauri windows

import { getCurrentWindow } from '@tauri-apps/api/window';

export function AIPanelResizeHandle() {
  const handleResizeStart = () => {
    // @ts-expect-error - startResizing is available in Tauri v2 but typings might be missing
    getCurrentWindow().startResizing('BottomRight');
  };

  return (
    <div
      onMouseDown={handleResizeStart}
      className="absolute bottom-0 right-0 p-1 cursor-se-resize z-50 text-gray-400 hover:text-gray-600"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15l-6 6" />
        <path d="M21 9l-12 12" />
      </svg>
    </div>
  );
}
