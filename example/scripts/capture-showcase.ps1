<#
  Captures every showcase screen from a connected Android device into
  docs/images/<key>.png for the README.

  Prerequisites: the example app is installed and running in debug mode with
  Metro, and exactly one device is connected (or pass -Device <serial>).

    powershell -ExecutionPolicy Bypass -File example/scripts/capture-showcase.ps1
#>
param(
  [string]$Device = '',
  [int]$Count = 12,
  [int]$SettleMs = 2500,
  [string]$OutDir = (Join-Path $PSScriptRoot '..\..\docs\images')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$deviceArgs = @()
if ($Device) { $deviceArgs = @('-s', $Device) }
# adb prints harmless warnings to stderr (e.g. "intent delivered to the running
# instance"); Windows PowerShell would turn those into terminating errors.
function Invoke-Adb {
  $previous = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { & adb @deviceArgs @args 2>$null } finally { $ErrorActionPreference = $previous }
}

New-Item -ItemType Directory -Force $OutDir | Out-Null
$OutDir = (Resolve-Path $OutDir).Path
$tmp = Join-Path ([IO.Path]::GetTempPath()) 'rn-smart-grid-showcase.png'

# Device pixels per dp (wm density reports dpi; an override wins over physical).
$densityLines = Invoke-Adb shell wm density
$dpi = ($densityLines | Select-String '(\d+)' -AllMatches | ForEach-Object { $_.Matches } | Select-Object -Last 1).Value
$scale = [double]$dpi / 160

for ($i = 0; $i -lt $Count; $i++) {
  Invoke-Adb logcat -c
  Invoke-Adb shell am start -a android.intent.action.VIEW -d "rnsmartgrid://showcase/$i" com.rnsmartgridexample | Out-Null

  # Wait for the screen to report itself (key + safe-area insets).
  $line = $null
  for ($t = 0; $t -lt 60 -and -not $line; $t++) {
    Start-Sleep -Milliseconds 500
    $line = Invoke-Adb logcat -d -s ReactNativeJS:V | Select-String "\[showcase\] (\{.*`"index`":$i,.*\})" | Select-Object -Last 1
  }
  if (-not $line) { throw "Showcase screen $i did not render. Is Metro running and the app open?" }
  $info = $line.Matches[0].Groups[1].Value | ConvertFrom-Json
  Start-Sleep -Milliseconds $SettleMs

  # adb exec-out keeps the PNG bytes intact (no CRLF translation).
  $p = Start-Process -FilePath 'adb' -ArgumentList ($deviceArgs + @('exec-out', 'screencap', '-p')) `
    -RedirectStandardOutput $tmp -NoNewWindow -Wait -PassThru
  if ($p.ExitCode -ne 0) { throw "screencap failed for screen $i" }

  $src = [System.Drawing.Bitmap]::FromFile($tmp)
  try {
    $top = [math]::Round($info.insets.top * $scale)
    $bottom = [math]::Round($info.insets.bottom * $scale)
    $rect = New-Object System.Drawing.Rectangle 0, $top, $src.Width, ($src.Height - $top - $bottom)
    $crop = $src.Clone($rect, $src.PixelFormat)
    $file = Join-Path $OutDir "$($info.key).png"
    $crop.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
    $crop.Dispose()
    Write-Host "[$i] $($info.key) -> $file"
  } finally {
    $src.Dispose()
  }
}
Remove-Item $tmp -ErrorAction SilentlyContinue
