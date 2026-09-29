using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using AirDropWindows.Models;
using AirDropWindows.Services;

namespace AirDropWindows.ViewModels
{
    public class MainViewModel : INotifyPropertyChanged
    {
        private readonly HotspotService _hotspotService;
        private FileTransferServer? _transferServer;
        private readonly Dispatcher _dispatcher;
        private readonly DispatcherTimer _pollTimer;

        private bool _isHotspotActive;
        private bool _isBusy;
        private string _statusText = "Initializing...";
        private string _ssid = "Windows Hotspot";
        private string _password = "";
        private string _localIp = "192.168.137.1";
        private int _serverPort = GetAvailablePort(8765);
        private string _serverUrl = "http://192.168.137.1:8765";
        private string _receivedDirectory;
        private BitmapImage? _wifiQrCode;
        private BitmapImage? _serverUrlQrCode;
        private int _connectedClientsCount;

        public ObservableCollection<SharedFileItem> SharedFiles { get; } = new();
        public ObservableCollection<TransferItem> Transfers { get; } = new();
        public ObservableCollection<ConnectedClient> ConnectedClients { get; } = new();

        public bool IsHotspotActive
        {
            get => _isHotspotActive;
            set
            {
                if (_isHotspotActive != value)
                {
                    _isHotspotActive = value;
                    OnPropertyChanged();
                    OnPropertyChanged(nameof(StatusBadgeColor));
                }
            }
        }

        public bool IsBusy
        {
            get => _isBusy;
            set { _isBusy = value; OnPropertyChanged(); }
        }

        public string StatusText
        {
            get => _statusText;
            set { _statusText = value; OnPropertyChanged(); }
        }

        public string Ssid
        {
            get => _ssid;
            set { _ssid = value; OnPropertyChanged(); }
        }

        public string Password
        {
            get => _password;
            set { _password = value; OnPropertyChanged(); }
        }

        public string ServerUrl
        {
            get => _serverUrl;
            set { _serverUrl = value; OnPropertyChanged(); }
        }

        public string ReceivedDirectory
        {
            get => _receivedDirectory;
            set { _receivedDirectory = value; OnPropertyChanged(); }
        }

        public BitmapImage? WiFiQrCode
        {
            get => _wifiQrCode;
            set { _wifiQrCode = value; OnPropertyChanged(); }
        }

        public BitmapImage? ServerUrlQrCode
        {
            get => _serverUrlQrCode;
            set { _serverUrlQrCode = value; OnPropertyChanged(); }
        }

        public int ConnectedClientsCount
        {
            get => _connectedClientsCount;
            set { _connectedClientsCount = value; OnPropertyChanged(); }
        }

        public string StatusBadgeColor => IsHotspotActive ? "#30D158" : "#8E8E93";

        public MainViewModel()
        {
            _dispatcher = Application.Current?.Dispatcher ?? Dispatcher.CurrentDispatcher;

            string downloadsPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads", "AirDropReceived");
            _receivedDirectory = downloadsPath;
            if (!Directory.Exists(_receivedDirectory))
            {
                Directory.CreateDirectory(_receivedDirectory);
            }

            _hotspotService = new HotspotService();
            _hotspotService.StatusChanged += OnHotspotStatusChanged;

            _pollTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(3)
            };
            _pollTimer.Tick += async (s, e) => await PollStatusAsync();

            _ = InitializeAsync();
        }

        private async Task InitializeAsync()
        {
            IsBusy = true;
            StatusText = "Checking Hotspot status...";

            await RefreshHotspotInfoAsync();
            await StartHttpServerAsync();

            _pollTimer.Start();
            IsBusy = false;
        }

        public async Task RefreshHotspotInfoAsync()
        {
            var info = await _hotspotService.GetStatusAsync();

            IsHotspotActive = info.IsActive;
            StatusText = info.StatusMessage;
            Ssid = !string.IsNullOrWhiteSpace(info.Ssid) ? info.Ssid : "AirDrop-PC";
            Password = info.Passphrase;
            _localIp = info.LocalIpAddress;
            ServerUrl = $"http://{_localIp}:{_serverPort}";
            ConnectedClientsCount = info.ClientCount;

            UpdateQrCodes();
            RefreshConnectedClients();
        }

        private void UpdateQrCodes()
        {
            try
            {
                if (!string.IsNullOrEmpty(Password))
                {
                    string wifiPayload = QRCodeService.BuildWiFiPayload(Ssid, Password);
                    WiFiQrCode = QRCodeService.GenerateQrCodeImage(wifiPayload, 12);
                }
                else
                {
                    WiFiQrCode = null;
                }

                ServerUrlQrCode = QRCodeService.GenerateQrCodeImage(ServerUrl, 12);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[MainViewModel] QR Gen error: {ex.Message}");
            }
        }

