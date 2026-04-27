[CmdletBinding()]
param(
  [switch]$SelfTest
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Send-HostMessage {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$Message
  )

  $json = $Message | ConvertTo-Json -Compress -Depth 6
  $payload = [System.Text.Encoding]::UTF8.GetBytes($json)
  $lengthBytes = [System.BitConverter]::GetBytes([int]$payload.Length)
  $stdout = [System.Console]::OpenStandardOutput()
  $stdout.Write($lengthBytes, 0, $lengthBytes.Length)
  $stdout.Write($payload, 0, $payload.Length)
  $stdout.Flush()
}

function Read-ExactBytes {
  param(
    [Parameter(Mandatory = $true)]
    [System.IO.Stream]$Stream,
    [Parameter(Mandatory = $true)]
    [int]$Count
  )

  $buffer = New-Object byte[] $Count
  $offset = 0

  while ($offset -lt $Count) {
    $read = $Stream.Read($buffer, $offset, $Count - $offset)
    if ($read -le 0) {
      if ($offset -eq 0) {
        return $null
      }

      throw "Unexpected end of native messaging input stream."
    }

    $offset += $read
  }

  return $buffer
}

function Read-HostMessage {
  $stdin = [System.Console]::OpenStandardInput()
  $lengthBytes = Read-ExactBytes -Stream $stdin -Count 4

  if ($null -eq $lengthBytes) {
    return $null
  }

  $length = [System.BitConverter]::ToInt32($lengthBytes, 0)
  if ($length -lt 0) {
    throw "Invalid message length."
  }

  $payload = Read-ExactBytes -Stream $stdin -Count $length
  $json = [System.Text.Encoding]::UTF8.GetString($payload)
  return $json | ConvertFrom-Json
}

function Get-UniqueDestinationPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$DirectoryPath,
    [Parameter(Mandatory = $true)]
    [string]$FileName
  )

  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
  $extension = [System.IO.Path]::GetExtension($FileName)
  $candidate = Join-Path -Path $DirectoryPath -ChildPath $FileName
  $index = 1

  while (Test-Path -LiteralPath $candidate) {
    $candidate = Join-Path -Path $DirectoryPath -ChildPath ("{0} ({1}){2}" -f $baseName, $index, $extension)
    $index += 1
  }

  return $candidate
}

function Move-DownloadedFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,
    [Parameter(Mandatory = $true)]
    [string]$TargetDirectory
  )

  if (-not (Test-Path -LiteralPath $SourcePath -PathType Leaf)) {
    throw "The downloaded file does not exist: $SourcePath"
  }

  if (-not (Test-Path -LiteralPath $TargetDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $TargetDirectory -Force | Out-Null
  }

  $sourceFullPath = [System.IO.Path]::GetFullPath($SourcePath)
  $sourceFileName = [System.IO.Path]::GetFileName($sourceFullPath)
  $destinationPath = Get-UniqueDestinationPath -DirectoryPath $TargetDirectory -FileName $sourceFileName
  $destinationFullPath = [System.IO.Path]::GetFullPath($destinationPath)

  if ($sourceFullPath -eq $destinationFullPath) {
    return @{
      ok = $true
      message = "The file is already in the selected location."
      targetDirectory = $TargetDirectory
      finalPath = $destinationFullPath
    }
  }

  Move-Item -LiteralPath $sourceFullPath -Destination $destinationFullPath

  return @{
    ok = $true
    message = "Moved download successfully."
    targetDirectory = $TargetDirectory
    finalPath = $destinationFullPath
  }
}

if ($SelfTest) {
  "location-switcher-host.ps1 loaded successfully"
  exit 0
}

while ($true) {
  try {
    $message = Read-HostMessage
    if ($null -eq $message) {
      break
    }

    switch ($message.type) {
      "ping" {
        Send-HostMessage @{
          ok = $true
          message = "Native host is available."
        }
      }
      "moveDownload" {
        $response = Move-DownloadedFile -SourcePath $message.sourcePath -TargetDirectory $message.targetDirectory
        Send-HostMessage $response
      }
      default {
        Send-HostMessage @{
          ok = $false
          message = "Unsupported message type: $($message.type)"
        }
      }
    }
  } catch {
    Send-HostMessage @{
      ok = $false
      message = $_.Exception.Message
    }
  }
}
