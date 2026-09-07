# Archivo: Publicar/config/release.env.example.ps1

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| Publicar/config/release.env.example.ps1 | 15 | PowerShell 7 (plantilla dot-source) | 758 | Plantilla de configuración de entorno (secretos de firma release) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Plantilla versionada en Git que define las **cuatro variables de entorno** (`MYAPP_RELEASE_*`) necesarias para firmar builds release de Android dentro del flujo de `Publicar`. No contiene secretos reales: es la base que `Initialize-PlayReleaseConfig.ps1` copia a `Publicar/config/release.env.ps1` (archivo local ignorado por Git) para que el operador complete los valores reales.

[NIVEL DE CERTEZA: Confirmado por código]

## Clasificación y estado

- Estado: `FUNCIONALIDAD EXISTENTE` como plantilla.
- El archivo real `Publicar/config/release.env.ps1` existe actualmente en disco en este workspace (confirmado por Test-Path; **no se leyó su contenido** para no exponer secretos). Está excluido de Git por `.gitignore` línea 37 (`Publicar/config/release.env.ps1`), confirmado por lectura del `.gitignore`. [NIVEL DE CERTEZA: Confirmado por Test-Path y por código (.gitignore)]
- Consumidores: `Build-PlayInternalTesting.ps1` (lo carga por dot-source, líneas 32 y 35) y `Assert-ReleaseEnv` (líneas 54–57) que valida las variables. [NIVEL DE CERTEZA: Confirmado por código (grep)]

## Dependencias e importaciones

| Dependencia | Tipo | Dónde se usa | ¿Realmente usada? | Para qué se usa |
| --- | --- | --- | --- | --- |
| Ninguna instrucción de importación | — | — | — | Archivo de datos (asignaciones `$env:*`) pensado para ser dot-sourceado |
| Consumido por dot-source | Interna | `Build-PlayInternalTesting.ps1` (línea 35) | Sí | Cargar variables en la sesión del proceso de build |
| Consumido por copia | Interna | `Initialize-PlayReleaseConfig.ps1` (líneas 33 y 45) | Sí | Origen para crear `release.env.ps1` |
| Consumido por validación | Interna | `Assert-ReleaseEnv` (`Build-PlayInternalTesting.ps1`, líneas 54–57) | Sí | Verifica presencia/ausencia de las variables |

## Componentes que dependen de este archivo

| Componente | Tipo de dependencia |
| --- | --- |
| `Publicar/scripts/Initialize-PlayReleaseConfig.ps1` | Lo copia a `release.env.ps1` |
| `Publicar/scripts/Build-PlayInternalTesting.ps1` | Depende de las variables que define (mensaje de ayuda línea 73) |
| `Publicar/README.md` (líneas 29–32) | Lo documenta como plantilla versionada |
| `Publicar/play-console/01_Checklist.md` (línea 8) y `02_Tutorial_Paso_A_Paso.md` (líneas 13–16) | Documentan las variables que deben completarse |
| `SETUP.md` (líneas 101–104) | Documenta la misma convención de variables en otro flujo |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `$env:MYAPP_RELEASE_STORE_FILE` | [SECRETO OCULTO] (en plantilla: ruta de ejemplo `C:\secure\safealert-release.keystore`) | Variable de entorno (proceso) | Ruta del keystore release usado para firmar | Línea 12; Assert-ReleaseEnv |
| `$env:MYAPP_RELEASE_STORE_PASSWORD` | [SECRETO OCULTO] (en plantilla: marcador `COMPLETAR_PASSWORD`) | Variable de entorno (proceso) | Contraseña del almacén de claves (keystore) | Línea 13; Assert-ReleaseEnv |
| `$env:MYAPP_RELEASE_KEY_ALIAS` | [SECRETO OCULTO] (en plantilla: alias de ejemplo `safealert-release`) | Variable de entorno (proceso) | Alias de la clave de firma dentro del keystore | Línea 14; Assert-ReleaseEnv |
| `$env:MYAPP_RELEASE_KEY_PASSWORD` | [SECRETO OCULTO] (en plantilla: marcador `COMPLETAR_PASSWORD`) | Variable de entorno (proceso) | Contraseña de la clave de firma | Línea 15; Assert-ReleaseEnv |

## Estructura (funciones / clases / tipos)

Ninguna. El archivo es una secuencia de cuatro asignaciones a variables de entorno de proceso.

## Análisis línea por línea

### Bloque 1 (líneas 1–10): cabecera documental

```ps1
<# ============================================================================

* Archivo         : release.env.example.ps1
* Descripción     : Plantilla local para definir variables de firma release usadas por la carpeta Publicar.
* Autor           : oafon
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : PowerShell 7
* Uso             : Copiar a release.env.ps1 y completar los valores reales.
* ============================================================================ #>
```

**Explicación de las líneas 1–10:** cabecera documental.

