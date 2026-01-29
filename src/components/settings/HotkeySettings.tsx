// JustSnap - Hotkey Settings Component

import { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { invoke } from '@tauri-apps/api/core';

interface HotkeyInputProps {
  label: string;
  description: string;
  value: string;
  onChange: (hotkey: string) => void;
  status?: 'idle' | 'success' | 'error';
}

function HotkeyInput({ label, description, value, onChange, status = 'idle' }: HotkeyInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const inputRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Build the hotkey string
      const parts: string[] = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.metaKey) parts.push('Meta');

      // Get the key (ignoring modifier-only keypresses)
      const key = e.key;
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
        parts.push(key.length === 1 ? key.toUpperCase() : key);
        const hotkey = parts.join('+');
        setTempValue(hotkey);
        onChange(hotkey);
        setIsRecording(false);
      } else {
        // Show current modifiers while recording
        setTempValue(parts.length > 0 ? parts.join('+') + '+...' : 'Press a key...');
      }
    };

    const handleBlur = () => {
      setIsRecording(false);
      setTempValue('');
    };

    window.addEventListener('keydown', handleKeyDown);
    inputRef.current?.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      inputRef.current?.removeEventListener('blur', handleBlur);
    };
  }, [isRecording, onChange]);

  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{label}</span>
          {status === 'success' && <Check size={16} className="text-green-400" />}
          {status === 'error' && <AlertCircle size={16} className="text-red-400" />}
        </div>
        <div className="text-gray-400 text-sm">{description}</div>
      </div>

      <button
        ref={inputRef}
        onClick={() => {
          setIsRecording(true);
          setTempValue('Press a key...');
        }}
        className={`
          min-w-[160px] px-4 py-2 rounded-lg font-mono text-sm transition-all
          ${isRecording
            ? 'bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
          }
        `}
      >
        {isRecording ? tempValue : value}
      </button>
    </div>
  );
}

// Parse a hotkey string like "Ctrl+Shift+S" into modifiers and key
function parseHotkey(hotkeyStr: string): { modifiers: string[]; key: string } {
  const parts = hotkeyStr.split('+');
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  return { modifiers, key };
}

export function HotkeySettings() {
  const hotkeys = useAppStore((state) => state.hotkeys);
  const setHotkey = useAppStore((state) => state.setHotkey);
  const [hotkeyStatus, setHotkeyStatus] = useState<Record<string, 'idle' | 'success' | 'error'>>({});

  const hotkeyDefinitions: { action: string; label: string; description: string }[] = [
    { action: 'capture', label: 'Capture Screenshot', description: 'Open the snipping overlay' },
  ];

  // Handle hotkey change with live registration
  const handleHotkeyChange = useCallback(async (action: string, newHotkey: string) => {
    try {
      // 1. Unregister all existing hotkeys
      await invoke('unregister_hotkey');
      
      // 2. Parse the new hotkey
      const { modifiers, key } = parseHotkey(newHotkey);
      
      // 3. Register the new hotkey
      await invoke('register_hotkey', {
        config: { key, modifiers }
      });
      
      // 4. Save to store
      setHotkey(action, newHotkey);
      
      // 5. Show success feedback
      setHotkeyStatus(prev => ({ ...prev, [action]: 'success' }));
      setTimeout(() => {
        setHotkeyStatus(prev => ({ ...prev, [action]: 'idle' }));
      }, 2000);
      
      console.log(`[HotkeySettings] Registered new hotkey: ${newHotkey}`);
    } catch (error) {
      console.error('[HotkeySettings] Failed to register hotkey:', error);
      setHotkeyStatus(prev => ({ ...prev, [action]: 'error' }));
      setTimeout(() => {
        setHotkeyStatus(prev => ({ ...prev, [action]: 'idle' }));
      }, 3000);
    }
  }, [setHotkey]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Keyboard Shortcuts</h2>
        <p className="text-gray-400">Customize global hotkeys for quick access</p>
      </div>

      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
        <Check size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-green-200 font-medium">Live Updates</div>
          <div className="text-green-200/70 text-sm">
            Hotkey changes take effect immediately - no restart required!
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {hotkeyDefinitions.map((def) => (
          <HotkeyInput
            key={def.action}
            label={def.label}
            description={def.description}
            value={hotkeys[def.action] || 'Not set'}
            onChange={(hotkey) => handleHotkeyChange(def.action, hotkey)}
            status={hotkeyStatus[def.action] || 'idle'}
          />
        ))}
      </div>

      <div className="text-gray-500 text-sm">
        <Keyboard size={16} className="inline mr-2" />
        More shortcuts coming soon...
      </div>
    </div>
  );
}

