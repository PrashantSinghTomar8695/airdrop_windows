import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TitleBar } from './components/TitleBar';
import { RadarView } from './components/RadarView';
import { DropZone } from './components/DropZone';
import { IncomingTransferModal } from './components/IncomingTransferModal';
import { ActiveTransfersDrawer } from './components/ActiveTransfersDrawer';
import { SettingsModal } from './components/SettingsModal';
import { MobileConnectModal } from './components/MobileConnectModal';
import { airdropService } from './services/airdropService';
import type { AirDropDevice, AirDropSettings, AirDropVisibility, TransferSession } from './types/airdrop';

export function App() {
  const [devices, setDevices] = useState<AirDropDevice[]>([]);
  const [transfers, setTransfers] = useState<TransferSession[]>([]);
  const [settings, setSettings] = useState<AirDropSettings>(airdropService.getSettings());
  const [selectedDevice, setSelectedDevice] = useState<AirDropDevice | null>(null);
  const [incomingSession, setIncomingSession] = useState<TransferSession | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileConnectOpen, setIsMobileConnectOpen] = useState(false);

  useEffect(() => {
    const unsubDevices = airdropService.subscribeDevices(setDevices);
    const unsubTransfers = airdropService.subscribeTransfers((newTransfers) => {
      setTransfers(newTransfers);
      // Check if any transfer just completed to trigger confetti
      const justCompleted = newTransfers.find((t) => t.status === 'completed' && t.progress === 100);
      if (justCompleted) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#6366f1', '#10b981'],
        });
      }
    });

    const unsubIncoming = airdropService.subscribeIncoming((session) => {
      setIncomingSession(session);
    });

    return () => {
      unsubDevices();
      unsubTransfers();
      unsubIncoming();
    };
  }, []);

  const handleUpdateVisibility = (visibility: AirDropVisibility) => {
    airdropService.updateSettings({ visibility });
    setSettings(airdropService.getSettings());
  };

  const handleSaveSettings = (newSettings: Partial<AirDropSettings>) => {
    airdropService.updateSettings(newSettings);
    setSettings(airdropService.getSettings());
  };

  const handleSelectDevice = (device: AirDropDevice) => {
    setSelectedDevice(device);
  };

  const handleSendFiles = (deviceId: string, files: File[]) => {
    airdropService.sendFilesToDevice(deviceId, files);
  };

  const handleDropFilesOnDevice = (device: AirDropDevice, files: File[]) => {
    setSelectedDevice(device);
    airdropService.sendFilesToDevice(device.id, files);
  };

  const handleAcceptTransfer = (sessionId: string) => {
    airdropService.acceptTransfer(sessionId);
    setIncomingSession(null);
  };

  const handleDeclineTransfer = (sessionId: string) => {
    airdropService.declineTransfer(sessionId);
    setIncomingSession(null);
  };

  const handleCancelTransfer = (sessionId: string) => {
    airdropService.cancelTransfer(sessionId);
  };

  const handleSimulateIncoming = () => {
    airdropService.simulateIncomingTransfer("Alex's iPhone 15 Pro", 3);
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Title Bar with Controls */}
      <TitleBar
        settings={settings}
        onUpdateVisibility={handleUpdateVisibility}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMobileConnect={() => setIsMobileConnectOpen(true)}
        onSimulateIncoming={handleSimulateIncoming}
      />

      {/* Main Radar / Sonar Area */}
      <main className="flex-1 flex flex-col justify-between relative">
        <RadarView
          devices={devices}
          onSelectDevice={handleSelectDevice}
          onDropFilesOnDevice={handleDropFilesOnDevice}
          thisDeviceName={settings.deviceName}
        />

        {/* Bottom File Dropzone Dock */}
        <DropZone
          selectedDevice={selectedDevice}
          onClearSelectedDevice={() => setSelectedDevice(null)}
          onSendFiles={handleSendFiles}
          devices={devices}
          onSelectDevice={handleSelectDevice}
        />
      </main>

      {/* Real-time Transfers Activity Drawer */}
      <ActiveTransfersDrawer
        transfers={transfers}
        onCancel={handleCancelTransfer}
        downloadPath={settings.downloadPath}
      />

      {/* Incoming AirDrop Transfer Request Modal */}
      <IncomingTransferModal
        session={incomingSession}
        onAccept={handleAcceptTransfer}
        onDecline={handleDeclineTransfer}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Mobile Connect / QR Portal Modal */}
      <MobileConnectModal
        isOpen={isMobileConnectOpen}
        onClose={() => setIsMobileConnectOpen(false)}
        localIp="192.168.1.102"
        port={settings.port}
      />
    </div>
  );
}

export default App;
