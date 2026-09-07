# Archivo: Publicar/scripts/Build-PlayInternalTesting.ps1

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| Publicar/scripts/Build-PlayInternalTesting.ps1 | 124 | PowerShell 7 | 5167 | Script de automatización de build local de Android (PowerShell) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Script principal de la carpeta `Publicar` para producir localmente el **AAB Android de producción** (firmado) destinado a la pista de **Google Play Internal Testing**. Su responsabilidad es orquestar, en orden:

1. Cargar la configuración local de release (`Publicar/config/release.env.ps1`) si existe.
2. Validar que las variables de firma `MYAPP_RELEASE_*` estén presentes y no sean marcadores.
3. Ejecutar la validación TypeScript de la app (`npm run typecheck`).
4. Ejecutar Gradle (`gradlew.bat bundleRelease`) para generar el bundle firmado.

No sube nada a Google Play: la carga final es manual (ver `Publicar/README.md` y el análisis `Publicar/scripts/Export-PublicacionBundle.ps1`). [NIVEL DE CERTEZA: Confirmado por código]

## Clasificación y estado

- Estado: `FUNCIONALIDAD EXISTENTE`. El flujo es secuencial, coherente y está conectado: `Import-LocalReleaseEnv` → `Assert-ReleaseEnv` → `typecheck` → `bundleRelease`.
- Referencias externas que lo usan: `Publicar/README.md` (paso 3 del flujo recomendado, línea 22) y `Publicar/play-console/02_Tutorial_Paso_A_Paso.md` (línea 20). [NIVEL DE CERTEZA: Confirmado por código (grep de referencias)]

## Dependencias e importaciones

No hay instrucciones `Import-Module` ni `using`. Las dependencias son cmdlets del propio PowerShell, herramientas externas del proyecto y el punto de origen (dot-source) de un archivo de configuración.

| Dependencia | Tipo | Dónde se usa | ¿Realmente usada? | Para qué se usa |
| --- | --- | --- | --- | --- |
| Cmdlets `Split-Path`, `Join-Path`, `Test-Path` | Estándar (PowerShell) | Import-LocalReleaseEnv, Invoke-SafeAlertCommand | Sí | Resolución de rutas relativas a `$PSScriptRoot` |
| Cmdlet `Write-Host` | Estándar (PowerShell) | Varias | Sí | Mensajes de progreso en consola |
| Cmdlet `Push-Location` / `Pop-Location` | Estándar (PowerShell) | Invoke-SafeAlertCommand | Sí | Cambiar de directorio de forma segura (try/finally) |
| `[Environment]::GetEnvironmentVariable` | Estándar (.NET) | Assert-ReleaseEnv | Sí | Leer variables de entorno `MYAPP_RELEASE_*` |
| Dot-source de `Publicar/config/release.env.ps1` | Interna (archivo local ignorado por Git) | Import-LocalReleaseEnv | Condicional | Cargar variables de firma en la sesión si el archivo existe |
| `npm` (`run typecheck`) | Externa (Node.js) | Flujo principal (línea 121) | Sí | Validación estática TypeScript previa al build |
| `.\gradlew.bat` (`bundleRelease`) | Externa (Gradle Wrapper, dentro de `android/`) | Flujo principal (línea 123) | Sí | Generar el AAB release firmado |

[NOTA] Las variables `MYAPP_RELEASE_*` son consumidas finalmente por la configuración de firma del lado Gradle (`android/`, fuera del alcance de este análisis).

## Componentes que dependen de este archivo

| Componente | Tipo de dependencia |
| --- | --- |
| `Publicar/README.md` (línea 22) | Lo invoca en el flujo recomendado (paso 3) |
| `Publicar/play-console/02_Tutorial_Paso_A_Paso.md` (línea 20) | Lo invoca en el tutorial |
| `Publicar/scripts/Export-PublicacionBundle.ps1` | Consumidor aguas abajo: copia y documenta el AAB que este script genera |
| `Publicar/config/release.env.ps1` (si existe) | Lo carga vía dot-source; es su entrada de configuración |
| `Publicar/config/release.env.example.ps1` | Plantilla de la que deriva `release.env.ps1` |

[NOTA] No se hallaron llamadas a este script desde el CI (`.github/workflows/ci.yml`): la generación del AAB release es un proceso manual local.

## Variables globales y constantes

