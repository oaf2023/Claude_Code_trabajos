# Archivo: public/sw.js

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | public/sw.js |
| Líneas totales | 97 |
| Lenguaje | JavaScript (Service Worker) |
| Tamaño (bytes) | 3110 |
| Categoría | Salida web PWA — Service Worker offline |
| Estado detectado | FUNCIONALIDAD EXISTENTE (con base URL legada incoherente) |
| Nivel de certeza | Confirmado por código |

## Objetivo

Service Worker de la PWA SafeAlert: precachea recursos críticos en la instalación, limpia cachés antiguas en la activación y define la estrategia de respuesta a peticiones (network-first para navegación con fallback offline, cache-first con actualización en segundo plano para assets). Su registro lo realiza `app/+html.tsx` (líneas 20–28, `BASE_URL = "/"`), mientras el propio archivo usa el prefijo `/Claude_Code_trabajos/safealert`.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` para el mecanismo SW; `CÓDIGO LEGADO` en cuanto a rutas.

El registro activo existe en `app/+html.tsx` (`navigator.serviceWorker.register('/sw.js', { scope: '/' })`), y Expo copia `public/` a `dist/`, por lo que `sw.js` llega al artefacto. Sin embargo `BASE_URL = '/Claude_Code_trabajos/safealert'` (línea 14) es el esquema del despliegue GitHub Pages antiguo (`deploy-ghpages.ps1`) y contradice el `experiments.baseUrl: "/"` vigente de `app.json` (línea 112) y el registro con scope `/` de `+html.tsx`. `[NIVEL DE CERTEZA: Confirmado por código]`.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna (imports externos) | — | — | — |
| APIs de plataforma `caches`, `self`, `fetch`, `URL` | estándar (Web API del SW) | Todo el archivo | Sí |

No usa `importScripts`, Workbox ni librerías. Solo APIs nativas del contexto Service Worker.

## Componentes que dependen de este archivo

| Componente | Cómo lo referencia |
| --- | --- |
| app/+html.tsx (líneas 21–27) | Registra `'/sw.js'` con scope `'/'` en `load`, con `.catch` de advertencia |
| public/manifest.json (línea 17) | El manifest se precachea en este SW |
| scripts/patch-import-meta.js (líneas 153–161) | Intenta registrar `'${BASE}/sw.js'` (BASE `/Claude_Code_trabajos/safealert`), pero el guard `!html.includes('serviceWorker')` (línea 168) lo impide porque `+html.tsx` ya registró el SW |
| scripts/deploy-ghpages.ps1 (línea 60) | Copia `public/` (vía `dist/`) al subdirectorio `safealert/` del branch `gh-pages` |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| CACHE_NAME | `'safealert-cache-v3'` | string | Nombre de la caché activa; versión manual | 12, 28, 42, 71, 88 |
| BASE_URL | `'/Claude_Code_trabajos/safealert'` | string | Prefijo de la base pública (GitHub Pages en subdirectorio) | 14–21, 60–64, 75 |
| PRECACHE_URLS | array de 6 URLs | string[] | Lista de recursos a precachear en `install` | 15–22, 29 |
| — (listeners) | `install`, `activate`, `fetch` | función | Manejadores de ciclo de vida y peticiones | 25, 35, 52 |

`[OBSERVACIÓN TÉCNICA]`: `PRECACHE_URLS` incluye `${BASE_URL}/favicon.ico` (línea 21) y no existe `favicon.ico` en `public/` (solo `icons/icon-192.png`, `icons/icon-512.png`, `icons/apple-touch-icon.png`). Expo puede generar `favicon.ico` en `dist/` desde `app.json` `web.favicon` (`./assets/favicon.png`), pero bajo la raíz, no bajo el prefijo; si el recurso devuelve 404, `cache.addAll` rechaza y la instalación del SW falla completa. `[NIVEL DE CERTEZA: Inferido]` (depende del output de `expo export`).

## Estructura (funciones / clases / tipos)

- Manejador de evento `install` (líneas 25–32).
- Manejador de evento `activate` (líneas 35–48).
- Manejador de evento `fetch` (líneas 52–96).
- Sin clases ni tipos; uso intensivo de promesas encadenadas.

## Análisis línea por línea

```js
/* ============================================================================
 * Archivo         : sw.js
 * Descripción     : Service Worker PWA de SafeAlert — offline-first para
 *                   assets estáticos y network-first para rutas de navegación.
 * Autor           : oafon
 * Fecha           : 2026-08-07
 * Versión         : 1.0.0
 * Lenguaje        : JavaScript (Service Worker)
 * Uso             : Registrado desde app/+html.tsx en runtime web.
 * ============================================================================ */

