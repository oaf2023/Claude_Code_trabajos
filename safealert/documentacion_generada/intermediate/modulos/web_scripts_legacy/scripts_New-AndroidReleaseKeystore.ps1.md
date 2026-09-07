# Archivo: scripts/New-AndroidReleaseKeystore.ps1

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | scripts/New-AndroidReleaseKeystore.ps1 |
| Líneas totales | 164 |
| Lenguaje | PowerShell 7 |
| Tamaño (bytes) | 6126 |
| Categoría | Utilidad de soporte — generación de keystore de firma Android |
| Estado detectado | FUNCIONALIDAD EXISTENTE (utilidad manual de soporte al release) |
| Nivel de certeza | Confirmado por código |

## Objetivo

Genera un keystore de release (clave RSA 2048) para firmar el APK/AAB de Android usando `keytool` del JDK, e imprime la plantilla de variables de entorno que el build de Gradle/Expo necesita (`MYAPP_RELEASE_*`). Permite pasar contraseñas por parámetro u omitirlas (keytool preguntará interactivamente). Es delegado por un duplicado de publicación: `Publicar/scripts/New-AndroidReleaseKeystore.ps1` (línea 37 del mismo) y referenciado en `SETUP.md` y `Publicar/scripts/Build-PlayInternalTesting.ps1`.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` como herramienta manual (no se ejecuta en CI ni en builds automáticos).

Referencias reales encontradas:
- `Publicar/scripts/New-AndroidReleaseKeystore.ps1` (línea 37): delega en este archivo (`$delegateScript = ...\scripts\New-AndroidReleaseKeystore.ps1`).
- `SETUP.md` (línea 140) y `Publicar/scripts/Build-PlayInternalTesting.ps1` (línea 72, mensaje de instrucciones): lo citan como paso de preparación.

## Dependencias e importaciones

| Dependencia | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `keytool` (JDK) | externa (herramienta del sistema) | `Get-KeytoolCommand` y `New-ReleaseKeystore` | Sí (requisito; si falta, lanza error claro) |
| Cmdlets de PowerShell (`Split-Path`, `Test-Path`, `New-Item`, `Write-Host`) | estándar | Todo el script | Sí |
| Operador ternario `? :` | lenguaje PowerShell 7 | Líneas 156–157 | Sí (requiere PS 7+, correcto según cabecera) |

## Componentes que dependen de este archivo

| Componente | Referencia |
| --- | --- |
| Publicar/scripts/New-AndroidReleaseKeystore.ps1 | Lo invoca como delegado |
| Publicar/scripts/Build-PlayInternalTesting.ps1 (línea 72) | Mensaje de instrucciones al operador |
| SETUP.md (línea 140) | Documentación de uso |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| KeystorePath | parámetro obligatorio | string | Ruta destino del keystore | 14–15, 162–164 |
| KeyAlias | parámetro obligatorio | string | Alias de la clave | 17–18, 162–164 |
| ValidityDays | 10000 (default) | int | Días de validez (~27,4 años) | 20–21, 78, 162 |
| DName | `CN=SafeAlert, OU=Mobile, O=SafeAlert, L=Buenos Aires, S=Buenos Aires, C=AR` | string | Distinguished Name del certificado | 23–24, 162 |
| StorePassword | parámetro opcional | string | Contraseña del almacén | 26–27, 111–113, 156, 162–163 |
| KeyPassword | parámetro opcional | string | Contraseña de la clave | 29–30, 115–117, 157, 162–163 |

## Estructura (funciones / clases / tipos)

- `Get-KeytoolCommand` (líneas 48–55): localiza `keytool`.
- `New-ReleaseKeystore` (líneas 69–123): ejecuta `keytool -genkeypair`.
- `Show-ReleaseEnvTemplate` (líneas 137–160): imprime plantilla `MYAPP_RELEASE_*`.
- Main: líneas 162–164.

## Análisis línea por línea

```powershell
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
```

**Explicación de las líneas 1–34:**

- **Líneas 1–10**: cabecera estándar del proyecto usando el comentario de bloque correcto `<# #>` de PowerShell. Uso de ejemplo con rutas `C:\secure\...`.
- **Línea 12**: `[CmdletBinding()]` habilita parámetros comunes y comportamiento avanzado.
- **Líneas 13–31** (`param`): parámetros. `KeystorePath` y `KeyAlias` obligatorios; `ValidityDays` con default 10000 días; `DName` con valores de organización SafeAlert/Argentina; `StorePassword` y `KeyPassword` opcionales.
- **Línea 33**: `Set-StrictMode -Version Latest` (errores ante variables no definidas).
- **Línea 34**: `$ErrorActionPreference = 'Stop'` (fallo rápido).
- `[NOTA]` (seguridad, ver Seguridad): contraseñas como parámetros CLI quedan visibles en el historial/lista de procesos del shell.