No declara variables globales propias; usa variables de entorno de proceso (`$env:*`) definidas por `release.env.ps1` o por el entorno.

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| MYAPP_RELEASE_STORE_FILE | [SECRETO OCULTO] (ruta al keystore) | Variable de entorno (proceso) | Ruta del keystore de firma release | Assert-ReleaseEnv (línea 54) |
| MYAPP_RELEASE_STORE_PASSWORD | [SECRETO OCULTO] | Variable de entorno (proceso) | Contraseña del almacén de claves | Assert-ReleaseEnv (línea 55) |
| MYAPP_RELEASE_KEY_ALIAS | [SECRETO OCULTO] (alias, p. ej. `safealert-release`) | Variable de entorno (proceso) | Alias de la clave de firma | Assert-ReleaseEnv (línea 56) |
| MYAPP_RELEASE_KEY_PASSWORD | [SECRETO OCULTO] | Variable de entorno (proceso) | Contraseña de la clave de firma | Assert-ReleaseEnv (línea 57) |

Constantes/valores mágicos internos:

| Nombre | Valor | Finalidad |
| --- | --- | --- |
| Marcador `'********'` | literal | Se interpreta como "contraseña no completada" en Assert-ReleaseEnv (línea 63) |
| Prefijo de variables requeridas | `MYAPP_RELEASE_*` | Convención de nombres del flujo release (documentada también en SETUP.md y en la plantilla de entorno) |

## Estructura (funciones / clases / tipos)

| Elemento | Tipo | Líneas |
| --- | --- | --- |
| Import-LocalReleaseEnv | Función (sin parámetros) | 30–38 |
| Assert-ReleaseEnv | Función (sin parámetros) | 52–79 |
| Invoke-SafeAlertCommand | Función (File-Path, Arguments, WorkingDirectory) | 93–117 |
| Flujo principal | Código secuencial de script | 119–124 |

## Análisis línea por línea

### Bloque 1 (líneas 1–16): cabecera documental y arranque del script

```ps1
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
```

**Explicación de las líneas 1–16:** cabecera estándar del proyecto (concordante con la plantilla de CLAUDE.md) y configuración estricta del intérprete.

- **Línea 1** (`<# =====...`): apertura de comentario de bloque de PowerShell.
- **Línea 3** (`* Archivo : Build-PlayInternalTesting.ps1`): nombre del archivo.
- **Línea 4** (`* Descripción : Valida SafeAlert y genera localmente el AAB Android...`): contrato funcional declarado.
- **Línea 5** (`* Autor : oafon`): autor.
- **Línea 6** (`* Fecha : 2026-03-28`): fecha de creación/versión.
- **Línea 7** (`* Versión : 1.1.0`): versión del script.
- **Línea 8** (`* Lenguaje : PowerShell 7`): intérprete objetivo.
- **Línea 9** (`* Uso : pwsh -File ...`): forma de invocación documentada.
- **Línea 10** (`* ===== #>`): cierre del comentario.
- **Línea 12** (`[CmdletBinding()]`): habilita parámetros comunes avanzados y enlazado de parámetros.
- **Línea 13** (`param()`): bloque de parámetros vacío: el script no recibe argumentos.
- **Línea 15** (`Set-StrictMode -Version Latest`): activa el modo estricto (referencias a propiedades inexistentes o variables sin definir lanzan error).
- **Línea 16** (`$ErrorActionPreference = 'Stop'`): cualquier error no capturado termina el script. Combinado con la línea 15 hace el orquestador muy exigente ante cambios de esquema (p. ej. `app.json`).

### Bloque 2 (líneas 18–38): función Import-LocalReleaseEnv

```ps1
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
```

**Explicación de las líneas 18–38:** carga opcional de la configuración release local mediante dot-source.

