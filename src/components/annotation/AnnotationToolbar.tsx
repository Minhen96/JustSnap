// JustSnap - Annotation Toolbar
// Reference: use_case.md lines 68-90 (Screen Capture toolbar)

import { useCallback, useRef, useState, useMemo, useEffect } from 'react';
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
  Minus,
} from 'lucide-react';
import { ColorPickerPopover } from './ColorPickerPopover';
import { useAppStore } from '../../store/appStore';
import { OCRPanel } from '../ai/OCRPanel';
import { TranslationPanel } from '../ai/TranslationPanel';
import type { ToolbarItemId } from '../../store/toolbarConfig';

// Icon mapping for toolbar items
const TOOLBAR_ICONS: Record<ToolbarItemId, React.ElementType> = {
  rectangle: Square,
  circle: Circle,
  arrow: ArrowRight,
  pen: Pencil,
  highlighter: Highlighter,
  text: Type,
  blur: Droplet,
  colorPicker: Palette,
  strokeWidth: Minus,
  undo: Undo2,
  redo: Redo2,
  ocr: ScanText,
  translation: Languages,
  generateCode: FileCode,
  pin: Pin,
  copy: Copy,
  save: Save,
  close: X,
};

// Map item IDs to annotation tools
const TOOL_ID_MAP: Partial<Record<ToolbarItemId, AnnotationTool>> = {
  rectangle: 'rectangle',
  circle: 'circle',
  arrow: 'arrow',
  pen: 'pen',
  highlighter: 'highlighter',
  text: 'text',
  blur: 'blur',
};

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

  // Get toolbar config from store
  const toolbarConfig = useAppStore((state) => state.toolbarConfig);
  const colorPalette = useAppStore((state) => state.colorPalette);
  
  // Sync colorPalette from localStorage on mount AND listen for updates
  useEffect(() => {
    // 1. Initial sync from localStorage
    try {
      const stored = localStorage.getItem('app-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.state?.colorPalette && Array.isArray(parsed.state.colorPalette)) {
          const currentPalette = useAppStore.getState().colorPalette;
          if (JSON.stringify(currentPalette) !== JSON.stringify(parsed.state.colorPalette)) {
            useAppStore.setState({ colorPalette: parsed.state.colorPalette });
          }
        }
      }
    } catch (err) {
      // Silently fail
    }

    // 2. Listen for live updates from settings window
    let unlisten: (() => void) | undefined;
    import('@tauri-apps/api/event').then(async ({ listen }) => {
      unlisten = await listen<string[]>('palette-updated', (event) => {
        console.log('[AnnotationToolbar] Received palette update:', event.payload);
        useAppStore.setState({ colorPalette: event.payload });
      });
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // OCR State from store
  const ocrLoading = useAppStore((state) => state.ocrLoading);
  const ocrResult = useAppStore((state) => state.ocrResult);
  const ocrError = useAppStore((state) => state.ocrError);

  // Helper to check if an item is enabled
  const isItemEnabled = useCallback((itemId: ToolbarItemId): boolean => {
    for (const group of toolbarConfig.groups) {
      const item = group.items.find(i => i.id === itemId);
      if (item) return item.enabled;
    }
    return true;
  }, [toolbarConfig]);

  // Get ordered items for a group
  const getGroupItems = useCallback((groupId: string) => {
    const group = toolbarConfig.groups.find(g => g.id === groupId);
    return group ? group.items.filter(item => item.enabled) : [];
  }, [toolbarConfig]);

  // Memoize enabled items per group
  const annotationItems = useMemo(() => getGroupItems('annotationTools'), [getGroupItems]);
  const styleItems = useMemo(() => getGroupItems('styleTools'), [getGroupItems]);
  const historyItems = useMemo(() => getGroupItems('historyTools'), [getGroupItems]);
  const aiItems = useMemo(() => getGroupItems('aiTools'), [getGroupItems]);
  const actionItems = useMemo(() => getGroupItems('actionTools'), [getGroupItems]);
  
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

  // Render annotation tool button
  const renderAnnotationTool = (itemId: ToolbarItemId) => {
    const Icon = TOOLBAR_ICONS[itemId];
    const tool = TOOL_ID_MAP[itemId];
    if (!Icon || !tool) return null;
    
    const labels: Record<string, string> = {
      rectangle: 'Rectangle (R)',
      circle: 'Circle (C)',
      arrow: 'Arrow (A)',
      pen: 'Pen (P)',
      highlighter: 'Highlighter (H)',
      text: 'Text (T)',
      blur: 'Blur (B)',
    };
    
    return <ToolButton key={itemId} tool={tool} icon={Icon} label={labels[itemId] || itemId} />;
  };

  // Render style tools (color picker, stroke width)
  const renderStyleTool = (itemId: ToolbarItemId) => {
    if (itemId === 'colorPicker') {
      return (
        <div key={itemId}>
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
            presetColors={colorPalette && colorPalette.length > 0 ? colorPalette : undefined}
          />
        </div>
      );
    }
    
    if (itemId === 'strokeWidth') {
      return (
        <div key={itemId} className="relative group">
          <button
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-medium"
            title="Stroke Width"
          >
            {strokeWidth}px
          </button>
          <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 group-hover:delay-0 delay-300 z-50">
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
      );
    }
    
    return null;
  };

  // Render history tools (undo, redo)
  const renderHistoryTool = (itemId: ToolbarItemId) => {
    if (itemId === 'undo') {
      return (
        <button
          key={itemId}
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
      );
    }
    
    if (itemId === 'redo') {
      return (
        <button
          key={itemId}
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
      );
    }
    
    return null;
  };

  // Render AI tools
  const renderAITool = (itemId: ToolbarItemId) => {
    if (itemId === 'ocr') {
      return (
        <button
          key={itemId}
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
      );
    }
    
    if (itemId === 'translation') {
      return (
        <button
          key={itemId}
          onClick={() => setShowTranslationPanel(true)}
          className="p-2 rounded-lg transition-all border bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-600 border-gray-300 hover:border-purple-300"
          title="Translate Text"
        >
          <Languages size={20} />
        </button>
      );
    }
    
    if (itemId === 'generateCode') {
      return (
        <DropdownMenu.Root key={itemId}>
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
              className="min-w-[150px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[60] animate-in fade-in-0 zoom-in-95"
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
      );
    }
    
    return null;
  };

  // Render action tools
  const renderActionTool = (itemId: ToolbarItemId) => {
    if (itemId === 'pin') {
      return (
        <button
          key={itemId}
          onClick={onStick}
          className="p-2 rounded-lg border transition-all bg-white hover:bg-orange-100 text-orange-600 border-orange-300"
          title="Pin Screenshot"
        >
          <Pin size={20} />
        </button>
      );
    }
    
    if (itemId === 'copy') {
      return (
        <button
          key={itemId}
          onClick={onCopy}
          className="p-2 rounded-lg bg-white hover:bg-blue-100 text-blue-600 border border-blue-300"
          title="Copy to Clipboard"
        >
          <Copy size={20} />
        </button>
      );
    }
    
    if (itemId === 'save') {
      return (
        <button
          key={itemId}
          onClick={onSave}
          className="p-2 rounded-lg bg-white hover:bg-purple-100 text-purple-600 border border-purple-300"
          title="Save as Image"
        >
          <Save size={20} />
        </button>
      );
    }
    
    if (itemId === 'close') {
      return (
        <button
          key={itemId}
          onClick={onClose}
          className="p-2 rounded-lg bg-white hover:bg-red-100 text-red-600 border border-red-300"
          title="Close (Esc)"
        >
          <X size={20} />
        </button>
      );
    }
    
    return null;
  };

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
          {annotationItems.length > 0 && (
            <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
              {annotationItems.map(item => renderAnnotationTool(item.id))}
            </div>
          )}

          {/* Style Tools */}
          {styleItems.length > 0 && (
            <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
              {styleItems.map(item => renderStyleTool(item.id))}
            </div>
          )}

          {/* History Tools */}
          {historyItems.length > 0 && (
            <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
              {historyItems.map(item => renderHistoryTool(item.id))}
            </div>
          )}

          {/* AI Tools */}
          {aiItems.length > 0 && (
            <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
              {aiItems.map(item => renderAITool(item.id))}
            </div>
          )}

          {/* Action Tools */}
          {actionItems.length > 0 && (
            <div className="flex items-center gap-1">
              {actionItems.map(item => renderActionTool(item.id))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
