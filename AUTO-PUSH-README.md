# Auto-Push Git Configuration

Este directorio incluye scripts para automatizar la sincronización con GitHub.

## Scripts Disponibles

### 1. `auto-push.ps1`
Script que detecta cambios y hace push automáticamente a GitHub.

**Uso directo:**
```powershell
.\auto-push.ps1 -IntervalSeconds 300
```

**Parámetros:**
- `-IntervalSeconds`: Intervalo entre sincronizaciones en segundos (default: 300 = 5 minutos)

### 2. `setup-auto-push.ps1`
Script para configurar una tarea programada en Windows que ejecuta `auto-push.ps1` automáticamente.

## Instalación Automática

### Opción 1: Ejecutar Como Administrador en PowerShell

```powershell
# 1. Abrir PowerShell como Administrador
# 2. Cambiar a la carpeta del proyecto
cd C:\Claude_Code_trabajos

# 3. Permitir ejecución de scripts (solo la primera vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 4. Ejecutar el script de configuración
.\setup-auto-push.ps1
```

## Gestión de la Tarea

### Ver estado de la tarea
```powershell
Get-ScheduledTask -TaskName "SafeAlert-AutoPush" | Format-List
```

### Ejecutar manualmente la tarea
```powershell
Start-ScheduledTask -TaskName "SafeAlert-AutoPush"
```

### Detener la tarea
```powershell
Stop-ScheduledTask -TaskName "SafeAlert-AutoPush"
```

### Eliminar la tarea
```powershell
Unregister-ScheduledTask -TaskName "SafeAlert-AutoPush" -Confirm:$false
```

## Verificación

Los logs se guardan en: `C:\Claude_Code_trabajos\auto-push.log`

Ver últimas actualizaciones:
```powershell
Get-Content C:\Claude_Code_trabajos\auto-push.log -Tail 20
```

## Características

✅ Detecta cambios automáticamente  
✅ Crea commits con timestamp  
✅ Sincroniza con GitHub cada 5 minutos (configurable)  
✅ Registra actividades en log  
✅ Se ejecuta en background  
✅ Se reinicia después de reiniciar Windows  

## Solución de Problemas

### Error: "No se puede ejecutar scripts"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error de autenticación con GitHub
Asegúrate de haber configurado credenciales de Git:
```powershell
git config user.name "Tu Nombre"
git config user.email "tu.email@example.com"
```

O usa SSH keys para evitar introducir contraseñas cada vez.
