# Archivo: Publicar/scripts/Initialize-PlayReleaseConfig.ps1

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| Publicar/scripts/Initialize-PlayReleaseConfig.ps1 | 50 | PowerShell 7 | 2137 | Script de inicialización de configuración local (PowerShell) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Script de arranque de la carpeta `Publicar`: copia la plantilla versionada `Publicar/config/release.env.example.ps1` a `Publicar/config/release.env.ps1` (archivo local ignorado por Git) la primera vez, para que el operador complete allí sus credenciales reales de firma antes de ejecutar `Build-PlayInternalTesting.ps1`.

Es el paso 1 del flujo recomendado en `Publicar/README.md` (línea 20) y del tutorial `Publicar/play-console/02_Tutorial_Paso_A_Paso.md` (línea 9). [NIVEL DE CERTEZA: Confirmado por código]

## Clasificación y estado

- Estado: `FUNCIONALIDAD EXISTENTE`; guard de no sobrescritura correctamente implementado (si `release.env.ps1` ya existe, no lo toca, preservando secretos existentes).
- `Publicar/config/release.env.ps1` ya existe en disco en este workspace (confirmado por Test-Path, sin leer su contenido); el script sería una no-operación aquí salvo recreación manual. [NIVEL DE CERTEZA: Confirmado por Test-Path]

## Dependencias e importaciones

| Dependencia | Tipo | Dónde se usa | ¿Realmente usada? | Para qué se usa |
| --- | --- | --- | --- | --- |
| Cmdlets `Split-Path`, `Join-Path`, `Test-Path` | Estándar (PowerShell) | Initialize-ReleaseEnvFile | Sí | Resolución de rutas |
| Cmdlets `New-Item`, `Copy-Item` | Estándar (PowerShell) | Initialize-ReleaseEnvFile | Sí | Crear carpeta `config` si falta y copiar la plantilla |
| Cmdlet `Write-Host` | Estándar (PowerShell) | Initialize-ReleaseEnvFile | Sí | Mensajes de estado |
| `Publicar/config/release.env.example.ps1` | Interna (plantilla versionada) | Initialize-ReleaseEnvFile | Sí | Origen de la copia |
| `Publicar/config/release.env.ps1` | Interna (local, ignorada por Git) | Initialize-ReleaseEnvFile | Sí (destino) | Archivo que contendrá los secretos reales |

## Componentes que dependen de este archivo

| Componente | Tipo de dependencia |
| --- | --- |
| `Publicar/README.md` (línea 20) | Lo invoca como paso 1 del flujo |
| `Publicar/play-console/02_Tutorial_Paso_A_Paso.md` (línea 9) | Lo invoca como primer paso del tutorial |
| `Publicar/scripts/Build-PlayInternalTesting.ps1` (línea 32 y 73) | Consumidor del archivo que este script crea (`release.env.ps1`) |
| `Publicar/config/release.env.ps1` | Salida que genera (si no existe previamente) |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `$publishRoot` | `Publicar` | Local de función | Base de la carpeta Publicar | Línea 31 |
| `$configRoot` | `Publicar\config` | Local de función | Carpeta de configuración | Línea 32 |
| `$examplePath` | `Publicar\config\release.env.example.ps1` | Local de función | Plantilla de origen | Línea 33 |
| `$targetPath` | `Publicar\config\release.env.ps1` | Local de función | Archivo destino con secretos | Línea 34 |

No hay constantes globales de módulo ni valores mágicos relevantes.

## Estructura (funciones / clases / tipos)

| Elemento | Tipo | Líneas |
| --- | --- | --- |
| Initialize-ReleaseEnvFile | Función (sin parámetros) | 30–48 |
| Flujo principal (llamada) | Código secuencial de script | 50 |

## Análisis línea por línea

### Bloque 1 (líneas 1–16): cabecera documental y arranque

```ps1
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
```

**Explicación de las líneas 1–16:** cabecera del proyecto (autor `oafon`, fecha 2026-03-28, versión 1.0.0), sin parámetros y modo estricto.

- **Línea 4**: propósito declarado: crear la configuración release local desde la plantilla.
- **Línea 12** (`[CmdletBinding()]`): parámetros comunes avanzados.
- **Línea 13** (`param()`): sin parámetros de entrada.
- **Línea 15** (`Set-StrictMode -Version Latest`): modo estricto.
- **Línea 16** (`$ErrorActionPreference = 'Stop'`): errores terminantes.

### Bloque 2 (líneas 18–48): función Initialize-ReleaseEnvFile

```ps1
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
```

