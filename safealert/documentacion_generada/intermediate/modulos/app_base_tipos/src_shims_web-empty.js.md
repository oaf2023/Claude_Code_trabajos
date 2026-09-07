# Archivo: src/shims/web-empty.js

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/shims/web-empty.js |
| Líneas totales | 37 |
| Lenguaje | JavaScript (CommonJS) |
| Tamaño (bytes) | 1291 |
| Categoría | Shim web (Proxy) para módulos nativos sin soporte web |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Resuelve el problema de compatibilidad web de los **módulos nativos sin implementación
web**. En móvil, Metro resuelve `react-native-wakeword`, `react-native-permissions` y
`react-native-device-info` desde `node_modules`; en web esos módulos intentan llamar a
código nativo (TurboModules/Android/iOS) y crashean al importarse. `metro.config.js`
redirige esas importaciones a este archivo cuando `platform === 'web'`, que exporta un
`Proxy` que devuelve funciones vacías y objetos para **cualquier** propiedad consultada,
de modo que el código que importa esos módulos no explota durante el bundling ni en
runtime web.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Referencias reales de configuración:

- `metro.config.js` (línea 40-44): `NATIVE_WEB_EMPTY = ['react-native-wakeword', 'react-native-permissions', 'react-native-device-info']`.
- `metro.config.js` (líneas 81-85): en `resolveRequest`, si `platform === 'web'` y el
  módulo está en `NATIVE_WEB_EMPTY`, devuelve `{ type: 'sourceFile', filePath: ...web-empty.js }`.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna (no importa nada) | — | — | — |

Usa el objeto global `Proxy` del estándar ECMAScript.

## Componentes que dependen de este archivo

El shim no se importa en código de aplicación: lo resuelve Metro en tiempo de build
(plataforma web) para los nombres de la lista `NATIVE_WEB_EMPTY`:

- `react-native-wakeword` → consumido en `src/services/WakeWordService.ts`.
- `react-native-permissions` → consumido por los servicios de permisos.
- `react-native-device-info` → consumido por servicios que detectan dispositivo.

Referencia de configuración: `metro.config.js` (líneas 40-44 y 83-85). [NIVEL DE
CERTEZA: Confirmado por código].

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `handler` | Objeto con getters/`apply`/`construct` | object (trampa de Proxy) | Respuesta universal a accesos, llamadas y construcciones | Líneas 14-35 |
| Proxy raíz exportado | `new Proxy({}, handler)` | Proxy | Módulo exportado que nunca lanza al acceder a propiedades | Línea 37 |

## Estructura (funciones / clases / tipos)

- Constante `handler` con trampas: `get` (con Proxy anidado), `apply`, `construct`.
- Export CommonJS: `module.exports = new Proxy({}, handler)`.

## Análisis línea por línea

```js
/* ============================================================================
* Archivo         : web-empty.js
* Descripción     : Módulo shim Proxy para módulos nativos sin soporte web.
*                   Metro Bundler resuelve estos módulos cuando el target es web,
*                   evitando crashes por imports nativos (react-native-permissions,
*                   react-native-device-info, react-native-wakeword).
* Autor           : oafon
* Fecha           : 2026-08-26
* Versión         : 1.0.0
* Lenguaje        : JavaScript
* Uso             : Resuelto automáticamente por metro.config.js en modo web.
* ============================================================================ */
```

**Explicación de las líneas 1–12:**

- **Línea 1**: apertura del comentario de cabecera estándar del proyecto.
- **Líneas 2–11**: metadatos (autor `oafon`, fecha `2026-08-26`, versión `1.0.0`,
  JavaScript) y propósito explícito: evitar crashes por imports nativos
  (react-native-permissions, react-native-device-info, react-native-wakeword) cuando el
  target es web. La línea 11 indica que Metro lo resuelve automáticamente en modo web.
- **Línea 12**: cierre de la cabecera.

