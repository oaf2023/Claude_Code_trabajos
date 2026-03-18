# Auto-push script for Git repository
# Este script detecta cambios y hace push automáticamente a GitHub

param(
    [int]$IntervalSeconds = 300  # Intervalo en segundos (por defecto 5 minutos)
)

$repoPath = "C:\Claude_Code_trabajos"
$logFile = "$repoPath\auto-push.log"

function Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $message" | Tee-Object -FilePath $logFile -Append
}

Log "=== Iniciando auto-push script ==="
Log "Intervalo: $IntervalSeconds segundos"

Set-Location $repoPath

# Configurar usuario de Git si no está configurado
$userName = git config user.name
$userEmail = git config user.email

if (-not $userName) {
    Log "Configurando usuario de Git..."
    git config user.name "Auto-Push Bot"
    git config user.email "auto-push@safealert.local"
}

# Loop infinito de verificación
while ($true) {
    try {
        # Verificar estado del repositorio
        $status = git status --porcelain
        
        if ($status) {
            Log "Cambios detectados:"
            Log "$status"
            
            # Agregar todos los cambios
            git add .
            Log "Archivos agregados al staging"
            
            # Crear commit con timestamp
            $commitMessage = "Auto-update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
            git commit -m $commitMessage
            Log "Commit realizado: $commitMessage"
            
            # Hacer push
            git push origin main
            Log "Push completado exitosamente"
        } else {
            Log "No hay cambios pendientes"
        }
    }
    catch {
        Log "ERROR: $_"
    }
    
    Log "Próxima verificación en $IntervalSeconds segundos..."
    Start-Sleep -Seconds $IntervalSeconds
}
