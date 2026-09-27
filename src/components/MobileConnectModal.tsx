import React from 'react';
import { X, Smartphone, Radio, Copy, Check } from 'lucide-react';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  localIp: string;
  port: number;
}

export const MobileConnectModal: React.FC<MobileConnectModalProps> = ({
  isOpen,
  onClose,
  localIp,
  port,
}) => {
  const [copied, setCopied] = React.useState(false);
  if (!isOpen) return null;

  const url = `http://${localIp}:${port}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-left select-none animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Connect iPhone / Mobile Devices</h3>
            <p className="text-xs text-slate-400">Zero-install instant sharing from iOS, iPadOS or Android</p>
          </div>
        </div>

        {/* Dual Mode Switch Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
          {/* Method 1: QR / Local Web Portal */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col items-center text-center">
            {/* Stylized QR Code SVG Representation */}
            <div className="w-36 h-36 bg-white p-2.5 rounded-xl shadow-md flex items-center justify-center mb-3">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Position Markers */}
                <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="4" />
                <rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
                <rect x="13" y="13" width="12" height="12" fill="#0f172a" rx="1" />

                <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="4" />
                <rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
                <rect x="75" y="13" width="12" height="12" fill="#0f172a" rx="1" />

                <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="4" />
                <rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
                <rect x="13" y="75" width="12" height="12" fill="#0f172a" rx="1" />

                {/* Simulated Data Matrix dots */}
                <rect x="40" y="8" width="6" height="6" fill="#0f172a" />
                <rect x="52" y="14" width="6" height="6" fill="#0f172a" />
                <rect x="40" y="24" width="6" height="6" fill="#0f172a" />
                <rect x="50" y="24" width="6" height="6" fill="#0f172a" />
                <rect x="8" y="42" width="6" height="6" fill="#0f172a" />
                <rect x="20" y="42" width="6" height="6" fill="#0f172a" />
                <rect x="36" y="40" width="8" height="8" fill="#2563eb" rx="2" />
                <rect x="48" y="48" width="8" height="8" fill="#0f172a" />
                <rect x="62" y="42" width="6" height="6" fill="#0f172a" />
                <rect x="78" y="42" width="6" height="6" fill="#0f172a" />
                <rect x="40" y="64" width="6" height="6" fill="#0f172a" />
                <rect x="52" y="68" width="6" height="6" fill="#0f172a" />
                <rect x="40" y="80" width="6" height="6" fill="#0f172a" />
                <rect x="52" y="82" width="6" height="6" fill="#0f172a" />
                <rect x="70" y="70" width="6" height="6" fill="#0f172a" />
                <rect x="84" y="74" width="6" height="6" fill="#0f172a" />
                <rect x="76" y="86" width="6" height="6" fill="#0f172a" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-white">Scan with Camera</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Open iPhone camera to access immediate Wi-Fi AirDrop portal
            </p>
          </div>

          {/* Method 2: Native AirDrop AWDL */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">Native AirDrop (AWDL)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                If your Wi-Fi card supports AWDL or OWL is enabled, this PC will appear directly in
                the Apple AirDrop menu when tapping <span className="text-blue-400 font-medium">Share</span> on photos or files.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/70">
              <span className="text-[10px] uppercase font-bold text-slate-400">Local URL</span>
              <div className="flex items-center justify-between mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
                <span className="truncate">{url}</span>
                <button
                  onClick={handleCopy}
                  className="hover:text-blue-400 transition ml-2 text-slate-400"
                  title="Copy link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
