$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$runtimeNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if ($nodeCommand) { $studioNode = $nodeCommand.Source } elseif (Test-Path -LiteralPath $runtimeNode) { $studioNode = $runtimeNode } else { throw 'Node.js 22+ is required. Install Node.js and retry.' }
$studioPort = if ($env:PORT) { $env:PORT } else { '4317' }
$studioUrl = "http://127.0.0.1:$studioPort"
$running = $false
try { $response = Invoke-RestMethod "$studioUrl/api/state" -TimeoutSec 2; $running = $response.version -eq 1 } catch {}
if (-not $running) {
    New-Item -ItemType Directory -Path (Join-Path $projectRoot 'data') -Force | Out-Null
    Start-Process -FilePath $studioNode -ArgumentList @('server.mjs') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectRoot 'data\server.log') -RedirectStandardError (Join-Path $projectRoot 'data\server-error.log') | Out-Null
    for ($attempt = 0; $attempt -lt 30; $attempt++) { Start-Sleep -Milliseconds 300; try { $response = Invoke-RestMethod "$studioUrl/api/state" -TimeoutSec 1; $running = $true; break } catch {} }
}
if (-not $running) { throw 'The website did not start. Check data/server-error.log.' }
Start-Process $studioUrl
