<# ============================================================================

* Archivo         : Build-PlayInternalTesting.ps1
* Descripción     : Valida SafeAlert y genera localmente el AAB Android de producción para Google Play Internal Testing.
* Autor           : oafon
* Fecha           : 2026-03-28
* Versión         : 1.1.0
* Lenguaje        : PowerShell 7
* Uso             : pwsh -File .\Publicar\scripts\Build-PlayInternalTesting.ps1
* ============================================================================ #>

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

<# ============================================================================

* Función         : Import-LocalReleaseEnv
* Descripción     : Carga variables release desde un archivo local ignorado por Git si existe.
* Fecha           : 2026-03-28
* Versión         : 1.1.0
* Lenguaje        : PowerShell 7
* Conexiones      : Publicar\config\release.env.ps1
* Ingesta         : Sin parámetros
* Devolución      : Sin retorno. Importa variables de entorno a la sesión actual.
* Uso             : Import-LocalReleaseEnv
* ============================================================================ #>
function Import-LocalReleaseEnv {
    $publishRoot = Split-Path -Path $PSScriptRoot -Parent
    $localEnvPath = Join-Path -Path $publishRoot -ChildPath 'config\release.env.ps1'

    if (Test-Path -Path $localEnvPath) {
        . $localEnvPath
        Write-Host "Configuracion release cargada desde: $localEnvPath" -ForegroundColor Cyan
    }
}

<# ============================================================================

* Función         : Assert-ReleaseEnv
* Descripción     : Verifica que existan las variables de entorno necesarias para firmar una build release.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Conexiones      : Variables de entorno MYAPP_RELEASE_*
* Ingesta         : Sin parámetros
* Devolución      : Sin retorno. Lanza excepción si falta alguna variable.
* Uso             : Assert-ReleaseEnv
* ============================================================================ #>
function Assert-ReleaseEnv {
    $requiredVars = @(
        'MYAPP_RELEASE_STORE_FILE',
        'MYAPP_RELEASE_STORE_PASSWORD',
        'MYAPP_RELEASE_KEY_ALIAS',
        'MYAPP_RELEASE_KEY_PASSWORD'
    )

    $missing = @()
    foreach ($variableName in $requiredVars) {
        $value = [Environment]::GetEnvironmentVariable($variableName)
        if ([string]::IsNullOrWhiteSpace($value) -or $value -eq '********') {
            $missing += $variableName
        }
    }

    if ($missing.Count -gt 0) {
        $helpMessage = @(
            "Faltan variables release: $($missing -join ', ')"
            'Soluciones posibles:'
            '1. Ejecutar .\Publicar\scripts\New-AndroidReleaseKeystore.ps1 para generar el keystore.'
            '2. Crear y completar Publicar\config\release.env.ps1 a partir de Publicar\config\release.env.example.ps1.'
            '3. O exportar manualmente MYAPP_RELEASE_* en la terminal actual.'
        ) -join [Environment]::NewLine

        throw $helpMessage
    }
}

<# ============================================================================

* Función         : Invoke-SafeAlertCommand
* Descripción     : Ejecuta un comando dentro de la raiz de SafeAlert y detiene el proceso ante error.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Conexiones      : npm, Gradle Wrapper
* Ingesta         : string FilePath, string[] Arguments, string? WorkingDirectory
* Devolución      : Sin retorno. Ejecuta el comando solicitado.
* Uso             : Invoke-SafeAlertCommand -FilePath npm -Arguments @('run','typecheck')
* ============================================================================ #>
function Invoke-SafeAlertCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter()]
        [string]$WorkingDirectory = ''
    )

    $projectRoot = Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent
    $resolvedWorkingDirectory = if ([string]::IsNullOrWhiteSpace($WorkingDirectory)) { $projectRoot } else { $WorkingDirectory }
    Push-Location $resolvedWorkingDirectory
    try {
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "El comando fallo: $FilePath $($Arguments -join ' ')"
        }
    }
    finally {
        Pop-Location
    }
}

Import-LocalReleaseEnv
Assert-ReleaseEnv
Invoke-SafeAlertCommand -FilePath 'npm' -Arguments @('run', 'typecheck')
$androidRoot = Join-Path -Path (Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent) -ChildPath 'android'
Invoke-SafeAlertCommand -FilePath '.\gradlew.bat' -Arguments @('bundleRelease') -WorkingDirectory $androidRoot
Write-Host 'Build local de Google Play Internal Testing generada correctamente.' -ForegroundColor Green