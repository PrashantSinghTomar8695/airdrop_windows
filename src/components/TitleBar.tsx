import React from 'react';
import { Radio, Settings, QrCode } from 'lucide-react';
import type { AirDropSettings, AirDropVisibility } from '../types/airdrop';

interface TitleBarProps {
  settings: AirDropSettings;
  onUpdateVisibility: (visibility: AirDropVisibility) => void;
  onOpenSettings: () => void;
  onOpenMobileConnect: () => void;
  onSimulateIncoming: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  settings,
  onUpdateVisibility,
  onOpenSettings,
  onOpenMobileConnect,
  onSimulateIncoming,
}) => {

  return (
    <header className="h-14 w-full flex items-center justify-between px-5 glass-panel border-b border-slate-800/80 sticky top-0 z-40 select-none">
      {/* Left: App Branding & Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 shadow-lg shadow-blue-500/25">
          <Radio className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-white">AirDrop</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Windows
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 -ml-2.5"></span>
            <span className="text-[11px] font-medium text-slate-300">AWDL + Wi-Fi Ready</span>
          </div>
        </div>
      </div>

      {/* Center: Test Trigger & Fast Switch */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={onSimulateIncoming}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 shadow-sm"
          title="Simulate incoming AirDrop request from an Apple device"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulate Incoming AirDrop</span>
        </button>
      </div>

      {/* Right Controls: Visibility, QR Mobile Portal, Settings */}
      <div className="flex items-center gap-3">
        {/* Visibility Selector */}
        <div className="relative flex items-center">
          <select
            value={settings.visibility}
            onChange={(e) => onUpdateVisibility(e.target.value as AirDropVisibility)}
            className="text-xs font-medium bg-slate-900/90 text-slate-200 border border-slate-700/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer hover:border-slate-600 transition"
          >
            <option value="everyone_10min">Everyone (10 min)</option>
            <option value="contacts">Contacts Only</option>
            <option value="everyone">Everyone</option>
            <option value="off">Receiving Off</option>
          </select>
        </div>

        {/* Mobile Portal Modal Button */}
        <button
          onClick={onOpenMobileConnect}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 text-slate-300 hover:text-white transition-all shadow-sm"
          title="Connect iPhone / Android via QR or Local Web Link"
        >
          <QrCode className="w-4 h-4 text-blue-400" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 text-slate-300 hover:text-white transition-all shadow-sm"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-slate-400 hover:text-slate-200" />
        </button>
      </div>
    </header>
  );
};