**Explicación de las líneas 18–48:** cuerpo de la función que materializa la plantilla.

- **Líneas 18–29**: docstring de la función (conexión con `release.env.example.ps1`; devolución: crea el archivo).
- **Línea 31** (`$publishRoot = Split-Path -Path $PSScriptRoot -Parent`): `Publicar` (padre de `Publicar\scripts`).
- **Línea 32** (`$configRoot = Join-Path ... 'config'`): `Publicar\config`.
- **Línea 33** (`$examplePath = Join-Path ... 'release.env.example.ps1'`): plantilla de origen (versionada en Git).
- **Línea 34** (`$targetPath = Join-Path ... 'release.env.ps1'`): destino local (ignorado por Git, `.gitignore` línea 37).
- **Líneas 36–38** (`if (-not (Test-Path -Path $configRoot)) { New-Item ... | Out-Null }`): crea la carpeta `config` si no existe (caso de repositorios clonados sin ella); `Out-Null` descarta la salida.
- **Líneas 40–43** (`if (Test-Path -Path $targetPath) { ... return }`): si el archivo final ya existe, avisa en amarillo y sale sin sobrescribir. [NOTA] Guard importante: evita destruir un `release.env.ps1` con secretos reales al re-ejecutar el script.
- **Línea 45** (`Copy-Item -Path $examplePath -Destination $targetPath -Force`): copia la plantilla. `-Force` es inofensivo aquí por el guard previo; si faltara la plantilla, lanzaría error terminante.
- **Línea 46**: mensaje verde de creación con la ruta.
- **Línea 47**: instrucción de completar valores reales antes de `Build-PlayInternalTesting.ps1`.

### Bloque 3 (línea 50): llamada principal

```ps1
Initialize-ReleaseEnvFile
```

**Explicación de la línea 50:** invoca la función en el arranque del script; el archivo resultante queda en `Publicar/config/release.env.ps1` listo para editar.

## Fichas de funciones y métodos

### Initialize-ReleaseEnvFile (líneas 30–48)

- Firma: `function Initialize-ReleaseEnvFile {` (sin parámetros).
- Propósito técnico: copia idempotente de la plantilla de entorno.
- Propósito funcional: preparar el archivo local donde el operador completará credenciales de firma.
- Parámetros: ninguno. Retorno: ninguno. Excepciones: posibles errores de I/O si `config` no es creable o la plantilla no existe.
- Dependencias: `Publicar/config/release.env.example.ps1`, cmdlets de rutas/copia.
- Flujo interno: rutas → crear carpeta si falta → si el destino existe, avisar y salir → copiar → mensajes.
- Efectos secundarios: crea `release.env.ps1` en disco (en la primera ejecución). Riesgos: bajos; el guard de no sobrescritura protege secretos existentes.

## Clases / interfaces / tipos

Ninguna.

## Observaciones técnicas

- [NOTA] Si el operador ya completó `release.env.ps1` y vuelve a ejecutar este script, no se pierde nada (guard de línea 40); la única vía de regeneración es borrar el archivo manualmente.
- [INFORMATIVO] El script no valida que la plantilla de ejemplo siga existiendo; si se eliminara del repositorio, la copia lanzaría un error de `Copy-Item` (comportamiento aceptable).
- [NIVEL DE CERTEZA: Confirmado por código] El script crea el archivo destino con el mismo contenido de la plantilla, incluidos los marcadores `COMPLETAR_PASSWORD`, que el propio flujo release deberá sustituir (ver análisis de `Build-PlayInternalTesting.ps1`, observación sobre el marcador no detectado).

## Seguridad

- [INFORMATIVO] No manipula secretos: copia una plantilla con marcadores.
- [BAJO] El archivo generado (`release.env.ps1`) alojará contraseñas del keystore en texto plano en disco. Mitigación existente: está excluido de Git (`.gitignore` línea 37). La protección adicional depende de permisos del sistema de archivos.
- [INFORMATIVO] Sin entrada de usuario, sin red, sin logging de secretos.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Tras copiar, podría imprimirse un recordatorio de permisos del archivo (p. ej. ACL de solo el usuario) al ser un archivo con secretos.
- [RIESGO] Bajo: si el operador edita `release.env.ps1` con un editor que guarde copias de seguridad en la misma carpeta (p. ej. `release.env.ps1~`), esas copias podrían no estar cubiertas por el `.gitignore`; conviene verificar.
- [RECOMENDACIÓN] Mantener sincronizados el marcador de la plantilla (`COMPLETAR_PASSWORD`) y el marcador que rechaza la validación de `Build-PlayInternalTesting.ps1` (`********`).
