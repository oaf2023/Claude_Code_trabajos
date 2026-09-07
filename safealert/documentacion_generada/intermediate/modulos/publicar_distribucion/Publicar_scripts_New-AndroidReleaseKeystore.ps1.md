# Archivo: Publicar/scripts/New-AndroidReleaseKeystore.ps1

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| Publicar/scripts/New-AndroidReleaseKeystore.ps1 | 49 | PowerShell 7 | 1669 | Script wrapper (re-exposición de utilidad de keystore) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Script "puente" dentro de `Publicar`: **re-expone** la utilidad de creación guiada del keystore release de Android, que vive en la raíz del repositorio (`scripts/New-AndroidReleaseKeystore.ps1`). Su única responsabilidad es validar la existencia del script delegado y reenviarle todos los parámetros. Existe para que el operador pueda permanecer dentro del flujo de la carpeta `Publicar` sin conocer la ruta de `scripts/`.

No contiene lógica de generación de keystore: toda la lógica (keytool, RSA 2048, validaciones) está en el delegado `scripts/New-AndroidReleaseKeystore.ps1` (164 líneas, verificado). [NIVEL DE CERTEZA: Confirmado por código]

## Clasificación y estado

- Estado: `FUNCIONALIDAD EXISTENTE`. El delegado existe en `scripts/New-AndroidReleaseKeystore.ps1` (leído parcialmente para verificar el contrato de parámetros: líneas 13–31 con firma idéntica).
- Referencia documental: el propio `Assert-ReleaseEnv` de `Build-PlayInternalTesting.ps1` (línea 72) lo cita como solución 1 cuando faltan variables release; `SETUP.md` (línea 140) documenta la variante de la raíz (`.\scripts\New-AndroidReleaseKeystore.ps1`). [NIVEL DE CERTEZA: Confirmado por código (grep)]

## Dependencias e importaciones

| Dependencia | Tipo | Dónde se usa | ¿Realmente usada? | Para qué se usa |
| --- | --- | --- | --- | --- |
| Cmdlets `Split-Path`, `Join-Path`, `Test-Path` | Estándar (PowerShell) | Flujo principal | Sí | Resolución de la ruta del delegado |
| `scripts/New-AndroidReleaseKeystore.ps1` (raíz) | Interna (script delegado del proyecto) | Flujo principal (líneas 37–49) | Sí | Generación real del keystore y guía de variables |
| Herramienta `keytool` (JDK) | Externa (indirecta, usada por el delegado) | A través del delegado | Sí (indirecta) | Creación del par de claves y el almacén |
| Cmdlet `Write-Host` (en delegado) | Estándar (indirecta) | A través del delegado | Sí (indirecta) | Mensajes y plantilla de variables de entorno |

## Componentes que dependen de este archivo

| Componente | Tipo de dependencia |
| --- | --- |
| `Build-PlayInternalTesting.ps1` (mensaje de ayuda, línea 72) | Lo menciona como opción para resolver variables faltantes |
| `Publicar/play-console/01_Checklist.md` (línea 8) | Implícito (requiere keystore disponible vía `MYAPP_RELEASE_*`) |
| `scripts/New-AndroidReleaseKeystore.ps1` (raíz) | Delegado que ejecuta (relación de dependencia funcional) |
| `Publicar/config/release.env.ps1` (salida esperada del flujo) | El operador completa las variables que este flujo sugiere |

[NOTA] No se hallaron invocaciones automatizadas de este wrapper fuera de la documentación (README/tutorial/SETUP no lo citan directamente por nombre en comandos; el comando citado en SETUP usa el script de la raíz). [NIVEL DE CERTEZA: Confirmado por código (grep)].

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `$KeystorePath` | Obligatorio (entrada) | Parámetro string | Ruta de salida del keystore | Líneas 14–15 |
| `$KeyAlias` | Obligatorio (entrada) | Parámetro string | Alias de la clave de firma | Líneas 17–18 |
| `$ValidityDays` | 10000 (por defecto) | Parámetro int | Días de validez (~27,4 años) | Líneas 20–21 |
| `$DName` | `CN=SafeAlert, OU=Mobile, O=SafeAlert, L=Buenos Aires, S=Buenos Aires, C=AR` (por defecto) | Parámetro string | Distinguished Name del certificado | Líneas 23–24 |
| `$StorePassword` | Opcional (entrada) | Parámetro string | Contraseña del almacén | Líneas 26–27 |
| `$KeyPassword` | Opcional (entrada) | Parámetro string | Contraseña de la clave | Líneas 29–30 |
| `$projectRoot` | Raíz del repositorio | Local | Base para localizar el delegado | Línea 36 |
| `$delegateScript` | `scripts\New-AndroidReleaseKeystore.ps1` | Local | Ruta del script delegado | Línea 37 |