        public async Task ToggleHotspotAsync(bool enable)
        {
            if (IsBusy) return;
            IsBusy = true;

            if (enable)
            {
                StatusText = "Turning on Mobile Hotspot...";
                var (success, msg) = await _hotspotService.StartHotspotAsync();
                StatusText = msg;
                IsHotspotActive = success;
            }
            else
            {
                StatusText = "Turning off Mobile Hotspot...";
                var (success, msg) = await _hotspotService.StopHotspotAsync();
                StatusText = msg;
                IsHotspotActive = !success ? IsHotspotActive : false;
            }

            await RefreshHotspotInfoAsync();
            IsBusy = false;
        }

        private async Task StartHttpServerAsync()
        {
            try
            {
                if (_transferServer != null)
                {
                    await _transferServer.StopAsync();
                }

                _transferServer = new FileTransferServer(_serverPort, SharedFiles, _receivedDirectory);
                _transferServer.OnTransferStarted += Transfer_OnStarted;
                _transferServer.OnTransferProgress += Transfer_OnProgress;
                _transferServer.OnTransferCompleted += Transfer_OnCompleted;

                await _transferServer.StartAsync();
            }
            catch (Exception ex)
            {
                StatusText = $"HTTP Server error: {ex.Message}";
            }
        }

        private async Task PollStatusAsync()
        {
            try
            {
                var info = await _hotspotService.GetStatusAsync();
                if (IsHotspotActive != info.IsActive)
                {
                    IsHotspotActive = info.IsActive;
                    StatusText = info.StatusMessage;
                }

                if (_localIp != info.LocalIpAddress)
                {
                    _localIp = info.LocalIpAddress;
                    ServerUrl = $"http://{_localIp}:{_serverPort}";
                    UpdateQrCodes();
                }

                RefreshConnectedClients();
            }
            catch
            {
                // Background polling safety
            }
        }

        private void RefreshConnectedClients()
        {
            var currentClients = _hotspotService.GetConnectedClients();
            _dispatcher.Invoke(() =>
            {
                ConnectedClients.Clear();
                foreach (var c in currentClients)
                {
                    ConnectedClients.Add(c);
                }
                ConnectedClientsCount = ConnectedClients.Count;
            });
        }

        public void AddFilesToShare(string[] filePaths)
        {
            foreach (var path in filePaths)
            {
                if (File.Exists(path))
                {
                    var fileInfo = new FileInfo(path);
                    if (!SharedFiles.Any(f => f.FilePath.Equals(path, StringComparison.OrdinalIgnoreCase)))
                    {
                        SharedFiles.Add(new SharedFileItem
                        {
                            FileName = fileInfo.Name,
                            FilePath = fileInfo.FullName,
                            FileSize = fileInfo.Length,
                            AddedTime = DateTime.Now
                        });
                    }
                }
            }
        }

        public void RemoveSharedFile(SharedFileItem item)
        {
            SharedFiles.Remove(item);
        }

        public void ClearSharedFiles()
        {
            SharedFiles.Clear();
        }

        public void OpenReceivedFolder()
        {
            try
            {
                if (!Directory.Exists(_receivedDirectory))
                {
                    Directory.CreateDirectory(_receivedDirectory);
                }
                Process.Start(new ProcessStartInfo
                {
                    FileName = _receivedDirectory,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Could not open folder: {ex.Message}", "AirDrop Windows", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void Transfer_OnStarted(TransferItem transfer)
        {
            _dispatcher.Invoke(() =>
            {
                Transfers.Insert(0, transfer);
            });
        }

        private void Transfer_OnProgress(TransferItem transfer)
        {
            // Progress updates the observable properties on TransferItem, so WPF updates automatically.
        }

        private void Transfer_OnCompleted(TransferItem transfer)
        {
            _dispatcher.Invoke(() =>
            {
                // Notify if upload finished
            });
        }

        public void ClearFinishedTransfers()
        {
            var finished = Transfers.Where(t => t.Status == TransferStatus.Completed || t.Status == TransferStatus.Failed).ToList();
            foreach (var f in finished)
            {
                Transfers.Remove(f);
            }
        }

        private void OnHotspotStatusChanged(object? sender, HotspotInfo info)
        {
            _dispatcher.Invoke(() =>
            {
                IsHotspotActive = info.IsActive;
                StatusText = info.StatusMessage;
                UpdateQrCodes();
            });
        }

        public static int GetAvailablePort(int preferredPort = 8765)
        {
            try
            {
                using var listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Any, preferredPort);
                listener.Start();
                listener.Stop();
                return preferredPort;
            }
            catch
            {
                try
                {
                    using var listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Any, 0);
                    listener.Start();
                    int port = ((System.Net.IPEndPoint)listener.LocalEndpoint).Port;
                    listener.Stop();
                    return port;
                }
                catch
                {
                    return 8765;
                }
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;
        protected void OnPropertyChanged([CallerMemberName] string? name = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }
    }
}
