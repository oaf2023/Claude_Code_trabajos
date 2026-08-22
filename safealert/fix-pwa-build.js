/* ============================================================================
 * Archivo         : fix-pwa-build.js
 * Descripción     : Post-procesamiento del export web estático de Expo.
 *                   Corrige dos bugs del export static que rompen la PWA en
 *                   navegadores/iOS:
 *                   1. El bundle contiene import.meta.env (zustand devtools)
 *                      pero el HTML lo carga sin type="module" -> "Cannot use
 *                      'import.meta' outside a module" -> app colgada en
 *                      spinner rojo.
 *                      Fix: reemplazar import.meta.env por process.env.NODE_ENV
 *                      (que Metro inyecta como "production").
 *                   2. Marcar los <script src> del bundle con type="module".
 * Autor           : oafon
 * Fecha           : 2026-08-22
 * Versión         : 1.0.0
 * Lenguaje        : Node.js
 * Uso             : node fix-pwa-build.js <distDir>
 * ============================================================================ */

const fs = require('fs');
const path = require('path');

const distDir = process.argv[2] || path.join(__dirname, 'dist');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = walk(full, files);
    else files.push(full);
  }
  return files;
}

function fixBundle(file) {
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes('import.meta')) return false;

  // Los usos reales son del middleware devtools de zustand:
  //   (import.meta.env ? import.meta.env.MODE : void 0)
  // process.env.NODE_ENV ya está inyectado por Metro como "production".
  const fixed = original
    .replace(/import\.meta\.env\?import\.meta\.env\.MODE:void 0/g, 'process.env.NODE_ENV')
    .replace(/import\.meta\.env\?import\.meta\.env\.MODE/gi, 'process.env.NODE_ENV')
    .replace(/import\.meta\.env\.MODE/g, 'process.env.NODE_ENV')
    .replace(/import\.meta\.env/g, 'process.env.NODE_ENV');

  if (fixed !== original) {
    fs.writeFileSync(file, fixed, 'utf8');
    return true;
  }
  return false;
}

function fixHtml(file) {
  const original = fs.readFileSync(file, 'utf8');
  // Marcar los scripts del bundle como module (el export de Expo no lo hace).
  const fixed = original.replace(
    /<script src="([^"]+\.js)" defer><\/script>/g,
    '<script type="module" src="$1" defer></script>'
  );
  if (fixed !== original) {
    fs.writeFileSync(file, fixed, 'utf8');
    return true;
  }
  return false;
}

console.log(`[fix-pwa-build] Dist: ${distDir}`);
let bundlesFixed = 0;
let htmlFixed = 0;
for (const file of walk(distDir)) {
  const rel = path.relative(distDir, file);
  if (/\.js$/.test(file)) {
    if (fixBundle(file)) {
      bundlesFixed++;
      console.log(`  [JS] import.meta corregido: ${rel}`);
    }
  } else if (/\.html$/.test(file)) {
    if (fixHtml(file)) {
      htmlFixed++;
      console.log(`  [HTML] script marcado como module: ${rel}`);
    }
  }
}
console.log(`[fix-pwa-build] Listo: ${bundlesFixed} bundles JS, ${htmlFixed} HTML corregidos.`);
