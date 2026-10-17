$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
try { $health = Invoke-RestMethod 'http://127.0.0.1:8765/__bumpmesh-local-health.json' -TimeoutSec 2 } catch { Write-Host 'BumpMesh Local is already stopped.'; exit 0 }
if ($health.app -ne 'bumpmesh-local' -or $health.root -ne $projectRoot) { throw 'This port belongs to another app or checkout.' }
$process = Get-Process -Id $health.pid -ErrorAction Stop
if (-not $process -or $process.ProcessName -ne 'node') { throw 'The process is not this BumpMesh local server.' }
Stop-Process -Id $health.pid
Write-Host 'BumpMesh Local stopped.'
