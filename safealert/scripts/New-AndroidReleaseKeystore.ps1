<# ============================================================================

* Archivo         : New-AndroidReleaseKeystore.ps1
* Descripción     : Genera un keystore de release para Android y muestra las variables necesarias para firmar SafeAlert.
* Autor           : oafon
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Uso             : pwsh -File .\scripts\New-AndroidReleaseKeystore.ps1 -KeystorePath C:\secure\safealert-release.keystore -KeyAlias safealert-release
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

<# ============================================================================

* Función         : Get-KeytoolCommand
* Descripción     : Resuelve el ejecutable keytool disponible en el sistema.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Conexiones      : JDK instalado en el sistema
* Ingesta         : Sin parámetros
* Devolución      : Ruta al ejecutable keytool
* Uso             : Get-KeytoolCommand
* ============================================================================ #>
function Get-KeytoolCommand {
    $keytoolCommand = Get-Command keytool -ErrorAction SilentlyContinue
    if ($null -eq $keytoolCommand) {
        throw 'No se encontró keytool. Instalá un JDK y verificá que keytool esté disponible en PATH.'
    }

    return $keytoolCommand.Source
}

<# ============================================================================

* Función         : New-ReleaseKeystore
* Descripción     : Ejecuta keytool para crear el keystore release de Android.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Conexiones      : Get-KeytoolCommand, herramienta keytool
* Ingesta         : string OutputPath, string Alias, int Days, string DistinguishedName, string StoreSecret, string KeySecret
* Devolución      : Sin retorno. Crea el archivo keystore en disco.
* Uso             : New-ReleaseKeystore -OutputPath C:\secure\safealert-release.keystore -Alias safealert-release -Days 10000 -DistinguishedName "CN=SafeAlert,..."
* ============================================================================ #>
function New-ReleaseKeystore {
    param(
        [Parameter(Mandatory = $true)]
        [string]$OutputPath,

        [Parameter(Mandatory = $true)]
        [string]$Alias,

        [Parameter(Mandatory = $true)]
        [int]$Days,

        [Parameter(Mandatory = $true)]
        [string]$DistinguishedName,

        [Parameter()]
        [string]$StoreSecret,

        [Parameter()]
        [string]$KeySecret
    )

    $targetDirectory = Split-Path -Path $OutputPath -Parent
    if ($targetDirectory -and -not (Test-Path -Path $targetDirectory)) {
        New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
    }

    if (Test-Path -Path $OutputPath) {
        throw "El archivo ya existe: $OutputPath"
    }

    $keytoolPath = Get-KeytoolCommand
    $arguments = @(
        '-genkeypair'
        '-v'
        '-keystore', $OutputPath
        '-alias', $Alias
        '-keyalg', 'RSA'
        '-keysize', '2048'
        '-validity', $Days.ToString()
        '-dname', $DistinguishedName
    )

    if ($StoreSecret) {
        $arguments += @('-storepass', $StoreSecret)
    }

    if ($KeySecret) {
        $arguments += @('-keypass', $KeySecret)
    }

    & $keytoolPath @arguments
    if (-not (Test-Path -Path $OutputPath)) {
        throw 'No se pudo crear el keystore de release.'
    }
}

<# ============================================================================

* Función         : Show-ReleaseEnvTemplate
* Descripción     : Imprime las variables necesarias para firmar builds release de Android.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Conexiones      : New-ReleaseKeystore
* Ingesta         : string OutputPath, string Alias, string StoreSecret, string KeySecret
* Devolución      : Sin retorno. Escribe variables sugeridas en consola.
* Uso             : Show-ReleaseEnvTemplate -OutputPath C:\secure\safealert-release.keystore -Alias safealert-release
* ============================================================================ #>
function Show-ReleaseEnvTemplate {
    param(
        [Parameter(Mandatory = $true)]
        [string]$OutputPath,

        [Parameter(Mandatory = $true)]
        [string]$Alias,

        [Parameter()]
        [string]$StoreSecret,

        [Parameter()]
        [string]$KeySecret
    )

    Write-Host ''
    Write-Host 'Variables para firmar release:' -ForegroundColor Cyan
    Write-Host "MYAPP_RELEASE_STORE_FILE=$OutputPath"
    Write-Host "MYAPP_RELEASE_KEY_ALIAS=$Alias"
    Write-Host "MYAPP_RELEASE_STORE_PASSWORD=$([string]::IsNullOrWhiteSpace($StoreSecret) ? '<completar>' : $StoreSecret)"
    Write-Host "MYAPP_RELEASE_KEY_PASSWORD=$([string]::IsNullOrWhiteSpace($KeySecret) ? '<completar>' : $KeySecret)"
    Write-Host ''
    Write-Host 'Sugerencia: exportá estas variables sólo en tu shell local o CI, nunca en el repositorio.' -ForegroundColor Yellow
}

New-ReleaseKeystore -OutputPath $KeystorePath -Alias $KeyAlias -Days $ValidityDays -DistinguishedName $DName -StoreSecret $StorePassword -KeySecret $KeyPassword
Show-ReleaseEnvTemplate -OutputPath $KeystorePath -Alias $KeyAlias -StoreSecret $StorePassword -KeySecret $KeyPassword
Write-Host "Keystore generado en: $KeystorePath" -ForegroundColor Green