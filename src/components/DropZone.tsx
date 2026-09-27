import React, { useRef, useState } from 'react';
import { UploadCloud, File as FileIcon, X, Send, FolderPlus } from 'lucide-react';
import type { AirDropDevice } from '../types/airdrop';

interface DropZoneProps {
  selectedDevice: AirDropDevice | null;
  onClearSelectedDevice: () => void;
  onSendFiles: (deviceId: string, files: File[]) => void;
  devices: AirDropDevice[];
  onSelectDevice: (device: AirDropDevice) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  selectedDevice,
  onClearSelectedDevice,
  onSendFiles,
  devices,
  onSelectDevice,
}) => {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const incoming = Array.from(e.dataTransfer.files);
      setStagedFiles((prev) => [...prev, ...incoming]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files);
      setStagedFiles((prev) => [...prev, ...incoming]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!selectedDevice || stagedFiles.length === 0) return;
    onSendFiles(selectedDevice.id, stagedFiles);
    setStagedFiles([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 pb-6 select-none">
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 glass-panel p-5 ${
          isDragOver
            ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20'
            : 'border-slate-700/60 hover:border-slate-600'
        }`}
      >
        {stagedFiles.length === 0 ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition"
              >
                <UploadCloud className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Drag and drop files to AirDrop
                </p>
                <p className="text-xs text-slate-400">
                  Or drop files directly onto any device avatar on the radar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2 shadow-sm"
              >
                <FolderPlus className="w-4 h-4 text-blue-400" />
                Browse Files
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File list chips */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                {stagedFiles.length} file{stagedFiles.length > 1 ? 's' : ''} staged for AirDrop (
                {formatFileSize(stagedFiles.reduce((acc, f) => acc + f.size, 0))})
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-400 hover:underline font-medium"
              >
                + Add more
              </button>
            </div>

            <div className="max-h-28 overflow-y-auto pr-1 flex flex-wrap gap-2">
              {stagedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs text-slate-200 shadow-sm"
                >
                  <FileIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="max-w-[160px] truncate font-medium">{file.name}</span>
                  <span className="text-[10px] text-slate-400">({formatFileSize(file.size)})</span>
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="hover:text-red-400 transition ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Target device selector & Send Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400">Recipient:</span>
                {selectedDevice ? (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                    <span>{selectedDevice.name}</span>
                    <button onClick={onClearSelectedDevice} className="hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <select
                    onChange={(e) => {
                      const dev = devices.find((d) => d.id === e.target.value);
                      if (dev) onSelectDevice(dev);
                    }}
                    value=""
                    className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>
                      Choose a nearby device...
                    </option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.modelName || d.type})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setStagedFiles([])}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Clear
                </button>
                <button
                  disabled={!selectedDevice}
                  onClick={handleSend}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
                    selectedDevice
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  AirDrop Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