- **Líneas 18–29**: docstring de la función: declara conexión con `Publicar\config\release.env.ps1`, sin ingesta ni retorno.
- **Línea 30** (`function Import-LocalReleaseEnv {`): apertura de la función.
- **Línea 31** (`$publishRoot = Split-Path -Path $PSScriptRoot -Parent`): `$PSScriptRoot` apunta a `Publicar\scripts`; el padre es `Publicar`.
- **Línea 32** (`$localEnvPath = Join-Path ... 'config\release.env.ps1'`): ruta del archivo local de secretos (ignorado por Git, confirmado en `.gitignore` línea 37).
- **Línea 34** (`if (Test-Path ...)`): solo carga si el archivo existe.
- **Línea 35** (`. $localEnvPath`): dot-source: ejecuta el archivo en la sesión actual, por lo que sus asignaciones `$env:MYAPP_RELEASE_*` quedan visibles para el resto del script. [NOTA] Esto ejecuta código arbitrario del archivo local: es el mecanismo previsto para cargar secretos, pero cualquier alteración local del archivo controla el proceso.
- **Línea 36** (`Write-Host ... -ForegroundColor Cyan`): informa la ruta cargada (solo ruta, no secretos). Ausencia de archivo es silenciosa: se valida después en `Assert-ReleaseEnv`.

### Bloque 3 (líneas 40–79): función Assert-ReleaseEnv

```ps1
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
```

**Explicación de las líneas 40–79:** valida la presencia de las cuatro variables de firma y aborta con ayuda accionable si falta alguna.

- **Líneas 40–51**: docstring de la función.
- **Línea 52** (`function Assert-ReleaseEnv {`): apertura.
- **Líneas 53–58** (`$requiredVars = @(...)`): lista de las cuatro variables obligatorias (ruta de keystore, contraseña del almacén, alias y contraseña de la clave).
- **Línea 60** (`$missing = @()`): acumulador de variables ausentes.
- **Línea 61** (`foreach ($variableName in $requiredVars) {`): recorre las obligatorias.
- **Línea 62** (`$value = [Environment]::GetEnvironmentVariable($variableName)`): lee la variable. [NOTA] Con un único argumento, .NET lee la variable del bloque de entorno del **proceso** actual: las asignaciones por dot-source de `release.env.ps1` y las exportadas con `$env:` en la misma terminal sí se ven; las creadas a nivel de usuario con `setx` requieren abrir una terminal nueva.
- **Línea 63** (`if ([string]::IsNullOrWhiteSpace($value) -or $value -eq '********')`): considera ausente un valor vacío o el marcador `********`. [OBSERVACIÓN TÉCNICA] La plantilla `release.env.example.ps1` usa el marcador `COMPLETAR_PASSWORD`, que NO se detecta aquí (ver Observaciones técnicas).
- **Líneas 64–65**: agrega la variable al listado de ausentes.
- **Línea 68** (`if ($missing.Count -gt 0) {`): si hay ausencias...
- **Líneas 69–75** (`$helpMessage = @(...) -join ...`): construye mensaje multilínea con tres salidas posibles (generar keystore, completar el archivo local o exportar variables manualmente). Referencias cruzadas correctas con `New-AndroidReleaseKeystore.ps1` y la plantilla de entorno.
- **Línea 77** (`throw $helpMessage`): aborta la ejecución con el mensaje de ayuda. Con `ErrorActionPreference = 'Stop'` detiene todo el orquestador antes de firmar.

### Bloque 4 (líneas 81–117): función Invoke-SafeAlertCommand

```ps1
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
```

**Explicación de las líneas 81–117:** ejecuta un proceso externo en la raíz del proyecto (o en un directorio indicado) y convierte un código de salida distinto de cero en una excepción terminante.

- **Líneas 81–92**: docstring de la función.
- **Línea 93** (`function Invoke-SafeAlertCommand {`): apertura.
- **Líneas 94–103**: parámetros `FilePath` (obligatorio) y `Arguments` (obligatorio, array) y `WorkingDirectory` (opcional, por defecto cadena vacía).
- **Línea 105** (`$projectRoot = Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent`): asciende dos niveles desde `Publicar\scripts` hasta la raíz `safealert`.
- **Línea 106** (`$resolvedWorkingDirectory = if (...)`): si no se indica directorio, usa la raíz del proyecto.
- **Línea 107** (`Push-Location $resolvedWorkingDirectory`): cambia de directorio apilando el anterior.
- **Línea 109** (`& $FilePath @Arguments`): invoca el proceso con sus argumentos; `@Arguments` aplica splatting de array.
- **Líneas 110–111** (`if ($LASTEXITCODE -ne 0) { throw ... }`): si el proceso termina con error, lanza excepción con el comando completo.
- **Líneas 114–116** (`finally { Pop-Location }`): restaura siempre el directorio anterior, incluso ante excepción (patrón correcto de gestión de directorio).

### Bloque 5 (líneas 119–124): flujo principal

