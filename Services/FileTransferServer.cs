using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Net;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using AirDropWindows.Models;

namespace AirDropWindows.Services
{
    public class FileTransferServer
    {
        private WebApplication? _app;
        private CancellationTokenSource? _cts;
        private readonly int _port;
        private readonly ObservableCollection<SharedFileItem> _sharedFiles;
        private readonly string _receivedDirectory;

        public event Action<TransferItem>? OnTransferStarted;
        public event Action<TransferItem>? OnTransferProgress;
        public event Action<TransferItem>? OnTransferCompleted;

        public bool IsRunning { get; private set; }

        public FileTransferServer(int port, ObservableCollection<SharedFileItem> sharedFiles, string receivedDirectory)
        {
            _port = port;
            _sharedFiles = sharedFiles;
            _receivedDirectory = receivedDirectory;

            if (!Directory.Exists(_receivedDirectory))
            {
                Directory.CreateDirectory(_receivedDirectory);
            }
        }

        public async Task StartAsync()
        {
            if (IsRunning) return;

            _cts = new CancellationTokenSource();

            var builder = WebApplication.CreateBuilder();

            // Disable console logging overhead
            builder.Logging.ClearProviders();
            builder.Logging.SetMinimumLevel(LogLevel.Warning);

            builder.WebHost.ConfigureKestrel(options =>
            {
                options.Listen(IPAddress.Any, _port);
                options.Limits.MaxRequestBodySize = null; // Unlimited file upload size (multi-GB video files)
            });

            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
            });

            _app = builder.Build();
            _app.UseCors();

            // 1. Mobile Web App single-page application
            _app.MapGet("/", () => Results.Content(GetMobileWebAppHtml(), "text/html; charset=utf-8", Encoding.UTF8));

            // 2. Health check
            _app.MapGet("/api/status", () => Results.Ok(new { status = "online", timestamp = DateTime.Now }));

            // 3. List available files on PC to download
            _app.MapGet("/api/files", () =>
            {
                var list = new List<object>();
                lock (_sharedFiles)
                {
                    foreach (var f in _sharedFiles)
                    {
                        if (File.Exists(f.FilePath))
                        {
                            list.Add(new
                            {
                                id = f.Id,
                                name = f.FileName,
                                size = f.FileSize,
                                formattedSize = f.FormattedFileSize,
                                extension = f.Extension,
                                downloadUrl = $"/api/download/{f.Id}"
                            });
                        }
                    }
                }
                return Results.Json(list);
            });

