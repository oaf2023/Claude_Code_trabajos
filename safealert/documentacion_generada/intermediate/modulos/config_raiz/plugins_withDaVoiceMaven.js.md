# Archivo: plugins/withDaVoiceMaven.js

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| plugins/withDaVoiceMaven.js | 20 | JavaScript (CommonJS) | 856 | Config plugin de Expo (Gradle/Maven) | APARENTEMENTE NO UTILIZADO | Altamente probable |

## Objetivo

Config plugin de Expo que modifica el `build.gradle` del proyecto Android (vía `withProjectBuildGradle` de `@expo/config-plugins`) para añadir el repositorio Maven de DaVoice (`https://maven.davoice.io`) a la lista de repositorios, tanto si ya existe `jitpack` (lo añade después) como si no (lo inyecta en `allprojects.repositories`). DaVoice es la empresa detrás del SDK de wake word (`react-native-wakeword`), que distribuye artefactos nativos Android desde ese repositorio Maven.

## Clasificación y estado

APARENTEMENTE NO UTILIZADO con [POTENCIALMENTE NO UTILIZADO]. El plugin NO está listado en `app.json` (`plugins`, líneas 114-148), donde solo figura `./plugins/withManifestConflictFix`. Una búsqueda grep en todo el proyecto no encontró ninguna otra referencia a `withDaVoiceMaven` (solo inventarios internos y el propio archivo). Por tanto, en el flujo actual de prebuild no se ejecuta.

[POTENCIALMENTE NO UTILIZADO] [NIVEL DE CERTEZA: Altamente probable] — No se puede descartar su uso en un flujo manual previo (builds históricos, aplicado a mano al `android/build.gradle` generado) o en scripts fuera del árbol analizado.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `@expo/config-plugins` (`withProjectBuildGradle`) | externa (dependencia transitiva de expo) | Líneas 1, 4 | Solo si el plugin se ejecuta (no ocurre desde `app.json`) |

Nota: `@expo/config-plugins` no aparece en `package.json` como dependencia directa; se resuelve como dependencia transitiva de `expo`/`@expo/config-plugins` del SDK. [NIVEL DE CERTEZA: Inferido]

## Componentes que dependen de este archivo

- Ninguno detectado en el código actual (no referenciado en `app.json` ni en scripts).
- Potencialmente, el `android/build.gradle` (proyecto nativo generado) si se ejecutara durante prebuild.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `config` (parámetro) | objeto de config de Expo | object | Config que se transforma | Líneas 3-4, 18 |
| URL Maven DaVoice | `https://maven.davoice.io` | string | Repositorio Maven del SDK DaVoice | Líneas 9, 15 |
| URL JitPack | `https://jitpack.io` | string | Repositorio Maven ya presente o a detectar | Líneas 5-9, 13-15 |

## Estructura (funciones / clases / tipos)

- `withDaVoiceMaven(config)` (líneas 3-19): función que exporta el config plugin.

## Análisis línea por línea

```js
const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withDaVoiceMaven(config) {
  return withProjectBuildGradle(config, config => {
    if (config.modResults.contents.includes('https://jitpack.io')) {
       // Si ya tiene jitpack, añadimos el de davoice después
       config.modResults.contents = config.modResults.contents.replace(
         /maven { url 'https:\/\/jitpack\.io' }/g,
         "maven { url 'https://jitpack.io' }\n        maven { url 'https://maven.davoice.io' }"
       );
    } else {
       // Si no, lo inyectamos en allprojects
       config.modResults.contents = config.modResults.contents.replace(
         /allprojects {[\s\S]*?repositories {/g,
         "allprojects {\n    repositories {\n        maven { url 'https://maven.davoice.io' }"
       );
    }
    return config;
  });
};
```

**Explicación de las líneas 1–20:**

