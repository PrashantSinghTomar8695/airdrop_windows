import type { AirDropDevice, AirDropSettings, FilePayload, TransferSession } from '../types/airdrop';
import { soundManager } from '../utils/sound';

type DeviceUpdateListener = (devices: AirDropDevice[]) => void;
type TransferUpdateListener = (transfers: TransferSession[]) => void;
type IncomingRequestListener = (transfer: TransferSession) => void;

class AirDropService {
  private devices: AirDropDevice[] = [];
  private transfers: TransferSession[] = [];
  private deviceListeners: DeviceUpdateListener[] = [];
  private transferListeners: TransferUpdateListener[] = [];
  private incomingListeners: IncomingRequestListener[] = [];
  private scanInterval: number | null = null;
  private transferIntervals: Map<string, number> = new Map();

  private settings: AirDropSettings = {
    deviceName: "Redrex's Windows PC",
    visibility: 'everyone_10min',
    downloadPath: 'C:\\Users\\redrex\\Downloads',
    autoAcceptKnown: false,
    enableSound: true,
    port: 8770,
    useAwdl: true,
  };

  constructor() {
    this.initDefaultDevices();
    this.startRadarSimulation();
  }

  getSettings(): AirDropSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<AirDropSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  private initDefaultDevices() {
    this.devices = [
      {
        id: 'dev-iphone-1',
        name: "Alex's iPhone 15 Pro",
        type: 'iphone',
        modelName: 'iPhone 15 Pro',
        avatarColor: 'from-amber-400 to-orange-500',
        signalStrength: 92,
        ip: '192.168.1.104',
        status: 'available',
        angle: 45,
        distance: 140,
        isAirDropNative: true,
      },
      {
        id: 'dev-mac-1',
        name: 'Sarah’s MacBook Air',
        type: 'mac',
        modelName: 'MacBook Air M2',
        avatarColor: 'from-blue-400 to-indigo-600',
        signalStrength: 85,
        ip: '192.168.1.112',
        status: 'available',
        angle: 165,
        distance: 180,
        isAirDropNative: true,
      },
      {
        id: 'dev-ipad-1',
        name: 'Studio iPad Pro',
        type: 'ipad',
        modelName: 'iPad Pro 12.9"',
        avatarColor: 'from-emerald-400 to-teal-600',
        signalStrength: 78,
        ip: '192.168.1.135',
        status: 'available',
        angle: 285,
        distance: 160,
        isAirDropNative: true,
      },
    ];
  }

  // Simulates nearby device motion and periodic discovery
  private startRadarSimulation() {
    this.scanInterval = window.setInterval(() => {
      // Gentle jitter in angles to look alive
      this.devices = this.devices.map((device) => {
        const angleDelta = (Math.random() - 0.5) * 1.5;
        const newAngle = (device.angle + angleDelta + 360) % 360;
        return {
          ...device,
          angle: newAngle,
        };
      });
      this.notifyDeviceListeners();
    }, 3000);
  }

  subscribeDevices(listener: DeviceUpdateListener): () => void {
    this.deviceListeners.push(listener);
    listener(this.devices);
    return () => {
      this.deviceListeners = this.deviceListeners.filter((l) => l !== listener);
    };
  }

  subscribeTransfers(listener: TransferUpdateListener): () => void {
    this.transferListeners.push(listener);
    listener(this.transfers);
    return () => {
      this.transferListeners = this.transferListeners.filter((l) => l !== listener);
    };
  }

  subscribeIncoming(listener: IncomingRequestListener): () => void {
    this.incomingListeners.push(listener);
    return () => {
      this.incomingListeners = this.incomingListeners.filter((l) => l !== listener);
    };
  }

  private notifyDeviceListeners() {
    this.deviceListeners.forEach((l) => l([...this.devices]));
  }

  private notifyTransferListeners() {
    this.transferListeners.forEach((l) => l([...this.transfers]));
  }

  // Trigger simulated incoming AirDrop request from an Apple device
  simulateIncomingTransfer(deviceName = "Alex's iPhone 15 Pro", count = 3) {
    const sampleFiles: FilePayload[] = [
      { name: 'IMG_4821_Cinematic_4K.MOV', size: 148 * 1024 * 1024, type: 'video/quicktime' },
      { name: 'Photo_Sunset_Malibu.HEIC', size: 4.2 * 1024 * 1024, type: 'image/heic' },
      { name: 'Design_System_Spec.pdf', size: 12.8 * 1024 * 1024, type: 'application/pdf' },
    ].slice(0, count);

    const totalSize = sampleFiles.reduce((acc, f) => acc + f.size, 0);

    const session: TransferSession = {
      id: 'session-' + Date.now(),
      deviceId: 'dev-iphone-1',
      deviceName,
      deviceType: 'iphone',
      files: sampleFiles,
      totalSize,
      transferredBytes: 0,
      progress: 0,
      speed: '0 MB/s',
      timeRemaining: 'Calculating...',
      direction: 'incoming',
      status: 'pending',
      timestamp: Date.now(),
    };

    this.transfers.unshift(session);
    this.notifyTransferListeners();

    if (this.settings.enableSound) {
      soundManager.playAirDropChime();
    }

    this.incomingListeners.forEach((l) => l(session));
  }