```powershell
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
```

**Explicación de las líneas 36–123:**

- **Líneas 36–55** (`Get-KeytoolCommand`): usa `Get-Command keytool`; si no existe lanza una excepción con instrucciones claras (mensaje en español rioplatense "Instalá un JDK..."). Devuelve `$keytoolCommand.Source` (ruta del ejecutable).
- **Líneas 57–123** (`New-ReleaseKeystore`):
  - **Líneas 70–88**: parámetros (OutputPath, Alias, Days, DistinguishedName obligatorios; StoreSecret/KeySecret opcionales).
  - **Líneas 90–93**: crea el directorio padre si no existe.
  - **Líneas 95–97**: protección anti-sobrescritura: si el archivo destino ya existe, lanza error (evita regenerar y perder la clave de firma existente). Buen diseño.
  - **Línea 99**: resuelve `keytool`.
  - **Líneas 100–109**: argumentos de `keytool -genkeypair -v -keystore ... -alias ... -keyalg RSA -keysize 2048 -validity ... -dname ...`. RSA 2048 es el mínimo recomendado actual.
  - **Líneas 111–117**: si se pasaron contraseñas, agrega `-storepass` y `-keypass`; si no, keytool las solicita interactivamente por consola (ocultas).
  - **Línea 119**: ejecuta keytool (`& $keytoolPath @arguments`).
  - **Líneas 120–122**: verifica que el archivo se haya creado; si no, lanza error.

```powershell
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
```

**Explicación de las líneas 125–164:**

- **Líneas 125–160** (`Show-ReleaseEnvTemplate`): imprime la plantilla de variables que Gradle/Expo esperan para firmar:
  - `MYAPP_RELEASE_STORE_FILE`, `MYAPP_RELEASE_KEY_ALIAS` (líneas 154–155);
  - `MYAPP_RELEASE_STORE_PASSWORD` y `MYAPP_RELEASE_KEY_PASSWORD` (líneas 156–157). Usa el operador ternario de PowerShell 7: si no se pasó contraseña imprime `<completar>`, pero **si se pasó, imprime la contraseña real en claro en la consola**.
  - **Línea 159**: advertencia de no commitear las variables — buena práctica, aunque el propio script acaba de imprimirlas.
- **Líneas 162–164** (main): invoca `New-ReleaseKeystore` con los parámetros recibidos, luego `Show-ReleaseEnvTemplate`, y cierra con mensaje verde.

## Fichas de funciones y métodos

### Get-KeytoolCommand (líneas 48–55)
- Firma: `function Get-KeytoolCommand { ... }` (sin parámetros).
- Propósito: resolver el binario `keytool` del JDK instalado.
- Parámetros: ninguno. Retorno: ruta al ejecutable (string). Excepciones: lanza si no está en PATH.
- Flujo: `Get-Command` → validación → `return .Source`. Llamada desde `New-ReleaseKeystore` (línea 99).

