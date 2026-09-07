# Archivo: Publicar/scripts/Export-PublicacionBundle.ps1

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| Publicar/scripts/Export-PublicacionBundle.ps1 | 169 | PowerShell 7 | 6671 | Script de utilidad de publicación (exportación de artefactos y metadatos) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Script de la carpeta `Publicar` que se ejecuta **después** de `Build-PlayInternalTesting.ps1` (o de forma autónoma con `-SourceAabPath`) para:

1. Resolver las rutas base del proyecto y de `Publicar/artefactos`.
2. Leer datos clave de `app.json` y `android/app/build.gradle` y componer un resumen de publicación.
3. Copiar el AAB release a `Publicar/artefactos/` (si existe).
4. Escribir `publicacion-metadata.json` con los datos técnicos de la publicación.

No sube nada a Google Play ni invoca fastlane/gcloud: es preparación local de artefactos y metadatos. [NIVEL DE CERTEZA: Confirmado por código]

## Clasificación y estado

- Estado: `FUNCIONALIDAD EXISTENTE`. Referenciado por `Publicar/README.md` (paso 4 del flujo recomendado, línea 23) y por `Publicar/play-console/02_Tutorial_Paso_A_Paso.md` (línea 26).
- Depende aguas arriba del AAB generado por `Build-PlayInternalTesting.ps1` (o de una ruta manual `-SourceAabPath`). [NIVEL DE CERTEZA: Confirmado por código (grep de referencias)]

## Dependencias e importaciones

| Dependencia | Tipo | Dónde se usa | ¿Realmente usada? | Para qué se usa |
| --- | --- | --- | --- | --- |
| Cmdlets `Split-Path`, `Join-Path`, `Test-Path` | Estándar (PowerShell) | Varias funciones | Sí | Resolución de rutas |
| Cmdlets `Get-Content`, `ConvertFrom-Json`, `ConvertTo-Json`, `Set-Content` | Estándar (PowerShell) | Get-AppMetadata y flujo principal | Sí | Lectura de `app.json` y escritura del JSON de metadatos |
| `[regex]::Match` | Estándar (.NET) | Get-AppMetadata | Sí | Extraer `versionCode` y `versionName` de `build.gradle` |
| Cmdlets `New-Item`, `Copy-Item` | Estándar (PowerShell) | Flujo principal y Copy-AabIfPresent | Sí | Crear carpeta `artefactos` y copiar el AAB |
| `(Get-Date).ToString('s')` | Estándar (.NET) | Get-AppMetadata | Sí | Marca de tiempo en formato ISO 8601 corto |
| `app.json` (raíz del proyecto) | Interna (config de Expo) | Get-AppMetadata | Sí | Nombre, slug, scheme, paquete Android, versión, EAS project id |
| `android/app/build.gradle` | Interna (config Gradle de Android) | Get-AppMetadata | Sí | Leer `versionCode` y `versionName` reales |
| Carpeta `Publicar/artefactos` | Interna (destino de salida) | Flujo principal | Sí | Destino del AAB y de los metadatos |

## Componentes que dependen de este archivo

| Componente | Tipo de dependencia |
| --- | --- |
| `Publicar/README.md` (línea 23) | Lo invoca en el flujo recomendado (paso 4) |
| `Publicar/play-console/02_Tutorial_Paso_A_Paso.md` (línea 26) | Lo invoca en el tutorial |
| `Publicar/artefactos/app-release.aab` | Salida que copia (consumidor: proceso manual de subida a Play) |
| `Publicar/artefactos/publicacion-metadata.json` | Salida que genera |

## Variables globales y constantes

No declara variables globales ni constantes de módulo. Usa variables locales dentro de funciones y del flujo principal.

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `$paths` | Hashtable devuelto por Get-SafeAlertPaths | Local del flujo principal | projectRoot, publishRoot, artifactRoot | Líneas 145–146 |
| `$metadata` | Hashtable ordenado | Local del flujo principal | Datos de publicación | Líneas 148, 158, 162 |
| `$resolvedAabPath` | string | Local del flujo principal | Ruta del AAB a copiar | Líneas 149–153 |
| `$copiedAab` | string o null | Local del flujo principal | Ruta del AAB ya copiado | Líneas 155–159 |
| `$metadataPath` | string | Local del flujo principal | Ruta del JSON de salida | Líneas 161–162 |

Valores mágicos: el sufijo de fecha `'s'` (patrón de formato de fecha .NET: `yyyy-MM-ddTHH:mm:ss`, ordenable) y la ruta por defecto del AAB `android\app\build\outputs\bundle\release\app-release.aab`.

## Estructura (funciones / clases / tipos)

