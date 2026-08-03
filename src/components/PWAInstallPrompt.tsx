import React, { useState } from 'react';
import { Download, WifiOff, RefreshCw, X, Smartphone, Check } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

interface PWAInstallPromptProps {
  onTriggerInstall: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  needRefresh: boolean;
  onReloadApp: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onTriggerInstall,
  isInstallable,
  isInstalled,
  isOffline,
  needRefresh,
  onReloadApp,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  return (
    <>
      {/* Offline Status Badge */}
      {isOffline && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-amber-900/90 border border-amber-600/80 text-amber-100 text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-md animate-bounce">
          <WifiOff className="w-3.5 h-3.5 text-amber-300" />
          <span>Working Offline — Studio cache active</span>
        </div>
      )}

      {/* SW Update Ready Toast */}
      {needRefresh && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-red-500 p-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-white">
          <RefreshCw className="w-5 h-5 text-red-400 animate-spin" />
          <div>
            <h4 className="text-xs font-bold">App Update Available</h4>
            <p className="text-[11px] text-slate-400">Click to load the latest studio features.</p>
          </div>
          <button
            onClick={onReloadApp}
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow"
          >
            Update
          </button>
        </div>
      )}

      {/* Prominent PWA Install Toast Banner for Desktop/Mobile */}
      {!isInstalled && !isDismissed && (
        <div className="fixed bottom-4 left-4 z-40 bg-slate-900/95 border border-red-600/60 p-3.5 rounded-2xl shadow-2xl max-w-sm flex items-center justify-between gap-3 text-white backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                Install ProEdit Studio
                <span className="text-[9px] bg-red-950 text-red-300 px-1.5 py-0.2 rounded font-mono">PWA</span>
              </h4>
              <p className="text-[11px] text-slate-400">Install app on desktop or phone for offline multi-track editing.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onTriggerInstall}
              className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow transition-all cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
