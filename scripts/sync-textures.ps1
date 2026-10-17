param(
    [string]$Source = 'C:\Users\Kurtz\Documents\3D Printing\Textures',
    [switch]$Check
)

$ErrorActionPreference = 'Stop'
$taskPython = Get-Command python -ErrorAction SilentlyContinue
if ($taskPython) {
    $taskPythonPath = $taskPython.Source
} else {
    $taskBundledPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
    if (-not (Test-Path -LiteralPath $taskBundledPython -PathType Leaf)) {
        throw 'Python was not found. Install Python and Pillow, then run scripts/sync-textures.py.'
    }
    $taskPythonPath = $taskBundledPython
}

$taskSyncArguments = @((Join-Path $PSScriptRoot 'sync-textures.py'), '--source', $Source)
if ($Check) { $taskSyncArguments += '--check' }
& $taskPythonPath @taskSyncArguments
exit $LASTEXITCODE
