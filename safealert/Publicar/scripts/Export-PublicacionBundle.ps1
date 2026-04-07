<# ============================================================================

* Archivo         : Export-PublicacionBundle.ps1
* Descripción     : Copia el AAB release y genera metadatos de publicación dentro de la carpeta Publicar.
* Autor           : oafon
* Fecha           : 2026-03-28
* Versión         : 1.1.0
* Lenguaje        : PowerShell 7
* Uso             : pwsh -File .\Publicar\scripts\Export-PublicacionBundle.ps1
* ============================================================================ #>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$SourceAabPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

<# ============================================================================

* Función         : Get-SafeAlertPaths
* Descripción     : Resuelve las rutas base del proyecto y de la carpeta Publicar.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Conexiones      : Estructura de carpetas del repositorio
* Ingesta         : Sin parámetros
* Devolución      : Hashtable con projectRoot, publishRoot y artifactRoot
* Uso             : Get-SafeAlertPaths
* ============================================================================ #>
function Get-SafeAlertPaths {
    $publishRoot = Split-Path -Path $PSScriptRoot -Parent
    $projectRoot = Split-Path -Path $publishRoot -Parent
    $artifactRoot = Join-Path -Path $publishRoot -ChildPath 'artefactos'

    return @{
        projectRoot = $projectRoot
        publishRoot = $publishRoot
        artifactRoot = $artifactRoot
    }
}

<# ============================================================================

* Función         : Resolve-DefaultAabPath
* Descripción     : Resuelve el AAB release local generado por Gradle cuando no se informa una ruta manual.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Conexiones      : android/app/build/outputs/bundle/release
* Ingesta         : string ProjectRoot
* Devolución      : Ruta candidata al AAB local o cadena vacía
* Uso             : Resolve-DefaultAabPath -ProjectRoot C:\Claude_Code_trabajos\safealert
* ============================================================================ #>
function Resolve-DefaultAabPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectRoot
    )

    $defaultAabPath = Join-Path -Path $ProjectRoot -ChildPath 'android\app\build\outputs\bundle\release\app-release.aab'
    if (Test-Path -Path $defaultAabPath) {
        return $defaultAabPath
    }

    return ''
}

<# ============================================================================

* Función         : Get-AppMetadata
* Descripción     : Lee datos clave de app.json y build.gradle para generar un resumen de publicación.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Conexiones      : app.json, android/app/build.gradle
* Ingesta         : string ProjectRoot
* Devolución      : Hashtable con datos principales de la app
* Uso             : Get-AppMetadata -ProjectRoot C:\Claude_Code_trabajos\safealert
* ============================================================================ #>
function Get-AppMetadata {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectRoot
    )

    $appJsonPath = Join-Path -Path $ProjectRoot -ChildPath 'app.json'
    $buildGradlePath = Join-Path -Path $ProjectRoot -ChildPath 'android\app\build.gradle'

    $appJson = Get-Content -Path $appJsonPath -Raw | ConvertFrom-Json
    $buildGradle = Get-Content -Path $buildGradlePath -Raw

    $versionCodeMatch = [regex]::Match($buildGradle, 'versionCode\s+(\d+)')
    $versionNameMatch = [regex]::Match($buildGradle, 'versionName\s+"([^"]+)"')

    return [ordered]@{
        appName = $appJson.expo.name
        slug = $appJson.expo.slug
        scheme = $appJson.expo.scheme
        androidPackage = $appJson.expo.android.package
        version = $appJson.expo.version
        versionCode = $(if ($versionCodeMatch.Success) { $versionCodeMatch.Groups[1].Value } else { '' })
        versionName = $(if ($versionNameMatch.Success) { $versionNameMatch.Groups[1].Value } else { '' })
        easProjectId = $appJson.expo.extra.eas.projectId
        generatedAt = (Get-Date).ToString('s')
    }
}

<# ============================================================================

* Función         : Copy-AabIfPresent
* Descripción     : Copia el AAB indicado a la carpeta artefactos si existe.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Conexiones      : Carpeta Publicar\artefactos
* Ingesta         : string CandidatePath, string ArtifactRoot
* Devolución      : Ruta copiada o nula
* Uso             : Copy-AabIfPresent -CandidatePath C:\tmp\app.aab -ArtifactRoot C:\...\artefactos
* ============================================================================ #>
function Copy-AabIfPresent {
    param(
        [Parameter()]
        [string]$CandidatePath,

        [Parameter(Mandatory = $true)]
        [string]$ArtifactRoot
    )

    if ([string]::IsNullOrWhiteSpace($CandidatePath)) {
        return $null
    }

    if (-not (Test-Path -Path $CandidatePath)) {
        throw "No existe el archivo AAB indicado: $CandidatePath"
    }

    $destination = Join-Path -Path $ArtifactRoot -ChildPath (Split-Path -Path $CandidatePath -Leaf)
    Copy-Item -Path $CandidatePath -Destination $destination -Force
    return $destination
}

$paths = Get-SafeAlertPaths
$null = New-Item -ItemType Directory -Path $paths.artifactRoot -Force

$metadata = Get-AppMetadata -ProjectRoot $paths.projectRoot
$resolvedAabPath = if ([string]::IsNullOrWhiteSpace($SourceAabPath)) {
    Resolve-DefaultAabPath -ProjectRoot $paths.projectRoot
} else {
    $SourceAabPath
}

$copiedAab = Copy-AabIfPresent -CandidatePath $resolvedAabPath -ArtifactRoot $paths.artifactRoot

if ($copiedAab) {
    $metadata['copiedAab'] = $copiedAab
}

$metadataPath = Join-Path -Path $paths.artifactRoot -ChildPath 'publicacion-metadata.json'
$metadata | ConvertTo-Json | Set-Content -Path $metadataPath -Encoding UTF8

Write-Host "Metadata de publicación generada en: $metadataPath" -ForegroundColor Green
if ($copiedAab) {
    Write-Host "AAB copiado a: $copiedAab" -ForegroundColor Green
} else {
    Write-Host 'No se encontró un AAB local. Si ya lo tenés en otra ruta, ejecutá el script con -SourceAabPath.' -ForegroundColor Yellow
}