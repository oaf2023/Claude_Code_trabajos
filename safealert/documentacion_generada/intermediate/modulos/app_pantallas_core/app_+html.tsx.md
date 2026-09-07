# Archivo: app/+html.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| app/+html.tsx | 61 | TypeScript 5.9 / TSX (Expo Router, export web estático) | 2702 | Personalización del HTML raíz (solo web/PWA) | FUNCIONALIDAD EXISTENTE (solo build web) | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

`+html.tsx` es el archivo especial de expo-router que personaliza el documento HTML generado en el export estático (web/PWA). En SafeAlert inyecta: el `manifest.json` de la PWA, metadatos de instalación móvil para iOS/Android (Apple/theme color), un polyfill de React Native Web (`__fbBatchedBridgeConfig`) y el registro del Service Worker para funcionamiento offline. Especificado para el export web; no participa en los builds nativos (Android/iOS).

## Clasificación y estado

FUNCIONALIDAD EXISTENTE — [NIVEL DE CERTEZA: Confirmado por código]. La ruta `app/+html.tsx` es la convención oficial de expo-router para el HTML raíz en export estático. El archivo comenta que solo aplica en export web. Estado coherente con la PWA del proyecto (carpeta `public/` y `experiments.baseUrl` de `app.json` según comentario interno).

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `expo-router/html` (`ScrollViewStyleReset`) | Externa (Expo Router) | En `<head>` (línea 40) | Sí |
| `react` (`PropsWithChildren`) | Estándar (React 19) | Tipado de props del componente `Root` | Sí |

## Componentes que dependen de este archivo

Ningún import directo: expo-router usa `+html.tsx` automáticamente como envoltorio del documento HTML en export estático web. En plataformas nativas el archivo se ignora. [NIVEL DE CERTEZA: Confirmado por código].

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `BASE_URL` | `'/'` | string | Base pública del sitio para manifest, service worker e iconos | Líneas 18, 23, 43, 49 |
| `SW_REGISTER_SCRIPT` | Plantilla de script (usa `${BASE_URL}`) | string | Código inline de registro del Service Worker | Líneas 20–28, 57 |
| Color corporativo | `#DC2626` (rojo) | string | `theme-color` y `msapplication-TileColor` | Líneas 44, 50 |

## Estructura (funciones / clases / tipos)

- `Root({ children }: PropsWithChildren): JSX.Element` — componente exportado por defecto que renderiza `<html lang="es">`.
- Constante `SW_REGISTER_SCRIPT` (script embebido).
- Sin clases ni interfaces adicionales.

## Análisis línea por línea

**Bloque de las líneas 1–28 (cabecera, imports, `BASE_URL` y script del Service Worker):**

```tsx
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
```

**Explicación de las líneas 1–28:**

- **Líneas 1–11**: cabecera documental; aclara que el archivo solo aplica en export web estático.
- **Línea 13**: `ScrollViewStyleReset` — reseteo de estilos de scroll requerido por React Native Web.
- **Línea 14**: tipo `PropsWithChildren` para recibir los hijos (la app) que renderiza expo-router.
- **Líneas 16–18**: `BASE_URL = '/'`. El comentario indica que el sitio se sirve desde GitHub Pages en subdirectorio y que debe mantenerse en sincronía con `experiments.baseUrl` de `app.json`. [OBSERVACIÓN TÉCNICA] Con valor `'/'` la app solo funciona correctamente publicada en la raíz del dominio; si GitHub Pages sirve en un subdirectorio (p. ej. `/<repo>/`), el valor debería ser distinto. El comentario y el valor parecen contradictorios o dependen del despliegue real.
- **Líneas 20–28**: `SW_REGISTER_SCRIPT` — código JS como plantilla string. En `load` registra el Service Worker `sw.js` con `scope` la base pública; falla con `console.warn` y prefijo `[SafeAlertPWA]`. No expone secretos.

**Bloque de las líneas 30–61 (componente `Root` con `<head>` y `<body>`):**

```tsx
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
```

**Explicación de las líneas 30–61:**

