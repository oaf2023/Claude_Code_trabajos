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
