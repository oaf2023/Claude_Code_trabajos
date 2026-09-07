# Archivo: metro.config.js

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| metro.config.js | 115 | JavaScript (CommonJS) | 4749 | Configuración de Metro Bundler | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Configuración personalizada de Metro para SafeAlert (Expo SDK 55 + RN 0.83). Añade cuatro capas de comportamiento: (1) carga manual del `.env` en `process.env` (para builds de Gradle), (2) extensiones de assets para modelos de wakeword (`.onnx`, `.ppn`, `.tflite`), (3) parche del texto fuente que elimina/reemplaza `import.meta` para que el bundle no rompa en web, (4) resolución web de módulos nativos sin soporte hacia shims vacíos (`react-native-wakeword`, `react-native-permissions`, `react-native-device-info`, `react-native-screens`, `TurboModuleRegistry`), y (5) desactivación del bundle multipart para compatibilidad con el `BundleDownloader` de RN 0.83.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Metro lo carga automáticamente desde la raíz del proyecto en `expo start`/`expo export`. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `expo/metro-config` (`getDefaultConfig`) | externa | Líneas 14, 48 | Sí, base de la config |
| `path` | estándar Node | Líneas 18, 45, 79, 84 | Sí |
| `fs` | estándar Node | Líneas 19-23 | Sí, lectura del `.env` |
| Shims locales `src/shims/web-empty.js`, `web-rn-screens.js`, `web-turbo-modules.js` | interna | Líneas 45, 79, 84, 87, 90 | Sí, target web (archivos existentes verificados) |

## Componentes que dependen de este archivo

- Metro Bundler al arrancar (`expo start`, `expo export --platform web`, builds de Gradle).
- `src/shims/web-empty.js`, `src/shims/web-rn-screens.js`, `src/shims/web-turbo-modules.js` (archivos que redirige el resolver web).
- El build web PWA (scripts `web:build`), que necesita el parche de `import.meta` y los shims.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `envPath` | `.env` (raíz) | string | Ruta del archivo de entorno | Líneas 20-21 |
| `NATIVE_WEB_EMPTY` | `['react-native-wakeword','react-native-permissions','react-native-device-info']` | array | Módulos nativos a shimmear en web | Líneas 40-44 |
| `WEB_RN_SCREENS_PATH` | `src/shims/web-rn-screens.js` (absoluto) | string | Shím de react-native-screens para web | Líneas 45, 87 |
| `WEB_TURBO_SHIM_PATH` | `src/shims/web-turbo-modules.js` (absoluto) | string | Shím de TurboModuleRegistry para web | Líneas 79, 90 |
| `config` | Objeto de config Metro | object | Config base extendida | Línea 48 |
| `originalProcessModule`, `originalResolveRequest`, `originalEnhance` | funciones previas | function | Delegación a la config original | Líneas 56, 80, 103 |

Valores mágicos: extensiones `onnx`, `ppn`, `tflite` (modelos de wakeword y audio); puerto no presente aquí; `"production"` como MODE de `import.meta` parcheado.

## Estructura (funciones / clases / tipos)

- Código de nivel superior: carga `.env`, define constantes y muta `config`.
- Función anónima de `processModuleFilter` (líneas 57-76): parchea el texto fuente.
- Función anónima de `resolveRequest` (líneas 81-97): redirección de módulos en web.
- Función anónima de `enhanceMiddleware` (líneas 104-113): fuerza bundle simple.

## Análisis línea por línea

```js
/* ============================================================================
 * Archivo         : metro.config.js
 * Descripción     : Configuración de Metro Bundler para SafeAlert.
 *                   Obligatorio en Expo SDK 55 + React Native 0.83 para
 *                   resolución correcta de assets, source maps y módulos nativos.
 *                   En modo web, redirige módulos nativos sin soporte a shims.
 * Autor           : oafon
 * Fecha           : 2026-08-26
 * Versión         : 2.0.0
 * Lenguaje        : JavaScript
 * Uso             : Consumido automáticamente por Metro al ejecutar `expo start`.
 * ============================================================================ */

const { getDefaultConfig } = require('expo/metro-config');
```

