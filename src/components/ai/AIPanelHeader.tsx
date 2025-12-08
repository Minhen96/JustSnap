// JustSnap - AI Panel Header Component
// Draggable header with title and close button

import { X } from 'lucide-react';

interface AIPanelHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export function AIPanelHeader({ title, subtitle, onClose }: AIPanelHeaderProps) {
  return (
    <div
      data-tauri-drag-region
      className="h-10 bg-gray-50 border-b flex items-center justify-between px-4 select-none cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-2 pointer-events-none">
        <div className="font-semibold text-sm text-gray-700">{title}</div>
      </div>

      <div className="flex items-center gap-2">
        {subtitle && (
          <div className="text-xs text-gray-400 mr-2 pointer-events-none">
            {subtitle}
          </div>
        )}
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors z-50 cursor-pointer relative"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
