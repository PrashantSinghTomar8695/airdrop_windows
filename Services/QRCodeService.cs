using System;
using System.IO;
using System.Windows.Media.Imaging;
using QRCoder;

namespace AirDropWindows.Services
{
    public static class QRCodeService
    {
        public static BitmapImage GenerateQrCodeImage(string payload, int pixelsPerModule = 15)
        {
            if (string.IsNullOrWhiteSpace(payload))
            {
                return new BitmapImage();
            }

            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.M);
            using var qrCode = new PngByteQRCode(qrCodeData);
            byte[] qrCodeBytes = qrCode.GetGraphic(pixelsPerModule);

            var bitmapImage = new BitmapImage();
            using (var mem = new MemoryStream(qrCodeBytes))
            {
                mem.Position = 0;
                bitmapImage.BeginInit();
                bitmapImage.CreateOptions = BitmapCreateOptions.PreservePixelFormat;
                bitmapImage.CacheOption = BitmapCacheOption.OnLoad;
                bitmapImage.StreamSource = mem;
                bitmapImage.EndInit();
            }
            bitmapImage.Freeze();
            return bitmapImage;
        }

        public static string BuildWiFiPayload(string ssid, string password)
        {
            // Escape special characters in SSID and password: \ ; , : "
            string escapedSsid = EscapeWiFiString(ssid);
            string escapedPassword = EscapeWiFiString(password);
            return $"WIFI:S:{escapedSsid};T:WPA;P:{escapedPassword};;";
        }

        private static string EscapeWiFiString(string value)
        {
            if (string.IsNullOrEmpty(value)) return "";
            return value
                .Replace(@"\", @"\\")
                .Replace(";", @"\;")
                .Replace(",", @"\,")
                .Replace(":", @"\:")
                .Replace("\"", @"\""");
        }
    }
}
