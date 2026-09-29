using System;
using System.IO;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using Microsoft.Win32;
using Wpf.Ui.Controls;
using AirDropWindows.Models;
using AirDropWindows.ViewModels;

namespace AirDropWindows
{
    public partial class MainWindow : FluentWindow
    {
        public MainViewModel ViewModel { get; }

        public MainWindow()
        {
            InitializeComponent();
            ViewModel = new MainViewModel();
            DataContext = ViewModel;
        }

        private async void ToggleHotspot_Checked(object sender, RoutedEventArgs e)
        {
            if (!ViewModel.IsHotspotActive)
            {
                await ViewModel.ToggleHotspotAsync(true);
            }
        }

        private async void ToggleHotspot_Unchecked(object sender, RoutedEventArgs e)
        {
            if (ViewModel.IsHotspotActive)
            {
                await ViewModel.ToggleHotspotAsync(false);
            }
        }

        private void BtnCopySsid_Click(object sender, RoutedEventArgs e)
        {
            if (!string.IsNullOrWhiteSpace(ViewModel.Ssid))
            {
                Clipboard.SetText(ViewModel.Ssid);
            }
        }

        private void BtnCopyPassword_Click(object sender, RoutedEventArgs e)
        {
            if (!string.IsNullOrWhiteSpace(ViewModel.Password))
            {
                Clipboard.SetText(ViewModel.Password);
            }
        }

        private void BtnCopyUrl_Click(object sender, RoutedEventArgs e)
        {
            if (!string.IsNullOrWhiteSpace(ViewModel.ServerUrl))
            {
                Clipboard.SetText(ViewModel.ServerUrl);
            }
        }

        private void BtnOpenFolder_Click(object sender, RoutedEventArgs e)
        {
            ViewModel.OpenReceivedFolder();
        }

        private async void BtnRefresh_Click(object sender, RoutedEventArgs e)
        {
            await ViewModel.RefreshHotspotInfoAsync();
        }

        private void BtnBrowseFiles_Click(object sender, RoutedEventArgs e)
        {
            var dialog = new OpenFileDialog
            {
                Multiselect = true,
                Title = "Select Files to Share with iPhone"
            };

            if (dialog.ShowDialog() == true)
            {
                ViewModel.AddFilesToShare(dialog.FileNames);
            }
        }

        private void BtnClearSharedFiles_Click(object sender, RoutedEventArgs e)
        {
            ViewModel.ClearSharedFiles();
        }

        private void BtnRemoveSharedFile_Click(object sender, RoutedEventArgs e)
        {
            if (sender is FrameworkElement element && element.Tag is SharedFileItem item)
            {
                ViewModel.RemoveSharedFile(item);
            }
        }

        private void DropZone_MouseDown(object sender, MouseButtonEventArgs e)
        {
            if (e.LeftButton == MouseButtonState.Pressed)
            {
                BtnBrowseFiles_Click(sender, e);
            }
        }

        private void DropZone_DragOver(object sender, DragEventArgs e)
        {
            if (e.Data.GetDataPresent(DataFormats.FileDrop))
            {
                e.Effects = DragDropEffects.Copy;
                DropZone.BorderBrush = new SolidColorBrush(Color.FromRgb(48, 209, 88)); // Green glow
                DropZone.Background = new SolidColorBrush(Color.FromArgb(50, 48, 209, 88));
            }
            else
            {
                e.Effects = DragDropEffects.None;
            }
            e.Handled = true;
        }

        private void DropZone_DragLeave(object sender, DragEventArgs e)
        {
            DropZone.BorderBrush = new SolidColorBrush(Color.FromRgb(10, 132, 255)); // Blue default
            DropZone.Background = new SolidColorBrush(Color.FromRgb(26, 34, 51));
        }

        private void DropZone_Drop(object sender, DragEventArgs e)
        {
            DropZone.BorderBrush = new SolidColorBrush(Color.FromRgb(10, 132, 255));
            DropZone.Background = new SolidColorBrush(Color.FromRgb(26, 34, 51));

            if (e.Data.GetDataPresent(DataFormats.FileDrop))
            {
                string[] files = (string[])e.Data.GetData(DataFormats.FileDrop);
                if (files != null && files.Length > 0)
                {
                    ViewModel.AddFilesToShare(files);
                }
            }
        }

        private void BtnClearLog_Click(object sender, RoutedEventArgs e)
        {
            ViewModel.ClearFinishedTransfers();
        }
    }
}