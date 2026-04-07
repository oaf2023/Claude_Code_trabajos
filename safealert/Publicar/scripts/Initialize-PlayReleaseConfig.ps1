<# ============================================================================

* Archivo         : Initialize-PlayReleaseConfig.ps1
* Descripción     : Crea la configuracion local release para Publicar a partir de una plantilla editable.
* Autor           : oafon
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Uso             : pwsh -File .\Publicar\scripts\Initialize-PlayReleaseConfig.ps1
* ============================================================================ #>

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

<# ============================================================================

* Función         : Initialize-ReleaseEnvFile
* Descripción     : Copia la plantilla local de configuracion release si el archivo final aun no existe.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Conexiones      : Publicar\config\release.env.example.ps1
* Ingesta         : Sin parámetros
* Devolución      : Sin retorno. Crea el archivo release.env.ps1.
* Uso             : Initialize-ReleaseEnvFile
* ============================================================================ #>
function Initialize-ReleaseEnvFile {
    $publishRoot = Split-Path -Path $PSScriptRoot -Parent
    $configRoot = Join-Path -Path $publishRoot -ChildPath 'config'
    $examplePath = Join-Path -Path $configRoot -ChildPath 'release.env.example.ps1'
    $targetPath = Join-Path -Path $configRoot -ChildPath 'release.env.ps1'

    if (-not (Test-Path -Path $configRoot)) {
        New-Item -ItemType Directory -Path $configRoot -Force | Out-Null
    }

    if (Test-Path -Path $targetPath) {
        Write-Host "Ya existe: $targetPath" -ForegroundColor Yellow
        return
    }

    Copy-Item -Path $examplePath -Destination $targetPath -Force
    Write-Host "Archivo creado: $targetPath" -ForegroundColor Green
    Write-Host 'Editalo con tus valores reales antes de ejecutar Build-PlayInternalTesting.ps1.' -ForegroundColor Cyan
}

Initialize-ReleaseEnvFile