## Estructura (funciones / clases / tipos)

| Elemento | Tipo | Líneas |
| --- | --- | --- |
| Declaración de parámetros | Bloque `param` | 13–31 |
| Flujo principal (re-despacho al delegado) | Código secuencial de script | 36–49 |

El archivo no declara funciones propias: es un wrapper de invocación directa.

## Análisis línea por línea

### Bloque 1 (líneas 1–10): cabecera documental

```ps1
<# ============================================================================

* Archivo         : New-AndroidReleaseKeystore.ps1
* Descripción     : Reexpone desde Publicar la creación guiada del keystore release de Android para SafeAlert.
* Autor           : oafon
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Uso             : pwsh -File .\Publicar\scripts\New-AndroidReleaseKeystore.ps1 -KeystorePath C:\secure\safealert-release.keystore -KeyAlias safealert-release -StorePassword TU_PASSWORD -KeyPassword TU_PASSWORD
* ============================================================================ #>
```

**Explicación de las líneas 1–10:** cabecera documental.

- **Línea 4**: propósito: re-exponer desde `Publicar` la creación guiada del keystore.
- **Línea 9** (`* Uso : ... -StorePassword TU_PASSWORD ...`): el ejemplo de uso documenta el patrón de invocación con contraseñas como argumentos de línea de comandos (con literales de ejemplo `TU_PASSWORD`, que no son secretos reales pero normalizan una práctica insegura; ver Seguridad).

### Bloque 2 (líneas 12–34): parámetros y modo estricto