  // User initiates outgoing transfer to a specific device
  sendFilesToDevice(deviceId: string, files: File[]) {
    const target = this.devices.find((d) => d.id === deviceId);
    if (!target) return;

    const filePayloads: FilePayload[] = files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      file: f,
    }));

    const totalSize = filePayloads.reduce((acc, f) => acc + f.size, 0);

    const session: TransferSession = {
      id: 'session-' + Date.now(),
      deviceId: target.id,
      deviceName: target.name,
      deviceType: target.type,
      files: filePayloads,
      totalSize,
      transferredBytes: 0,
      progress: 0,
      speed: 'Waiting for acceptance...',
      timeRemaining: 'Connecting...',
      direction: 'outgoing',
      status: 'pending',
      timestamp: Date.now(),
    };

    this.transfers.unshift(session);
    this.updateDeviceStatus(deviceId, 'connecting');
    this.notifyTransferListeners();

    // Simulate remote Apple device auto-accepting or accepting after 1.5s
    setTimeout(() => {
      this.startDataTransfer(session.id);
    }, 1500);
  }

  acceptTransfer(sessionId: string) {
    const session = this.transfers.find((t) => t.id === sessionId);
    if (!session) return;
    session.status = 'accepted';
    this.notifyTransferListeners();
    this.startDataTransfer(sessionId);
  }

  declineTransfer(sessionId: string) {
    const session = this.transfers.find((t) => t.id === sessionId);
    if (!session) return;
    session.status = 'rejected';
    this.notifyTransferListeners();
  }

  cancelTransfer(sessionId: string) {
    const interval = this.transferIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.transferIntervals.delete(sessionId);
    }
    const session = this.transfers.find((t) => t.id === sessionId);
    if (session) {
      session.status = 'canceled';
      this.updateDeviceStatus(session.deviceId, 'available');
      this.notifyTransferListeners();
    }
  }

  private startDataTransfer(sessionId: string) {
    const session = this.transfers.find((t) => t.id === sessionId);
    if (!session) return;

    session.status = 'transferring';
    this.updateDeviceStatus(session.deviceId, session.direction === 'outgoing' ? 'sending' : 'receiving');
    this.notifyTransferListeners();

    // High speed simulated transfer (45 - 85 MB/s typical of 802.11ac/ax AWDL)
    const transferChunkBytes = 18 * 1024 * 1024; // 18MB every 250ms (~72 MB/s)
    const intervalTime = 250;

    const interval = window.setInterval(() => {
      session.transferredBytes += transferChunkBytes;
      if (session.transferredBytes >= session.totalSize) {
        session.transferredBytes = session.totalSize;
        session.progress = 100;
        session.speed = '0 MB/s';
        session.timeRemaining = 'Completed';
        session.status = 'completed';

        clearInterval(interval);
        this.transferIntervals.delete(sessionId);

        this.updateDeviceStatus(session.deviceId, 'completed');
        if (this.settings.enableSound) {
          soundManager.playSuccessChime();
        }

        setTimeout(() => {
          this.updateDeviceStatus(session.deviceId, 'available');
        }, 3000);
      } else {
        session.progress = Math.round((session.transferredBytes / session.totalSize) * 100);
        const mbps = (transferChunkBytes / 1024 / 1024 / (intervalTime / 1000)).toFixed(1);
        session.speed = `${mbps} MB/s`;

        const remainingBytes = session.totalSize - session.transferredBytes;
        const remainingSeconds = Math.max(1, Math.round(remainingBytes / (transferChunkBytes * 4)));
        session.timeRemaining = `${remainingSeconds}s remaining`;
      }
      this.notifyTransferListeners();
    }, intervalTime);

    this.transferIntervals.set(sessionId, interval);
  }

  private updateDeviceStatus(deviceId: string, status: AirDropDevice['status']) {
    this.devices = this.devices.map((d) => (d.id === deviceId ? { ...d, status } : d));
    this.notifyDeviceListeners();
  }

  destroy() {
    if (this.scanInterval) clearInterval(this.scanInterval);
    this.transferIntervals.forEach((interval) => clearInterval(interval));
    this.transferIntervals.clear();
  }
}

export const airdropService = new AirDropService();