| Elemento | Tipo | Líneas |
| --- | --- | --- |
| Get-SafeAlertPaths | Función (sin parámetros) | 33–43 |
| Resolve-DefaultAabPath | Función (ProjectRoot) | 57–69 |
| Get-AppMetadata | Función (ProjectRoot) | 83–109 |
| Copy-AabIfPresent | Función (CandidatePath, ArtifactRoot) | 123–143 |
| Flujo principal | Código secuencial de script | 145–169 |

## Análisis línea por línea

### Bloque 1 (líneas 1–19): cabecera documental, parámetros y arranque

```ps1
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
```

**Explicación de las líneas 1–19:** cabecera del proyecto, parámetro opcional y modo estricto.

- **Línea 3**: nombre del archivo.
- **Línea 4**: descripción: copiar el AAB y generar metadatos dentro de `Publicar`.
- **Líneas 5–9**: autor, fecha, versión 1.1.0, lenguaje y uso documentado.
- **Línea 12** (`[CmdletBinding()]`): parámetros comunes avanzados.
- **Líneas 13–16** (`param(... [string]$SourceAabPath)`): parámetro opcional para indicar una ruta manual del AAB cuando el default no existe.
- **Línea 18** (`Set-StrictMode -Version Latest`): modo estricto.
- **Línea 19** (`$ErrorActionPreference = 'Stop'`): errores terminantes.

### Bloque 2 (líneas 21–43): función Get-SafeAlertPaths

```ps1
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
```

**Explicación de las líneas 21–43:** deriva las tres rutas base a partir de la ubicación del propio script.

- **Líneas 21–32**: docstring de la función.
- **Línea 34** (`$publishRoot = Split-Path -Path $PSScriptRoot -Parent`): `Publicar` (padre de `Publicar\scripts`).
- **Línea 35** (`$projectRoot = Split-Path -Path $publishRoot -Parent`): raíz del repositorio `safealert`.
- **Línea 36** (`$artifactRoot = Join-Path -Path $publishRoot -ChildPath 'artefactos'`): carpeta de salida `Publicar\artefactos`.
- **Líneas 38–42**: devuelve Hashtable con las tres claves. [NOTA] La carpeta de artefactos se nombra en español (`artefactos`), coherente con el resto de la carpeta `Publicar`.

### Bloque 3 (líneas 45–69): función Resolve-DefaultAabPath

```ps1
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
```

**Explicación de las líneas 45–69:** localiza el AAB en la ruta estándar que deja Gradle tras `bundleRelease`.

- **Líneas 45–56**: docstring de la función.
- **Línea 63** (`$defaultAabPath = Join-Path ... 'android\app\build\outputs\bundle\release\app-release.aab'`): ruta canónica de salida de Gradle para `bundleRelease`.
- **Líneas 64–66**: si existe, devuelve la ruta.
- **Línea 68** (`return ''`): si no existe, devuelve cadena vacía (el flujo principal la interpreta como "sin AAB por defecto" y evita el error, ver línea 149–150 y 132–134).

### Bloque 4 (líneas 71–109): función Get-AppMetadata

```ps1
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
```

**Explicación de las líneas 71–109:** compone el resumen técnico de publicación a partir de dos fuentes de configuración.

- **Líneas 71–82**: docstring de la función.
- **Línea 89** (`$appJsonPath = Join-Path ... 'app.json'`): configuración principal de Expo en la raíz.
- **Línea 90** (`$buildGradlePath = Join-Path ... 'android\app\build.gradle'`): configuración Gradle del módulo app.
- **Línea 92** (`$appJson = Get-Content ... -Raw | ConvertFrom-Json`): lee y parsea `app.json`. Con `-Raw` evita la fragmentación por líneas.
- **Línea 93** (`$buildGradle = Get-Content ... -Raw`): lee `build.gradle` como texto plano para usar expresiones regulares.
- **Línea 95** (`$versionCodeMatch = [regex]::Match($buildGradle, 'versionCode\s+(\d+)')`): extrae el número tras `versionCode`.
- **Línea 96** (`$versionNameMatch = [regex]::Match($buildGradle, 'versionName\s+"([^"]+)"')`): extrae la versión entre comillas tras `versionName`.
- **Líneas 98–108** (`return [ordered]@{ ... }`): Hashtable ordenado con: appName, slug, scheme, androidPackage, version (todos de `app.json`), versionCode y versionName (de `build.gradle`, con cadena vacía si el regex no casó), easProjectId (del `extra.eas` de `app.json`) y generatedAt (marca de tiempo local ISO corto).
- [OBSERVACIÓN TÉCNICA] El acceso a `$appJson.expo.android.package` y `$appJson.expo.extra.eas.projectId` asume una forma concreta del `app.json`; con `Set-StrictMode -Version Latest`, si `expo.android` o `expo.extra` no existieran, la lectura lanzaría error terminante. La forma canónica de Expo/EAS sí anida así estos campos. [NIVEL DE CERTEZA: Altamente probable] (la forma real de `app.json` no se audita en este módulo).
- [OBSERVACIÓN TÉCNICA] La extracción por regex de `versionCode`/`versionName` es frágil ante cambios de formato del `build.gradle` (p. ej. versionCatalog o variables interpoladas); si no casa, se escribe cadena vacía sin aviso (las líneas 104–105 usan `else { '' }`).