- **Línea 1**: importa `withProjectBuildGradle`, el modificador de Expo que expone el contenido del `android/build.gradle` (raíz del proyecto Android) como `config.modResults.contents`.
- **Línea 3**: exporta la función del plugin que recibe la `config` de Expo.
- **Línea 4**: invoca `withProjectBuildGradle(config, callback)`; el callback recibe la config con `modResults.contents` (string del build.gradle) y debe devolver la config modificada.
- **Línea 5**: comprueba si el build.gradle ya contiene `https://jitpack.io` (normalmente lo añaden librerías que publican en JitPack).
- **Líneas 6-7**: comentario y reemplazo: si existe jitpack, añade después de cada `maven { url 'https://jitpack.io' }` la línea del repositorio de DaVoice.
- **Línea 8**: regex global que localiza `maven { url 'https://jitpack.io' }` (con la barra escapada).
- **Línea 9**: sustituye por el bloque original más la línea nueva de `maven.davoice.io` con indentación de 8 espacios (formato Gradle).
- **Líneas 11-16**: rama alternativa (no hay jitpack):
  - **Línea 11**: comentario "lo inyectamos en allprojects".
  - **Línea 13**: regex `allprojects {[\s\S]*?repositories {` que localiza el bloque `allprojects` y su primera apertura de `repositories` (no greedy).
  - **Línea 15**: lo sustituye por el mismo inicio seguido del `maven { url 'https://maven.davoice.io' }` ya insertado dentro de `repositories`.
- **Línea 18**: devuelve la config modificada.
- **Línea 19**: cierre del callback; **Línea 20**: cierre de la función exportada.

## Fichas de funciones y métodos

### withDaVoiceMaven (líneas 3–19)

- Firma original: `module.exports = function withDaVoiceMaven(config)`.
- Propósito técnico: config plugin que inyecta el repositorio Maven de DaVoice en `android/build.gradle`.
- Propósito funcional: permitir que Gradle descargue los artefactos nativos del SDK de wake word (DaVoice) durante el build Android.
- Parámetros: `config` (config de Expo). Retorno: `config` modificada (cadena de modificadores de `@expo/config-plugins`).
- Excepciones: si el `build.gradle` no contuviera `allprojects { ... repositories {` y tampoco `jitpack`, el `replace` no encontraría coincidencia y NO añadiría el repositorio (fallo silencioso).
- Dependencias: `withProjectBuildGradle` de `@expo/config-plugins`.
- Desde dónde se llama: actualmente desde ningún sitio (no está en `app.json`).
- Efectos secundarios: modifica el proyecto nativo generado en prebuild; si el SDK DaVoice requiere además otras configuraciones (permissions, so libs), este plugin no las aporta.
- Riesgos: [RIESGO] Al no ejecutarse, si `react-native-wakeword` necesita `maven.davoice.io` para descargar sus artefactos, el build Android podría fallar o el SDK podría venir con dependencias de JitPack. El análisis de por qué el proyecto builda sin él queda fuera del alcance (posiblemente el SDK ya publica en JitPack o los artefactos están cacheados).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [POTENCIALMENTE NO UTILIZADO] No referenciado en `app.json` ni en ninguna otra parte del árbol. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] El reemplazo regex con `[\s\S]*?` y la detección por subcadena son frágiles ante cambios de formato del `build.gradle` (p. ej. comillas dobles, sangría distinta o bloques `pluginManagement` de Gradle moderno, que usan `dependencyResolutionManagement` en lugar de `allprojects`).
- [OBSERVACIÓN TÉCNICA] En proyectos Expo SDK 55/RN 0.83 el `build.gradle` raíz suele delegar en `buildscript`/`pluginManagement`; si el repositorio de DaVoice es realmente necesario, probablemente haya que inyectarlo también en `settings.gradle` (`dependencyResolutionManagement.repositories`), cosa que este plugin no hace. [NIVEL DE CERTEZA: Inferido]
- [NOTA] El proyecto contiene la carpeta `android/` generada (no analizada aquí); el estado real de los repositorios Maven en el build actual debería verificarse en `android/` (fuera del alcance de este módulo).

## Seguridad

- [INFORMATIVO] Inyectar un repositorio Maven externo (`maven.davoice.io`) añade una fuente de dependencias de terceros al build: riesgo de supply chain si el repositorio o el SDK se vieran comprometidos. El plugin no fija versiones ni verifica sumas.
- [INFORMATIVO] No hay secretos en el archivo.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Si el wake word deja de funcionar o el build Android falla al limpiar cachés de Gradle, revisar si falta este repositorio (o su equivalente en `settings.gradle`).
- [RECOMENDACIÓN] Decidir explícitamente: o bien registrar el plugin en `app.json` (`./plugins/withDaVoiceMaven`) si el SDK lo necesita, o bien eliminar el archivo si el SDK ya resuelve sus artefactos por JitPack/npm, documentando la decisión.
- [RECOMENDACIÓN] Si se mantiene, modernizar la inyección para Gradle `dependencyResolutionManagement` (settings.gradle) y añadir verificación de que el reemplazo se aplicó (p. ej. lanzar si no hay coincidencia).
