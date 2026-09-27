import React from 'react';
import { Smartphone, Laptop, Tablet, FileText, Check, X, ShieldAlert } from 'lucide-react';
import type { TransferSession } from '../types/airdrop';

interface IncomingTransferModalProps {
  session: TransferSession | null;
  onAccept: (sessionId: string) => void;
  onDecline: (sessionId: string) => void;
}

export const IncomingTransferModal: React.FC<IncomingTransferModalProps> = ({
  session,
  onAccept,
  onDecline,
}) => {
  if (!session) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const getDeviceIcon = () => {
    switch (session.deviceType) {
      case 'iphone':
        return <Smartphone className="w-8 h-8 text-white" />;
      case 'mac':
        return <Laptop className="w-8 h-8 text-white" />;
      case 'ipad':
        return <Tablet className="w-8 h-8 text-white" />;
      default:
        return <Smartphone className="w-8 h-8 text-white" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/90 border border-slate-700/80 p-6 shadow-2xl shadow-blue-500/10 text-center select-none animate-in zoom-in-95 duration-200">
        {/* Device Icon Avatar */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-xl shadow-blue-600/30 flex items-center justify-center mb-4">
          <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center">
            {getDeviceIcon()}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-slate-900"></span>
          </span>
        </div>

        {/* Heading */}
        <h3 className="text-lg font-bold text-white tracking-tight">AirDrop Invitation</h3>
        <p className="text-sm font-semibold text-blue-400 mt-1">{session.deviceName}</p>
        <p className="text-xs text-slate-400 mt-1">
          wants to share {session.files.length} item{session.files.length > 1 ? 's' : ''} (
          {formatFileSize(session.totalSize)})
        </p>

        {/* Files Preview Box */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-left max-h-36 overflow-y-auto space-y-1.5">
          {session.files.map((file, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                {formatFileSize(file.size)}
              </span>
            </div>
          ))}
        </div>

        {/* Security / Verification Badge */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted TLS 1.3 AirDrop Transfer</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => onDecline(session.id)}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 font-semibold text-xs text-slate-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <X className="w-4 h-4 text-rose-400" />
            Decline
          </button>
          <button
            onClick={() => onAccept(session.id)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-xs text-white transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
