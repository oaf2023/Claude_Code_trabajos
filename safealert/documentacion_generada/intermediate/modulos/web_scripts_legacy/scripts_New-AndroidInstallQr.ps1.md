# Archivo: scripts/New-AndroidInstallQr.ps1

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | scripts/New-AndroidInstallQr.ps1 |
| Líneas totales | 239 |
| Lenguaje | PowerShell 7 (genera HTML/CSS) |
| Tamaño (bytes) | 7691 |
| Categoría | Utilidad de soporte — landing HTML + QR de instalación APK |
| Estado detectado | FUNCIONALIDAD EXISTENTE (utilidad manual documentada) |
| Nivel de certeza | Confirmado por código |

## Objetivo

Genera una landing page HTML autocontenida con un código QR (servicio externo `api.qrserver.com`) y un enlace de descarga para instalar la APK de Android de SafeAlert fuera de Play Store (distribución directa). Escribe `index.html` y `metadata.json` bajo `dist/android-distribution/` por defecto, con nombre de app, versión, URL de descarga y marca de tiempo.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` como herramienta manual de soporte.

Referencias reales: `DEPLOY.md` (línea 43) y `SETUP.md` (línea 146) muestran su invocación con `-DownloadUrl`. No forma parte de builds automáticos ni CI.

## Dependencias e importaciones

| Dependencia | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `api.qrserver.com` (API externa de QR) | externa (servicio HTTP) | Líneas 220–221 (URL de imagen del QR) | Sí — en runtime la imagen la sirve el tercero |
| `[System.Uri]::EscapeDataString` | .NET estándar | Línea 219 | Sí (codificación de la URL en el query del QR) |
| `ConvertTo-Json` / `Set-Content` / `New-Item` | estándar | Líneas 217, 226, 236 | Sí |

Nota: la generación del HTML no usa ninguna librería local de QR: delega el renderizado a un servicio de terceros (requiere conectividad al visualizar la landing).

## Componentes que dependen de este archivo

| Componente | Referencia |
| --- | --- |
| DEPLOY.md (línea 43) | Documenta la invocación |
| SETUP.md (línea 146) | Documenta la invocación |

Salida: `dist/android-distribution/index.html` + `metadata.json` (no consumidos por la app; artefactos de distribución manual).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| DownloadUrl | parámetro obligatorio | string | URL pública de la APK | 14–15, 219–222, 231 |
| Version | `'1.0.0'` (default) | string | Versión mostrada | 17–18, 222, 230 |
| AppName | `'SafeAlert'` (default) | string | Nombre de la app | 20–21, 222, 229 |
| OutputDirectory | `'dist/android-distribution'` (default) | string | Carpeta de salida relativa | 23–24, 216–217 |
| qrImageUrl | `https://api.qrserver.com/v1/create-qr-code/?size=720x720&data=<encoded>` | string | URL de la imagen QR | 220–221, 232 |
| metadata | `[ordered]@{...}` | hashtable ordenado | Metadatos del release | 228–234, 236 |

## Estructura (funciones / clases / tipos)

- `Resolve-OutputDirectory` (líneas 42–50): resuelve la ruta absoluta de salida.
- `New-QrLandingHtml` (líneas 64–214): construye el HTML (bloque here-string).
- Main: líneas 216–239.

## Análisis línea por línea

```powershell
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
```

**Explicación de las líneas 1–50:**

- **Líneas 1–10**: cabecera estándar con `<# #>` (sintaxis PowerShell correcta). Ejemplo con `https://mi-host/safealert.apk`.
- **Línea 12**: `[CmdletBinding()]`.
- **Líneas 13–25**: parámetros; solo `DownloadUrl` obligatorio; defaults para versión (1.0.0), nombre y carpeta de salida.
- **Líneas 27–28**: strict mode y errores que detienen.
- **Líneas 30–50** (`Resolve-OutputDirectory`): toma `PSScriptRoot` (scripts/), sube un nivel (raíz del proyecto) y une la carpeta relativa; `GetFullPath` normaliza. Devuelve ruta absoluta (p. ej. `C:\Claude_Code_trabajos\safealert\dist\android-distribution`).

```powershell
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
```

**Explicación de las líneas 52–214:**

- **Líneas 52–77**: cabecera de función y `param` (Title, ReleaseVersion, ApkUrl, QrImageUrl, todos obligatorios).
- **Línea 79**: `return @"..."@` — here-string expandible de PowerShell: las variables `$Title`, `$ReleaseVersion`, `$QrImageUrl`, `$ApkUrl` se interpolan.
- **Líneas 80–93**: `<head>` con charset UTF-8, viewport responsive y `<title>$Title Android</title>`.
- **Líneas 86–184**: hoja de estilo embebida con paleta cálida (`--bg: #fff7ed`, `--accent: #c2410c` — naranja), tarjeta central (`main` con border-radius 28px y sombra), héroe con degradado, layout responsive en grid (`repeat(auto-fit, minmax(260px,1fr))`), estilos de `.qr`, `.button` y `code` con `word-break`. CSS sin lógica; se documenta como presentación autocontenida (no requiere CSS externo).
- **Líneas 187–211** (`<body>`):
  - **Línea 189**: `<h1>$Title para Android</h1>` (interpolado).
  - **Línea 190**: párrafo de versión interpolado.
  - **Línea 194**: `<img class="qr" src="$QrImageUrl" ...>` — la imagen QR se carga desde el tercero al abrir la landing.
  - **Línea 195**: botón de descarga `<a class="button" href="$ApkUrl">Descargar APK</a>`.
  - **Líneas 196–197**: enlace alternativo en `<code>$ApkUrl</code>`.
  - **Líneas 200–207**: instrucciones de instalación (5 pasos), incluido el aviso de "orígenes desconocidos" y permisos solicitados (ubicación, notificaciones, micrófono, contactos).