### Bloque 5 (líneas 111–143): función Copy-AabIfPresent

```ps1
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
```

**Explicación de las líneas 111–143:** copia el AAB al destino conservando el nombre base, con casos de "sin ruta" y "ruta inexistente" diferenciados.

- **Líneas 111–122**: docstring de la función.
- **Líneas 125–130**: parámetros: `CandidatePath` opcional; `ArtifactRoot` obligatorio.
- **Líneas 132–134** (`if ([string]::IsNullOrWhiteSpace($CandidatePath)) { return $null }`): ruta vacía (el caso "sin AAB por defecto") no es error: devuelve nulo.
- **Líneas 136–138** (`if (-not (Test-Path ...)) { throw ... }`): una ruta explícita que no existe sí es un error terminante con mensaje claro.
- **Línea 140** (`$destination = Join-Path ... (Split-Path -Path $CandidatePath -Leaf)`): destino = `artefactos` + nombre base del archivo origen.
- **Línea 141** (`Copy-Item ... -Force`): copia sobrescribiendo si ya existiera.
- **Línea 142** (`return $destination`): devuelve la ruta copiada.

### Bloque 6 (líneas 145–169): flujo principal

```ps1
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
```

**Explicación de las líneas 145–169:** orquesta la exportación completa.

- **Línea 145** (`$paths = Get-SafeAlertPaths`): rutas base.
- **Línea 146** (`$null = New-Item -ItemType Directory -Path $paths.artifactRoot -Force`): crea `Publicar/artefactos` si no existe (idempotente); `$null =` descarta la salida.
- **Línea 148** (`$metadata = Get-AppMetadata ...`): genera el resumen técnico leyendo `app.json` y `build.gradle`.
- **Líneas 149–153** (`$resolvedAabPath = if (...)`): usa `-SourceAabPath` si se pasó; si no, intenta el AAB por defecto (puede ser `''`).
- **Línea 155** (`$copiedAab = Copy-AabIfPresent ...`): copia o devuelve nulo; puede lanzar error si `-SourceAabPath` no existe.
- **Líneas 157–159** (`if ($copiedAab) { $metadata['copiedAab'] = $copiedAab }`): agrega la clave `copiedAab` al Hashtable ordenado solo cuando hubo copia.
- **Línea 161** (`$metadataPath = Join-Path ... 'publicacion-metadata.json'`): ruta del archivo JSON.
- **Línea 162** (`$metadata | ConvertTo-Json | Set-Content ... -Encoding UTF8`): serializa y escribe. En PowerShell 7, `-Encoding UTF8` equivale a UTF-8 sin BOM. La profundidad por defecto de `ConvertTo-Json` (2) es suficiente porque el Hashtable es de un solo nivel con valores escalares.
- **Línea 164**: mensaje de éxito con la ruta del JSON.
- **Líneas 165–168**: si hubo copia informa la ruta del AAB; si no, mensaje amarillo sugiriendo `-SourceAabPath` (con registro en español rioplatense: "ejecutá").

## Fichas de funciones y métodos

### Get-SafeAlertPaths (líneas 33–43)

- Firma: `function Get-SafeAlertPaths {` (sin parámetros).
- Propósito técnico y funcional: centralizar la resolución de rutas del proyecto.
- Parámetros: ninguno. Retorno: Hashtable con `projectRoot`, `publishRoot`, `artifactRoot`. Excepciones: no lanza.
- Dependencias: `$PSScriptRoot`, `Split-Path`, `Join-Path`.
- Flujo: Publicar → raíz → artefactos. Efectos secundarios: ninguno. Riesgos: ninguno relevante.

### Resolve-DefaultAabPath (líneas 57–69)

- Firma: `function Resolve-DefaultAabPath { param([string]$ProjectRoot) }`.
- Propósito: resolver el AAB estándar de Gradle cuando no se indica ruta manual.
- Parámetros: ProjectRoot (obligatorio). Retorno: ruta si existe; cadena vacía si no. Excepciones: no lanza.
- Dependencias: `Test-Path`, `Join-Path`.
- Flujo: arma ruta canónica → comprueba existencia → devuelve ruta o `''`. Riesgos: devolver `''` es deliberado para que el flujo principal no falle (se reporta como "AAB ausente").

