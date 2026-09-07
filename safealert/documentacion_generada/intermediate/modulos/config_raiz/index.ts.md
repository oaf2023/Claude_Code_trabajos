# Archivo: index.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| index.ts | 37 | TypeScript 5.9 | 1665 | Punto de entrada (entry point) de la app Expo | FUNCIONALIDAD EXISTENTE (instrumentación de arranque) | Confirmado por código |

## Objetivo

Es el *entry point* declarado en `package.json` (`"main": "index.ts"`). Su responsabilidad es montar el router de Expo (`expo-router`) cargando el módulo `expo-router/entry` por efecto lateral y, al mismo tiempo, emitir trazas de consola de diagnóstico (`[SafeAlertBootstrap]`) para validar el arranque del bundle JavaScript en cliente Android. Incluye además la supresión en desarrollo de avisos concretos de `LogBox` que se consideran ruido o falsos positivos.

La cabecera del archivo (líneas 1-9) lo describe como "Punto de entrada instrumentado para validar el arranque JS del cliente Android", lo que indica que fue creado (o adaptado) durante una sesión de diagnóstico de un fallo de bootstrap.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. `package.json` línea 4 define `"main": "index.ts"`, por lo que Expo/Metro lo ejecuta como primer módulo de la app. No es el "registro clásico" de Expo (que haría `registerRootComponent`), sino un arranque delegado: al requerir `expo-router/entry`, la cadena `entry.js` → `entry-classic.js` (del paquete `expo-router`, v55.0.7 verificado en `node_modules`) ejecuta en su carga `renderRootComponent(App)`, que registra y monta el componente raíz. Por tanto, aunque `index.ts` no llama a ningún registro, el router SÍ se monta como efecto lateral del `require`.

[NIVEL DE CERTEZA: Confirmado por código] (verificado contra `node_modules/expo-router/entry.js`, `entry-classic.js` y `build/qualified-entry.js`).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `react-native` (`LogBox`) | externa | Líneas 11-21, supresión de avisos en desarrollo | Sí |
| `expo-router/entry` (requerido dinámico) | externa (paquete del proyecto) | Líneas 27-35, arranque del router dentro de `try/catch` | Sí (efecto lateral: monta la app) |

[OBSERVACIÓN TÉCNICA] No hay importación estática de React ni de ExpoRoot; el montaje depende enteramente de que `require('expo-router/entry')` se ejecute y no lance excepción.

## Componentes que dependen de este archivo

- `package.json` línea 4: `"main": "index.ts"` — es quien lo declara como entrada.
- Ningún otro módulo importa `index.ts` directamente (es el primer módulo del bundle).
- `app.json` línea 116 declara el plugin `expo-router`, que configura el router; `index.ts` es el que lo arranca.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `__DEV__` | `true`/`false` según build | boolean (global RN) | Distingue entorno de desarrollo | Línea 13 |
| `globalThis.__SAFEALERT_BOOTSTRAP_MARK__` | `Date.now()` (marca temporal) | number (propiedad global) | Marca de bootstrap en tiempo real para diagnóstico externo | Línea 24 |
| `routerEntry` | Resultado del `require('expo-router/entry')` | any | Objeto exportado por el módulo de entrada, solo para inspección | Líneas 27-31 |
| `err` | Objeto de excepción del `catch` | any | Captura de errores del arranque | Líneas 32-34 |

Valores mágicos: prefijos de log `[SafeAlertBootstrap]` (identificador de trazabilidad); `500` en `err?.stack?.substring(0, 500)` (recorte del stack para no saturar el log); patrón `id: 0` y `[storage/unauthorized]` en la lista de avisos ignorados (mensajes concretos de error Firebase Storage que se quieren silenciar).

## Estructura (funciones / clases / tipos)

