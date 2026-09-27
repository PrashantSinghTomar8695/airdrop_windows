export type DeviceType = 'iphone' | 'ipad' | 'mac' | 'windows' | 'android';

export interface AirDropDevice {
  id: string;
  name: string;
  type: DeviceType;
  avatarColor: string;
  signalStrength: number; // 0 - 100%
  ip?: string;
  port?: number;
  status: 'available' | 'connecting' | 'sending' | 'receiving' | 'completed' | 'declined';
  angle: number; // 0 - 360 degrees for radar
  distance: number; // 120 - 240 px from center
  isAirDropNative?: boolean;
  modelName?: string;
}

export interface FilePayload {
  name: string;
  size: number;
  type: string;
  file?: File;
  previewUrl?: string;
}

export interface TransferSession {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  files: FilePayload[];
  totalSize: number;
  transferredBytes: number;
  progress: number; // 0 - 100
  speed: string; // e.g. "32.4 MB/s"
  timeRemaining: string;
  direction: 'incoming' | 'outgoing';
  status: 'pending' | 'accepted' | 'transferring' | 'completed' | 'canceled' | 'rejected';
  timestamp: number;
}

export type AirDropVisibility = 'off' | 'contacts' | 'everyone_10min' | 'everyone';

export interface AirDropSettings {
  deviceName: string;
  visibility: AirDropVisibility;
  downloadPath: string;
  autoAcceptKnown: boolean;
  enableSound: boolean;
  port: number;
  useAwdl: boolean;
}
