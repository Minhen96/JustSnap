import { useAppStore } from '../../store/appStore';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import { useEffect } from 'react';

export function GeneralSettings() {
  const autoCloseAfterCopy = useAppStore((state) => state.autoCloseAfterCopy);
  const setAutoCloseAfterCopy = useAppStore((state) => state.setAutoCloseAfterCopy);
  
  const autoCloseAfterSave = useAppStore((state) => state.autoCloseAfterSave);
  const setAutoCloseAfterSave = useAppStore((state) => state.setAutoCloseAfterSave);

  const startAtLogin = useAppStore((state) => state.startAtLogin);
  const setStartAtLogin = useAppStore((state) => state.setStartAtLogin);

  // Sync state with plugin on mount
  useEffect(() => {
    isEnabled().then((enabled) => {
      if (enabled !== startAtLogin) {
        setStartAtLogin(enabled);
      }
    });
  }, []);

  const handleToggleStartAtLogin = async () => {
    const newState = !startAtLogin;
    try {
      if (newState) {
        await enable();
      } else {
        await disable();
      }
      setStartAtLogin(newState);
    } catch (error) {
      console.error('Failed to update autostart setting:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          Behavior Settings
        </h2>

        <div className="space-y-4">
          {/* Launch at login */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
            <div>
              <div className="font-medium text-white mb-1">Launch at login</div>
              <div className="text-sm text-gray-400">
                Automatically start JustSnap when you log in to your computer
              </div>
            </div>
            <button
              onClick={handleToggleStartAtLogin}
              className={`
                relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900
                ${startAtLogin ? 'bg-blue-600' : 'bg-gray-600'}
              `}
            >
              <span
                className={`
                  inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                  ${startAtLogin ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Auto Close After Copy */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
            <div>
              <div className="font-medium text-white mb-1">Auto-close after Copy</div>
              <div className="text-sm text-gray-400">
                Automatically close the editor window after copying to clipboard
              </div>
            </div>
            <button
              onClick={() => setAutoCloseAfterCopy(!autoCloseAfterCopy)}
              className={`
                relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900
                ${autoCloseAfterCopy ? 'bg-blue-600' : 'bg-gray-600'}
              `}
            >
              <span
                className={`
                  inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                  ${autoCloseAfterCopy ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Auto Close After Save */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
            <div>
              <div className="font-medium text-white mb-1">Auto-close after Save</div>
              <div className="text-sm text-gray-400">
                Automatically close the editor window after saving the file
              </div>
            </div>
            <button
              onClick={() => setAutoCloseAfterSave(!autoCloseAfterSave)}
              className={`
                relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900
                ${autoCloseAfterSave ? 'bg-blue-600' : 'bg-gray-600'}
              `}
            >
              <span
                className={`
                  inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                  ${autoCloseAfterSave ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
