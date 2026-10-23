$ErrorActionPreference = "Stop"

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  $elevatedProcess = Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList $arguments -Wait -PassThru
  exit $elevatedProcess.ExitCode
}

$hostsPath = Join-Path $env:WINDIR "System32\drivers\etc\hosts"
$hostsContent = [System.IO.File]::ReadAllText($hostsPath)
if ($hostsContent -match "(?m)^\s*127\.0\.0\.1\s+.*\bbantinmoi\.test(?:\s|$)") {
  Write-Output "bantinmoi.test is already present in the Windows hosts file."
  exit 0
}

[System.IO.File]::AppendAllText(
  $hostsPath,
  "`r`n127.0.0.1`tbantinmoi.test`r`n",
  [System.Text.Encoding]::ASCII
)
Clear-DnsClientCache
Write-Output "Added bantinmoi.test. Open http://bantinmoi.test in your browser."
