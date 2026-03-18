# Script para crear una tarea programada en Windows
# Ejecuta auto-push cada 5 minutos

$taskName = "SafeAlert-AutoPush"
$scriptPath = "C:\Claude_Code_trabajos\auto-push.ps1"
$logPath = "C:\Claude_Code_trabajos\auto-push.log"

# Verificar si la tarea ya existe
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "La tarea '$taskName' ya existe. Eliminándola..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Crear acción para ejecutar el script PowerShell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

# Crear trigger para ejecutar cada 5 minutos
$trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 5) -Once -At (Get-Date)

# Crear configuración
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable

# Registrar la tarea
Register-ScheduledTask -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Auto-push de cambios en SafeAlert a GitHub cada 5 minutos" `
    -RunLevel Highest

Write-Host "✅ Tarea programada creada exitosamente"
Write-Host "Nombre: $taskName"
Write-Host "Script: $scriptPath"
Write-Host "Log: $logPath"
Write-Host ""
Write-Host "El repositorio se sincronizará automáticamente cada 5 minutos"
