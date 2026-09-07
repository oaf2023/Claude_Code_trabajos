# Archivo: src/config/sentry.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/config/sentry.ts | 47 | TypeScript 5.9 | 1563 | Configuración / Crash reporting (Sentry) | FUNCIONALIDAD EXISTENTE (condicional a DSN) | Confirmado por código |

## Objetivo

Inicializa Sentry (crash reporting) en la app mediante efectos de importación
side-effect. El módulo lee el DSN de la variable `EXPO_PUBLIC_SENTRY_DSN`; si existe,
ejecuta `Sentry.init` con configuración de muestreo de trazas y un `beforeSend` que
redacta datos potencialmente sensibles de los eventos antes de enviarlos (Fase 2
según cabecera: redacción automática). Si no hay DSN, informa por consola y no
inicializa nada.

Se ejecuta una sola vez por la importación en `app/_layout.tsx` (`import * as Sentry
from '../src/config/sentry'`), que además recibe el objeto Sentry y el re-export
completo de `@sentry/react-native` para usar sus APIs en el resto de la app.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — importado y ejecutado por `app/_layout.tsx`
(línea 11) y presente también en el respaldo `app/_layout.tsx.bak`. La inicialización
efectiva depende de que `EXPO_PUBLIC_SENTRY_DSN` esté definida en el entorno de
compilación; sin ella el módulo queda inerte (no es un error).

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `* as Sentry` de `@sentry/react-native` | externa | init, beforeSend, default export, re-export | Sí |

`@sentry/react-native` es el SDK oficial de Sentry para React Native. El módulo lo
usa para inicializar y lo re-exporta entero (`export * from
'@sentry/react-native'`), de modo que los importadores obtienen el namespace
completo del SDK (Sentry.captureException, etc.) sin importar la librería dos veces.

## Componentes que dependen de este archivo

| Archivo dependiente | Forma de uso |
| --- | --- |
| app/_layout.tsx | `import * as Sentry from '../src/config/sentry';` (efecto side-effect de init + APIs) |
| app/_layout.tsx.bak | Mismo import (respaldo no activo) |

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| SENTRY_DSN | process.env.EXPO_PUBLIC_SENTRY_DSN o '' | string | Endpoint DSN de Sentry | Líneas 14-16 (condiciona el init) |

[SECRETO OCULTO] El DSN no es una clave de autenticación propiamente dicha (es un
endpoint público de ingesta), pero se considera información de configuración sensible
del proyecto: no se documenta su valor real. Se accede vía variable de entorno
`EXPO_PUBLIC_SENTRY_DSN` (incrustada en el bundle en tiempo de compilación).

También se usa `process.env.EXPO_PUBLIC_ENVIRONMENT` para el entorno reportado
(valores típicos: development/staging/production; default 'production').

## Estructura (funciones / clases / tipos)

- Inicialización imperativa a nivel de módulo (líneas 16-44).
- `export default Sentry` (línea 46) y `export * from '@sentry/react-native'`
  (línea 47).
- Callback `beforeSend` inline (líneas 21-40) — función de saneamiento de eventos.

## Análisis línea por línea

**Bloque líneas 1-19 (cabecera, import, DSN y apertura del init):**

```ts
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
```

**Explicación de las líneas 1-19:**
- **Líneas 1-10**: cabecera; la descripción menciona "redacción automática de datos
  sensibles (Fase 2)", es decir, este módulo implementa una fase de protección de
  datos en telemetría.
- **Línea 12**: import del SDK de Sentry React Native.
- **Línea 14**: lee el DSN del entorno público de Expo; '' si no existe.
- **Líneas 16-19**: solo si hay DSN se configura Sentry. `environment` distingue el
  entorno; `tracesSampleRate: 0.2` muestrea el 20% de las trazas para limitar
  coste/volumen.

**Bloque líneas 21-44 (beforeSend, cierre y rama sin DSN):**

```ts
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
```

**Explicación de las líneas 21-44:**
- **Línea 21**: `beforeSend` permite mutar cada evento antes del envío; aquí actúa
  como filtro de privacidad.
- **Líneas 22-24**: si el evento contiene datos de petición (`request.data`), los
  sustituye por el literal '[REDACTED]'. Esto evita que cuerpos de peticiones
  (potencialmente con datos personales) salgan del dispositivo.
