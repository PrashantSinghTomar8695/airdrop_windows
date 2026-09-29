using System;

namespace AirDropWindows.Models
{
    public class ConnectedClient
    {
        public string MacAddress { get; set; } = string.Empty;
        public string Hostname { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public DateTime ConnectedTime { get; set; } = DateTime.Now;

        public string DisplayName => string.IsNullOrWhiteSpace(Hostname) ? (string.IsNullOrWhiteSpace(IpAddress) ? MacAddress : IpAddress) : Hostname;
    }
}
