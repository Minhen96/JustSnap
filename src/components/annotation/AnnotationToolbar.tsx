// JustSnap - Annotation Toolbar
// Reference: use_case.md lines 68-90 (Screen Capture toolbar)

import { useCallback, useRef, useState } from 'react';
import type { AnnotationTool, AskFramework } from '../../types';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
  ScanText,
  Languages,
  FileCode,
  ChevronRight,
} from 'lucide-react';
import { ColorPickerPopover } from './ColorPickerPopover';
import { useAppStore } from '../../store/appStore';
import { OCRPanel } from '../ai/OCRPanel';
import { TranslationPanel } from '../ai/TranslationPanel';


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
  onClose,
  style,
  className,
}: AnnotationToolbarProps) {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [showOCRPanel, setShowOCRPanel] = useState(false);
  const [showTranslationPanel, setShowTranslationPanel] = useState(false);
  const colorButtonRef = useRef<HTMLButtonElement>(null);

  // OCR State from store
  const ocrLoading = useAppStore((state) => state.ocrLoading);
  const ocrResult = useAppStore((state) => state.ocrResult);
  const ocrError = useAppStore((state) => state.ocrError);
  
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

  return (
    <>
      {/* OCR Results Panel */}
      {showOCRPanel && <OCRPanel onClose={() => setShowOCRPanel(false)} />}
      {showTranslationPanel && <TranslationPanel onClose={() => setShowTranslationPanel(false)} />}

      {/* Toolbar */}
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
            {/* OCR Button */}
            <button
              onClick={() => setShowOCRPanel(true)}
              className={`
                relative p-2 rounded-lg transition-all border
                ${ocrLoading
                  ? 'bg-blue-50 text-blue-600 border-blue-300'
                  : ocrError
                  ? 'bg-red-50 text-red-600 border-red-300'
                  : 'bg-white hover:bg-green-50 text-gray-700 hover:text-green-600 border-gray-300 hover:border-green-300'
                }
              `}
              title={ocrResult ? 'View OCR Results' : ocrLoading ? 'Processing...' : 'Extract Text (OCR)'}
            >
              {ocrLoading && (
                <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                  <div
                    className="absolute inset-0 border-2 border-transparent rounded-lg"
                    style={{
                      borderTopColor: 'currentColor',
                      borderRightColor: 'currentColor',
                      animation: 'spin 2s linear infinite',
                      opacity: 0.5
                    }}
                  />
                </div>
              )}
              {ocrResult && !ocrLoading && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              )}
              <ScanText size={20} />
            </button>

            {/* Translation Button - Now works without OCR, will auto-trigger it */}
            <button
              onClick={() => setShowTranslationPanel(true)}
              className="p-2 rounded-lg transition-all border bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-600 border-gray-300 hover:border-purple-300"
              title="Translate Text"
            >
              <Languages size={20} />
            </button>

            {/* Generate Code Button with Radix UI Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="p-2 rounded-lg transition-all border bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 border-gray-300 data-[state=open]:bg-blue-50 data-[state=open]:text-blue-600 data-[state=open]:border-blue-300"
                  title="Generate UI Code"
                >
                  <FileCode size={20} />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[150px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[60] animate-in fade-in-0 zoom-in-95 data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-top-2"
                  sideOffset={5}
                  align="start"
                >
                  <DropdownMenu.Label className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Generate Code
                  </DropdownMenu.Label>

                  {(['react', 'vue', 'flutter'] as AskFramework[]).map((fw) => (
                    <DropdownMenu.Item
                      key={fw}
                      onClick={() => onGenerateAiCode(fw)}
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 outline-none cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <span>
                        {fw === 'react' && 'React'}
                        {fw === 'vue' && 'Vue'}
                        {fw === 'flutter' && 'Flutter'}
                      </span>
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onStick}
              className="p-2 rounded-lg border transition-all bg-white hover:bg-orange-100 text-orange-600 border-orange-300"
              title="Pin Screenshot"
            >
              <Pin size={20} />
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
    </>
  );
}