### New-ReleaseKeystore (líneas 69–123)
- Firma: `New-ReleaseKeystore -OutputPath <string> -Alias <string> -Days <int> -DistinguishedName <string> [-StoreSecret <string>] [-KeySecret <string>]`.
- Propósito técnico: crear keystore RSA-2048 con `keytool`.
- Parámetros (tabla):

| Parámetro | Tipo | Obligatorio | Finalidad |
| --- | --- | --- | --- |
| OutputPath | string | Sí | Ruta del archivo `.keystore` |
| Alias | string | Sí | Alias de la clave |
| Days | int | Sí | Días de validez |
| DistinguishedName | string | Sí | DN del certificado |
| StoreSecret | string | No | Contraseña del almacén |
| KeySecret | string | No | Contraseña de la clave |

- Retorno: ninguno. Excepciones: archivo existente, keytool ausente, creación fallida.
- Efectos secundarios: crea un archivo de clave privada en disco (protección anti-sobrescritura incluida); pasa secretos por línea de comandos a keytool si se proveen.

### Show-ReleaseEnvTemplate (líneas 137–160)
- Firma: `Show-ReleaseEnvTemplate -OutputPath <string> -Alias <string> [-StoreSecret <string>] [-KeySecret <string>]`.
- Propósito: imprimir la plantilla de variables `MYAPP_RELEASE_*`.
- Retorno: ninguno. Efectos secundarios: imprime secretos en claro si se pasaron como parámetros. Llamada desde main (línea 163).

## Clases / interfaces / tipos

No aplica (script procedural con funciones).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (líneas 156–157): si el operador pasa `-StorePassword`/`-KeyPassword`, el script imprime los valores reales en consola y quedan además en el historial del shell y en la línea de comandos del proceso `keytool`. La recomendación del propio script (exportar variables en el entorno) es la vía segura.
- `[NOTA]`: `ValidityDays = 10000` (~27,4 años) es un valor típico para keystores de release Android; coherente con la política de Google de validez hasta 2046+ (aunque recomiendan >= 25 años).
- `[NOTA]`: hay un duplicado en `Publicar/scripts/New-AndroidReleaseKeystore.ps1` que delega en este archivo; riesgo de divergencia si se edita solo una copia.
- `[NOTA]`: cabeceras de funciones completas siguiendo la plantilla del proyecto (Fecha/Versión/Conexiones/Ingesta/Devolución/Uso).

## Seguridad

- `[MEDIO]` (líneas 26–27, 111–113, 156–157): contraseñas de firma pasadas como argumentos CLI (visibles en el historial del shell y en la tabla de procesos mientras keytool corre) e impresas en claro por `Show-ReleaseEnvTemplate`. Recomendado: omitir los parámetros de contraseña (keytool pregunta de forma oculta) o usar variables de entorno del proceso.
- `[INFORMATIVO]`: si se omiten contraseñas, keytool pregunta interactivamente (no queda rastro en historial).
- `[INFORMATIVO]`: el keystore es material de firma crítico; el script protege contra sobrescritura, pero no advierte sobre backup/seguridad del archivo (el propio nombre del directorio de ejemplo `C:\secure\` lo sugiere).
- `[INFORMATIVO]` (línea 159): buena práctica incluida (no commitear secretos); coherente con gobierno de datos del proyecto.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Medio: fuga de contraseñas de firma por consola/historial si se usan los parámetros de contraseña; pérdida del keystore sin respaldo implicaría no poder actualizar la app en Play Store.
- `[RECOMENDACIÓN]`: ejecutar sin `-StorePassword`/`-KeyPassword` (ingreso interactivo oculto) o leerlas de variables de entorno; guardar respaldo del keystore + contraseñas en un gestor de secretos.
- `[RECOMENDACIÓN]`: consolidar el duplicado `Publicar/scripts/...` en un único script canónico.
