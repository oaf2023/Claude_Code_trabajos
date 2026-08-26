/* ============================================================================
* Archivo         : +html.tsx
* Descripción     : Personalización del HTML raíz en build estático (web/PWA).
*                   Inyecta manifest.json, meta tags de instalación móvil
*                   (iOS/Android) y el registro del Service Worker.
* Autor           : oafon
* Fecha           : 2026-08-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9 (Expo Router)
* Uso             : Solo aplica en export web estático (app/+html.tsx).
* ============================================================================ */

import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Base pública del sitio (GitHub Pages sirve en subdirectorio).
// Se mantiene en sincronía con experiments.baseUrl de app.json.
const BASE_URL = '/';

const SW_REGISTER_SCRIPT = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('${BASE_URL}/sw.js', { scope: '${BASE_URL}/' }).catch(function (err) {
        console.warn('[SafeAlertPWA] No se pudo registrar el service worker:', err);
      });
    });
  }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />

        {/* PWA: manifest + metas de instalación móvil (rutas con base pública) */}
        <link rel="manifest" href={`${BASE_URL}/manifest.json`} />
        <meta name="theme-color" content="#DC2626" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SafeAlert" />
        <link rel="apple-touch-icon" href={`${BASE_URL}/icons/apple-touch-icon.png`} />
        <meta name="msapplication-TileColor" content="#DC2626" />
      </head>
      <body>
        {/* Polyfill: React Native Web necesita __fbBatchedBridgeConfig con remoteModuleConfig como array */}
        <script dangerouslySetInnerHTML={{ __html: "window.__fbBatchedBridgeConfig={remoteModuleConfig:[]};" }} />
        {children}
        {/* Registro del Service Worker para modo offline */}
        <script dangerouslySetInnerHTML={{ __html: SW_REGISTER_SCRIPT }} />
      </body>
    </html>
  );
}
