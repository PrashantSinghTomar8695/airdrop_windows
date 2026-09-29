using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace AirDropWindows.Models
{
    public enum TransferType
    {
        UploadFromPhone,
        DownloadToPhone
    }

    public enum TransferStatus
    {
        Queued,
        Transferring,
        Completed,
        Failed
    }

    public class TransferItem : INotifyPropertyChanged
    {
        private string _fileName = string.Empty;
        private long _fileSize;
        private long _bytesTransferred;
        private double _progress;
        private string _speed = string.Empty;
        private TransferStatus _status = TransferStatus.Queued;
        private string _errorMessage = string.Empty;

        public string Id { get; set; } = Guid.NewGuid().ToString("N");

        public string FileName
        {
            get => _fileName;
            set { _fileName = value; OnPropertyChanged(); }
        }

        public long FileSize
        {
            get => _fileSize;
            set 
            { 
                _fileSize = value; 
                OnPropertyChanged(); 
                OnPropertyChanged(nameof(FormattedFileSize)); 
            }
        }

        public long BytesTransferred
        {
            get => _bytesTransferred;
            set
            {
                _bytesTransferred = value;
                OnPropertyChanged();
                if (FileSize > 0)
                {
                    Progress = Math.Min(100.0, (double)_bytesTransferred / FileSize * 100.0);
                }
            }
        }

        public double Progress
        {
            get => _progress;
            set { _progress = value; OnPropertyChanged(); }
        }

        public string Speed
        {
            get => _speed;
            set { _speed = value; OnPropertyChanged(); }
        }

        public TransferType Type { get; set; } = TransferType.UploadFromPhone;

        public TransferStatus Status
        {
            get => _status;
            set { _status = value; OnPropertyChanged(); }
        }

        public DateTime Timestamp { get; set; } = DateTime.Now;

        public string FilePath { get; set; } = string.Empty;

        public string ErrorMessage
        {
            get => _errorMessage;
            set { _errorMessage = value; OnPropertyChanged(); }
        }

        public string FormattedFileSize => FormatBytes(FileSize);

        public static string FormatBytes(long bytes)
        {
            if (bytes <= 0) return "0 B";
            string[] suffixes = { "B", "KB", "MB", "GB", "TB" };
            int i = 0;
            double dbl = bytes;
            while (dbl >= 1024 && i < suffixes.Length - 1)
            {
                dbl /= 1024;
                i++;
            }
            return $"{dbl:0.##} {suffixes[i]}";
        }

        public event PropertyChangedEventHandler? PropertyChanged;
        protected void OnPropertyChanged([CallerMemberName] string? name = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }
    }
}
