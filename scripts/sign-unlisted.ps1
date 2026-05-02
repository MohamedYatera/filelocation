[CmdletBinding()]
param(
  [string]$ApiKey = $env:AMO_JWT_ISSUER,
  [string]$ApiSecret = $env:AMO_JWT_SECRET
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ApiKey)) {
  throw "Missing AMO API key. Set AMO_JWT_ISSUER or pass -ApiKey."
}

if ([string]::IsNullOrWhiteSpace($ApiSecret)) {
  throw "Missing AMO API secret. Set AMO_JWT_SECRET or pass -ApiSecret."
}

$repoRoot = Split-Path -Parent $PSScriptRoot

$webExt = Get-Command web-ext -ErrorAction SilentlyContinue
if ($null -eq $webExt) {
  throw "web-ext is not installed. Run: npm install --global web-ext"
}

Push-Location $repoRoot
try {
  & $webExt.Source sign --channel=unlisted --api-key=$ApiKey --api-secret=$ApiSecret
} finally {
  Pop-Location
}