```ps1
Import-LocalReleaseEnv
Assert-ReleaseEnv
Invoke-SafeAlertCommand -FilePath 'npm' -Arguments @('run', 'typecheck')
$androidRoot = Join-Path -Path (Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent) -ChildPath 'android'
Invoke-SafeAlertCommand -FilePath '.\gradlew.bat' -Arguments @('bundleRelease') -WorkingDirectory $androidRoot
Write-Host 'Build local de Google Play Internal Testing generada correctamente.' -ForegroundColor Green
```

**Explicación de las líneas 119–124:** secuencia principal del script.

- **Línea 119** (`Import-LocalReleaseEnv`): carga la configuración local (silenciosa si no existe).
- **Línea 120** (`Assert-ReleaseEnv`): valida variables de firma; aborta con ayuda si faltan.
- **Línea 121** (`Invoke-SafeAlertCommand -FilePath 'npm' -Arguments @('run', 'typecheck')`): ejecuta la validación TypeScript en la raíz del proyecto.
- **Línea 122** (`$androidRoot = Join-Path ... 'android'`): ruta a la carpeta nativa `android` de la raíz.
- **Línea 123** (`Invoke-SafeAlertCommand ... '.\gradlew.bat' ... 'bundleRelease' -WorkingDirectory $androidRoot`): invoca Gradle Wrapper de Windows para generar el bundle de release firmado. Requiere que exista la carpeta `android` local (generada por prebuild en flujos Expo; fuera de alcance verificar su estado aquí). Las credenciales `MYAPP_RELEASE_*` ya deben estar en el entorno del proceso para que la configuración de firma de Gradle las consuma.
- **Línea 124** (`Write-Host 'Build local ... generada correctamente.' -ForegroundColor Green`): mensaje final de éxito. Solo se alcanza si las líneas 121 y 123 no lanzaron excepción.

## Fichas de funciones y métodos

### Import-LocalReleaseEnv (líneas 30–38)

- Firma: `function Import-LocalReleaseEnv {` (sin parámetros).
- Propósito técnico: dot-source opcional del archivo de entorno local.
- Propósito funcional: dejar disponibles en la sesión las variables `$env:MYAPP_RELEASE_*` para la firma.
- Parámetros: ninguno. Retorno: ninguno. Excepciones: no lanza; si el archivo existe pero contiene errores de sintaxis, el dot-source lanza error terminante.
- Dependencias: `$PSScriptRoot`, `Split-Path`, `Join-Path`, `Test-Path`, archivo `Publicar/config/release.env.ps1`.
- Flujo: resuelve `Publicar` → arma ruta `config\release.env.ps1` → si existe, lo ejecuta → mensaje informativo.
- Efectos secundarios: define variables de entorno de proceso; ejecuta código arbitrario del archivo local. Riesgos: si el archivo no existe, la ausencia se detecta recién en `Assert-ReleaseEnv`.

### Assert-ReleaseEnv (líneas 52–79)

- Firma: `function Assert-ReleaseEnv {` (sin parámetros).
- Propósito técnico: guard de precondiciones de firma.
- Propósito funcional: evitar generar un AAB sin credenciales válidas de keystore.
- Parámetros: ninguno. Retorno: ninguno. Excepciones: `throw` con mensaje de ayuda multilínea si falta alguna variable.
- Dependencias: `[Environment]::GetEnvironmentVariable`, lista `MYAPP_RELEASE_*`.
- Flujo: define 4 variables requeridas → lee cada una → considera ausente si es vacía o `********` → si hay ausencias, lanza excepción con soluciones.
- Efectos secundarios: ninguno (solo lectura). Riesgos: no detecta el marcador `COMPLETAR_PASSWORD` de la plantilla de ejemplo (ver Observaciones técnicas).

### Invoke-SafeAlertCommand (líneas 93–117)

- Firma: `function Invoke-SafeAlertCommand { param([string]$FilePath, [string[]]$Arguments, [string]$WorkingDirectory = '') }`.
- Propósito técnico: envoltorio de ejecución de procesos con cambio de directorio seguro.
- Propósito funcional: ejecutar `npm run typecheck` y `gradlew.bat bundleRelease` desde el directorio correcto.
- Parámetros: FilePath (obligatorio), Arguments (obligatorio), WorkingDirectory (opcional, por defecto raíz del proyecto).
- Retorno: ninguno. Excepciones: si el comando no existe (p. ej. `npm` no instalado) el operador `&` lanza error terminante; si el proceso devuelve código distinto de cero, lanza excepción propia.
- Dependencias: `Push-Location`/`Pop-Location`, `$LASTEXITCODE`.
- Flujo interno: resuelve raíz del proyecto → decide directorio → Push-Location → try: invoca y comprueba `$LASTEXITCODE` → finally: Pop-Location.
- Efectos secundarios: cambia temporalmente el directorio actual del proceso. Riesgos: bajo (el patrón try/finally restaura el directorio incluso ante error).