```js
const handler = {
  get(target, prop) {
    if (prop === '__esModule') return false;
    if (prop === 'default') return target;
    if (typeof prop === 'symbol') return undefined;

    return new Proxy(() => {}, {
      get(_, innerProp) {
        if (innerProp === 'then') return undefined;
        if (innerProp === '__esModule') return false;
        if (innerProp === 'default') return undefined;
        return () => {};
      },
      apply() {
        return {};
      },
      construct() {
        return {};
      },
    });
  },
};
```

**Explicación de las líneas 14–35:**

- **Línea 14**: apertura de `handler`, objeto de trampas del `Proxy`.
- **Línea 15**: trampa `get(target, prop)`, invocada en cada acceso de propiedad al módulo.
- **Línea 16**: si la propiedad es `__esModule` devuelve `false` (evita que el interop de
  módulos lo trate como ES module).
- **Línea 17**: si piden `default`, devuelve el objeto destino (compatibilidad con
  `import modulo from ...`).
- **Línea 18**: ante símbolos (p. ej. `Symbol.iterator`, `Symbol.toStringTag`) devuelve
  `undefined`, evitando sorpresas con protocolos estándar.
- **Líneas 20–33**: para cualquier otra propiedad devuelve un **Proxy anidado sobre una
  función vacía** (`() => {}`):
  - Líneas 21–25: al acceder a propiedades del stub (p. ej. `then`, `__esModule`,
    `default`) devuelve `undefined` o `false`, salvo otras que devuelven `() => {}`.
  - Línea 26–29: `apply()` (si el stub se invoca como función) devuelve `{}`.
  - Línea 30–32: `construct()` (si se usa con `new`) devuelve `{}`.
  Esto hace que cadenas como `Permissions.check(...)`, `DeviceInfo.getModel()` o
  `wakeword.createInstance(...)` no lancen en web: cada acceso devuelve otra función
  llamable y cada llamada devuelve un objeto.
- **Línea 35**: cierre de `handler`.

```js
module.exports = new Proxy({}, handler);
```

**Explicación de las líneas 37:**

- **Línea 37**: exporta como módulo CommonJS un `Proxy` sobre un objeto vacío con el
  `handler` descrito. Metro lo entrega como reemplazo de los módulos nativos en web.

## Fichas de funciones y métodos

No hay funciones con nombre: el comportamiento se define con trampas de `Proxy`
(`get`, `apply`, `construct`). Se documenta el flujo de cada trampa en el análisis línea
por línea.

## Clases / interfaces / tipos

Ninguna: es JavaScript sin clases ni tipos.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: el shim es deliberadamente permisivo: cualquier API del módulo
  nativo devuelve stubs, por lo que los errores de "módulo no disponible en web" se
  silencian y la app debe comprobar capacidades por otra vía (p. ej. `Platform.OS`).
  `WakeWordService.ts` ya lo hace: en web nunca importa el módulo real porque
  `loadWakeWordModule` lanza si `Platform.OS !== 'android'` (líneas 47-49 de ese archivo).
- [OBSERVACIÓN TÉCNICA]: `typeof prop === 'symbol'` (línea 18) y el manejo de `then`
  (línea 22) evitan que los bundlers y utilidades de promesas interpreten mal los stubs.
- [NIVEL DE CERTEZA: Confirmado por código] para el mecanismo de resolución en
  `metro.config.js`.

## Seguridad

- INFORMATIVO: al ser un stub universal, ningún dato del dispositivo se expone en web a
  través de estos módulos (las llamadas devuelven objetos vacíos). No hay secretos.
- No se detectan hallazgos de seguridad relevantes.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: mantener la lista `NATIVE_WEB_EMPTY` de `metro.config.js` sincronizada
  con los módulos realmente importados en la app; un módulo nativo nuevo sin shim rompería
  el build web.
- [RECOMENDACIÓN]: añadir logs de advertencia en el shim (solo en desarrollo) si se quiere
  detectar usos web accidentales de APIs nativas, en lugar de silenciarlos por completo.