**Explicación de las líneas 1–14:**

- **Líneas 1-12**: cabecera estándar del proyecto (v2.0.0). Documenta que es "obligatorio en Expo SDK 55 + RN 0.83" y que en web redirige módulos nativos a shims.
- **Línea 14**: importa `getDefaultConfig` de `expo/metro-config` para partir de la configuración oficial.

```js
// Cargar variables de entorno del .env de Expo en process.env
// Necesario para builds de Gradle (assembleDebug) donde Metro no carga el .env automáticamente
const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}
```

**Explicación de las líneas 16–36:**

- **Líneas 16-17**: comentario: carga manual del `.env` porque en builds de Gradle (`assembleDebug`) Metro no inyecta el `.env` automáticamente.
- **Líneas 18-19**: importa `path` y `fs` de Node.
- **Línea 20**: construye la ruta al `.env` en la raíz del proyecto.
- **Línea 21**: si el archivo existe:
- **Línea 22**: lo lee como UTF-8.
- **Línea 23**: recorre el contenido línea a línea.
- **Línea 24**: elimina espacios en blanco de cada línea.
- **Línea 25**: ignora líneas vacías y comentarios (empiezan por `#`).
- **Línea 26**: localiza el primer `=`.
- **Línea 27**: solo procesa líneas con `=` en posición > 0.
- **Líneas 28-29**: separa clave y valor, recortando espacios.
- **Líneas 30-32**: si la variable aún no existe en `process.env`, la define. [OBSERVACIÓN TÉCNICA] Este parser casero no soporta comillas, escapes ni `export`; valores con `#` dentro se truncarían. Se sobrescribe en `process.env` solo si no está ya definida (prioridad al entorno real).

```js
// Módulos nativos que no tienen implementación web.
// Cuando el target es web, Metro los resuelve a un shim vacío en vez de crashear.
const NATIVE_WEB_EMPTY = [
  'react-native-wakeword',
  'react-native-permissions',
  'react-native-device-info',
];
const WEB_RN_SCREENS_PATH = path.resolve(__dirname, 'src', 'shims', 'web-rn-screens.js');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Soporte para archivos de modelos de wakeword (.onnx) y recursos de audio
config.resolver.assetExts.push('onnx', 'ppn', 'tflite');
```

**Explicación de las líneas 38–51:**

- **Líneas 38-39**: comentario: módulos nativos sin implementación web que se resuelven a un shim vacío para no crashear.
- **Líneas 40-44**: `NATIVE_WEB_EMPTY` lista `react-native-wakeword`, `react-native-permissions` y `react-native-device-info`.
- **Línea 45**: ruta absoluta al shim de `react-native-screens` para web.
- **Línea 47**: anotación JSDoc del tipo esperado.
- **Línea 48**: obtiene la config base de Metro.
- **Línea 51**: añade `onnx`, `ppn` y `tflite` a las extensiones tratadas como assets estáticos (modelos de wakeword; se empaquetan como recursos y se referencian por URI en runtime).

```js
// En web, reemplazar import.meta por un objeto seguro para que zustand/redux
// no crashee en bundles que no son ES modules.
if (!config.serializer) config.serializer = {};
const originalProcessModule = config.serializer.processModuleFilter;
config.serializer.processModuleFilter = (module, ...rest) => {
  if (module?.source?.text && module.source.text.includes('import.meta')) {
    module.source.text = module.source.text.replace(
      /import\.meta\.env\?\.MODE/g,
      '"production"'
    );
    module.source.text = module.source.text.replace(
      /import\.meta\.env\.MODE/g,
      '"production"'
    );
    module.source.text = module.source.text.replace(
      /import\.meta/g,
      '({env:{MODE:"production"}})'
    );
  }
  if (originalProcessModule) {
    return originalProcessModule(module, ...rest);
  }
  return true;
};
```

**Explicación de las líneas 53–76:**