## Clases / interfaces / tipos

Ninguna. El archivo define solo funciones y código secuencial de script (PowerShell no declara clases aquí).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Línea 63: la validación considera inválido el marcador `'********'`, pero la plantilla versionada `Publicar/config/release.env.example.ps1` usa `'COMPLETAR_PASSWORD'` como marcador. Un usuario que copie la plantilla sin editar las contraseñas pasaría `Assert-ReleaseEnv` y recién fallaría en la firma de Gradle con un mensaje menos claro. Archivos: `Build-PlayInternalTesting.ps1` (63), `release.env.example.ps1` (13 y 15). Impacto potencial: baja, pero la validación no cumple su propósito por completo. [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] Línea 62: `[Environment]::GetEnvironmentVariable($name)` sin segundo argumento lee el entorno del proceso actual. Las variables definidas a nivel de usuario (p. ej. con `setx`) no se verán si la terminal no se reinició tras crearlas. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] Líneas 35 y 36: el dot-source ejecuta íntegramente `release.env.ps1`; la carga queda condicionada a que ese archivo local no esté corrupto. El mensaje de éxito (línea 124) solo confirma que Gradle terminó con código 0, no que el AAB esté firmado con la clave prevista. [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] El script es específico de Windows (`gradlew.bat`); no tiene equivalente para macOS/Linux en el módulo `Publicar`. [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] La fecha declarada (2026-03-28) y versión (1.1.0) están en el encabezado; el contenido no presenta marcadores TODO/FIXME.

## Seguridad

- [INFORMATIVO] El script nunca imprime valores de secretos: solo valida presencia y muestra rutas o nombres de variable.
- [BAJO] `release.env.ps1` (que contendrá las contraseñas del keystore en texto plano) se carga y permanece en disco. Está excluido del repositorio por `.gitignore` (línea 37), pero su protección depende de los permisos del sistema de archivos local. No se leyó su contenido en esta auditoría (solo se confirmó su existencia). [NIVEL DE CERTEZA: Confirmado por código (.gitignore) y por Test-Path]
- [BAJO] El dot-source de un archivo local ejecuta código arbitrario: si el archivo de configuración es manipulado, el atacante controla el proceso de firma. Riesgo propio de herramientas locales, mitigado por el control físico de la máquina.
- [BAJO] Línea 63: un marcador de plantilla no detectado (`COMPLETAR_PASSWORD`) puede dejar pasar credenciales no reales hasta la fase de firma; sin impacto de divulgación.
- [INFORMATIVO] Autenticación/autorización: no aplica (script local). Validación de entrada: rutas derivadas de `$PSScriptRoot` (no de entrada de usuario), sin vectores de inyección de comandos relevantes; los argumentos a `&` se pasan como array tipado.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Alinear los marcadores de plantilla: hacer que `Assert-ReleaseEnv` también rechace `COMPLETAR_PASSWORD` (o valores idénticos a los de la plantilla de ejemplo) para fallar temprano con mensaje claro.
- [RECOMENDACIÓN] Verificar la existencia previa de `android/app/build.gradle` (y de la carpeta `android`) y documentar si el flujo requiere `expo prebuild` antes de `gradlew.bat`.
- [RECOMENDACIÓN] Considerar comprobar tras `bundleRelease` que el archivo `app-release.aab` existe y reportar su ruta, en lugar de un único mensaje genérico de éxito.
- [RECOMENDACIÓN] Documentar la dependencia de JDK/Android SDK local (el script no verifica `JAVA_HOME` ni `ANDROID_HOME`).
- [RIESGO] Al ser un script solo-Windows, el equipo que trabaje en macOS/Linux no puede reproducir la pista interna con las mismas herramientas; la alternativa declarada en el repositorio es el flujo manual vía Play Console (ver `Publicar/README.md`).
