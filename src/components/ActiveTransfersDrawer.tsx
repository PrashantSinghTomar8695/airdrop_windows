import React from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, FolderOpen, X } from 'lucide-react';
import type { TransferSession } from '../types/airdrop';

interface ActiveTransfersDrawerProps {
  transfers: TransferSession[];
  onCancel: (sessionId: string) => void;
  downloadPath: string;
}

export const ActiveTransfersDrawer: React.FC<ActiveTransfersDrawerProps> = ({
  transfers,
  onCancel,
  downloadPath,
}) => {
  if (transfers.length === 0) return null;

  const activeTransfers = transfers.filter(
    (t) => t.status === 'transferring' || t.status === 'pending' || t.status === 'accepted'
  );
  const completedTransfers = transfers.filter(
    (t) => t.status === 'completed' || t.status === 'canceled' || t.status === 'rejected'
  );

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] z-40 select-none animate-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-2xl glass-panel border border-slate-700/80 shadow-2xl p-4 overflow-hidden">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            AirDrop Activity
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono">
            {activeTransfers.length} Active
          </span>
        </div>

        {/* Active Transfer Items */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {activeTransfers.map((session) => (
            <div
              key={session.id}
              className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <div
                    className={`p-1.5 rounded-lg ${
                      session.direction === 'incoming'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {session.direction === 'incoming' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {session.deviceName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {session.files[0]?.name || 'Files'}{' '}
                      {session.files.length > 1 ? `(+${session.files.length - 1} more)` : ''}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onCancel(session.id)}
                  className="text-slate-400 hover:text-rose-400 transition"
                  title="Cancel Transfer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar & Stats */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                  <span>{session.progress}%</span>
                  <span>{session.speed}</span>
                  <span>{session.timeRemaining}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-200"
                    style={{ width: `${session.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}

          {/* Recent Completed / Cancelled Items */}
          {completedTransfers.slice(0, 2).map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                {session.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <div className="truncate">
                  <p className="text-xs text-slate-300 truncate font-medium">
                    {session.deviceName}
                  </p>
                  <p className="text-[10px] text-slate-500 capitalize">
                    {session.status === 'completed' ? 'Transfer complete' : session.status}
                  </p>
                </div>
              </div>

              {session.status === 'completed' && session.direction === 'incoming' && (
                <button
                  onClick={() => alert(`Saved to: ${downloadPath}`)}
                  className="px-2 py-1 rounded-md bg-slate-700/60 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1 transition"
                  title="Open in Downloads folder"
                >
                  <FolderOpen className="w-3 h-3 text-blue-400" />
                  Open
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
