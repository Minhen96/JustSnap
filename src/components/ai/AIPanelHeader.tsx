import { X } from 'lucide-react';

interface AIPanelHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export function AIPanelHeader({ title, subtitle, onClose }: AIPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 backdrop-blur-sm handle select-none cursor-move">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-gray-200/50 rounded-md transition-colors text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
    </div>
  );
}
