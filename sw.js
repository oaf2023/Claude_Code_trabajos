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
