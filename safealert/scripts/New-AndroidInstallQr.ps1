<# ============================================================================

* Archivo         : New-AndroidInstallQr.ps1
* Descripción     : Genera una landing HTML con QR para descargar e instalar la APK de SafeAlert en Android.
* Autor           : oafon
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Uso             : pwsh -File .\scripts\New-AndroidInstallQr.ps1 -DownloadUrl https://mi-host/safealert.apk -Version 1.0.0
* ============================================================================ #>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$DownloadUrl,

    [Parameter()]
    [string]$Version = '1.0.0',

    [Parameter()]
    [string]$AppName = 'SafeAlert',

    [Parameter()]
    [string]$OutputDirectory = 'dist/android-distribution'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

<# ============================================================================

* Función         : Resolve-OutputDirectory
* Descripción     : Resuelve la carpeta absoluta donde se escribirán los artefactos HTML y JSON del QR.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Conexiones      : Estructura del repositorio SafeAlert
* Ingesta         : string RelativeOutputDirectory
* Devolución      : Ruta absoluta de salida
* Uso             : Resolve-OutputDirectory -RelativeOutputDirectory dist/android-distribution
* ============================================================================ #>
function Resolve-OutputDirectory {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RelativeOutputDirectory
    )

    $projectRoot = Split-Path -Path $PSScriptRoot -Parent
    return [System.IO.Path]::GetFullPath((Join-Path -Path $projectRoot -ChildPath $RelativeOutputDirectory))
}

<# ============================================================================

* Función         : New-QrLandingHtml
* Descripción     : Construye la landing HTML con QR, enlace de descarga e instrucciones de instalación.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Conexiones      : Servicio externo api.qrserver.com para render del QR
* Ingesta         : string Title, string ReleaseVersion, string ApkUrl, string QrImageUrl
* Devolución      : Contenido HTML como texto
* Uso             : New-QrLandingHtml -Title SafeAlert -ReleaseVersion 1.0.0 -ApkUrl https://mi-host/safealert.apk -QrImageUrl https://api.qrserver.com/...
* ============================================================================ #>
function New-QrLandingHtml {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Title,

        [Parameter(Mandatory = $true)]
        [string]$ReleaseVersion,

        [Parameter(Mandatory = $true)]
        [string]$ApkUrl,

        [Parameter(Mandatory = $true)]
        [string]$QrImageUrl
    )

    return @"
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>$Title Android</title>
    <style>
      :root {
        --bg: #fff7ed;
        --card: #ffffff;
        --ink: #1f2937;
        --accent: #c2410c;
        --muted: #6b7280;
        --border: #fed7aa;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top right, #fdba74 0, transparent 28%),
          linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%);
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }

      main {
        width: min(920px, 100%);
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 28px;
        box-shadow: 0 20px 60px rgba(194, 65, 12, 0.14);
        overflow: hidden;
      }

      .hero {
        padding: 32px;
        background: linear-gradient(135deg, rgba(194, 65, 12, 0.08), rgba(251, 146, 60, 0.18));
      }

      .hero h1 {
        margin: 0 0 8px;
        font-size: clamp(32px, 4vw, 48px);
      }

      .hero p {
        margin: 0;
        color: var(--muted);
        font-size: 18px;
      }

      .content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 24px;
        padding: 32px;
      }

      .panel {
        border: 1px solid var(--border);
        border-radius: 22px;
        padding: 24px;
        background: rgba(255, 255, 255, 0.92);
      }

      .qr {
        display: block;
        width: min(280px, 100%);
        aspect-ratio: 1;
        margin: 0 auto 16px;
        border-radius: 18px;
      }

      .button {
        display: inline-block;
        width: 100%;
        text-align: center;
        text-decoration: none;
        color: #ffffff;
        background: var(--accent);
        padding: 14px 18px;
        border-radius: 14px;
        font-weight: 700;
        margin-top: 12px;
      }

      ol {
        padding-left: 20px;
        margin: 0;
      }

      li + li {
        margin-top: 10px;
      }

      code {
        word-break: break-all;
        color: var(--accent);
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>$Title para Android</h1>
        <p>Version $ReleaseVersion lista para instalar desde QR o enlace directo.</p>
      </section>
      <section class="content">
        <article class="panel">
          <img class="qr" src="$QrImageUrl" alt="QR de descarga de $Title" />
          <a class="button" href="$ApkUrl">Descargar APK</a>
          <p>Si el QR no abre bien, usá este enlace:</p>
          <code>$ApkUrl</code>
        </article>
        <article class="panel">
          <h2>Instalacion</h2>
          <ol>
            <li>Escaneá el QR o abrí el enlace de descarga.</li>
            <li>Descargá la APK en tu teléfono Android.</li>
            <li>Si Android lo pide, habilitá la instalación desde orígenes desconocidos para tu navegador.</li>
            <li>Instalá la app y abrila.</li>
            <li>Aceptá ubicación, notificaciones, micrófono y contactos según corresponda.</li>
          </ol>
        </article>
      </section>
    </main>
  </body>
</html>
"@
}

$resolvedOutputDirectory = Resolve-OutputDirectory -RelativeOutputDirectory $OutputDirectory
$null = New-Item -ItemType Directory -Path $resolvedOutputDirectory -Force

$encodedUrl = [System.Uri]::EscapeDataString($DownloadUrl)
$qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=720x720&data=$encodedUrl"

$htmlContent = New-QrLandingHtml -Title $AppName -ReleaseVersion $Version -ApkUrl $DownloadUrl -QrImageUrl $qrImageUrl
$htmlPath = Join-Path -Path $resolvedOutputDirectory -ChildPath 'index.html'
$metadataPath = Join-Path -Path $resolvedOutputDirectory -ChildPath 'metadata.json'

Set-Content -Path $htmlPath -Value $htmlContent -Encoding UTF8

$metadata = [ordered]@{
    appName = $AppName
    version = $Version
    downloadUrl = $DownloadUrl
    qrImageUrl = $qrImageUrl
    generatedAt = (Get-Date).ToString('s')
}

$metadata | ConvertTo-Json | Set-Content -Path $metadataPath -Encoding UTF8

Write-Host "Landing QR generada en: $htmlPath" -ForegroundColor Green
Write-Host "Metadata generada en: $metadataPath" -ForegroundColor Green