- **Líneas 53-54**: comentario: reemplaza `import.meta` por un objeto seguro para que zustand/redux no crashee en bundles que no son ES modules.
- **Línea 55**: garantiza que exista `config.serializer`.
- **Línea 56**: guarda el filtro original de módulos.
- **Línea 57**: envuelve `processModuleFilter`, que Metro invoca por cada módulo del bundle.
- **Línea 58**: si el módulo tiene texto fuente que contiene `import.meta`:
- **Líneas 59-62**: reemplaza `import.meta.env?.MODE` por `"production"`.
- **Líneas 63-66**: reemplaza `import.meta.env.MODE` por `"production"`.
- **Líneas 67-70**: reemplaza cualquier `import.meta` restante por el objeto literal `({env:{MODE:"production"}})`.
- **Líneas 72-75**: delega en el filtro original si existía.
- **Línea 76**: si no había original, mantiene el módulo (`return true`).

[ADVERTENCIA] Mutar `module.source.text` en `processModuleFilter` es un parche frágil: modifica el fuente en memoria durante el empaquetado, puede romper source maps y afecta a TODO el bundle (no solo a zustand). [NIVEL DE CERTEZA: Altamente probable] es la causa por la que existe `scripts/patch-import-meta.js` en el build web (parche en fichero ya exportado).

```js
// Resolver para web: redirigir módulos nativos a shim vacío
const WEB_TURBO_SHIM_PATH = path.resolve(__dirname, 'src', 'shims', 'web-turbo-modules.js');
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (NATIVE_WEB_EMPTY.includes(moduleName)) {
      return { type: 'sourceFile', filePath: path.resolve(__dirname, 'src', 'shims', 'web-empty.js') };
    }
    if (moduleName === 'react-native-screens') {
      return { type: 'sourceFile', filePath: WEB_RN_SCREENS_PATH };
    }
    if (moduleName.includes('TurboModuleRegistry')) {
      return { type: 'sourceFile', filePath: WEB_TURBO_SHIM_PATH, unstable_enablePackageExports: false };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName);
};
```

**Explicación de las líneas 78–97:**

- **Línea 78**: comentario del resolver web.
- **Línea 79**: ruta del shim de `TurboModuleRegistry`.
- **Línea 80**: guarda el resolver original.
- **Línea 81**: envuelve `resolveRequest`, llamado por Metro al resolver cada import.
- **Línea 82**: solo actúa cuando `platform === 'web'`.
- **Líneas 83-85**: si el módulo está en `NATIVE_WEB_EMPTY`, lo resuelve al shim vacío `web-empty.js` (evita el crash por módulo nativo inexistente en web).
- **Líneas 86-88**: si es `react-native-screens`, lo resuelve al shim web `web-rn-screens.js` (implementación mínima para web).
- **Líneas 89-91**: si el nombre del módulo contiene `TurboModuleRegistry` (acceso a módulos nativos turbo), lo resuelve a `web-turbo-modules.js` desactivando `package exports`.
- **Líneas 93-96**: en el resto de casos delega en el resolver original (o en el de contexto).

```js
// Deshabilitar bundle multipart para compatibilidad con RN 0.83 BundleDownloader.
// Sin esto, Metro envía el bundle en formato multipart/mixed que el nuevo APK
// no puede parsear correctamente (ProtocolException: Expected [0-9a-fA-F]).
config.server = config.server || {};
const originalEnhance = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = originalEnhance ? originalEnhance(middleware, server) : middleware;
  return (req, res, next) => {
    // Forzar que Metro responda con bundle simple (no multipart)
    if (req.url && req.url.includes('.bundle')) {
      req.headers['accept'] = 'application/javascript';
    }
    return enhanced(req, res, next);
  };
};

module.exports = config;
```

**Explicación de las líneas 99–115:**

- **Líneas 99-101**: comentario: sin este cambio, Metro responde el bundle en `multipart/mixed` y el `BundleDownloader` de RN 0.83 lanza `ProtocolException: Expected [0-9a-fA-F]`.
- **Línea 102**: garantiza `config.server`.
- **Línea 103**: guarda el middleware de realce original.
- **Línea 104**: envuelve `enhanceMiddleware`.
- **Línea 105**: compone el middleware original si existe.
- **Líneas 106-112**: devuelve middleware que, para URLs que contienen `.bundle`, fuerza el header `Accept: application/javascript` para que Metro envíe el bundle simple y no multipart.
- **Línea 115**: exporta la config final.

