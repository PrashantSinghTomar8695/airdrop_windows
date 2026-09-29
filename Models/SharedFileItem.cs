using System;
using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;

namespace AirDropWindows.Models
{
    public class SharedFileItem : INotifyPropertyChanged
    {
        private int _downloadCount;

        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime AddedTime { get; set; } = DateTime.Now;

        public int DownloadCount
        {
            get => _downloadCount;
            set { _downloadCount = value; OnPropertyChanged(); }
        }

        public string FormattedFileSize => TransferItem.FormatBytes(FileSize);

        public string Extension => Path.GetExtension(FileName).TrimStart('.').ToUpperInvariant();

        public event PropertyChangedEventHandler? PropertyChanged;
        protected void OnPropertyChanged([CallerMemberName] string? name = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }
    }
}
