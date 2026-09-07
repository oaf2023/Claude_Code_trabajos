# Archivo: src/shims/web-turbo-modules.js

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/shims/web-turbo-modules.js |
| Líneas totales | 77 |
| Lenguaje | JavaScript (CommonJS) |
| Tamaño (bytes) | 2718 |
| Categoría | Shim web para TurboModuleRegistry de React Native |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Resuelve el problema de compatibilidad web de los **TurboModules** de React Native
0.83: en móvil, `TurboModuleRegistry` (de `react-native/Libraries/TurboModule/...`)
localiza módulos nativos registrados; en web no existe ese registro y las importaciones
que referencian el path del registro (o paquetes que lo requieren indirectamente) rompen
el bundle. El shim exporta un `TurboModuleRegistry` con `get`, `getEnforcing` y `register`,
donde cada módulo pedido es un Proxy/stub que ofrece los métodos habituales de un
TurboModule (`getConstants` con `Dimensions` reales del navegador, `addListener`,
`removeListeners`, `getName`, `getViewManagerConfig`, `getConstantsForViewManager`) y
devuelve stubs para cualquier otra propiedad o llamada. `metro.config.js` lo entrega
cuando el bundle destino es web y el módulo pedido contiene `TurboModuleRegistry`.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Referencias reales de configuración:

- `metro.config.js` (línea 79): `const WEB_TURBO_SHIM_PATH = path.resolve(__dirname, 'src', 'shims', 'web-turbo-modules.js')`.
- `metro.config.js` (líneas 89-91): si `platform === 'web'` y `moduleName.includes('TurboModuleRegistry')`, resuelve al shim (con `unstable_enablePackageExports: false`).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna (no importa nada) | — | — | — |

Usa objetos globales del navegador (`window`, `screen`, `devicePixelRatio`) con guardas de
existencia, y `Proxy`.

## Componentes que dependen de este archivo

El shim no se importa en código de aplicación: Metro lo resuelve en tiempo de build
(plataforma web) para cualquier módulo cuyo nombre contenga `TurboModuleRegistry`.
Consumidores típicos: dependencias de React Native que piden TurboModules
(`Appearance`, `DeviceInfo`, etc.) y el propio runtime de RN cuando corre sobre web.
Referencia de configuración: `metro.config.js` (líneas 79, 89-91).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `window.innerWidth` | lectura condicional | number | Ancho de ventana web (fallback 375) | Líneas 19-20 |
| `window.innerHeight` | lectura condicional | number | Alto de ventana web (fallback 667) | Líneas 19-20 |
| `window.devicePixelRatio` | lectura condicional | number | Escala de píxeles (fallback 1) | Líneas 21, 27 |
| `screen.width` / `screen.height` | lectura condicional | number | Dimensiones de pantalla (fallback 375/667) | Líneas 25-26 |
| `reactNativeVersion` | `{ major: 0, minor: 83, patch: 0 }` | object | Versión RN declarada en constantes | Línea 33 |

## Estructura (funciones / clases / tipos)

- Función interna: `createStub(name)`.
- Objeto exportado: `TurboModuleRegistry` con `get`, `getEnforcing`, `register`.
- Exportaciones adicionales: `module.exports.default`, `module.exports.__esModule`.

## Análisis línea por línea

```js
/* ============================================================================
 * Archivo         : src/shims/web-turbo-modules.js
 * Descripción     : Shim completo para TurboModuleRegistry en web.
 *                   Devuelve stubs con métodos comunes para todos los módulos,
 *                   incluyendo getConstants con Dimensions, addListener, etc.
 * Autor           : oafon
 * Fecha           : 2026-08-26
 * Versión         : 6.0.0
 * Lenguaje        : JavaScript
 * Uso             : Resuelto por metro.config.js en plataforma web.
 * ============================================================================ */
```

**Explicación de las líneas 1–11:**

- **Línea 1**: apertura del comentario de cabecera estándar del proyecto.
- **Líneas 2–10**: metadatos (autor `oafon`, fecha `2026-08-26`, versión `6.0.0`) y
  descripción: "Shim completo para TurboModuleRegistry en web" con `getConstants`
  incluyendo `Dimensions`, `addListener`, etc. La versión 6.0.0 sugiere iteraciones
  previas del shim conforme cambiaban las exigencias de RN 0.83.
- **Línea 11**: cierre de la cabecera.

```js
function createStub(name) {
  var stub = {
    getConstants: function() {
      return {
        Dimensions: {
          window: {
            width: typeof window !== 'undefined' ? window.innerWidth : 375,
            height: typeof window !== 'undefined' ? window.innerHeight : 667,
            scale: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
            fontScale: 1,
          },
          screen: {
            width: typeof screen !== 'undefined' ? screen.width : 375,
            height: typeof screen !== 'undefined' ? screen.height : 667,
            scale: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
            fontScale: 1,
          },
        },
        isTesting: false,
        isPlaying: false,
        reactNativeVersion: { major: 0, minor: 83, patch: 0 },
        ViewManagerNames: [],
        NativeModulesConstants: {},
      };
    },
    addListener: function() { return { remove: function() {} }; },
    removeListeners: function() {},
    getName: function() { return name; },
    getViewManagerConfig: function(viewName) {
      return {
        Commands: {},
        Constants: {},
        NativeProps: {},
        directEventTypes: {},
        uiViewClassName: viewName,
      };
    },
    getConstantsForViewManager: function(viewName) {
      return {};
    },
  };

  return new Proxy(stub, {
    get: function(target, prop) {
      if (prop === 'then') return undefined;
      if (prop === '__esModule') return false;
      if (prop === 'default') return undefined;
      if (prop in target) return target[prop];
      if (typeof prop === 'symbol') return undefined;
      return function() { return {}; };
    },
    apply: function() { return {}; },
    construct: function() { return {}; },
  });
}
```

