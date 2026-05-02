[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path -Path $repoRoot -ChildPath "native-host\\location-switcher-host.manifest.json"
$registryKeyPath = "HKCU:\Software\Mozilla\NativeMessagingHosts\com.filelocation.download_path_switcher"

if (Test-Path -LiteralPath $registryKeyPath) {
  Remove-Item -LiteralPath $registryKeyPath -Force
}

if (Test-Path -LiteralPath $manifestPath) {
  Remove-Item -LiteralPath $manifestPath -Force
}

Write-Host "Native host removed."
