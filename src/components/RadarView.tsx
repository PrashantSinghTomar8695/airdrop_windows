import React, { useState } from 'react';
import { Smartphone, Laptop, Tablet, Monitor, Check, Loader2, ArrowUpRight } from 'lucide-react';
import type { AirDropDevice, DeviceType } from '../types/airdrop';

interface RadarViewProps {
  devices: AirDropDevice[];
  onSelectDevice: (device: AirDropDevice) => void;
  onDropFilesOnDevice: (device: AirDropDevice, files: File[]) => void;
  thisDeviceName: string;
}

export const RadarView: React.FC<RadarViewProps> = ({
  devices,
  onSelectDevice,
  onDropFilesOnDevice,
  thisDeviceName,
}) => {
  const [hoveredDeviceId, setHoveredDeviceId] = useState<string | null>(null);
  const [dragOverDeviceId, setDragOverDeviceId] = useState<string | null>(null);

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'iphone':
        return <Smartphone className="w-6 h-6 text-white" />;
      case 'mac':
        return <Laptop className="w-6 h-6 text-white" />;
      case 'ipad':
        return <Tablet className="w-6 h-6 text-white" />;
      case 'windows':
        return <Monitor className="w-6 h-6 text-white" />;
      default:
        return <Smartphone className="w-6 h-6 text-white" />;
    }
  };

  const handleDragOver = (e: React.DragEvent, deviceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDeviceId(deviceId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDeviceId(null);
  };

  const handleDrop = (e: React.DragEvent, device: AirDropDevice) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDeviceId(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onDropFilesOnDevice(device, filesArray);
    }
  };

  return (
    <div className="relative w-full h-[520px] flex items-center justify-center overflow-hidden select-none">
      {/* Background Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      <div className="absolute w-[450px] h-[450px] rounded-full bg-blue-600/10 blur-[90px] pointer-events-none"></div>

      {/* Radar Sonar Rings */}
      <div className="relative flex items-center justify-center w-[500px] h-[500px]">
        {/* Outer Ring 3 */}
        <div className="absolute w-[440px] h-[440px] rounded-full border border-slate-700/40"></div>
        {/* Middle Ring 2 */}
        <div className="absolute w-[320px] h-[320px] rounded-full border border-slate-700/60"></div>
        {/* Inner Ring 1 */}
        <div className="absolute w-[200px] h-[200px] rounded-full border border-blue-500/20"></div>

        {/* Pulsing Sonar Waves */}
        <div className="absolute w-[200px] h-[200px] rounded-full border border-blue-500/30 animate-radar-pulse pointer-events-none"></div>
        <div className="absolute w-[200px] h-[200px] rounded-full border border-indigo-500/30 animate-radar-pulse-delayed pointer-events-none"></div>

        {/* Radar Scanner Sweep Beam */}
        <div className="absolute w-[440px] h-[440px] rounded-full animate-radar-scan pointer-events-none opacity-20">
          <div className="w-1/2 h-1/2 bg-gradient-to-br from-blue-500/40 to-transparent rounded-tl-full origin-bottom-right"></div>
        </div>

        {/* Center: This PC */}
        <div className="relative z-20 flex flex-col items-center">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/40 shadow-xl shadow-blue-900/30">
            <Monitor className="w-8 h-8 text-blue-400" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
          </div>
          <div className="mt-2 text-center">
            <p className="text-xs font-semibold text-white drop-shadow">{thisDeviceName}</p>
            <span className="inline-block text-[10px] text-blue-400 font-medium">This Computer</span>
          </div>
        </div>

        {/* Discovered Peer Devices Positioned with Polar Coordinates */}
        {devices.map((device) => {
          const rad = (device.angle * Math.PI) / 180;
          const x = Math.cos(rad) * device.distance;
          const y = Math.sin(rad) * device.distance;
          const isDragOver = dragOverDeviceId === device.id;
          const isHovered = hoveredDeviceId === device.id;

          return (
            <div
              key={device.id}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
              className="absolute z-30 transition-transform duration-500 ease-out"
              onMouseEnter={() => setHoveredDeviceId(device.id)}
              onMouseLeave={() => setHoveredDeviceId(null)}
              onDragOver={(e) => handleDragOver(e, device.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, device)}
              onClick={() => onSelectDevice(device)}
            >
              <div
                className={`group relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
                  isDragOver ? 'scale-115' : isHovered ? 'scale-105' : 'scale-100'
                }`}
              >
                {/* Device Circular Avatar Button */}
                <div
                  className={`relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${
                    device.avatarColor
                  } shadow-lg transition-all duration-300 ${
                    isDragOver
                      ? 'ring-4 ring-blue-400 shadow-blue-500/50 scale-110'
                      : 'border border-white/20 group-hover:shadow-blue-500/25'
                  }`}
                >
                  {getDeviceIcon(device.type)}

                  {/* Status Indicator Badge */}
                  {device.status === 'sending' || device.status === 'connecting' ? (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    </div>
                  ) : device.status === 'completed' ? (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : null}

                  {/* Native AirDrop Indicator */}
                  {device.isAirDropNative && (
                    <div
                      className="absolute -bottom-1 -left-1 px-1 py-0.2 rounded text-[8px] font-bold bg-slate-900/90 text-blue-300 border border-blue-500/40"
                      title="Direct Apple AirDrop Protocol"
                    >
                      AirDrop
                    </div>
                  )}
                </div>

                {/* Device Name Label */}
                <div className="mt-2 text-center max-w-[130px]">
                  <p className="text-xs font-semibold text-slate-100 truncate group-hover:text-blue-300 transition-colors">
                    {device.name}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="text-[10px] text-slate-400">{device.modelName || device.type}</span>
                    <span className="text-[9px] text-emerald-400 font-mono">{device.signalStrength}%</span>
                  </div>
                </div>

                {/* Interactive Tooltip Card on Hover */}
                {isHovered && !isDragOver && (
                  <div className="absolute top-16 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2 shadow-2xl z-50 text-left min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between text-[11px] text-slate-300 pb-1 mb-1 border-b border-slate-800">
                      <span className="font-semibold text-white">{device.name}</span>
                      <ArrowUpRight className="w-3 h-3 text-blue-400" />
                    </div>
                    <div className="text-[10px] text-slate-400 space-y-0.5">
                      <p>IP: {device.ip || 'Local Direct'}</p>
                      <p>Protocol: {device.isAirDropNative ? 'Apple AirDrop (AWDL)' : 'Local Direct'}</p>
                      <p className="text-blue-400 font-medium pt-1">Click or drop file to send</p>
                    </div>
                  </div>
                )}

                {/* Drag-over Prompt */}
                {isDragOver && (
                  <div className="absolute top-16 bg-blue-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap animate-bounce">
                    Drop to send!
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