const CACHE_NAME = 'safealert-cache-v3';
// Base pública del sitio (GitHub Pages sirve en subdirectorio).
const BASE_URL = '/Claude_Code_trabajos/safealert';
const PRECACHE_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/manifest.json`,
  `${BASE_URL}/icons/icon-192.png`,
  `${BASE_URL}/icons/icon-512.png`,
  `${BASE_URL}/icons/apple-touch-icon.png`,
  `${BASE_URL}/favicon.ico`,
];
```

**Explicación de las líneas 1–22:**

- **Líneas 1–10**: cabecera estándar del proyecto (autor `oafon`, fecha 2026-08-07, v1.0.0). El comentario de "Uso" indica que el registro ocurre desde `app/+html.tsx` (confirmado).
- **Línea 12** (`CACHE_NAME`): nombre de caché `safealert-cache-v3`; el sufijo `v3` sugiere que hubo versiones previas de estrategia de caché; versionado manual.
- **Línea 14** (`BASE_URL`): prefijo `/Claude_Code_trabajos/safealert`. Rutas absolutas con nombre de carpeta local del desarrollador: solo válidas si el sitio se sirve en ese subdirectorio exacto.
- **Líneas 15–22** (`PRECACHE_URLS`): 6 recursos críticos. Se precachea la propia raíz (`/`), manifest, 3 iconos y favicon. `[OBSERVACIÓN TÉCNICA]` la raíz precacheada `${BASE_URL}/` corresponde al HTML de la PWA; al precachear el HTML en `install`, se reutiliza al fallar la navegación offline (línea 75).

```js
// Instalación: precachear recursos críticos.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar cachés antiguas.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});
```

**Explicación de las líneas 24–48:**

- **Línea 25** (`install`): al instalarse el SW se abre la caché y se ejecuta `addAll(PRECACHE_URLS)`.
- **Línea 29**: `addAll` es todo-o-nada: si una URL falla (p. ej. `favicon.ico` inexistente bajo el prefijo), la instalación completa falla y el SW no controla la página. `[RIESGO]` Funcional.
- **Línea 30** (`skipWaiting`): activa el SW nuevo sin esperar a que las pestañas abiertas se cierren.
- **Líneas 35–48** (`activate`): obtiene todas las claves de caché, elimina las que no sean `CACHE_NAME` (limpieza de versiones v1/v2…) y hace `clients.claim()` para que el SW controle clientes ya abiertos sin recargar.
- **Línea 42** (`filter(key => key !== CACHE_NAME)`): borra cualquier otra caché del origen; ojo: elimina también cachés de otras aplicaciones del mismo origen si las hubiera (no aplica hoy, el origen es de SafeAlert).

```js
// Fetch: assets con cache-first (ronda-corta de actualización) y
// navegaciones con network-first + fallback a caché para uso offline.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === 'navigate';
  const isAsset = url.pathname.startsWith(`${BASE_URL}/_expo/static/`) ||
    url.pathname.startsWith(`${BASE_URL}/icons/`) ||
    url.pathname.startsWith(`${BASE_URL}/assets/`) ||
    url.pathname.startsWith('/_expo/static/') ||
    /\.(js|css|png|jpg|jpeg|webp|svg|ico|ttf|woff2?)$/i.test(url.pathname);

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(`${BASE_URL}/`))
        )
    );
    return;
  }

  if (isAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
```

**Explicación de las líneas 50–97:**

- **Línea 52** (`fetch`): intercepta cada petición del ámbito controlado.
- **Líneas 53–54**: solo atiende `GET`; el resto (POST de Firebase, etc.) se deja pasar al navegador.
- **Líneas 56–57**: solo peticiones del mismo origen; peticiones cross-origin (Firebase, Mercado Pago, Sentry) no se cachean.
- **Líneas 59–64** (`isNavigation`/`isAsset`): clasificación. `isAsset` combina prefijos de Metro (`/_expo/static/`, `/icons/`, `/assets/`) y extensión de archivo. Se observa mezcla de comprobaciones con y sin `${BASE_URL}`: si el build se sirve en `/`, el SW nunca recibe rutas `/Claude_Code_trabajos/...` reales (y viceversa), por lo que parte de la clasificación queda muerta según el despliegue. `[OBSERVACIÓN TÉCNICA]`.
- **Líneas 66–79** (navegación, network-first): intenta red primero; en éxito clona la respuesta y la guarda en caché (líneas 70–71) y devuelve la respuesta viva; en fallo de red busca en caché la URL navegada y, si no está, el HTML raíz `${BASE_URL}/` (líneas 74–76). Permite abrir la app offline tras la primera visita.
- **Línea 71**: `cache.put(request, clone)` con clave = petición original; correcto.
- **Líneas 81–96** (assets, cache-first con revalidación): devuelve la copia en caché si existe y, en paralelo, lanza `fetch` para refrescar la copia si `response.ok` (líneas 84–92); si no hay caché, devuelve la respuesta de red; si la red falla y no hay caché, resuelve `undefined` (el navegador genera el error de red).
- **Líneas 93**: `return cached || network;` — el patrón "stale-while-revalidate": el usuario recibe lo cacheado y la copia nueva se guarda para la próxima visita.
- **Líneas 96–97**: si la petición no es ni navegación ni asset (p. ej. API JSON), no se intercepta (pasa por red normal). Comportamiento razonable.

