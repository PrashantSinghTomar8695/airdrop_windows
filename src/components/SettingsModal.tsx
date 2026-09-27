import React, { useState } from 'react';
import { X, Folder, Volume2, ShieldCheck, Radio, Save } from 'lucide-react';
import type { AirDropSettings, AirDropVisibility } from '../types/airdrop';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AirDropSettings;
  onSaveSettings: (settings: Partial<AirDropSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<AirDropSettings>({ ...settings });

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-left animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-white mb-1">AirDrop Settings</h3>
        <p className="text-xs text-slate-400 mb-5">Configure device visibility and transfer destinations</p>

        <div className="space-y-4">
          {/* Device Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Computer AirDrop Name
            </label>
            <input
              type="text"
              value={formData.deviceName}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 transition"
              placeholder="e.g. My Windows PC"
            />
          </div>

          {/* Download Directory */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Save Incoming Files To
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.downloadPath}
                onChange={(e) => setFormData({ ...formData, downloadPath: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => alert('Folder picker dialog: Selected Downloads folder')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                title="Browse folder"
              >
                <Folder className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>

          {/* Visibility Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              AirDrop Discovery Mode
            </label>
            <select
              value={formData.visibility}
              onChange={(e) =>
                setFormData({ ...formData, visibility: e.target.value as AirDropVisibility })
              }
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="everyone_10min">Everyone (10 Minutes) [Apple Default]</option>
              <option value="contacts">Contacts Only</option>
              <option value="everyone">Everyone (Always)</option>
              <option value="off">Off (Invisible)</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="pt-2 space-y-3 border-t border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-300">Play Apple AirDrop Chimes</span>
              </div>
              <input
                type="checkbox"
                checked={formData.enableSound}
                onChange={(e) => setFormData({ ...formData, enableSound: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-300">Enable AWDL / OWL Protocol Driver</span>
              </div>
              <input
                type="checkbox"
                checked={formData.useAwdl}
                onChange={(e) => setFormData({ ...formData, useAwdl: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-300">Auto-Accept from Known Devices</span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoAcceptKnown}
                onChange={(e) => setFormData({ ...formData, autoAcceptKnown: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-md shadow-blue-600/30"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
