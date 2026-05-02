[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

$webExt = Get-Command web-ext -ErrorAction SilentlyContinue
if ($null -eq $webExt) {
  throw "web-ext is not installed. Run: npm install --global web-ext"
}

Push-Location $repoRoot
try {
  & $webExt.Source build
} finally {
  Pop-Location
}