            // 4. Download file from PC to iPhone
            _app.MapGet("/api/download/{id}", async (string id, HttpContext context) =>
            {
                SharedFileItem? fileItem = null;
                lock (_sharedFiles)
                {
                    foreach (var f in _sharedFiles)
                    {
                        if (f.Id == id)
                        {
                            fileItem = f;
                            break;
                        }
                    }
                }

                if (fileItem == null || !File.Exists(fileItem.FilePath))
                {
                    return Results.NotFound(new { message = "File not found on host." });
                }

                fileItem.DownloadCount++;

                var transfer = new TransferItem
                {
                    FileName = fileItem.FileName,
                    FileSize = fileItem.FileSize,
                    Type = TransferType.DownloadToPhone,
                    Status = TransferStatus.Transferring,
                    FilePath = fileItem.FilePath
                };

                OnTransferStarted?.Invoke(transfer);

                try
                {
                    context.Response.ContentType = "application/octet-stream";
                    context.Response.Headers.Append("Content-Disposition", $"attachment; filename=\"{Uri.EscapeDataString(fileItem.FileName)}\"");
                    context.Response.ContentLength = fileItem.FileSize;

                    const int bufferSize = 128 * 1024; // 128 KB buffer
                    byte[] buffer = new byte[bufferSize];

                    long totalBytesRead = 0;
                    var stopwatch = System.Diagnostics.Stopwatch.StartNew();

                    using (var fs = new FileStream(fileItem.FilePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                    {
                        int bytesRead;
                        while ((bytesRead = await fs.ReadAsync(buffer, 0, buffer.Length, context.RequestAborted)) > 0)
                        {
                            await context.Response.Body.WriteAsync(buffer.AsMemory(0, bytesRead), context.RequestAborted);
                            totalBytesRead += bytesRead;

                            double elapsedSec = stopwatch.Elapsed.TotalSeconds;
                            if (elapsedSec > 0.3)
                            {
                                double speedMb = (totalBytesRead / (1024.0 * 1024.0)) / elapsedSec;
                                transfer.Speed = $"{speedMb:0.1} MB/s";
                            }

                            transfer.BytesTransferred = totalBytesRead;
                            OnTransferProgress?.Invoke(transfer);
                        }
                    }

                    transfer.Status = TransferStatus.Completed;
                    transfer.Speed = "Finished";
                    OnTransferCompleted?.Invoke(transfer);

                    return Results.Empty;
                }
                catch (Exception ex)
                {
                    transfer.Status = TransferStatus.Failed;
                    transfer.ErrorMessage = ex.Message;
                    OnTransferCompleted?.Invoke(transfer);
                    return Results.Empty;
                }
            });

            // 5. Upload files from iPhone to PC
            _app.MapPost("/api/upload", async (HttpRequest request) =>
            {
                if (!request.HasFormContentType)
                {
                    return Results.BadRequest(new { message = "Expected multipart/form-data" });
                }

                var form = await request.ReadFormAsync();
                if (form.Files.Count == 0)
                {
                    return Results.BadRequest(new { message = "No files uploaded" });
                }

                var uploadedFiles = new List<string>();

                foreach (var formFile in form.Files)
                {
                    string safeFileName = Path.GetFileName(formFile.FileName);
                    if (string.IsNullOrWhiteSpace(safeFileName))
                    {
                        safeFileName = $"iPhone_File_{DateTime.Now:yyyyMMdd_HHmmss}.bin";
                    }

                    string destinationPath = Path.Combine(_receivedDirectory, safeFileName);

                    // If file exists, generate unique name
                    int counter = 1;
                    string nameWithoutExt = Path.GetFileNameWithoutExtension(safeFileName);
                    string ext = Path.GetExtension(safeFileName);
                    while (File.Exists(destinationPath))
                    {
                        safeFileName = $"{nameWithoutExt}_{counter}{ext}";
                        destinationPath = Path.Combine(_receivedDirectory, safeFileName);
                        counter++;
                    }

                    var transfer = new TransferItem
                    {
                        FileName = safeFileName,
                        FileSize = formFile.Length,
                        Type = TransferType.UploadFromPhone,
                        Status = TransferStatus.Transferring,
                        FilePath = destinationPath
                    };

                    OnTransferStarted?.Invoke(transfer);

                    try
                    {
                        const int bufferSize = 128 * 1024;
                        byte[] buffer = new byte[bufferSize];
                        long totalRead = 0;
                        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

                        using (var src = formFile.OpenReadStream())
                        using (var dest = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None))
                        {
                            int bytesRead;
                            while ((bytesRead = await src.ReadAsync(buffer, 0, buffer.Length)) > 0)
                            {
                                await dest.WriteAsync(buffer, 0, bytesRead);
                                totalRead += bytesRead;

                                double elapsedSec = stopwatch.Elapsed.TotalSeconds;
                                if (elapsedSec > 0.3)
                                {
                                    double speedMb = (totalRead / (1024.0 * 1024.0)) / elapsedSec;
                                    transfer.Speed = $"{speedMb:0.1} MB/s";
                                }

                                transfer.BytesTransferred = totalRead;
                                OnTransferProgress?.Invoke(transfer);
                            }
                        }

                        transfer.Status = TransferStatus.Completed;
                        transfer.Speed = "Finished";
                        OnTransferCompleted?.Invoke(transfer);
                        uploadedFiles.Add(safeFileName);
                    }
                    catch (Exception ex)
                    {
                        transfer.Status = TransferStatus.Failed;
                        transfer.ErrorMessage = ex.Message;
                        OnTransferCompleted?.Invoke(transfer);
                        return Results.Problem($"Failed to save {safeFileName}: {ex.Message}");
                    }
                }

                return Results.Ok(new { success = true, files = uploadedFiles });
            });

            await _app.StartAsync(_cts.Token);
            IsRunning = true;
        }

        public async Task StopAsync()
        {
            if (!IsRunning || _app == null) return;

            try
            {
                _cts?.Cancel();
                await _app.StopAsync();
                await _app.DisposeAsync();
            }
            catch
            {
                // Graceful stop
            }
            finally
            {
                _app = null;
                IsRunning = false;
            }
        }

        private static string GetMobileWebAppHtml()
        {
            try
            {
                var assembly = Assembly.GetExecutingAssembly();
                using var stream = assembly.GetManifestResourceStream("AirDropWindows.Assets.webapp.html");
                if (stream != null)
                {
                    using var reader = new StreamReader(stream, Encoding.UTF8);
                    return reader.ReadToEnd();
                }

                string localPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "webapp.html");
                if (File.Exists(localPath))
                {
                    return File.ReadAllText(localPath, Encoding.UTF8);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[FileTransferServer] Error loading webapp HTML: {ex.Message}");
            }

            return "<!DOCTYPE html><html><body><h2>AirDrop Windows Transfer Server Online</h2><p>Assets/webapp.html was not found.</p></body></html>";
        }
    }
}
