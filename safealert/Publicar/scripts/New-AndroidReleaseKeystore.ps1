<# ============================================================================

* Archivo         : New-AndroidReleaseKeystore.ps1
* Descripción     : Reexpone desde Publicar la creación guiada del keystore release de Android para SafeAlert.
* Autor           : oafon
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Uso             : pwsh -File .\Publicar\scripts\New-AndroidReleaseKeystore.ps1 -KeystorePath C:\secure\safealert-release.keystore -KeyAlias safealert-release -StorePassword TU_PASSWORD -KeyPassword TU_PASSWORD
* ============================================================================ #>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$KeystorePath,

    [Parameter(Mandatory = $true)]
    [string]$KeyAlias,

    [Parameter()]
    [int]$ValidityDays = 10000,

    [Parameter()]
    [string]$DName = "CN=SafeAlert, OU=Mobile, O=SafeAlert, L=Buenos Aires, S=Buenos Aires, C=AR",

    [Parameter()]
    [string]$StorePassword,

    [Parameter()]
    [string]$KeyPassword
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent
$delegateScript = Join-Path -Path $projectRoot -ChildPath 'scripts\New-AndroidReleaseKeystore.ps1'

if (-not (Test-Path -Path $delegateScript)) {
    throw "No se encontró el script base: $delegateScript"
}

& $delegateScript `
    -KeystorePath $KeystorePath `
    -KeyAlias $KeyAlias `
    -ValidityDays $ValidityDays `
    -DName $DName `
    -StorePassword $StorePassword `
    -KeyPassword $KeyPassword
