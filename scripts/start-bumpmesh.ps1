param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$url = 'http://127.0.0.1:8765'
try { $health = Invoke-RestMethod "$url/__bumpmesh-local-health.json" -TimeoutSec 2 } catch { $health = $null }
if ($health -and ($health.app -ne 'bumpmesh-local' -or $health.root -ne $projectRoot)) {
    throw 'Port 8765 belongs to a different app or checkout. Close it before starting this BumpMesh copy.'
}
if (-not $health) {
    $node = (Get-Command node -ErrorAction Stop).Source
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'vendor/three/build/three.module.js'))) {
        throw 'Local libraries are missing. Run npm ci and npm run vendor in this project.'
    }
    $logDir = Join-Path $projectRoot 'bumpmesh-local-working/server-logs'
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $process = Start-Process -FilePath $node -ArgumentList 'scripts/local-server.mjs' -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'server.log') -RedirectStandardError (Join-Path $logDir 'server-errors.log')
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 200
        try { $health = Invoke-RestMethod "$url/__bumpmesh-local-health.json" -TimeoutSec 1 } catch { $health = $null }
        if ($health) { break }
        if ($process.HasExited) { throw "Server stopped. See $logDir/server-errors.log" }
    }
    if (-not $health -or $health.root -ne $projectRoot) { throw "BumpMesh did not start. See $logDir/server-errors.log" }
}
Write-Host "BumpMesh Local is running at $url"
if (-not $NoBrowser) { Start-Process $url }