- **Líneas 25-32**: clona los headers y elimina cabeceras sensibles por nombre:
  `Authorization`, `X-Sync-Secret`, `X-API-Key` e `X-Internal-Key` (esta última
  coincide con la clave interna del backend PythonAnywhere vista en `features.ts`).
  La clonación evita mutar el objeto original.
- **Líneas 33-38**: limpia migas de pan (breadcrumbs): reemplaza en el mensaje todo
  patrón `token=...` (hasta el primer espacio o `&`) por `token=REDACTED`, cubriendo
  tokens en query strings o textos de log.
- **Línea 39**: devuelve el evento saneado para su envío.
- **Líneas 42-44**: si no hay DSN, log informativo por consola (no falla la app) y el
  módulo queda sin inicializar.
- **Línea 46**: export default del objeto Sentry (comodidad para `import Sentry`).
- **Línea 47**: re-export del namespace completo del SDK, permitiendo a cualquier
  importador usar todas las APIs de Sentry a través de este módulo.

## Fichas de funciones y métodos

### beforeSend (líneas 21-40) — callback de Sentry.init

- Firma: `beforeSend: (event) => event` (tipo del SDK de Sentry).
- Propósito técnico: hook de transformación de eventos previo al envío. Propósito
  funcional: garantizar que datos sensibles de peticiones, headers y tokens no salgan
  del dispositivo hacia Sentry.
- Parámetros: `event` (evento de Sentry). Retorno: el mismo evento saneado.
- Dependencias: SDK de Sentry. Lo invoca internamente el SDK por cada evento.
- Efectos secundarios: mutación del evento (intencionada y acotada). Riesgos: si el
  SDK cambiara la forma del evento, la redacción podría dejar de aplicarse; conviene
  revisión al actualizar el SDK.

## Clases / interfaces / tipos

No define clases ni interfaces propias; usa los tipos del SDK de Sentry.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` El módulo se comporta como inicializador por efecto lateral;
  `app/_layout.tsx` lo importa con `import * as Sentry`, combinando init + uso.
- `[OBSERVACIÓN TÉCNICA]` La redacción cubre headers conocidos y query tokens, pero
  no es exhaustiva: otros datos personales dentro de mensajes de error (emails,
  coordenadas, textos de transcripción de voz) no se redactan en este hook. La
  grabación de audio de alertas y la transcripción podrían contener PII.
- `[OBSERVACIÓN TÉCNICA]` `tracesSampleRate: 0.2` fijo: en entornos de mucho volumen
  de alertas puede subir el coste de Sentry; es aceptable como arranque.
- `[NOTA]` La ausencia de DSN se reporta vía `console.log` en producción si la
  variable no se define: no es un secreto lo que se imprime.

## Seguridad

- `[BAJO]` El DSN (`EXPO_PUBLIC_SENTRY_DSN`) viaja en el bundle; el DSN es público
  por diseño en Sentry (solo permite ingesta), pero debe complementarse con allowlist
  de dominios si se desea evitar ingesta fraudulenta.
- `[MEDIO]` Si `beforeSend` no se mantiene al día con los nuevos campos del SDK o con
  nuevas cabeceras usadas por la app, podrían filtrarse datos de peticiones. Es un
  control de privacidad que requiere revisión periódica.
- `[INFORMATIVO]` La app declara cabeceras sensibles (`X-Sync-Secret`,
  `X-Internal-Key`, `X-API-Key`, `Authorization`): el simple hecho de que el código
  las elimine confirma que la app las envía en algún punto, por lo que la gestión de
  esos secretos debe seguir las mismas reglas de backend proxy.
- No se detecta logging de secretos adicional.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Medio: fuga potencial de PII vía breadcrumbs/mensajes de error no
  redactados (ubicación, transcripciones, datos personales).
  [RECOMENDACIÓN] Ampliar la redacción (p. ej. coordenadas lat/lon, números de
  teléfono, textos de audio) y definir explícitamente qué campos de datos de usuario
  pueden salir del dispositivo, alineado con DAMMA/DAMA-DMBOK (privacidad).
- `[RECOMENDACIÓN]` Configurar un `beforeSendTransaction` equivalente para trazas y
  revisar el `sampleRate` antes de producción.
- `[RECOMENDACIÓN]` Verificar en cada actualización del SDK de Sentry que el hook de
  redacción sigue aplicándose.