- **Línea 4**: propósito: plantilla de variables de firma release.
- **Línea 9** (`* Uso : Copiar a release.env.ps1 y completar los valores reales.`): instrucción de uso correcta: nunca editar la plantilla, sino copiarla al archivo local.

### Bloque 2 (líneas 12–15): asignaciones de variables de entorno

```ps1
$env:MYAPP_RELEASE_STORE_FILE = 'C:\secure\safealert-release.keystore'
$env:MYAPP_RELEASE_STORE_PASSWORD = 'COMPLETAR_PASSWORD'
$env:MYAPP_RELEASE_KEY_ALIAS = 'safealert-release'
$env:MYAPP_RELEASE_KEY_PASSWORD = 'COMPLETAR_PASSWORD'
```

**Explicación de las líneas 12–15:** define las variables de firma en el alcance de proceso de PowerShell.

- **Línea 12** (`$env:MYAPP_RELEASE_STORE_FILE = 'C:\secure\safealert-release.keystore'`): ruta de ejemplo del keystore fuera de la raíz del repositorio (`C:\secure\...`), buena práctica de ubicación segura. No es un secreto, pero en el archivo real apuntará al keystore real.
- **Línea 13** (`$env:MYAPP_RELEASE_STORE_PASSWORD = 'COMPLETAR_PASSWORD'`): marcador de plantilla para la contraseña del almacén; debe sustituirse por la contraseña real ([SECRETO OCULTO]) en `release.env.ps1`.
- **Línea 14** (`$env:MYAPP_RELEASE_KEY_ALIAS = 'safealert-release'`): alias de ejemplo coherente con el `-KeyAlias` sugerido por `New-AndroidReleaseKeystore.ps1` (default del flujo de keystore).
- **Línea 15** (`$env:MYAPP_RELEASE_KEY_PASSWORD = 'COMPLETAR_PASSWORD'`): marcador para la contraseña de la clave ([SECRETO OCULTO]).

[NOTA] El prefijo `$env:` asigna la variable al bloque de entorno del **proceso** PowerShell actual; cuando `Build-PlayInternalTesting.ps1` hace dot-source de este archivo, las variables quedan disponibles para el propio script y para los procesos hijos (npm, gradlew) que heredan el entorno. [NIVEL DE CERTEZA: Confirmado por documentación .NET / Altamente probable]

## Fichas de funciones y métodos

Ninguna (archivo de datos, no de lógica).

## Clases / interfaces / tipos

Ninguna.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Inconsistencia de marcadores: la plantilla usa `COMPLETAR_PASSWORD`, pero `Assert-ReleaseEnv` (`Build-PlayInternalTesting.ps1`, línea 63) solo rechaza valores vacíos o el marcador `********`. Un `release.env.ps1` copiado sin editar superaría la validación y fallaría recién en la firma de Gradle. [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] Las rutas del ejemplo usan separador `\` de Windows (`C:\secure\...`); coherente con un flujo PowerShell de Windows. Si algún día se consumen en CI Linux, habrá que normalizar separadores.
- [INFORMATIVO] El archivo real `release.env.ps1` existe en este workspace (Test-Path positivo). No se analizó su contenido por contener presumiblemente secretos ([SECRETO OCULTO]); únicamente se confirma su existencia y su exclusión de Git.
- [NIVEL DE CERTEZA: Confirmado por código] La convención `MYAPP_RELEASE_*` es transversal: aparece en `SETUP.md`, en la guía de keystore y en los documentos de Play Console, lo que la convierte en el contrato nominal de firma del proyecto.

## Seguridad

- [INFORMATIVO] La plantilla versionada no contiene secretos reales (solo marcadores y rutas de ejemplo): es seguro mantenerla en el repositorio.
- [BAJO] El marcador `COMPLETAR_PASSWORD` no es rechazado por la validación de entorno (ver Observaciones técnicas): si un operador publica un build con el marcador sin sustituir, la firma fallará (comportamiento esperado) pero el error será posterior y menos claro.
- [INFORMATIVO] El archivo real con secretos (`release.env.ps1`) está correctamente excluido de Git (`.gitignore` línea 37). Su protección en disco depende de permisos del sistema; se recomienda restringir ACL al usuario.
- [INFORMATIVO] Sin red, sin logs, sin entrada de usuario: no hay superficie de ataque adicional.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Unificar el marcador de plantilla con el marcador que valida `Assert-ReleaseEnv` (por ejemplo, usar `********` en ambos o ampliar la validación para rechazar `COMPLETAR_PASSWORD`).
- [RECOMENDACIÓN] Restringir los permisos del archivo `release.env.ps1` generado (ACL de solo lectura para el usuario) y evitar copias de seguridad sin protección.
- [RIESGO] Bajo: si alguien ejecuta la plantilla directamente (dot-source) con los marcadores intactos, el flujo de firma fallará al final; el riesgo no es de divulgación sino de error operativo.
