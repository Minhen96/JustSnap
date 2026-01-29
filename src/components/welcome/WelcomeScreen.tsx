// JustSnap - Welcome Screen
// A friendly first-launch screen that shows users the hotkeys
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { SettingsPage } from '../settings/SettingsPage';

export function WelcomeScreen() {
  const hotkeys = useAppStore((state) => state.hotkeys);
  
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) {
    return <SettingsPage onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden selection:bg-purple-500/30">
      
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px]" />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />
      </div>

      {/* Main Content Container - Centered & Compact */}
      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col gap-8 animate-fadeIn items-center text-center">
        
        {/* Brand Section */}
        <div className="flex flex-col items-center gap-6">
           
           {/* Header Row: Logo + Title */}
           <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 bg-white rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center transform transition-transform hover:scale-105 duration-300">
                 <img src="/justsnap_logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-gray-400 tracking-tight">
                JustSnap
              </h1>
           </div>

           {/* Description */}
           <p className="text-lg text-gray-400 max-w-md font-light leading-relaxed">
             The fastest way to <span className="text-blue-400 font-medium">capture</span>, <span className="text-purple-400 font-medium">annotate</span>, and <span className="text-pink-400 font-medium">share</span> your screen.
           </p>
        </div>

        {/* Info/Features Badge Row
        <div className="flex gap-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
           <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">Instant Copy</span>
           <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">Rich Tools</span>
           <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">Auto-Save</span>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" /> */}

        {/* Action Stack (Vertical) */}
        <div className="w-full max-w-sm flex flex-col gap-3">
           
           {/* Primary: Hotkey Card */}
           <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 group hover:border-white/20 transition-all shadow-2xl">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                 Ready to Capture
              </div>
              
              <div className="text-3xl font-bold text-white tracking-wide font-mono drop-shadow-lg">
                 {hotkeys.capture || 'Ctrl+Shift+S'}
              </div>

              <div className="text-xs text-gray-500 font-medium">
                 Global Shortcut Active
              </div>
           </div>

           {/* Secondary: Customize Button (Same width, smaller height) */}
           <button 
              onClick={() => setShowSettings(true)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all group"
           >
              <Settings size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                 Customize Settings
              </span>
           </button>
        </div>

      </div>

      {/* Minimal Footer */}
      <div className="absolute bottom-6 text-[10px] text-gray-600 font-medium tracking-widest uppercase opacity-60">
        v0.1.0 • Early Access
      </div>

    </div>
  );
}
