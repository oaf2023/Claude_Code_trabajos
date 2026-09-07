# Archivo: babel.config.js

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| babel.config.js | 19 | JavaScript (CommonJS) | 695 | Configuración de Babel para Expo/Metro | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Configuración de Babel del proyecto. Usa el preset oficial `babel-preset-expo` (que aporta el soporte JSX, TypeScript, módulos y el resto de transformaciones que Metro espera) y añade el plugin de `react-native-reanimated` (obligatorio para que Reanimated 4 funcione correctamente al compilar). Es consumida automáticamente por Metro/Expo al transformar el código.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. `babel-preset-expo ~55.0.8` está instalado (package.json) y Metro la carga por convención desde la raíz. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `babel-preset-expo` | externa | Línea 14 (`presets`) | Sí |
| `react-native-reanimated/plugin` | externa | Línea 16 (`plugins`) | Sí |

No hay require estático de módulos en el archivo: `babel-preset-expo` y `react-native-reanimated/plugin` se referencian por nombre de paquete y Babel los resuelve.

## Componentes que dependen de este archivo

- Metro Bundler (`expo start`, `expo export`), que lo lee automáticamente al transformar JS/TS.
- `react-native-reanimated` (4.2.1 instalada): su plugin debe estar al final de la lista de plugins.
- Jest NO usa este archivo: `jest.config.js` usa el preset `ts-jest` y transforma con `ts-jest`, no con Babel.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `api` | objeto de API de Babel | function param | Proporciona `api.cache` | Línea 11 |
| `presets` | `['babel-preset-expo']` | array | Transformaciones base | Línea 14 |
| `plugins` | `['react-native-reanimated/plugin']` | array | Transformación de worklets de Reanimated | Línea 16 |

## Estructura (funciones / clases / tipos)

- `module.exports = function (api)` (líneas 11-18): función de configuración de Babel que devuelve el objeto de config.

## Análisis línea por línea

```js
/* ============================================================================
* Archivo         : babel.config.js
* Descripción     : Configuración de Babel para SafeAlert con soporte explícito de Expo Router y Reanimated.
* Autor           : oafon
* Fecha           : 2026-03-20
* Versión         : 1.0.1
* Lenguaje        : JavaScript
* Uso             : Consumido por Expo/Metro durante la compilación de la app.
* ============================================================================ */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};
```

**Explicación de las líneas 1–19:**

- **Líneas 1-9**: cabecera estándar del proyecto (autor `oafon`, v1.0.1).
- **Línea 11**: exporta una función de configuración de Babel (forma que permite opciones dinámicas y cacheo).
- **Línea 12**: `api.cache(true)` — Babel cachea la configuración para siempre (no cambia en runtime); acelera builds.
- **Línea 13**: apertura del objeto de configuración devuelto.
- **Línea 14**: `presets: ['babel-preset-expo']` — preset oficial de Expo SDK 55: habilita JSX, TypeScript, `import.meta` donde aplique, transformaciones de React Native y convenciones de expo-router.
- **Líneas 15-17**: `plugins: ['react-native-reanimated/plugin']` — plugin de Reanimated, requerido para transformar worklets y mantener el orden correcto de ejecución; debe listarse al final de `plugins`.
- **Línea 18**: cierre y retorno del objeto.

## Fichas de funciones y métodos

### module.exports (líneas 11–18)

- Firma original: `module.exports = function (api) {...}`.
- Propósito técnico: generar la configuración de Babel consumida por Metro.
- Parámetros: `api` (API de Babel; se usa `api.cache`).
- Retorno: objeto `{ presets, plugins }`.
- Excepciones: no lanza. Dependencias: paquetes resueltos por nombre.
- Flujo: cachea config → devuelve preset de Expo y plugin de Reanimated.
- Efectos secundarios: ninguno en runtime.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NOTA] La configuración es la mínima recomendada para Expo SDK 55 + Reanimated; no hay plugins adicionales (p. ej. `babel-plugin-module-resolver`), por lo que el alias `@/` de `tsconfig.json` no se resuelve vía Babel: lo maneja Metro (`@/*` lo entiende Metro nativamente por convención de Expo) o se importa por rutas relativas. [NIVEL DE CERTEZA: Inferido]
- [NOTA] La cabecera menciona "soporte explícito de Expo Router"; en la práctica el soporte de router lo aporta el preset (`babel-preset-expo` incluye las transformaciones de expo-router).

## Seguridad

- [INFORMATIVO] Sin hallazgos: archivo de compilación sin datos ni permisos. No se detecta inyección de código en tiempo de build desde fuentes externas.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Mantener el plugin de Reanimated como ÚLTIMO elemento de `plugins` si en el futuro se añaden más plugins (requisito de Reanimated).
- [RECOMENDACIÓN] Verificar tras actualizaciones de Expo que `babel-preset-expo` y `react-native-reanimated/plugin` sigan siendo compatibles con la versión del SDK.
