[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$nativeHostDir = Join-Path -Path $repoRoot -ChildPath "native-host"
$hostCommandPath = Join-Path -Path $nativeHostDir -ChildPath "location-switcher-host.cmd"
$manifestPath = Join-Path -Path $nativeHostDir -ChildPath "location-switcher-host.manifest.json"
$registryKeyPath = "HKCU:\Software\Mozilla\NativeMessagingHosts\com.filelocation.download_path_switcher"

if (-not (Test-Path -LiteralPath $hostCommandPath -PathType Leaf)) {
  throw "Native host launcher not found at $hostCommandPath"
}

$manifest = @{
  name = "com.filelocation.download_path_switcher"
  description = "Native host for the Download Path Switcher Firefox extension"
  path = $hostCommandPath
  type = "stdio"
  allowed_extensions = @("download-path-switcher@filelocation.local")
}

$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

if (-not (Test-Path -LiteralPath $registryKeyPath)) {
  New-Item -Path $registryKeyPath -Force | Out-Null
}

$registryKey = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey(
  "Software\\Mozilla\\NativeMessagingHosts\\com.filelocation.download_path_switcher"
)

if ($null -eq $registryKey) {
  throw "Failed to open the Firefox native messaging registry key for writing."
}

try {
  $registryKey.SetValue("", $manifestPath, [Microsoft.Win32.RegistryValueKind]::String)
} finally {
  $registryKey.Dispose()
}

Write-Host "Native host manifest written to:"
Write-Host "  $manifestPath"
Write-Host ""
Write-Host "Registry key updated:"
Write-Host "  $registryKeyPath"