- **Línea 213**: cierre del here-string.
- `[OBSERVACIÓN TÉCNICA]` (líneas 79, 189–197): interpolación directa de `$ApkUrl`/`$QrImageUrl` en atributos HTML sin escape. Si `DownloadUrl` contuviera comillas dobles o caracteres `<`, rompería el HTML o inyectaría marcado (XSS autogenerado). Parámetro controlado por el operador en generación, pero la URL acaba visible en la landing pública y, en el `metadata.json`, tal cual. `[NIVEL DE CERTEZA: Confirmado por código]`.

```powershell
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
```

**Explicación de las líneas 216–239:**

- **Línea 216**: resuelve la carpeta absoluta de salida.
- **Línea 217**: crea el directorio si falta (`$null =` descarta el objeto).
- **Línea 219**: codifica la URL de descarga como query (`EscapeDataString`), requisito para que el QR sea válido con caracteres especiales.
- **Línea 220**: compone la URL de la API de QR con tamaño 720x720.
- **Líneas 222–224**: genera el HTML y calcula rutas de `index.html` y `metadata.json`.
- **Línea 226**: escribe el HTML en UTF-8.
- **Líneas 228–234**: hashtable `[ordered]` de metadatos: appName, version, downloadUrl, qrImageUrl, generatedAt (formato sortable ISO).
- **Línea 236**: serializa a JSON y lo escribe en UTF-8.
- **Líneas 238–239**: mensajes finales verdes con rutas de los artefactos.

## Fichas de funciones y métodos

### Resolve-OutputDirectory (líneas 42–50)
- Firma: `Resolve-OutputDirectory -RelativeOutputDirectory <string>`.
- Propósito: convertir la carpeta relativa en absoluta bajo la raíz del proyecto.
- Parámetros: `RelativeOutputDirectory` (string, obligatorio).
- Retorno: ruta absoluta (string). Excepciones: ninguna explícita.
- Flujo: `PSScriptRoot` → padre → join → `GetFullPath`. Llamada en línea 216.

### New-QrLandingHtml (líneas 64–214)
- Firma: `New-QrLandingHtml -Title <string> -ReleaseVersion <string> -ApkUrl <string> -QrImageUrl <string>`.
- Propósito: devolver el HTML completo de la landing (sin escribir en disco).
- Parámetros:

| Parámetro | Tipo | Obligatorio | Finalidad |
| --- | --- | --- | --- |
| Title | string | Sí | Nombre de la app en títulos |
| ReleaseVersion | string | Sí | Versión mostrada |
| ApkUrl | string | Sí | Enlace de descarga (href + texto) |
| QrImageUrl | string | Sí | Fuente de la imagen QR |

- Retorno: string HTML. Excepciones: ninguna.
- Efectos secundarios: ninguno (función pura de interpolación).
- Riesgo: interpolación sin escape de entradas (ver Seguridad).

## Clases / interfaces / tipos

No aplica. El HTML generado es estático autocontenido (CSS embebido, sin JS).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (línea 220): dependencia de disponibilidad y política de `api.qrserver.com`; si el servicio cambia/bloquea, la landing muestra imagen rota (el enlace directo sigue funcionando). Alternativa local (generar QR offline) evitaría el tercero y la fuga de la URL de descarga al proveedor del QR al cargar la imagen.
- `[OBSERVACIÓN TÉCNICA]` (líneas 194–197): la URL de la APK se incorpora literal a la página; conviene revisar exposición de la URL de distribución pública (esperable en una landing de descarga).
- `[NOTA]`: título "Instalacion" sin tilde (línea 200) — detalle de redacción.
- `[NOTA]`: `metadata.json` contiene la URL completa de descarga y del servicio QR; no contiene secretos.
- `[NOTA]`: el here-string emplea comillas dobles para HTML; si el HTML necesitara `$` literales (CSS var con `$` no existe; JS no hay) no habría colisión.

## Seguridad

- `[MEDIO]` (líneas 79/194/195/197): interpolación de `DownloadUrl`/`QrImageUrl` sin escape HTML; si el operador introduce comillas o `<`, se produce HTML inválido o inyección de marcado en la landing generada (riesgo de "generador que crea XSS"). Mitigación recomendada: `[System.Net.WebUtility]::HtmlEncode`.
- `[INFORMATIVO]` (línea 220): la URL de descarga viaja a un tercero (api.qrserver.com) cuando el cliente carga la imagen; para una APK pública no es sensible, pero si la APK fuera privada/firmada, la URL se revelaría al proveedor y quedaría en logs de ese servicio.
- `[INFORMATIVO]`: no se manejan credenciales; el HTML no ejecuta JavaScript.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: HTML mal formado o con inyección si `DownloadUrl` contiene caracteres especiales no codificados para HTML (la codificación solo se aplica al query del QR, no a los atributos).
- `[RIESGO]` Bajo: dependencia de disponibilidad del servicio QR externo.
- `[RECOMENDACIÓN]`: aplicar `HtmlEncode` a los cuatro valores interpolados antes de construir el HTML; considerar generación local del QR.
- `[RECOMENDACIÓN]`: revisar tildes/redacción ("Instalacion", "abrila", "Escaneá") si la landing es de cara al usuario.
