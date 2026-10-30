param([Parameter(Mandatory=$true)][string]$Folder)
$ErrorActionPreference = 'Stop'
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class FolderWindow {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, IntPtr process);
    [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint from, uint to, bool attach);
    [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hwnd, int command);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hwnd);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hwnd);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hwnd);
    public static bool Activate(IntPtr hwnd) {
        uint current = GetCurrentThreadId();
        uint foreground = GetWindowThreadProcessId(GetForegroundWindow(), IntPtr.Zero);
        bool attached = current != foreground && AttachThreadInput(current, foreground, true);
        try {
            ShowWindowAsync(hwnd, IsIconic(hwnd) ? 9 : 5);
            BringWindowToTop(hwnd);
            SetForegroundWindow(hwnd);
            return GetForegroundWindow() == hwnd;
        } finally { if (attached) AttachThreadInput(current, foreground, false); }
    }
}
'@
$target = [IO.Path]::GetFullPath($Folder).TrimEnd('\')
if (-not (Test-Path -LiteralPath $target -PathType Container)) { throw 'Video folder no longer exists.' }
$shell = New-Object -ComObject Shell.Application
function Find-FolderWindow {
    foreach ($window in $shell.Windows()) {
        try {
            if ($window.FullName -like '*\explorer.exe' -and $window.Document.Folder.Self.Path.TrimEnd('\') -ieq $target) {
                return [IntPtr]$window.HWND
            }
        } catch {}
    }
    return [IntPtr]::Zero
}
$handle = Find-FolderWindow
if ($handle -eq [IntPtr]::Zero) {
    $start = New-Object Diagnostics.ProcessStartInfo
    $start.FileName = Join-Path $env:WINDIR 'explorer.exe'
    $start.Arguments = '"' + $target + '"'
    $start.UseShellExecute = $true
    [Diagnostics.Process]::Start($start) | Out-Null
}
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    $handle = Find-FolderWindow
    if ($handle -ne [IntPtr]::Zero -and [FolderWindow]::Activate($handle)) { exit 0 }
    Start-Sleep -Milliseconds 150
}
throw 'Could not bring the video folder to the foreground. Please try again.'
