# Archivo: src/shims/web-rn-screens.js

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/shims/web-rn-screens.js |
| Líneas totales | 57 |
| Lenguaje | JavaScript (CommonJS) |
| Tamaño (bytes) | 1928 |
| Categoría | Shim web para react-native-screens |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Resuelve el problema de compatibilidad web de **react-native-screens**: en móvil, ese
paquete registra vistas nativas reales (mejoras de rendimiento de navegación); en web no
existe esa implementación nativa y algunas versiones/imports fallan al resolver
`ScreenStack`/`NativeScreen` etc. El shim reimplementa los componentes más usados como
`View` de `react-native` (con `flex: 1` por defecto) y deja como `null` o no-op los
componentes/APIs de cabecera y congelación. `metro.config.js` lo entrega cuando el bundle
destino es web y el módulo pedido es `react-native-screens`.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Referencias reales de configuración:

- `metro.config.js` (línea 45): `const WEB_RN_SCREENS_PATH = path.resolve(__dirname, 'src', 'shims', 'web-rn-screens.js')`.
- `metro.config.js` (líneas 86-88): si `platform === 'web'` y `moduleName === 'react-native-screens'`, resuelve a `WEB_RN_SCREENS_PATH`.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `react` (require) | externa | `React.createElement` en los componentes `Screen*` | Sí |
| `react-native` (`View`, `ScrollView`) | externa | Base de los componentes shim | Parcial: `View` se usa en los 6 componentes; `ScrollView` se importa pero no se usa en el cuerpo del archivo |

## Componentes que dependen de este archivo

El shim no se importa en código de aplicación: Metro lo resuelve en tiempo de build
(plataforma web) para el nombre `react-native-screens`, que consumen las librerías de
navegación (expo-router / react-navigation) y sus dependencias. Referencia de
configuración: `metro.config.js` (líneas 45, 86-88).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `React` | `require('react')` | object | Creación de elementos React | Línea 11 |
| `View` | de `react-native` | componente | Base visual de los stubs | Línea 12 |
| `ScrollView` | de `react-native` | componente | Importado pero no usado | Línea 12 |
| `featureFlags` | Objeto con `experiment` y 5 flags booleanos | object | API de flags experimentales de la librería real | Líneas 48-56 |

## Estructura (funciones / clases / tipos)

- Funciones-componente: `ScreenComponent`, `ScreenContainer`, `NativeScreen`,
  `NativeScreenNavigationContainer`, `ScreenStack`, `ScreenStackHeaderConfig`.
- Funciones no-op: `enableFreeze`, `unstable_createFreeScreenComponent`.
- Export CommonJS con las exportaciones nombradas, `default` y `featureFlags`.

## Análisis línea por línea

```js
/* ============================================================================
 * Archivo         : src/shims/web-rn-screens.js
 * Descripción     : Web shim para react-native-screens.
 *                   Proporciona componentes básicos usando View de react-native.
 * Autor           : oafon
 * Fecha           : 2026-08-26
 * Versión         : 1.0.0
 * Lenguaje        : JavaScript
 * ============================================================================ */
```

**Explicación de las líneas 1–9:**

- **Línea 1**: apertura del comentario de cabecera estándar del proyecto.
- **Líneas 2–8**: metadatos (autor `oafon`, fecha `2026-08-26`, versión `1.0.0`) y
  descripción: web shim para react-native-screens basado en `View`.
- **Línea 9**: cierre de la cabecera.

```js
const React = require('react');
const { View, ScrollView } = require('react-native');

function ScreenComponent(props) {
  return React.createElement(View, { ...props, style: [{ flex: 1 }, props.style] });
}

function ScreenContainer(props) {
  return React.createElement(View, { ...props, style: [{ flex: 1 }, props.style] });
}

function NativeScreen(props) {
  return React.createElement(View, { ...props, style: [{ flex: 1 }, props.style] });
}

function NativeScreenNavigationContainer(props) {
  return React.createElement(View, { ...props, style: [{ flex: 1 }, props.style] });
}

function ScreenStack(props) {
  return React.createElement(View, { ...props, style: [{ flex: 1 }, props.style] });
}

function ScreenStackHeaderConfig(props) {
  return null;
}
```

**Explicación de las líneas 11–36:**

- **Línea 11**: `const React = require('react')`, acceso a la creación de elementos.
- **Línea 12**: desestructura `View` y `ScrollView` de `react-native`. [OBSERVACIÓN
  TÉCNICA]: `ScrollView` no se usa en el resto del archivo.
- **Líneas 14–16**: `ScreenComponent`: renderiza un `View` con las props recibidas y
  estilo `[{ flex: 1 }, props.style]` (la pantalla ocupa todo el alto disponible y las
  props de estilo propias se aplican después).
