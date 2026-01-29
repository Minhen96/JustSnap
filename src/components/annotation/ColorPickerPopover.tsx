// JustSnap - Color Picker Popover Component
// Professional color picker with presets, recent colors, and custom picker

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';

interface ColorPickerPopoverProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  presetColors?: string[];
}

const DEFAULT_PRESET_COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green  
  '#0000FF', // Blue
  '#000000', // Black
];

export function ColorPickerPopover({
  currentColor,
  onColorChange,
  isOpen,
  onClose,
  buttonRef,
  presetColors = DEFAULT_PRESET_COLORS,
}: ColorPickerPopoverProps) {
  const [customColor, setCustomColor] = useState(currentColor);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [activePresetColors, setActivePresetColors] = useState<string[]>(presetColors);
  const popoverRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Update internal state when props change
  useEffect(() => {
    setActivePresetColors(presetColors);
  }, [presetColors]);

  // Load recent colors from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('justsnap-recent-colors');
    if (stored) {
      try {
        setRecentColors(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load recent colors:', e);
      }
    }
  }, []);

  // Save recent colors to localStorage
  const addToRecent = (color: string) => {
    const updated = [color, ...recentColors.filter(c => c !== color)].slice(0, 5);
    setRecentColors(updated);
    localStorage.setItem('justsnap-recent-colors', JSON.stringify(updated));
  };

  // Handle color selection
  const handleColorSelect = (color: string) => {
    onColorChange(color);
    addToRecent(color);
    setCustomColor(color);
  };

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, buttonRef]);

  // Position popover above button with boundary detection
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen || !buttonRef.current || !popoverRef.current) return;

    // Use RAF to ensure DOM is ready
    const updatePosition = () => {
      if (!buttonRef.current || !popoverRef.current) return;
      
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      
      const MARGIN = 8;
      
      // Calculate initial position (above and centered)
      let top = buttonRect.top - popoverRect.height - MARGIN;
      let left = buttonRect.left + (buttonRect.width / 2) - (popoverRect.width / 2);
      
      // Check if popover goes above viewport
      if (top < MARGIN) {
        top = buttonRect.bottom + MARGIN;
      }
      
      // Check if popover goes beyond right edge
      if (left + popoverRect.width > window.innerWidth - MARGIN) {
        left = window.innerWidth - popoverRect.width - MARGIN;
      }
      
      // Check if popover goes beyond left edge
      if (left < MARGIN) {
        left = MARGIN;
      }
      
      // Check if popover goes beyond bottom edge
      if (top + popoverRect.height > window.innerHeight - MARGIN) {
        top = buttonRect.top - popoverRect.height - MARGIN;
        if (top < MARGIN) {
          top = MARGIN;
        }
      }
      
      setPosition({ top, left });
    };

    requestAnimationFrame(updatePosition);
  }, [isOpen, buttonRef]);

  if (!isOpen) return null;

  // Use Portal to escape parent transforms (which break fixed positioning)
  return createPortal(
      <div
        ref={popoverRef}
        className="fixed z-[99999] bg-white rounded-lg shadow-2xl border border-gray-200 p-2"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          minWidth: '200px',
        }}
      >
        {/* Main Row: 4 Preset Colors + Color Picker Button */}
        <div className="flex items-center gap-1 mb-2">
          {activePresetColors.map((color: string) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              className="relative w-8 h-8 rounded-md border-2 hover:scale-110 transition-transform flex-shrink-0"
              style={{
                backgroundColor: color,
                borderColor: currentColor === color ? '#3B82F6' : '#E5E7EB',
              }}
              title={color}
            >
              {currentColor === color && (
                <Check
                  size={14}
                  className="absolute inset-0 m-auto"
                  style={{ color: color === '#FFFFFF' || color === '#00FF00' ? '#000000' : '#FFFFFF' }}
                />
              )}
            </button>
          ))}
          
          {/* Custom Color Picker Button - Triggers native color picker */}
          <button
            onClick={() => colorInputRef.current?.click()}
            className="w-8 h-8 rounded-md border-2 border-gray-300 hover:border-blue-500 hover:scale-110 transition-all flex items-center justify-center bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 flex-shrink-0"
            title="Custom Color"
          >
            <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center text-xs font-bold text-gray-700">
              +
            </div>
          </button>
          
          {/* Hidden native color input */}
          <input
            ref={colorInputRef}
            type="color"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              handleColorSelect(e.target.value);
            }}
            className="hidden"
          />
        </div>

        {/* Recent Colors */}
        {recentColors.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-500 mb-1 px-1">RECENT</div>
            <div className="flex gap-1">
              {recentColors.map((color, index) => (
                <button
                  key={`${color}-${index}`}
                  onClick={() => handleColorSelect(color)}
                  className="relative w-6 h-6 rounded-md border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: color,
                    borderColor: currentColor === color ? '#3B82F6' : '#E5E7EB',
                  }}
                  title={color}
                >
                  {currentColor === color && (
                    <Check
                      size={12}
                      className="absolute inset-0 m-auto"
                      style={{ color: color === '#FFFFFF' ? '#000000' : '#FFFFFF' }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Arrow pointing to button */}
        <div
          className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45"
        />
      </div>,
      document.body
    );
  }