```ps1
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

**Explicación de las líneas 12–34:** firma de parámetros idéntica a la del delegado (verificada en `scripts/New-AndroidReleaseKeystore.ps1`, líneas 13–31).

- **Línea 12** (`[CmdletBinding()]`): parámetros comunes avanzados.
- **Líneas 14–15**: `$KeystorePath` obligatorio (ruta donde se creará el archivo del keystore).
- **Líneas 17–18**: `$KeyAlias` obligatorio.
- **Líneas 20–21**: `$ValidityDays = 10000` (opcional). 10000 días ≈ 27,4 años: validez típica recomendada para claves de firma de Android (no debe expirar antes que la app).
- **Líneas 23–24**: `$DName` por defecto con datos de SafeAlert (CN, OU, O, L, S, C=AR). Coincide con el default del delegado.
- **Líneas 26–27** y **29–30**: `$StorePassword` y `$KeyPassword` opcionales: si no se pasan, el delegado no agrega `-storepass`/`-keypass` a keytool y este solicitará las contraseñas de forma interactiva.
- **Línea 33** (`Set-StrictMode -Version Latest`): modo estricto.
- **Línea 34** (`$ErrorActionPreference = 'Stop'`): errores terminantes.

### Bloque 3 (líneas 36–49): flujo principal

```ps1
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
```

**Explicación de las líneas 36–49:** localiza y ejecuta el delegado con todos los parámetros.

- **Línea 36** (`$projectRoot = Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent`): asciende dos niveles: `Publicar\scripts` → `Publicar` → raíz `safealert`.
- **Línea 37** (`$delegateScript = Join-Path ... 'scripts\New-AndroidReleaseKeystore.ps1'`): ruta del script base en la raíz.
- **Líneas 39–41** (`if (-not (Test-Path ...)) { throw ... }`): si el delegado no existe (p. ej. clonado parcial), aborta con mensaje claro.
- **Líneas 43–49** (`& $delegateScript ...`): invoca el delegado reenviando los seis parámetros. Las comillas invertidas al final de cada línea son el carácter de continuación de línea de PowerShell (equivalente a una sola invocación multilínea). No se comprueba `$LASTEXITCODE` porque el delegado es un script PowerShell cuyos errores son terminantes por su propio `ErrorActionPreference = 'Stop'` y sus `throw` explícitos.

Comportamiento heredado del delegado (verificado en `scripts/New-AndroidReleaseKeystore.ps1`):
- Resuelve `keytool` del sistema (o lanza error pidiendo instalar JDK).
- Crea el directorio destino si falta; **no sobrescribe** un keystore existente (throw).
- Ejecuta `keytool -genkeypair -v -keyalg RSA -keysize 2048 -validity <días> -dname <DN>`, agregando `-storepass`/`-keypass` solo si se suministraron contraseñas.
- Verifica la creación del archivo y lanza error si no se generó.
- Imprime la plantilla de variables `MYAPP_RELEASE_*` sugeridas para el entorno.

## Fichas de funciones y métodos

No hay funciones propias. La lógica de interés está delegada en `scripts/New-AndroidReleaseKeystore.ps1` (fuera del alcance de este módulo; su contrato se describe en el bloque 3).

## Clases / interfaces / tipos

Ninguna.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El wrapper duplica los valores por defecto de `ValidityDays` y `DName` que ya tiene el delegado. Hoy son idénticos (verificado), pero si uno de los dos archivos cambia su default sin actualizar el otro, el comportamiento del wrapper (que siempre pasa valores explícitos) prevalece y el cambio quedaría oculto. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] Las contraseñas viajan como parámetros de texto plano de la línea de comandos del wrapper al delegado y, si no son vacías, el delegado las agrega a la línea de comandos de keytool (`-storepass`/`-keypass`) y además las imprime en consola (`scripts/New-AndroidReleaseKeystore.ps1`, líneas 156–157: las muestra reales cuando no están vacías). Impacto: exposición en listado de procesos, historial de PowerShell, transcripciones y capturas de consola. [NIVEL DE CERTEZA: Confirmado por código (delegado leído)]
- [NOTA] Si no se pasan contraseñas, keytool entra en modo interactivo (el delegado no las agrega a los argumentos); en automatización sin terminal interactiva el proceso puede quedar esperando entrada. [NIVEL DE CERTEZA: Altamente probable]
- [INFORMATIVO] La cabecera del wrapper documenta valores de ejemplo `TU_PASSWORD` en la línea de Uso; no son secretos reales, pero ejemplifican el patrón de pasar secretos por parámetro.
- [INFORMATIVO] No hay referencias automatizadas al wrapper (solo documentación); el flujo normal citado es el del script de la raíz vía `SETUP.md`.

## Seguridad

- [ALTO] Contraseñas del keystore como argumentos de línea de comandos (`-StorePassword`/`-KeyPassword`): quedan visibles en la línea de comandos del proceso (accesible vía administrador de tareas/auditoría del SO), en el historial de PowerShell y en cualquier transcripción. Una fuga de la contraseña del keystore compromete la identidad de firma de la app en Google Play (permite publicar actualizaciones maliciosas firmadas con la misma identidad).
- [MEDIO] El delegado imprime las contraseñas en consola cuando se suministran no vacías (líneas 156–157 de `scripts/New-AndroidReleaseKeystore.ps1`): riesgo de captura por logs, capturas de pantalla o terminal compartida. [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] El keystore generado queda protegido por las contraseñas elegidas (y por los permisos del directorio destino); el flujo recomienda `C:\secure\...` (fuera de la raíz del repo, buena práctica).
- [BAJO] El `.gitignore` excluye `*.keystore`, `*.jks`, `*.key`, `*.p8`, `*.p12` (líneas 15–19): si el operador creara el keystore dentro del repo, Git no lo subiría; de todos modos la guía sugiere rutas fuera del repo.
- [RECOMENDACIÓN] Usar `SecureString`/`Get-Credential` o variables de entorno para las contraseñas en lugar de argumentos de línea de comandos; nunca invocar este flujo en CI con logs visibles.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] ALTO si se usa en CI o con transcripción: exposición de la clave de firma. Local y con consola privada, el riesgo baja a MEDIO pero persiste en el historial de PowerShell.
- [RECOMENDACIÓN] Modificar el delegado para no imprimir las contraseñas reales (mostrar siempre un marcador) y aceptar contraseñas por variable de entorno o `SecureString`.
- [RECOMENDACIÓN] Documentar la opción interactiva (sin contraseñas en el comando) como vía preferida en máquinas locales.
- [RECOMENDACIÓN] Mantener copia de seguridad offline del keystore y sus contraseñas: la pérdida del keystore impide publicar actualizaciones de la app existente en Play (Google no permite regenerar la misma identidad de firma).
