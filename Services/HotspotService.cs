using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Threading.Tasks;
using Windows.Networking.Connectivity;
using Windows.Networking.NetworkOperators;
using AirDropWindows.Models;

namespace AirDropWindows.Services
{
    public class HotspotInfo
    {
        public bool IsSupported { get; set; }
        public bool IsActive { get; set; }
        public string Ssid { get; set; } = string.Empty;
        public string Passphrase { get; set; } = string.Empty;
        public string LocalIpAddress { get; set; } = "192.168.137.1";
        public int ClientCount { get; set; }
        public string StatusMessage { get; set; } = string.Empty;
    }

    public class HotspotService
    {
        private NetworkOperatorTetheringManager? _tetheringManager;

        public event EventHandler<HotspotInfo>? StatusChanged;

        public HotspotService()
        {
            InitializeTetheringManager();
        }

        private bool InitializeTetheringManager()
        {
            try
            {
                // First try the primary internet connection profile
                var profile = Windows.Networking.Connectivity.NetworkInformation.GetInternetConnectionProfile();

                // If offline or no default internet profile, look for any active connection profile
                if (profile == null)
                {
                    var profiles = Windows.Networking.Connectivity.NetworkInformation.GetConnectionProfiles();
                    profile = profiles.FirstOrDefault(p => p.GetNetworkConnectivityLevel() != NetworkConnectivityLevel.None)
                              ?? profiles.FirstOrDefault();
                }

                if (profile != null)
                {
                    _tetheringManager = NetworkOperatorTetheringManager.CreateFromConnectionProfile(profile);
                    return true;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[HotspotService] Init error: {ex.Message}");
            }

            return false;
        }

        public Task<HotspotInfo> GetStatusAsync()
        {
            var info = new HotspotInfo();

            if (_tetheringManager == null && !InitializeTetheringManager())
            {
                info.IsSupported = false;
                info.StatusMessage = "Network adapter not ready or Wi-Fi profile not found.";
                info.LocalIpAddress = GetBestLocalIpAddress();
                return Task.FromResult(info);
            }

            try
            {
                info.IsSupported = true;
                info.IsActive = _tetheringManager!.TetheringOperationalState == TetheringOperationalState.On;

                var config = _tetheringManager.GetCurrentAccessPointConfiguration();
                info.Ssid = config.Ssid ?? "Windows-AirDrop";
                info.Passphrase = config.Passphrase ?? "";
                info.LocalIpAddress = GetBestLocalIpAddress();

                try
                {
                    var clients = _tetheringManager.GetTetheringClients();
                    info.ClientCount = clients?.Count ?? 0;
                }
                catch
                {
                    info.ClientCount = 0;
                }

                info.StatusMessage = info.IsActive ? "Mobile Hotspot is Active" : "Mobile Hotspot is Inactive";
            }
            catch (Exception ex)
            {
                info.StatusMessage = $"Status check: {ex.Message}";
                info.LocalIpAddress = GetBestLocalIpAddress();
            }

            return Task.FromResult(info);
        }

        public async Task<(bool Success, string Message)> StartHotspotAsync()
        {
            try
            {
                if (_tetheringManager == null && !InitializeTetheringManager())
                {
                    return (false, "Could not initialize Windows Mobile Hotspot manager. Please ensure Wi-Fi is enabled.");
                }

                if (_tetheringManager!.TetheringOperationalState == TetheringOperationalState.On)
                {
                    return (true, "Hotspot is already active.");
                }

                var result = await _tetheringManager.StartTetheringAsync();

                if (result.Status == TetheringOperationStatus.Success)
                {
                    var currentInfo = await GetStatusAsync();
                    StatusChanged?.Invoke(this, currentInfo);
                    return (true, "Mobile Hotspot started successfully.");
                }
                else
                {
                    return (false, $"Hotspot start failed with result: {result.Status}. {result.AdditionalErrorMessage}");
                }
            }
            catch (Exception ex)
            {
                return (false, $"Error starting Hotspot: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message)> StopHotspotAsync()
        {
            try
            {
                if (_tetheringManager == null)
                {
                    return (true, "Hotspot manager not initialized.");
                }

                if (_tetheringManager.TetheringOperationalState == TetheringOperationalState.Off)
                {
                    return (true, "Hotspot is already inactive.");
                }

                var result = await _tetheringManager.StopTetheringAsync();

                if (result.Status == TetheringOperationStatus.Success)
                {
                    var currentInfo = await GetStatusAsync();
                    StatusChanged?.Invoke(this, currentInfo);
                    return (true, "Mobile Hotspot stopped successfully.");
                }
                else
                {
                    return (false, $"Hotspot stop failed: {result.Status}");
                }
            }
            catch (Exception ex)
            {
                return (false, $"Error stopping Hotspot: {ex.Message}");
            }
        }

        public List<ConnectedClient> GetConnectedClients()
        {
            var list = new List<ConnectedClient>();
            if (_tetheringManager == null) return list;

            try
            {
                var rawClients = _tetheringManager.GetTetheringClients();
                if (rawClients != null)
                {
                    foreach (var c in rawClients)
                    {
                        var hostname = c.HostNames?.FirstOrDefault()?.DisplayName ?? "";
                        var ip = c.HostNames?.FirstOrDefault()?.CanonicalName ?? "";

                        list.Add(new ConnectedClient
                        {
                            MacAddress = c.MacAddress ?? "Unknown",
                            Hostname = hostname,
                            IpAddress = ip,
                            ConnectedTime = DateTime.Now
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[HotspotService] GetClients error: {ex.Message}");
            }

            return list;
        }

        public static string GetBestLocalIpAddress()
        {
            try
            {
                // 1. Look specifically for Windows Mobile Hotspot adapter IP (typically 192.168.137.1)
                foreach (var netInterface in NetworkInterface.GetAllNetworkInterfaces())
                {
                    if (netInterface.OperationalStatus != OperationalStatus.Up) continue;

                    var ipProps = netInterface.GetIPProperties();
                    foreach (var uni in ipProps.UnicastAddresses)
                    {
                        if (uni.Address.AddressFamily == AddressFamily.InterNetwork)
                        {
                            string ipStr = uni.Address.ToString();
                            if (ipStr.StartsWith("192.168.137."))
                            {
                                return ipStr;
                            }
                        }
                    }
                }

                // 2. Look for any active Wi-Fi interface IP
                foreach (var netInterface in NetworkInterface.GetAllNetworkInterfaces())
                {
                    if (netInterface.OperationalStatus != OperationalStatus.Up) continue;
                    if (netInterface.NetworkInterfaceType == NetworkInterfaceType.Wireless80211)
                    {
                        var ipProps = netInterface.GetIPProperties();
                        foreach (var uni in ipProps.UnicastAddresses)
                        {
                            if (uni.Address.AddressFamily == AddressFamily.InterNetwork && !uni.Address.ToString().StartsWith("169.254."))
                            {
                                return uni.Address.ToString();
                            }
                        }
                    }
                }

                // 3. Fallback to standard 192.168.137.1 for Windows Hotspot
                return "192.168.137.1";
            }
            catch
            {
                return "192.168.137.1";
            }
        }
    }
}
