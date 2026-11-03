# Launcher for the daily comment check (run by Windows Task Scheduler, see register-daily-task.ps1)
# Kept ASCII-only: Windows PowerShell 5.1 reads BOM-less scripts in the system codepage.
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = Join-Path $env:ProgramFiles 'nodejs\node.exe' }
& $node (Join-Path $PSScriptRoot 'daily-check.js')
exit $LASTEXITCODE