- Código de nivel superior (módulo): no exporta funciones ni tipos. Contiene un bloque `if (__DEV__)`, logs, una asignación a `globalThis` y un bloque `try/catch` con un `require` dinámico.

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : index.ts
* Descripción     : Punto de entrada instrumentado para validar el arranque JS del cliente Android.
* Autor           : oafon
* Fecha           : 2026-03-20
* Versión         : 1.0.1
* Lenguaje        : TypeScript 5.9
* Uso             : Cargado por Expo al iniciar la app para montar el router y emitir trazas de bootstrap.
* ============================================================================ */

import { LogBox } from 'react-native';
```

**Explicación de las líneas 1–11:**

- **Líneas 1-9**: cabecera estándar del proyecto (autor `oafon`, fecha 2026-03-20, versión 1.0.1). Documenta que el archivo se carga "por Expo al iniciar la app para montar el router y emitir trazas de bootstrap".
- **Línea 11**: importa `LogBox` de `react-native`; se usará para silenciar avisos específicos en desarrollo. No se importa `React` porque este archivo no renderiza JSX.

```ts
if (__DEV__) {
	LogBox.ignoreLogs([
		'[expo-av]: Expo AV has been deprecated',
		'This method is deprecated (as well as all React Native Firebase namespaced API)',
		'InteractionManager has been deprecated',
		'Uncaught (in promise, id: 0) Error: [storage/unauthorized]',
		'[storage/unauthorized]',
	]);
}
```

**Explicación de las líneas 13–21:**

- **Línea 13**: ejecuta el bloque solo en desarrollo (`__DEV__` global de React Native/Metro).
- **Línea 14**: `LogBox.ignoreLogs([...])` registra una lista de mensajes que no deben mostrarse como avisos rojos/amarillos en consola.
- **Línea 15**: silencia el aviso de deprecación de `expo-av` (módulo ya deprecado en favor de `expo-audio`), usado en la app para grabación/reproducción.
- **Línea 16**: silencia la deprecación de la API "namespaced" de React Native Firebase.
- **Línea 17**: silencia la deprecación de `InteractionManager`.
- **Líneas 18-19**: silencian el error `[storage/unauthorized]` de Firebase Storage. [OBSERVACIÓN TÉCNICA] Suprimir este error también oculta fallos reales de autorización de Storage en desarrollo; véase la sección Seguridad.

```ts
console.log('[SafeAlertBootstrap] index.ts loaded');
(globalThis as any).__SAFEALERT_BOOTSTRAP_MARK__ = Date.now();

try {
  const routerEntry = require('expo-router/entry');
  console.log('[SafeAlertBootstrap] expo-router entry imported, keys:', Object.keys(routerEntry || {}));
  console.log('[SafeAlertBootstrap] routerEntry type:', typeof routerEntry);
  console.log('[SafeAlertBootstrap] routerEntry.default:', typeof routerEntry?.default);
  console.log('[SafeAlertBootstrap] routerEntry.registerRootComponent:', typeof routerEntry?.registerRootComponent);
} catch (err: any) {
  console.error('[SafeAlertBootstrap] expo-router import FAILED:', err?.message || err);
  console.error('[SafeAlertBootstrap] stack:', err?.stack?.substring(0, 500));
}