- **Línea 30**: componente `Root` exportado por defecto; recibe `children` (la aplicación renderizada por expo-router).
- **Línea 32**: `<html lang="es">` — idioma declarado en español (accesibilidad y SEO).
- **Líneas 34–39**: `charset` UTF-8, compatibilidad con IE y `viewport` para instalación PWA (incluye `viewport-fit=cover` para notch).
- **Línea 40**: reset de estilos de scroll de React Native Web.
- **Líneas 43–50**: bloque PWA: vínculo al `manifest.json` y metas de instalación móvil; `theme-color` y `msapplication-TileColor` en el rojo corporativo `#DC2626`; soporte web-app-capable y Apple (título "SafeAlert", ícono `icons/apple-touch-icon.png`, barra de estado translúcida). Todos los recursos usan `BASE_URL`.
- **Líneas 52–58**: `<body>`: primero el polyfill `__fbBatchedBridgeConfig` con `remoteModuleConfig` como array (requisito de React Native Web), luego `{children}` y al final el script de registro del Service Worker.
- **Líneas 53–54 y 56–57**: uso de `dangerouslySetInnerHTML` con contenido estático controlado (ver Seguridad).
- **Línea 59**: cierre del documento. Texto visible en pantalla: ninguno (es estructura HTML raíz, no UI).

## Fichas de funciones y métodos

### Root (líneas 30–61)

- Firma: `export default function Root({ children }: PropsWithChildren): JSX.Element`
- Propósito técnico: envolver el contenido de la app en un documento HTML válido con cabecera PWA para el export estático web.
- Parámetros: `children` — nodos de React de la aplicación. Retorno: JSX de `<html>`.
- Dependencias: `ScrollViewStyleReset`, `SW_REGISTER_SCRIPT`, `BASE_URL`.
- Flujo: construye `head` (metadatos y manifest) y `body` (polyfill, hijos, registro de SW).
- Efectos secundarios: al cargar en navegador, registra el Service Worker (comportamiento offline) e inyecta el polyfill global `window.__fbBatchedBridgeConfig`.
- Riesgos: si `BASE_URL` no coincide con el despliegue real, el manifest, el SW y los iconos no cargan.

## Clases / interfaces / tipos

- `PropsWithChildren` (React) — tipo de props con `children`.
- Sin clases ni interfaces propias.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Líneas 16–18: el comentario menciona que GitHub Pages sirve en subdirectorio y que `BASE_URL` se mantiene sincronizado con `experiments.baseUrl` de `app.json`; sin embargo el valor es `'/'`. [NIVEL DE CERTEZA: No determinado] si el despliegue real usa la raíz del dominio o un subdirectorio; una discrepancia rompería manifest/SW/iconos.
- [OBSERVACIÓN TÉCNICA] El registro del SW se hace sobre `'load'` del `window`; la caché offline no se gestiona desde este archivo (depende de `sw.js` en `public/`), por lo que la estrategia de caché real queda fuera de este análisis.
- [NOTA] Sin `apple-mobile-web-app-status-bar-style` "black" conflictivo: usa `black-translucent`, correcto para PWA con UI oscura/roja.
- [NOTA] No hay contenido dinámico del usuario; el polyfill y el script son constantes estáticas.

## Seguridad

- [INFORMATIVO] `dangerouslySetInnerHTML` (líneas 54 y 57) inyecta HTML/JS en el documento. En este caso el contenido es estático y controlado por el código (no hay interpolación de entrada de usuario), por lo que el riesgo de XSS por esta vía es bajo. [NIVEL DE CERTEZA: Confirmado por código].
- [INFORMATIVO] El Service Worker se registra con `scope` derivado de `BASE_URL`; no se registran dominios externos ni se envían credenciales.
- [INFORMATIVO] No se detectan tokens, claves ni datos personales en el archivo.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] [RECOMENDACIÓN] Verificar que `BASE_URL` coincide con la URL real de publicación (raíz o subdirectorio) tanto aquí como en `experiments.baseUrl` de `app.json`; si se publica en subdirectorio, usar la base correspondiente en el manifest, el SW y los iconos.
- [RIESGO] [RECOMENDACIÓN] El bloqueo del registro del SW es silencioso en producción (solo `console.warn`): considerar un indicador de diagnóstico para depurar PWA en campo.
- [NOTA] Ninguna recomendación de seguridad adicional: no hay manipulación de entradas de usuario en este archivo.