### Get-AppMetadata (líneas 83–109)

- Firma: `function Get-AppMetadata { param([string]$ProjectRoot) }`.
- Propósito: leer `app.json` y `build.gradle` y componer el resumen técnico.
- Parámetros: ProjectRoot (obligatorio). Retorno: Hashtable ordenado con 9 claves (appName, slug, scheme, androidPackage, version, versionCode, versionName, easProjectId, generatedAt). Excepciones: errores de lectura/parseo de archivos y accesos a propiedades inexistentes bajo modo estricto.
- Dependencias: `app.json`, `android/app/build.gradle`, `ConvertFrom-Json`, `[regex]::Match`, `(Get-Date)`.
- Flujo: lee ambos archivos → regex de versiones → devuelve Hashtable.
- Efectos secundarios: ninguno (solo lectura). Riesgos: dependencia de la forma exacta de ambos archivos (ver Observaciones técnicas).

### Copy-AabIfPresent (líneas 123–143)

- Firma: `function Copy-AabIfPresent { param([string]$CandidatePath, [string]$ArtifactRoot) }`.
- Propósito: copiar el AAB a `artefactos` manteniendo el nombre base.
- Parámetros: CandidatePath (opcional), ArtifactRoot (obligatorio). Retorno: ruta copiada o `$null`. Excepciones: `throw` si una ruta explícita no existe.
- Dependencias: `Test-Path`, `Split-Path`, `Join-Path`, `Copy-Item`.
- Flujo: ruta vacía → null; ruta inexistente → throw; si no, copia con `-Force` y devuelve destino.
- Efectos secundarios: escribe en `Publicar/artefactos`. Riesgos: `-Force` sobrescribe un AAB previo del mismo nombre sin aviso (comportamiento esperado para regenerar artefactos).

## Clases / interfaces / tipos

Ninguna. Solo funciones y Hashtables anónimos.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El acceso rígido a `app.json` (líneas 99–106) puede fallar bajo modo estricto si la forma del JSON cambia. Impacto potencial: el script deja de funcionar sin mensaje útil. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] Las líneas 95–96 usan regex sobre el texto crudo de `build.gradle`: cualquier reformateo (p. ej. migración a version catalogs o `build.gradle.kts`) rompería la extracción en silencio (valores vacíos). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `generatedAt` (línea 107) usa la hora local de la máquina sin zona horaria explícita; suficiente para metadatos locales, pero no comparable entre máquinas de distinta zona. [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] La carpeta `Publicar/artefactos` no figura en `.gitignore` (verificado en `.gitignore`, no hay entrada para `artefactos`): existe riesgo de commit accidental del AAB y del JSON de metadatos. [NIVEL DE CERTEZA: Confirmado por código (.gitignore leído)]
- [INFORMATIVO] No usa fastlane/gcloud/Play Console API: la publicación final es manual (coherente con la limitación documentada en `Publicar/README.md`).

## Seguridad

- [INFORMATIVO] No maneja secretos ni credenciales: solo lectura de configuración pública del repo (`app.json`, `build.gradle`) y copia de un binario local.
- [INFORMATIVO] El JSON de metadatos incluye el identificador del proyecto EAS (proyecto Expo) y datos técnicos; no se reproduce su valor en esta documentación ([SECRETO OCULTO] por prudencia). Es información que también reside en `app.json` del repositorio.
- [BAJO] El AAB copiado contiene la configuración de Firebase embebida (configuración de la app, no credenciales de servidor). Si `Publicar/artefactos` se subiera a Git por accidente (no está en `.gitignore`), se expondría un binario completo de la app. [NIVEL DE CERTEZA: Inferido]
- [INFORMATIVO] Sin entradas de usuario, sin logging de secretos, sin operaciones de red. Autenticación/autorización: no aplica.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Agregar `Publicar/artefactos/` al `.gitignore` para evitar commit accidental de binarios y metadatos.
- [RECOMENDACIÓN] Reemplazar la extracción por regex de versiones por una fuente única y estructurada (p. ej. leer `versionCode`/`versionName` desde `app.json` de Expo o desde `ext` de Gradle) para eliminar fragilidad.
- [RECOMENDACIÓN] Añadir validación explícita de que `app.json` contenga `expo.android` y `expo.extra.eas` antes de acceder a sus propiedades, con mensajes de error accionables.
- [RECOMENDACIÓN] Considerar escribir `generatedAt` en UTC para metadatos reproducibles.
- [RIESGO] Si se ejecuta sin AAB por defecto y sin `-SourceAabPath`, el script termina con éxito generando un JSON sin `copiedAab`: el mensaje amarillo lo aclara, pero el código de salida no diferencia ambos escenarios (quien automatice debe leer la salida).
