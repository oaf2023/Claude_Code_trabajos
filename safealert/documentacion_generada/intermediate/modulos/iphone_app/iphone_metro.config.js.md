# Archivo: iphone/metro.config.js

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/metro.config.js | 39 | JavaScript | 1484 | Configuración de Metro bundler | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Configuración de Metro para el cliente Apple. Su función crítica es permitir que la
variante `iphone/` compile código que vive FUERA de su carpeta: añade la raíz del
proyecto (`..`) como carpeta vigilada (`watchFolders`), permite resolver módulos en el
`node_modules` raíz, y registra extensiones de assets de modelos de voz
(`onnx`, `ppn`, `tflite`). Además fuerza el header `Accept: application/javascript`
en peticiones de bundles (workaround habitual en dev para Expo/Metro).

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: configuración activa y necesaria para el arranque de la
variante. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| path (node) | estándar | Resolución de rutas | Sí |
| expo/metro-config (getDefaultConfig) | externa | Configuración base Metro de Expo | Sí |

## Componentes que dependen de este archivo

- Metro (via `expo start` / `expo run:ios` desde iphone).
- Indirectamente, todos los reexports de `iphone/app/` que apuntan a `../app/...` y el
  código de `../src/...`: sin `watchFolders` y `nodeModulesPaths`, Metro no podría
  empaquetarlos.
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| projectRoot | `__dirname` (iphone/) | string | Raíz del proyecto Metro | Línea 14 |
| workspaceRoot | `path.resolve(projectRoot, '..')` | string | Raíz del monorepo | Línea 15 |
| config | getDefaultConfig(projectRoot) | object | Config base | Línea 17 |
| config.watchFolders | [workspaceRoot] | array | Vigilar la raíz del monorepo | Línea 19 |
| config.resolver.nodeModulesPaths | [iphone/node_modules, raiz/node_modules] | array | Rutas de resolución de módulos | Líneas 20-23 |
| config.resolver.disableHierarchicalLookup | true | boolean | Evitar lookup jerárquico por defecto | Línea 24 |
| config.resolver.assetExts | +onnx, +ppn, +tflite | array | Assets de modelos de voz | Línea 25 |
| config.server.enhanceMiddleware | función wrapper | function | Workaround de bundle | Líneas 27-37 |

## Estructura (funciones / clases / tipos)

- `module.exports = config` (objeto de configuración Metro).
- Función interna anónima `enhanceMiddleware(middleware, server)` (líneas 29-37).

## Análisis línea por línea

```js
/* ============================================================================
* Archivo         : metro.config.js
* Descripcion     : Configuracion Metro del cliente Apple con acceso al codigo compartido del proyecto padre.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : JavaScript
* Uso             : Consumido por Metro al iniciar safealert/iphone.
* ============================================================================ */

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.assetExts.push('onnx', 'ppn', 'tflite');
```

**Explicación de las líneas 1-25:**

- **Líneas 1-9**: cabecera documental (autor oafon, 2026-04-21, v1.0.0).
- **Línea 11**: módulo `path` de Node.
- **Línea 12**: obtiene la configuración base de Metro de Expo.
- **Línea 14**: `projectRoot = __dirname` → carpeta `iphone/`.
- **Línea 15**: `workspaceRoot` = carpeta raíz del monorepo (`safealert/`).
- **Línea 17**: configuración base de Expo.
- **Línea 19**: Metro vigila la raíz del proyecto padre, permitiendo resolver y
  observar `../app`, `../src` y sus cambios en caliente.
- **Líneas 20-23**: resolución de paquetes primero en el `node_modules` propio de
  iphone y después en el de la raíz. Como iphone no tiene `node_modules` propio
  (verificado), todo se resuelve del raíz.
- **Línea 24**: desactiva la búsqueda jerárquica por defecto (evita resolver en
  carpetas intermedias no deseadas).
- **Línea 25**: registra extensiones de modelos de voz (`onnx`, `ppn`, `tflite`) como
  assets válidos, en línea con `react-native-wakeword` / Porcupine usados por el
  código compartido.

```js
config.server = config.server || {};
const originalEnhance = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = originalEnhance ? originalEnhance(middleware, server) : middleware;
  return (req, res, next) => {
    if (req.url && req.url.includes('.bundle')) {
      req.headers.accept = 'application/javascript';
    }
    return enhanced(req, res, next);
  };
};

module.exports = config;
```

**Explicación de las líneas 27-39:**

- **Línea 27**: garantiza que exista el objeto `server`.
- **Línea 28**: conserva el middleware original de Metro si existiera.
- **Líneas 29-37**: envuelve el middleware de servidor; en peticiones cuyo `url`
  contiene `.bundle` fuerza `Accept: application/javascript`, un workaround conocido
  para evitar respuestas de tipo incorrecto/streaming en dev.
- **Línea 39**: exporta la configuración.
- [OBSERVACIÓN TÉCNICA] El workaround `Accept` es típico cuando el cliente iOS
  solicita bundles y Metro responde con tipos que el runtime rechaza; no afecta a
  producción (los bundles de producción no pasan por este middleware de dev).

## Fichas de funciones y métodos

### enhanceMiddleware (líneas 29-37)

- Firma: `(middleware, server) => (req, res, next) => void`.
- Propósito técnico: decorar el middleware HTTP de Metro en desarrollo.
- Propósito funcional: forzar `Accept: application/javascript` para bundles.
- Parámetros: `middleware` (middleware original), `server` (servidor Metro). Retorno:
  middleware mejorado. Excepciones: ninguna; delega en `enhanced`.
- Dependencias: `originalEnhance` y configuración base de Expo.
- Efectos secundarios: muta `req.headers.accept` en peticiones `.bundle`.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NIVEL DE CERTEZA: Confirmado por código] Este archivo demuestra que iphone NO es una
  app aislada: su bundler está configurado expresamente para consumir el código y los
  `node_modules` de la raíz del proyecto.
- [OBSERVACIÓN TÉCNICA] `disableHierarchicalLookup = true` junto con la lista explícita
  de `nodeModulesPaths` puede impedir resolver paquetes que solo existan en carpetas
  intermedias; hoy funciona porque todas las dependencias están en la raíz.
- [NOTA] Extensión de assets de voz (`onnx/ppn/tflite`) reutiliza los modelos del stack
  de wakeword compartido.

## Seguridad

- [INFORMATIVO] El middleware fuerza `Accept` sobre bundles; no expone datos ni
  credenciales. Sin hallazgos de seguridad relevantes.
  [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] BAJO: si el `node_modules` raíz cambiara de estructura (p. ej. migración a
  pnpm/yarn workspaces con hoisting distinto), la resolución de la variante se rompería.
- [RECOMENDACIÓN] Considerar declarar formalmente el monorepo (workspaces) o mantener
  la documentación de este acoplamiento en el README.