- **Líneas 18–20**: `ScreenContainer`: envoltorio de contenedor de pantallas, mismo patrón.
- **Líneas 22–24**: `NativeScreen`: versión "nativa" de pantalla, mismo patrón (en web no
  hay nativo, se degrada a `View`).
- **Líneas 26–28**: `NativeScreenNavigationContainer`: contenedor de navegación nativa,
  degradado a `View`.
- **Líneas 30–32**: `ScreenStack`: pila de pantallas, degradada a `View` (sin animaciones
  de transición nativas en web).
- **Líneas 34–36**: `ScreenStackHeaderConfig`: configuración de cabecera nativa; devuelve
  `null` porque en web la cabecera la gestiona el navegador/la propia app.

```js
module.exports = {
  default: ScreenComponent,
  Screen: ScreenComponent,
  ScreenContainer: ScreenContainer,
  NativeScreen: NativeScreen,
  NativeScreenNavigationContainer: NativeScreenNavigationContainer,
  ScreenStack: ScreenStack,
  ScreenStackHeaderConfig: ScreenStackHeaderConfig,
  enableFreeze: function() {},
  unstable_createFreeScreenComponent: function() { return ScreenComponent; },
  featureFlags: {
    experiment: {
      synchronousScreenUpdatesEnabled: false,
      synchronousHeaderConfigUpdatesEnabled: false,
      synchronousHeaderSubviewUpdatesEnabled: false,
      controlledBottomTabs: false,
      iosPreventReattachmentOfDismissedScreens: false,
    },
  },
};
```

**Explicación de las líneas 38–57:**

- **Línea 38**: apertura del objeto exportado.
- **Línea 39**: `default: ScreenComponent` (compatibilidad con import default).
- **Líneas 40–45**: exporta con sus nombres las seis funciones-componente descritas.
- **Línea 46**: `enableFreeze`: función vacía (la congelación de pantallas no aplica en
  web).
- **Línea 47**: `unstable_createFreeScreenComponent`: devuelve `ScreenComponent` (la API
  inestable de creación de pantallas congelables se degrada al componente simple).
- **Líneas 48–56**: `featureFlags.experiment` con cinco flags en `false`: actualizaciones
  síncronas de pantalla/cabecera, subvistas de cabecera, bottom tabs controlados y
  prevención de re-enganche en iOS. El objeto existe para que los consumidores que leen
  flags no fallen al acceder a la propiedad.
- **Línea 57**: cierre del export.

## Fichas de funciones y métodos

### `ScreenComponent(props)` (líneas 14–16)

- Firma original: `function ScreenComponent(props) { return React.createElement(View, { ...props, style: [{ flex: 1 }, props.style] }); }`.
- Propósito: contenedor básico de pantalla en web.
- Retorno: elemento `View` con `flex: 1`.
- Nota: es el `default` export y la base de `unstable_createFreeScreenComponent`.

### `ScreenStackHeaderConfig(props)` (líneas 34–36)

- Retorna `null`: en web no se configura cabecera nativa.

### Funciones no-op (líneas 46-47)

- `enableFreeze`: no hace nada.
- `unstable_createFreeScreenComponent`: devuelve `ScreenComponent`.

## Clases / interfaces / tipos

Ninguna clase ni tipo: JavaScript funcional con `React.createElement`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: `ScrollView` (línea 12) se importa y no se usa: importación
  aparentemente innecesaria que solo añade peso simbólico al shim.
- [OBSERVACIÓN TÉCNICA]: al degradar `ScreenStack` y `NativeScreen` a `View`, la web
  pierde animaciones y comportamiento de transición de react-native-screens; las
  librerías de navegación web (react-navigation web) suelen funcionar igualmente porque en
  web ya usan su propia implementación, pero debe validarse el flujo visual de navegación
  en la PWA.
- [OBSERVACIÓN TÉCNICA]: el shim exporta las API presentes en la versión usada de
  `react-native-screens`; si la dependencia de navegación importara una API nueva no
  cubierta aquí (p. ej. `FullWindowOverlay`), el bundle web fallaría en resolución.
- [NIVEL DE CERTEZA: Confirmado por código] para el mecanismo de resolución en
  `metro.config.js`.

## Seguridad

- INFORMATIVO: el shim solo afecta a la construcción del bundle web y no maneja datos.
  No hay hallazgos de seguridad.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: retirar `ScrollView` de la importación (línea 12) por no usarse.
- [RECOMENDACIÓN]: si se actualiza la cadena de navegación, revisar que el shim cubra
  todas las exportaciones nuevas de `react-native-screens` que esa cadena importa en web.
- [RECOMENDACIÓN]: validar la navegación de la PWA (transiciones, gestos) tras cualquier
  cambio, dado que el shim elimina el comportamiento nativo de pantallas.
