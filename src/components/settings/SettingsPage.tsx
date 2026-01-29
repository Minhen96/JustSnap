// JustSnap - Settings Page Component

import { useState } from 'react';
import { ArrowLeft, Paintbrush, Keyboard, RotateCcw, Settings2 } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { ToolbarCustomizer } from './ToolbarCustomizer';
import { HotkeySettings } from './HotkeySettings';
import { GeneralSettings } from './GeneralSettings';

interface SettingsPageProps {
  onClose: () => void;
}

type SettingsTab = 'general' | 'toolbar' | 'shortcuts';

export function SettingsPage({ onClose }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const resetToolbarConfig = useAppStore((state) => state.resetToolbarConfig);

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: Settings2 },
    { id: 'toolbar', label: 'Toolbar', icon: Paintbrush },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>

        {activeTab === 'toolbar' && (
          <button
            onClick={resetToolbarConfig}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
          >
            <RotateCcw size={16} />
            Reset to Default
          </button>
        )}
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-56 p-4 border-r border-white/10">
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-white/10'
                    }
                  `}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto scrollbar-hide">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'toolbar' && <ToolbarCustomizer />}
          {activeTab === 'shortcuts' && <HotkeySettings />}
        </main>
      </div>
    </div>
  );
}