## Fichas de funciones y métodos

### addEventListener('install') (líneas 25–32)
- Firma: `self.addEventListener('install', (event) => { ... })`.
- Propósito técnico: precachear recursos críticos y activar el SW inmediatamente.
- Parámetros: `event` (InstallEvent) con `waitUntil`.
- Retorno: ninguno (promesa registrada en `waitUntil`).
- Excepciones: si `addAll` rechaza (algún recurso 404), la instalación se aborta.
- Dependencias: `caches`, `CACHE_NAME`, `PRECACHE_URLS`.
- Flujo: abrir caché → `addAll` → `skipWaiting`.
- Efectos secundarios: escritura en Cache Storage; riesgo de instalación fallida si un precache no existe.

### addEventListener('activate') (líneas 35–48)
- Firma: `self.addEventListener('activate', (event) => { ... })`.
- Propósito: depurar cachés obsoletas y tomar control de clientes.
- Flujo: listar claves → borrar las ajenas a `CACHE_NAME` → `clients.claim()`.
- Efectos secundarios: borrado destructivo de cualquier caché no `v3` del origen.

### addEventListener('fetch') (líneas 52–96)
- Firma: `self.addEventListener('fetch', (event) => { ... })`.
- Propósito: aplicar estrategias network-first (navegación) y stale-while-revalidate (assets).
- Parámetros: `event` (FetchEvent) con `request`.
- Retorno: `event.respondWith(...)` con promesa de Response.
- Efectos secundarios: escritura de respuestas en caché; sin invalidación programática por versión de bundle (confía en URLs con hash de Metro).

## Clases / interfaces / tipos

No aplica (JS plano). Tipos implícitos del estándar Service Worker.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (líneas 14–22, 60–64): `BASE_URL` hardcodeado `/Claude_Code_trabajos/safealert` vs. registro real `'/sw.js'` scope `'/'` en `app/+html.tsx`. Según el origen de despliegue, precache y clasificación de assets apuntan a rutas inexistentes. `[NIVEL DE CERTEZA: Confirmado por código]`.
- `[OBSERVACIÓN TÉCNICA]` (línea 21): precache de `/favicon.ico` inexistente en `public/`; puede romper la instalación del SW en despliegues donde no se genere favicon en `dist` bajo ese path. `[NIVEL DE CERTEZA: Inferido]`.
- `[NOTA]`: la estrategia no invalida caché por contenido (los assets Metro llevan hash en nombre; el HTML raíz no, por lo que la navegación network-first mitiga el HTML viejo pero el precache de `${BASE_URL}/` puede quedar obsoleto).
- `[NOTA]`: no se incluyen rutas de Firebase/Sentry en el SW (correcto: cross-origin).

## Seguridad

- `[INFORMATIVO]` (línea 14): el prefijo revela en el artefacto público el nombre de la carpeta/repositorio local del desarrollador y su esquema GitHub Pages.
- `[INFORMATIVO]`: solo se cachean peticiones GET del mismo origen; no se cachean respuestas con credenciales ni datos de usuario.
- No se detectan autenticación, validación de entrada ni logging de datos personales. El SW no lee `postMessage` ni acepta comandos externos.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Alto funcional: incoherencia de `BASE_URL` entre `sw.js`/`manifest.json`/`deploy-ghpages.ps1` (subdirectorio) y `app.json`/`+html.tsx` (raíz). Si el build se sirve en `/`, el `install` fallará (precache 404) o la PWA no cargará offline.
- `[RIESGO]` Medio: `cache.addAll` todo-o-nada con `favicon.ico` dudoso; un solo 404 impide que el SW controle la página (la app seguirá funcionando en línea, pero sin offline).
- `[RECOMENDACIÓN]`: parametrizar la base (p. ej. `self.registration.scope` o constante inyectada en build) y alinear con `experiments.baseUrl`; verificar que los 6 precaches existen tras `expo export`.
- `[RECOMENDACIÓN]`: considerar invalidación por versión de precache o estrategia runtime para el HTML raíz.
