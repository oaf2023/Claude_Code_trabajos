# Archivo: iphone/babel.config.js

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/babel.config.js | 17 | JavaScript | 652 | Configuración de Babel | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Configuración Babel del cliente Apple. Reutiliza el preset `babel-preset-expo`
(requerido por Expo SDK 55) y añade el plugin de `react-native-reanimated`, necesario
para que el código compartido con animaciones (si lo hay en las pantallas reexportadas)
funcione. Al ser un archivo mínimo e idéntico en enfoque al `babel.config.js` raíz,
sirve a Metro cuando se arranca desde la carpeta `iphone/`.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: configuración estándar y coherente con el resto del stack.
[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| babel-preset-expo | externa (dev) | Preset Babel principal | Sí |
| react-native-reanimated/plugin | externa | Plugin de Reanimated | Sí (declarado; necesario si el código compartido usa Reanimated). Ver nota. |

Nota: `react-native-reanimated` NO está declarado en `iphone/package.json`, pero sí en
el `package.json` raíz (`4.2.1`) y existe en el `node_modules` raíz, que Metro añade
como ruta de resolución. [OBSERVACIÓN TÉCNICA]

## Componentes que dependen de este archivo

- Babel/Metro al iniciar `expo start` / `expo run:ios` desde `iphone/`.
- Ningún archivo de código lo importa.
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

No hay variables; la única constante es la cabecera de documentación del archivo
(Autor oafon, Fecha 2026-04-21, Versión 1.0.0).

## Estructura (funciones / clases / tipos)

- `module.exports = function (api)` — función de configuración Babel que recibe la API
  de Babel.

## Análisis línea por línea

```js
/* ============================================================================
* Archivo         : babel.config.js
* Descripcion     : Configuracion Babel del cliente Apple reutilizando el stack Expo Router.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : JavaScript
* Uso             : Consumido por Expo/Metro al iniciar safealert/iphone.
* ============================================================================ */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

**Explicación de las líneas 1-17:**

- **Líneas 1-9**: cabecera documental estándar del proyecto (autor oafon, fecha
  2026-04-21, versión 1.0.0). Indica que es consumido por Expo/Metro al iniciar
  `safealert/iphone`.
- **Línea 11**: exporta la función de configuración Babel.
- **Línea 12** (`api.cache(true)`): cachea la configuración para siempre; Babel solo
  la recarga si cambia el archivo.
- **Línea 14**: preset `babel-preset-expo` (transforma JSX/TS/flow y config de Expo).
- **Línea 15**: plugin `react-native-reanimated/plugin`; en Reanimated 4 el plugin se
  aplica para worklets. [OBSERVACIÓN TÉCNICA] Si el código compartido ejecutado en la
  variante no usa Reanimated en runtime, el plugin es inofensivo; si el plugin no se
  encontrara, Metro fallaría al arrancar.

## Fichas de funciones y métodos

### module.exports (líneas 11-17)

- Firma: `module.exports = function (api) {...}`.
- Propósito técnico: devolver la configuración de presets/plugins de Babel.
- Propósito funcional: compilar correctamente el código de la variante Apple y su
  código compartido.
- Parámetros: `api` (objeto API de Babel). Retorno: objeto con `presets` y `plugins`.
- Excepciones: ninguna explícita; el arranque fallaría si un preset/plugin no existe.
- Dependencias: `babel-preset-expo` (raíz), `react-native-reanimated/plugin`
  (raíz node_modules). Se llama desde Babel al iniciar.
- Efectos secundarios: cacheo de configuración vía `api.cache(true)`.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Dependencia de plugin no declarada en el package.json de la
  variante: `react-native-reanimated/plugin` se resuelve del `node_modules` raíz.
  Si se instalara iphone de forma aislada, Babel no encontraría el plugin.
- [NIVEL DE CERTEZA: Confirmado por código] Este archivo es consistente con el enfoque
  "variante que reutiliza el stack del monorepo".

## Seguridad

Sin hallazgos de seguridad: no hay secretos ni datos sensibles en la configuración.
[NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] BAJO: si en el futuro se usa Reanimated con worklets desde código compartido
  dentro de iphone, la configuración ya está lista; en caso contrario el plugin añade
  carga de compilación mínima.
- [RECOMENDACIÓN] Documentar que la variante depende del `node_modules` raíz para
  resolver el plugin de Reanimated.
