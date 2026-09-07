# Archivo: scripts/patch-web-html.js

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | scripts/patch-web-html.js |
| Líneas totales | 32 |
| Lenguaje | JavaScript (Node.js, CommonJS) |
| Tamaño (bytes) | 1305 |
| Categoría | Script de build web (post-process del export estático de Expo) |
| Estado detectado | APARENTEMENTE NO UTILIZADO — reemplazado por scripts/patch-import-meta.js |
| Nivel de certeza | Confirmado por código |

## Objetivo

Post-build mínimo: inyecta en `dist/index.html` un polyfill inline de `import.meta` para evitar que zustand/redux (que referencian `import.meta.env.MODE`) crasheen cuando el bundle se ejecuta sin `type="module"`. Incluye la cabecera estándar y la descripción dice "se ejecuta después de expo export".

## Clasificación y estado

Etiqueta: `APARENTEMENTE NO UTILIZADO` con `[POTENCIALMENTE NO UTILIZADO]`.

El grep global no encontró ninguna referencia a `patch-web-html` fuera de sí mismo y de los inventarios generados (`documentacion_generada/`). `package.json` (línea 12) solo invoca `scripts/patch-import-meta.js` en `web:build`. Es un intento previo de solucionar el mismo problema que hoy resuelve `patch-import-meta.js` (bloque 1: sustitución de `import.meta`) y, complementariamente, `app/+html.tsx`. `[NIVEL DE CERTEZA: Confirmado por código]` en cuanto a ausencia de referencias; no puede afirmarse que sea eliminable sin confirmar que ningún pipeline externo/CI lo invoque (`[NIVEL DE CERTEZA: No determinado]` para su uso fuera del repo rastreado).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `fs` (node:fs) | estándar | Leer/escribir `dist/index.html` | Sí |
| `path` (node:path) | estándar | Resolver `dist/index.html` | Sí |

Sin dependencias externas.

## Componentes que dependen de este archivo

No se encontraron referencias en `package.json`, scripts de CI ni código de la app. `[POTENCIALMENTE NO UTILIZADO]` como herramienta; solo los inventarios de la auditoría lo listan.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| HTML_PATH | `path.resolve(__dirname, '..', 'dist', 'index.html')` | string | HTML a parchear | 15, 17–18, 22 |
| POLYFILL | `<script>if(typeof import.meta==="undefined"){import.meta={env:{MODE:"production"}}}</script>` | string | Snippet inyectado en `<head>` | 24, 29 |

## Estructura (funciones / clases / tipos)

Sin funciones (script main de nivel superior). Flujo: comprobar existencia del HTML → leer → comprobar si ya contiene `import.meta` → inyectar o saltar.

## Análisis línea por línea

```js
/* ============================================================================
 * Archivo         : scripts/patch-web-html.js
 * Descripción     : Post-build: inyecta polyfill import.meta en index.html
 *                   para que zustand/redux no crashee en bundles no-module.
 * Autor           : oafon
 * Fecha           : 2026-08-26
 * Versión         : 1.0.0
 * Lenguaje        : Node.js
 * Uso             : node scripts/patch-web-html.js (se ejecuta después de expo export)
 * ============================================================================ */

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.resolve(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(HTML_PATH)) {
  console.warn('[patch-web-html] dist/index.html no encontrado, saltando.');
  process.exit(0);
}

let html = fs.readFileSync(HTML_PATH, 'utf8');

const POLYFILL = `<script>if(typeof import.meta==="undefined"){import.meta={env:{MODE:"production"}}}</script>`;

if (html.includes('import.meta')) {
  console.log('[patch-web-html] import.meta polyfill ya presente, saltando.');
} else {
  html = html.replace('<head>', '<head>\n' + POLYFILL);
  fs.writeFileSync(HTML_PATH, html, 'utf8');
  console.log('[patch-web-html] Polyfill import.meta inyectado en dist/index.html');
}
```

**Explicación de las líneas 1–32:**

- **Líneas 1–10**: cabecera estándar (v1.0.0, 2026-08-26). El comentario de uso indica que se ejecuta tras `expo export`.
- **Líneas 12–13**: imports `fs` y `path`.
- **Línea 15**: `HTML_PATH` = `dist/index.html`.
- **Líneas 17–20**: si el HTML no existe, avisa y termina con código 0 (no rompe el pipeline).
- **Línea 22**: lee el HTML como texto UTF-8.
- **Línea 24** (`POLYFILL`): script inline que define `import.meta = {env:{MODE:"production"}}` solo si `import.meta` es `undefined`.
- **Línea 26**: guard por idempotencia: si el HTML ya menciona `import.meta`, se salta (evita doble inyección cuando el bundle ya fue parcheado o el polyfill se agregó antes).
- **Línea 27**: log de skip.
- **Líneas 28–31**: inyecta el snippet justo después de `<head>` y guarda el archivo.
- **Línea 32**: mensaje de éxito.

`[OBSERVACIÓN TÉCNICA]`: el polyfill define `import.meta` como objeto con solo `env.MODE`. `import.meta` en scripts clásicos es `undefined`/sintácticamente ilegal según el navegador; en scripts clásicos la *sintaxis* `import.meta` ni siquiera es válida (error de parseo) antes de que el polyfill corra, por lo que un polyfill inline no puede arreglar bundles que contengan la sintaxis `import.meta.*` literalmente (el parseo falla antes de ejecutar el polyfill). Por eso la solución efectiva terminó siendo la sustitución textual del bundle (`patch-import-meta.js` bloque 1 y `fix-pwa-build.js`) o marcar los scripts como `type="module"`. `[NIVEL DE CERTEZA: Altamente probable]`.

## Fichas de funciones y métodos

No aplica (sin funciones).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- `[POTENCIALMENTE NO UTILIZADO]`: sin referencias en `package.json`, CI o código; competidor superado de `patch-import-meta.js`.
- `[OBSERVACIÓN TÉCNICA]` (línea 24): el enfoque del polyfill inline es ineficaz frente a bundles con sintaxis `import.meta` literal en scripts clásicos (error de sintaxis previo a la ejecución), lo que explica su abandono.
- `[NOTA]`: escritura in-place sobre `dist/index.html`; no idempotente respecto a otros patchers que también tocan el mismo archivo (p. ej. `patch-import-meta.js` elimina `defer`), aunque el guard minimiza la duplicación.

## Seguridad

- `[INFORMATIVO]`: sin secretos, sin entrada de usuario, sin red. Escribe un snippet estático en el HTML de salida.
- No se detectan hallazgos clasificables.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: si se ejecutara junto a `patch-import-meta.js` en el mismo pipeline, ambos modifican `dist/index.html`; el orden importa (este script inserta tras `<head>`; el otro reemplaza `</head>`/`</body>` y quita `defer`).
- `[RECOMENDACIÓN]`: si se confirma que ningún pipeline lo invoca, marcarlo como candidato a eliminación o fusionarlo en `patch-import-meta.js`; nunca ejecutarlo en el `web:build` actual sin revisar interacción.
