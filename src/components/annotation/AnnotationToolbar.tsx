// JustSnap - Annotation Toolbar
// Reference: use_case.md lines 68-90 (Screen Capture toolbar)

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnnotationTool, AskFramework } from '../../types';
import {
  Pencil,
  Highlighter,
  Square,
  Circle,
  ArrowRight,
  Type,
  Droplet,
  Palette,
  Undo2,
  Redo2,
  Copy,
  Save,
  Pin,
  X,
  Wand2,
} from 'lucide-react';
import { ColorPickerPopover } from './ColorPickerPopover';

interface AnnotationToolbarProps {
  currentTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onSave: () => void;
  onStick: () => void;
  onGenerateAiCode: (framework: AskFramework) => void;
  isPinned?: boolean;
  onClose: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export function AnnotationToolbar({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCopy,
  onSave,
  onStick,
  onGenerateAiCode,
  isPinned = false,
  onClose,
  style,
  className,
}: AnnotationToolbarProps) {
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const hideAiDropdownTimeoutRef = useRef<number | null>(null);

  const clearHideAiDropdownTimeout = () => {
    if (hideAiDropdownTimeoutRef.current) {
      window.clearTimeout(hideAiDropdownTimeoutRef.current);
      hideAiDropdownTimeoutRef.current = null;
    }
  };

  const scheduleHideAiDropdown = () => {
    clearHideAiDropdownTimeout();
    hideAiDropdownTimeoutRef.current = window.setTimeout(() => {
      setShowAiDropdown(false);
      hideAiDropdownTimeoutRef.current = null;
    }, 450);
  };

  useEffect(() => () => clearHideAiDropdownTimeout(), []);

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  
  const ToolButton = useCallback(
    ({
      tool,
      icon: Icon,
      label,
      onClick,
    }: {
      tool?: AnnotationTool;
      icon: React.ElementType;
      label: string;
      onClick?: () => void;
    }) => {
      const isActive = tool === currentTool;
      return (
        <button
          onClick={() => (onClick ? onClick() : tool && onToolChange(tool))}
          className={`
            p-2 rounded-lg transition-all
            ${isActive ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'}
            border border-gray-300 shadow-sm
          `}
          title={label}
        >
          <Icon size={20} />
        </button>
      );
    },
    [currentTool, onToolChange]
  );

  const handleFrameworkSelect = (framework: AskFramework) => {
    setShowAiDropdown(false);
    onGenerateAiCode(framework);
  };

  return (
    <div 
      className={`absolute z-50 ${className || 'top-4 left-1/2 transform -translate-x-1/2'}`}
      style={style}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-3">
        <div className="flex items-center gap-2">
          {/* Annotation Tools */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
            <ToolButton tool="rectangle" icon={Square} label="Rectangle (R)" />
            <ToolButton tool="circle" icon={Circle} label="Circle (C)" />
            <ToolButton tool="arrow" icon={ArrowRight} label="Arrow (A)" />
            <ToolButton tool="pen" icon={Pencil} label="Pen (P)" />
            <ToolButton tool="highlighter" icon={Highlighter} label="Highlighter (H)" />
            <ToolButton tool="text" icon={Type} label="Text (T)" />
            <ToolButton tool="blur" icon={Droplet} label="Blur (B)" />
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
            <button
              ref={colorButtonRef}
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 relative"
              title="Color"
            >
              <div className="relative">
                <Palette size={20} className="text-gray-700" />
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
                  style={{ backgroundColor: currentColor }}
                />
              </div>
            </button>

            <ColorPickerPopover
              currentColor={currentColor}
              onColorChange={onColorChange}
              isOpen={isColorPickerOpen}
              onClose={() => setIsColorPickerOpen(false)}
              buttonRef={colorButtonRef}
            />
          </div>

          {/* Stroke Width */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
            {/* Stroke width slider */}
            <div className="relative group">
              <button
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-medium"
                title="Stroke Width"
              >
                {strokeWidth}px
              </button>

              <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 group-hover:delay-0 delay-300">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-600 text-center mt-1">{strokeWidth}px</div>
              </div>
            </div>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`
                p-2 rounded-lg transition-all border border-gray-300
                ${canUndo ? 'bg-white hover:bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
              `}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={20} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`
                p-2 rounded-lg transition-all border border-gray-300
                ${canRedo ? 'bg-white hover:bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
              `}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={20} />
            </button>
          </div>

          {/* AI Tools */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
            <div
              className="relative"
              onMouseEnter={clearHideAiDropdownTimeout}
              onMouseLeave={scheduleHideAiDropdown}
            >
              <button
                onClick={() => {
                  // small delay to avoid accidental clicks
                  clearHideAiDropdownTimeout();
                  setTimeout(() => setShowAiDropdown((prev) => !prev), 120);
                }}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 border border-blue-600 shadow-sm flex items-center gap-1"
                title="AI UI Code"
              >
                <Wand2 size={20} />
              </button>

              {showAiDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[150px] overflow-hidden z-10">
                  {(['react', 'vue', 'flutter'] as AskFramework[]).map((fw) => (
                    <button
                      key={fw}
                      onClick={() => handleFrameworkSelect(fw)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-gray-800"
                    >
                      {fw === 'react' && 'React'}
                      {fw === 'vue' && 'Vue'}
                      {fw === 'flutter' && 'Flutter'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onStick}
              className={`p-2 rounded-lg border transition-all ${
                isPinned 
                  ? 'bg-green-600 text-white border-green-700 shadow-inner' 
                  : 'bg-white hover:bg-green-50 text-green-600 border-green-200'
              }`}
              title={isPinned ? "Unpin from Screen" : "Stick on Screen (Always on Top)"}
            >
              <Pin size={20} className={isPinned ? "fill-current" : ""} />
            </button>
            <button
              onClick={onCopy}
              className="p-2 rounded-lg bg-white hover:bg-blue-100 text-blue-600 border border-blue-300"
              title="Copy to Clipboard"
            >
              <Copy size={20} />
            </button>
            <button
              onClick={onSave}
              className="p-2 rounded-lg bg-white hover:bg-purple-100 text-purple-600 border border-purple-300"
              title="Save as Image"
            >
              <Save size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white hover:bg-red-100 text-red-600 border border-red-300"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