## Fichas de funciones y métodos

### processModuleFilter envuelto (líneas 57–76)

- Firma: `(module, ...rest) => boolean`.
- Propósito técnico: parchear en memoria el fuente de módulos que usan `import.meta`.
- Parámetros: `module` (módulo de Metro con `source.text`), `...rest` (argumentos del filtro original).
- Retorno: decisión del filtro original o `true`.
- Riesgos: mutación del fuente, posible rotura de source maps, comportamiento global del bundle. [OBSERVACIÓN TÉCNICA]

### resolveRequest envuelto (líneas 81–97)

- Firma: `(context, moduleName, platform) => resolución`.
- Propósito: redirigir módulos nativos sin soporte web a shims.
- Parámetros: contexto de resolución, nombre del módulo, plataforma.
- Retorno: objeto `{ type: 'sourceFile', filePath, ... }` o delegación al resolver original.
- Riesgos: si un shim no cubre todas las APIs usadas, en web aparecerán errores en runtime difíciles de rastrear.

### enhanceMiddleware envuelto (líneas 104–113)

- Firma: `(middleware, server) => (req, res, next)`.
- Propósito: forzar respuesta de bundle no multipart para RN 0.83.
- Parámetros: middleware original y servidor Metro.
- Retorno: middleware que ajusta `Accept` en peticiones `.bundle`.
- Riesgos: bajo; solo altera cabeceras HTTP en desarrollo.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El parser de `.env` (líneas 20-36) es una implementación manual que no maneja comillas, escapes ni comentarios inline; puede leer mal valores con `#` o espacios. Se recomienda `@expo/env` (ya incluido en Expo) u otro parser estándar.
- [OBSERVACIÓN TÉCNICA] El parche de `import.meta` (líneas 57-76) y el `scripts/patch-import-meta.js` del build web parecen solapar intencionalidades; conviene revisar cuál es el realmente efectivo en producción web.
- [OBSERVACIÓN TÉCNICA] Los shims `web-empty.js`, `web-rn-screens.js` y `web-turbo-modules.js` existen en `src/shims/` (verificado). No analizados aquí (fuera del módulo).
- [NOTA] La carga manual del `.env` en `process.env` durante la config de Metro implica que variables como `EXPO_PUBLIC_*` llegan al proceso de build de Gradle; sin embargo, los valores quedan embebidos en el bundle si se referencian como `process.env.EXPO_PUBLIC_*`.

## Seguridad

- [MEDIO] El `.env` se lee y sus valores se inyectan en `process.env` durante el build; los prefijos `EXPO_PUBLIC_*` se incrustan en el bundle JS (público). Cualquier clave de API con prefijo `EXPO_PUBLIC_` es extraíble del APK/bundle web (ver `google-services.json.md` y `.env.example.md`). Es la mecánica estándar de Expo, pero hay que evitar poner secretos de servidor con ese prefijo.
- [INFORMATIVO] El archivo `.env` no debe subirse al repositorio (ver `.gitignore`); el parser solo actúa si el archivo existe en el disco de build.
- [BAJO] El reemplazo global de `import.meta` podría ocultar errores reales de entorno en web (fija MODE a `"production"`).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Sustituir el parser casero de `.env` por la utilidad oficial de Expo (`@expo/env`) para robustez.
- [RECOMENDACIÓN] Documentar y, si es posible, unificar el doble parche de `import.meta` (Metro + script post-export) para evitar divergencias.
- [RECOMENDACIÓN] Verificar que los shims web cubren todas las APIs invocadas en la PWA (especialmente `react-native-wakeword` y permisos) para no dejar funciones "en silencio" en web.
- [RECOMENDACIÓN] Revisar el estado de `enhanceMiddleware` al actualizar Expo SDK: los nombres internos de Metro cambian entre versiones.
