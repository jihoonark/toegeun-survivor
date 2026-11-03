# Registers the daily comment check in Windows Task Scheduler (GAME_SPEC.md section 11)
# - every day at 11:00
# - if the PC was off (or nobody was logged in) at 11:00, runs as soon as it can
# - runs only while the user is logged in, so the Windows notification can be shown
# - never posts replies; it only fetches comments, writes drafts and shows a notification
# Kept ASCII-only: Windows PowerShell 5.1 reads BOM-less scripts in the system codepage.
param([string]$At = '11:00')

$taskName = 'ToegeunBot-DailyCheck'
$launcher = Join-Path $PSScriptRoot 'daily-check.ps1'

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$launcher`"" `
  -WorkingDirectory (Split-Path -Parent $PSScriptRoot)
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $taskName -Description 'Toegeun Survivor bot: fetch YouTube comments, draft replies, notify (never posts)' `
  -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Get-ScheduledTask -TaskName $taskName | Get-ScheduledTaskInfo | Select-Object TaskName, NextRunTime