console.log('[SafeAlertBootstrap] done');
```

**Explicación de las líneas 23–37:**

- **Línea 23**: traza de consola incondicional (también en producción) que confirma que el módulo `index.ts` se cargó. [OBSERVACIÓN TÉCNICA] No está protegida por `__DEV__`, por lo que en builds de release quedan logs de diagnóstico en producción.
- **Línea 24**: escribe en `globalThis` la marca `__SAFEALERT_BOOTSTRAP_MARK__` con la marca temporal de arranque. Permite que herramientas externas (o código de diagnóstico) comprueben que el bundle llegó a ejecutarse. El `as any` evita el error de tipado TypeScript por propiedad no declarada.
- **Línea 26**: abre el `try` que envuelve la carga del router.
- **Línea 27**: ejecuta `require('expo-router/entry')`. Este es el paso decisivo: al cargar el módulo se ejecuta su código de nivel superior, que (vía `entry.js` → `entry-classic.js`) importa `App` de `expo-router/build/qualified-entry` y llama a `renderRootComponent(App)`, registrando y montando la app con las rutas del directorio `app/`. Es un arranque por efecto lateral.
- **Línea 28**: imprime las claves del objeto exportado por el módulo (diagnóstico; en la práctica expone `App` o vacío, según la versión).
- **Líneas 29-31**: inspeccionan tipos de `routerEntry`, `routerEntry.default` y `routerEntry.registerRootComponent`. Dado que en la v55 el registro se hace internamente con `renderRootComponent`, estas líneas probablemente imprimen `undefined`; son trazas de diagnóstico y no afectan al arranque. [OBSERVACIÓN TÉCNICA] La línea 31 busca una exportación que no existe en el paquete; no provoca error porque usa encadenamiento opcional, pero la comprobación es engañosa.
- **Línea 32**: abre `catch (err: any)` capturando cualquier excepción del `require`.
- **Línea 33**: registra el mensaje de error del arranque fallido.
- **Línea 34**: registra el stack truncado a 500 caracteres (evita logs enormes).
- **Línea 37**: traza final incondicional.

## Fichas de funciones y métodos

No hay funciones declaradas ni exportadas. La lógica es código de nivel superior del módulo; el flujo equivalente se describe en el análisis línea por línea.

## Clases / interfaces / tipos

No declara clases, interfaces ni tipos propios.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `index.ts` no llama explícitamente a `registerRootComponent`; el montaje depende del efecto lateral de `require('expo-router/entry')` (`renderRootComponent(App)` en `entry-classic.js`). Si una futura versión de `expo-router` dejara de auto-registrarse, la app arrancaría en blanco sin error evidente.
- [OBSERVACIÓN TÉCNICA] El `require` de un módulo de arranque dentro de `try/catch` degrada silenciosamente: si el router falla, la app queda sin UI y solo hay trazas de consola; no hay pantalla de error ni mecanismo de recuperación.
- [OBSERVACIÓN TÉCNICA] Las líneas 28-31 son diagnóstico puro heredado de una investigación de bootstrap; añaden ruido de log en cada arranque (también en release).
- [OBSERVACIÓN TÉCNICA] El comentario de cabecera y el uso del archivo indican que fue creado para "validar el arranque JS del cliente Android"; el log `[SafeAlertBootstrap] index.ts loaded` es un resto de esa instrumentación.

## Seguridad

- [BAJO] Líneas 18-19: se ignora globalmente el error `[storage/unauthorized]` de Firebase Storage. Oculta en desarrollo cualquier fallo real de autorización (reglas de Storage denegando acceso), lo que puede enmascarar problemas de permisos hasta producción.
- [BAJO] Líneas 23-37: logs de diagnóstico incondicionales (`console.log`/`console.error` en release). No filtran datos personales ni secretos, pero generan ruido en producción y pueden dificultar el análisis de logs reales.
- [INFORMATIVO] `__SAFEALERT_BOOTSTRAP_MARK__` en `globalThis` es legible desde cualquier JS inyectado en el contexto de la app; no contiene datos sensibles, solo una marca temporal.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Proteger los logs de bootstrap con `__DEV__` o un mecanismo de logging condicional para no ensuciar producción.
- [RECOMENDACIÓN] Considerar sustituir el `try/catch` silencioso por un arranque que muestre un error visible (p. ej. pantalla de error fatal) si `expo-router/entry` no puede cargarse.
- [RECOMENDACIÓN] Eliminar las líneas de inspección de exportaciones (28-31) que no aportan valor en operación.
- [RECOMENDACIÓN] Si se quiere garantizar el montaje de forma explícita y a prueba de cambios de versión de `expo-router`, valorar llamar a la API pública de registro que exponga la versión instalada, en lugar de depender solo del efecto lateral.
