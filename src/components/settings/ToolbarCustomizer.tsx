// JustSnap - Toolbar Customizer Component
// Allows users to reorder and enable/disable toolbar items

import { useState } from 'react';
import { GripVertical, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Pencil, Highlighter, Square, Circle, ArrowRight, Type, Droplet, Palette,
  Undo2, Redo2, ScanText, Languages, FileCode, Pin, Copy, Save, X, Minus
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { 
  type ToolbarItemId, 
  type ToolbarGroupId, 
  TOOLBAR_ITEM_METADATA 
} from '../../store/toolbarConfig';

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

export function ToolbarCustomizer() {
  const toolbarConfig = useAppStore((state) => state.toolbarConfig);
  const setToolbarItemEnabled = useAppStore((state) => state.setToolbarItemEnabled);
  const reorderToolbarItems = useAppStore((state) => state.reorderToolbarItems);
  const defaultTool = useAppStore((state) => state.defaultTool);
  const setDefaultTool = useAppStore((state) => state.setDefaultTool);
  const annotationStyle = useAppStore((state) => state.annotationStyle);
  const updateAnnotationStyle = useAppStore((state) => state.updateAnnotationStyle);
  const colorPalette = useAppStore((state) => state.colorPalette);
  const setColorPalette = useAppStore((state) => state.setColorPalette);
  const defaultStrokeWidth = useAppStore((state) => state.defaultStrokeWidth);
  const setDefaultStrokeWidth = useAppStore((state) => state.setDefaultStrokeWidth);

  const [expandedGroups, setExpandedGroups] = useState<Set<ToolbarGroupId>>(
    new Set(toolbarConfig.groups.map(g => g.id))
  );
  
  // Mouse-based drag state (more reliable than HTML5 drag in WebViews)
  const [dragging, setDragging] = useState<{ groupId: ToolbarGroupId; itemId: ToolbarItemId; startIndex: number } | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const toggleGroup = (groupId: ToolbarGroupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent, groupId: ToolbarGroupId, itemId: ToolbarItemId, index: number) => {
    e.preventDefault();
    setDragging({ groupId, itemId, startIndex: index });
    setHoverIndex(index);
  };

  const handleMouseUp = () => {
    if (dragging && hoverIndex !== null && dragging.startIndex !== hoverIndex) {
      const group = toolbarConfig.groups.find(g => g.id === dragging.groupId);
      if (group) {
        const currentOrder = group.items.map(item => item.id);
        const [movedItem] = currentOrder.splice(dragging.startIndex, 1);
        currentOrder.splice(hoverIndex, 0, movedItem);
        reorderToolbarItems(dragging.groupId, currentOrder);
      }
    }
    setDragging(null);
    setHoverIndex(null);
  };

  const handleMouseEnter = (index: number) => {
    if (dragging) {
      setHoverIndex(index);
    }
  };

  return (
    <div 
      className="space-y-6 h-full overflow-auto"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Customize Toolbar</h2>
        <p className="text-gray-400">Drag to reorder, toggle to show/hide tools</p>
      </div>

      {/* Default Tool Selection */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <label className="flex items-center justify-between">
          <div>
            <span className="text-white font-medium">Default Tool</span>
            <p className="text-gray-400 text-sm">Tool selected when starting a new capture</p>
          </div>
          <select
            value={defaultTool}
            onChange={(e) => setDefaultTool(e.target.value as any)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400 cursor-pointer"
          >
            <option value="rectangle" className="bg-slate-800">Rectangle</option>
            <option value="circle" className="bg-slate-800">Circle</option>
            <option value="arrow" className="bg-slate-800">Arrow</option>
            <option value="pen" className="bg-slate-800">Pen</option>
            <option value="highlighter" className="bg-slate-800">Highlighter</option>
            <option value="text" className="bg-slate-800">Text</option>
            <option value="blur" className="bg-slate-800">Blur</option>
          </select>
        </label>
      </div>

      
      {/* Color & Style Section */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-medium">Color & Style</h3>
          <p className="text-gray-400 text-sm">Customize annotation appearance</p>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Quick Palette */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-300 text-sm font-medium">Quick Colors & Default</span>
              <span className="text-xs text-gray-500">
                {colorPalette.length}/8 colors
              </span>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Default Color Preview / Picker */}
              <div className="relative group">
                <div 
                  className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-lg flex items-center justify-center cursor-pointer hover:border-white/40 transition-colors"
                  style={{ backgroundColor: annotationStyle.color }}
                >
                  <input
                    type="color"
                    value={annotationStyle.color}
                    onChange={(e) => updateAnnotationStyle({ color: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Default Tool Color"
                  />
                  {/* Tooltip-like label */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Default
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-white/10 mx-1"></div>

              {/* Palette Colors */}
              {colorPalette.map((color, index) => (
                <div key={index} className="relative group">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white/10 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newPalette = [...colorPalette];
                        newPalette[index] = e.target.value.toUpperCase();
                        setColorPalette(newPalette);
                        
                        import('@tauri-apps/api/event').then(({ emit }) => emit('palette-updated', newPalette));

                        setTimeout(() => {
                          const stored = localStorage.getItem('app-storage');
                          if (stored) {
                            const parsed = JSON.parse(stored);
                            parsed.state.colorPalette = newPalette;
                            localStorage.setItem('app-storage', JSON.stringify(parsed));
                          }
                        }, 0);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                      title={`Color ${index + 1}`}
                    />
                  </div>
                  
                  {/* Remove Button (Hover) */}
                  {colorPalette.length > 1 && (
                    <button
                      onClick={() => {
                        const newPalette = colorPalette.filter((_, i) => i !== index);
                        setColorPalette(newPalette);
                        
                        import('@tauri-apps/api/event').then(({ emit }) => emit('palette-updated', newPalette));

                        setTimeout(() => {
                          const stored = localStorage.getItem('app-storage');
                          if (stored) {
                            const parsed = JSON.parse(stored);
                            parsed.state.colorPalette = newPalette;
                            localStorage.setItem('app-storage', JSON.stringify(parsed));
                          }
                        }, 0);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm scale-0 group-hover:scale-100"
                      title="Remove color"
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {/* Add Color Button */}
              {colorPalette.length < 8 && (
                <button
                  onClick={() => {
                    const newPalette = [...colorPalette, '#888888'];
                    setColorPalette(newPalette);
                    
                    import('@tauri-apps/api/event').then(({ emit }) => emit('palette-updated', newPalette));

                    setTimeout(() => {
                      const stored = localStorage.getItem('app-storage');
                      if (stored) {
                        const parsed = JSON.parse(stored);
                        parsed.state.colorPalette = newPalette;
                        localStorage.setItem('app-storage', JSON.stringify(parsed));
                      }
                    }, 0);
                  }}
                  className="w-8 h-8 rounded-full border-2 border-dashed border-white/20 hover:border-white/40 flex items-center justify-center text-white/40 hover:text-white/60 transition-colors hover:scale-110"
                  title="Add color"
                >
                  <span className="text-xl leading-none mb-0.5">+</span>
                </button>
              )}
            </div>
          </div>

          {/* Stroke Width */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-300 text-sm font-medium">Default Stroke Width</span>
              <span className="text-xs text-gray-500">{defaultStrokeWidth}px</span>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="20"
                value={defaultStrokeWidth}
                onChange={(e) => {
                  const width = parseInt(e.target.value);
                  setDefaultStrokeWidth(width);
                  // Update current style too for preview
                  updateAnnotationStyle({ strokeWidth: width });
                }}
                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              
              {/* Preview Dot */}
              <div 
                className="w-10 h-10 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center"
                title="Preview"
              >
                <div 
                  className="rounded-full bg-white"
                  style={{ width: Math.min(24, Math.max(2, defaultStrokeWidth)), height: Math.min(24, Math.max(2, defaultStrokeWidth)) }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {toolbarConfig.groups.map((group) => (
          <div
            key={group.id}
            className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
          >
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <span className="text-white font-medium">{group.label}</span>
              {expandedGroups.has(group.id) ? (
                <ChevronDown size={20} className="text-gray-400" />
              ) : (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </button>

            {/* Group Items */}
            {expandedGroups.has(group.id) && (
              <div className="border-t border-white/10">
                {group.items.map((item, index) => {
                  const Icon = TOOLBAR_ICONS[item.id];
                  const meta = TOOLBAR_ITEM_METADATA[item.id];
                  const isDraggingThis = dragging?.itemId === item.id;
                  const isHoverTarget = dragging && dragging.groupId === group.id && hoverIndex === index && !isDraggingThis;

                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => handleMouseEnter(index)}
                      className={`
                        flex items-center gap-4 p-4 border-b border-white/5 last:border-b-0
                        transition-all select-none
                        ${isDraggingThis ? 'bg-blue-500/20 opacity-70' : 'hover:bg-white/5'}
                        ${isHoverTarget ? 'bg-blue-500/30 border-t-2 border-t-blue-400' : ''}
                        ${!item.enabled ? 'opacity-50' : ''}
                      `}
                    >
                      {/* Drag Handle */}
                      <div 
                        className="text-gray-500 flex-shrink-0 cursor-grab active:cursor-grabbing hover:text-gray-300"
                        onMouseDown={(e) => handleMouseDown(e, group.id, item.id, index)}
                      >
                        <GripVertical size={20} />
                      </div>

                      {/* Icon */}
                      <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg">
                        <Icon size={20} className="text-white" />
                      </div>

                      {/* Label & Description */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium">{meta.label}</div>
                        <div className="text-gray-400 text-sm truncate">{meta.description}</div>
                      </div>

                      {/* Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setToolbarItemEnabled(group.id, item.id, !item.enabled);
                        }}
                        className={`
                          p-2 rounded-lg transition-colors
                          ${item.enabled
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                          }
                        `}
                        title={item.enabled ? 'Disable' : 'Enable'}
                      >
                        {item.enabled ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
