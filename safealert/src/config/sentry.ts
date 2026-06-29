/* ============================================================================
* Archivo         : sentry.ts
* Descripción     : Inicialización de Sentry para crash reporting con
*                   redacción automática de datos sensibles (Fase 2).
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : import './config/sentry' en _layout.tsx
* ============================================================================ */

import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'production',
    tracesSampleRate: 0.2,
    beforeSend: (event) => {
      if (event.request?.data) {
        event.request.data = '[REDACTED]';
      }
      if (event.request?.headers) {
        const safe = { ...event.request.headers };
        delete safe['Authorization'];
        delete safe['X-Sync-Secret'];
        delete safe['X-API-Key'];
        delete safe['X-Internal-Key'];
        event.request.headers = safe;
      }
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((b) => ({
          ...b,
          message: b.message?.replace(/token=[^&\s]+/gi, 'token=REDACTED'),
        }));
      }
      return event;
    },
  });
} else {
  console.log('[Sentry] DSN no configurado — crash reporting desactivado.');
}

export default Sentry;
export * from '@sentry/react-native';