**Explicación de las líneas 13–67:**

- **Línea 13**: apertura de `createStub(name)`, fábrica de stubs por nombre de módulo.
- **Líneas 14–53**: objeto base `stub` con los métodos más consultados:
  - **Líneas 15–37**: `getConstants()` devuelve `Dimensions` reales del navegador: bloque
    `window` (con guardas `typeof window !== 'undefined'`, fallbacks 375x667, escala con
    `devicePixelRatio || 1` y `fontScale: 1`) y bloque `screen` (con guarda de `screen`,
    fallbacks 375x667). Además `isTesting: false`, `isPlaying: false`,
    `reactNativeVersion: { major: 0, minor: 83, patch: 0 }` (alineada con RN 0.83),
    `ViewManagerNames: []` y `NativeModulesConstants: {}`.
  - **Línea 38**: `addListener()` devuelve `{ remove() {} }` (suscripción sin efecto).
  - **Línea 39**: `removeListeners()` no-op.
  - **Línea 40**: `getName()` devuelve el nombre del módulo.
  - **Líneas 41–49**: `getViewManagerConfig(viewName)` devuelve una configuración vacía
    pero con la forma esperada (`Commands`, `Constants`, `NativeProps`,
    `directEventTypes`, `uiViewClassName`).
  - **Líneas 50–52**: `getConstantsForViewManager(viewName)` devuelve `{}`.
- **Líneas 55–66**: envuelve `stub` en un `Proxy`:
  - Líneas 57–59: `then`, `__esModule` y `default` se gestionan para no romper interop de
    módulos ni promesas.
  - Línea 60: si la propiedad existe en el stub, devuelve el valor real.
  - Línea 61: símbolos devuelven `undefined`.
  - Línea 62: cualquier otra propiedad devuelve una función que retorna `{}`.
  - Líneas 63–65: invocar o instanciar el proxy devuelve `{}`.
- **Línea 67**: cierre de `createStub`.

```js
var TurboModuleRegistry = {
  get: function(name) { return createStub(name); },
  getEnforcing: function(name) { return createStub(name); },
  register: function(config) {},
};

module.exports = TurboModuleRegistry;
module.exports.default = TurboModuleRegistry;
module.exports.__esModule = true;
```

**Explicación de las líneas 69–77:**

- **Línea 69**: apertura de `TurboModuleRegistry`.
- **Línea 70**: `get(name)`: devuelve el stub del módulo.
- **Línea 71**: `getEnforcing(name)`: variante que en RN lanza si el módulo no existe;
  aquí devuelve el mismo stub (nunca lanza).
- **Línea 72**: `register(config)`: no-op (los módulos no necesitan registro en web).
- **Línea 75**: exporta el registro como módulo CommonJS.
- **Línea 76**: `module.exports.default = TurboModuleRegistry` (compatibilidad ES default).
- **Línea 77**: `module.exports.__esModule = true` (marca de módulo ES para el interop).

## Fichas de funciones y métodos

### `createStub(name)` (líneas 13–67)

- Firma original: `function createStub(name)`.
- Propósito: construir el stub de un TurboModule concreto.
- Parámetros: `name: string` (nombre del módulo; se expone vía `getName`).
- Retorno: objeto `Proxy` sobre `stub`.
- Excepciones: ninguna; nunca lanza.
- Flujo interno: prepara el objeto con métodos comunes, lo envuelve en `Proxy` con
  respuestas universales.
- Efectos secundarios: ninguno (solo lectura de `window`/`screen` al llamar
  `getConstants`).

### Métodos del objeto `TurboModuleRegistry` (líneas 70–72)

- `get(name)` → `createStub(name)`.
- `getEnforcing(name)` → `createStub(name)` (semántica relajada: nunca lanza).
- `register(config)` → no-op.

## Clases / interfaces / tipos

Ninguna clase ni tipo: JavaScript con objetos y `Proxy`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: `getEnforcing` en React Native real lanza una excepción si el
  módulo no está registrado; aquí nunca lanza (línea 71). Esto evita crashes en web, pero
  puede ocultar la ausencia real de un módulo si el código web dependiera de él de verdad.
- [OBSERVACIÓN TÉCNICA]: la versión `6.0.0` del shim y su resolución con
  `unstable_enablePackageExports: false` (línea 90 de `metro.config.js`) indican que el
  paquete importado puede estar en `node_modules` con exports modernos; el flag desactiva
  la resolución por `exports` para ese path.
- [OBSERVACIÓN TÉCNICA]: `Dimensions` se calcula en el momento de `getConstants()`, no de
  forma reactiva: si la ventana cambia de tamaño después, los consumidores que cachean las
  constantes no verán el cambio (mismo comportamiento aproximado que en RN nativo, que usa
  listeners).
- [NIVEL DE CERTEZA: Confirmado por código] para el mecanismo de resolución en
  `metro.config.js`.

## Seguridad

- INFORMATIVO: el shim no expone datos reales del dispositivo más allá de las dimensiones
  de la ventana del navegador; no hay secretos ni superficies de ataque nuevas.
- No se detectan hallazgos de seguridad relevantes.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: mantener `reactNativeVersion` (línea 33) alineada con la versión real
  de React Native instalada (0.83 según el proyecto) para que los consumidores que
  versionan por constantes se comporten correctamente.
- [RECOMENDACIÓN]: auditar tras cada actualización de RN qué TurboModules nuevos piden las
  dependencias en web y añadir los métodos que requieran al stub base.
- [RECOMENDACIÓN]: si la PWA necesita reaccionar a cambios de orientación/tamaño, revisar
  que la capa de `Dimensions` de la app use los listeners de react-native en lugar de
  cachear `getConstants()`.
