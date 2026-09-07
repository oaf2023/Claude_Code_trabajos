# Archivo: jest.setup.js

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| jest.setup.js | 69 | JavaScript (CommonJS) | 2298 | Setup global de Jest (mocks) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Archivo de setup de Jest (referenciado en `jest.config.js` como `setupFiles`) que prepara el entorno Node para ejecutar los tests de los servicios. Define un mock global de `AsyncStorage` basado en `localStorage`, simula el objeto global `window` con `localStorage`, fija `global.__DEV__`, y registra mocks automáticos de `react-native` y `expo-constants` para que los servicios que importan `Platform`, `AppState`, `NativeModules`, etc. no fallen al cargarse en Node (evita el error "Cannot use import statement outside a module").

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Cargado por `jest.config.js` línea 35 (`setupFiles`). [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `react-native` (mockeado) | externa | Líneas 29-59 | Sí (los servicios la importan en runtime Node) |
| `expo-constants` (mockeado) | externa | Líneas 62-69 | Sí |

No usa imports estáticos: define mocks vía `jest.mock` y objetos globales.

## Componentes que dependen de este archivo

- `jest.config.js` (`setupFiles`).
- Los servicios bajo test que importan `@react-native-async-storage/async-storage`, `react-native` o `expo-constants` (p. ej. servicios de alertas/ubicación que leen configuración o estado de app).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `mockStorage` | `{}` | object | Backend del localStorage simulado | Líneas 14, 20-23 |
| `global.__DEV__` | `true` | boolean | Simula modo desarrollo | Línea 16 |
| `global.window.localStorage` | objeto con get/set/remove/clear | object | Sustituto de AsyncStorage | Líneas 18-25 |
| `Platform.OS` | `'android'` | string | Plataforma simulada | Línea 31 |
| `Platform.Version` | `34` | number | Versión de Android simulada | Línea 32 |
| `AppState.currentState` | `'active'` | string | Estado de app simulado | Línea 40 |

## Estructura (funciones / clases / tipos)

- Mocks globales (objetos y funciones `jest.fn`), sin funciones exportadas.

## Análisis línea por línea

```js
/* ============================================================================
* Archivo         : jest.setup.js
* Descripción     : Setup global de Jest: mock de AsyncStorage (vía localStorage)
*                   y mock mínimo de react-native para servicios que importan
*                   Platform/AppState en entorno Node.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.1.0
* Lenguaje        : JavaScript
* Uso             : Cargado automáticamente por jest (setupFiles).
* ============================================================================ */

/* Mock global para AsyncStorage en entorno Node.js */
const mockStorage = {};

global.__DEV__ = true;

global.window = {
  localStorage: {
    getItem: (key) => mockStorage[key] ?? null,
    setItem: (key, value) => { mockStorage[key] = value; },
    removeItem: (key) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  },
};
```

**Explicación de las líneas 1–25:**

- **Líneas 1-11**: cabecera estándar (v1.1.0): describe que mockea AsyncStorage vía `localStorage` y react-native mínimo.
- **Línea 13**: comentario del mock de AsyncStorage.
- **Línea 14**: `mockStorage = {}` — almacén en memoria compartido por todos los tests del proceso (NO se limpia automáticamente entre tests; solo con `clear()`).
- **Línea 16**: `global.__DEV__ = true` — simula entorno de desarrollo para que el código condicionado a `__DEV__` se ejecute.
- **Línea 18**: define `global.window`.
- **Líneas 19-24**: `localStorage` con API mínima: `getItem` (devuelve `null` si no existe, coherente con la API), `setItem`, `removeItem` y `clear`.
- [OBSERVACIÓN TÉCNICA] Líneas 20-23: valores almacenados como strings; si un servicio guarda objetos sin serializar, `getItem` devolverá `[object Object]`. El uso real debería pasar por `JSON.stringify`/`parse`.

```js
/* Mock mínimo de react-native: solo lo que usan los servicios en runtime Node.
   Evita el SyntaxError "Cannot use import statement outside a module". */
jest.mock('react-native', () => {
  const Platform = {
    OS: 'android',
    Version: 34,
    select: (obj) => (obj && typeof obj === 'object' ? obj.android ?? obj.default : obj),
    constants: { reactNativeVersion: { major: 0, minor: 83, patch: 2 } },
  };

  return {
    Platform,
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    NativeModules: {},
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeAllListeners: jest.fn(),
    })),
    Dimensions: {
      get: jest.fn(() => ({ width: 390, height: 844 })),
    },
    Vibration: { vibrate: jest.fn() },
    LogBox: { ignoreLogs: jest.fn() },
    Alert: { alert: jest.fn() },
    Linking: {
      openURL: jest.fn().mockResolvedValue(true),
      canOpenURL: jest.fn().mockResolvedValue(true),
    },
  };
});
```

**Explicación de las líneas 27–59:**

- **Líneas 27-28**: comentario: mock mínimo de react-native con lo que usan los servicios en Node, para evitar el error de sintaxis de ESM.
- **Línea 29**: `jest.mock('react-native', ...)` — cualquier import de `react-native` en los tests obtiene este mock.
- **Líneas 30-35**: `Platform` simulado: `OS: 'android'`, `Version: 34`, `select` (elige la variante android o default) y `constants` con versión de RN 0.83.2.
- **Líneas 39-42**: `AppState` con `currentState: 'active'` y `addEventListener` que devuelve un manejador con `remove`.
- **Línea 43**: `NativeModules: {}` vacío (si un servicio accediera a un módulo nativo, obtendría `undefined`).
- **Líneas 44-47**: `NativeEventEmitter` como `jest.fn` que devuelve un emitter con `addListener`/`removeAllListeners`.
- **Líneas 48-50**: `Dimensions.get` devuelve pantalla de 390x844 (medidas de iPhone 14-ish; útil si algún servicio calcula layout).
- **Línea 51**: `Vibration.vibrate` no-op.
- **Línea 52**: `LogBox.ignoreLogs` no-op.
- **Línea 53**: `Alert.alert` no-op.
- **Líneas 54-57**: `Linking.openURL` y `canOpenURL` resuelven `true` (para servicios que abren URLs de pago o mapas).

```js
/* Mock de expo-constants que algunos servicios importan en runtime Node */
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: { extra: {} },
    manifest: {},
    platform: { android: { versionCode: 1 } },
  },
  manifest: {},
}));
```

**Explicación de las líneas 61–69:**

- **Línea 61**: comentario del mock de `expo-constants`.
- **Líneas 62-68**: mockea `expo-constants`: exporta `default` con `expoConfig.extra` vacío (donde suelen leerse variables `EXPO_PUBLIC_*` y config extra), `manifest` vacío y `platform.android.versionCode: 1`. También exporta `manifest` como propiedad (compatibilidad con imports nombrados).

## Fichas de funciones y métodos

No aplica (definiciones de mocks).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El almacén `mockStorage` persiste entre tests dentro del mismo archivo de test (Jest no lo reinicia por test de forma automática). Los tests deben llamar a `localStorage.clear()` en `beforeEach` si necesitan aislamiento.
- [OBSERVACIÓN TÉCNICA] `Dimensions.get` fijo (390x844) y `Platform.Version` fijo (34) pueden no reflejar el dispositivo real de CI; si algún servicio ramifica por versión de Android, el resultado puede no ser representativo.
- [NOTA] No se mockea `@react-native-async-storage/async-storage` como módulo; el código de los servicios debe usar `global.window.localStorage` o el mock de la librería se resuelve por otro mecanismo (p. ej. si la librería ya mapea a localStorage en el preset). [NIVEL DE CERTEZA: Inferido]

## Seguridad

- [INFORMATIVO] Mocks de test sin implicaciones de seguridad: no contienen secretos ni datos reales.
- [BAJO] Si algún test llegara a ejecutarse contra entornos reales (por error de configuración de variables), `expoConfig.extra` vacío evitaría filtrar config de producción; comportamiento correcto.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Añadir limpieza de `localStorage` entre tests cuando los servicios dependan de estado persistido.
- [RECOMENDACIÓN] Si los servicios necesitan APIs de react-native adicionales (p. ej. `NativeEventEmitter` con eventos reales), ampliar el mock según lo que consuman de verdad.
- [RECOMENDACIÓN] Documentar que los tests corren simulando Android (OS android / versión 34) para evitar sorpresas en ramas específicas de plataforma.
