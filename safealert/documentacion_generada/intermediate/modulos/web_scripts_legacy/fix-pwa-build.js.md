# Archivo: fix-pwa-build.js

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | fix-pwa-build.js |
| Líneas totales | 85 |
| Lenguaje | JavaScript (Node.js, CommonJS) |
| Tamaño (bytes) | 3168 |
| Categoría | Script de build web (post-procesamiento del export estático de Expo) |
| Estado detectado | APARENTEMENTE NO UTILIZADO — superado por scripts/patch-import-meta.js |
| Nivel de certeza | Confirmado por código |

## Objetivo

Post-procesador recursivo del export web de Expo que corrige dos bugs de la PWA:
1. En los bundles JS reemplaza `import.meta.env` (usado por zustand devtools) por `process.env.NODE_ENV` (que Metro inyecta como literal "production"), porque el HTML carga el bundle sin `type="module"` y `import.meta` no es válido en scripts clásicos.
2. En los HTML marca los `<script src="*.js" defer>` como `<script type="module" ...>`.

Acepta el directorio destino como argumento (`node fix-pwa-build.js <distDir>`) y por defecto usa `./dist`.

## Clasificación y estado

Etiqueta: `APARENTEMENTE NO UTILIZADO` con `[POTENCIALMENTE NO UTILIZADO]`.

El grep global no halla ninguna referencia a `fix-pwa-build` fuera de sí mismo y de los inventarios/matrices generados por la auditoría (`documentacion_generada/`). `package.json` no lo invoca (su `web:build` llama a `scripts/patch-import-meta.js`). Todo indica que fue un intento previo de resolver el mismo problema `import.meta` del bundle (aproximación distinta: reemplazo por `process.env.NODE_ENV` y adición de `type="module"`), reemplazado por el patcher integrado. `[NIVEL DE CERTEZA: Confirmado por código]` para ausencia de referencias en el repo; `[NIVEL DE CERTEZA: No determinado]` respecto a uso externo/CI no rastreado.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `fs` (node:fs) | estándar | `walk`, `fixBundle`, `fixHtml` | Sí |
| `path` (node:path) | estándar | `walk`, relativo, extensiones | Sí |
| `process.argv` | estándar | Argumento `<distDir>` | Sí (con default) |

Sin dependencias npm.

## Componentes que dependen de este archivo

Ninguno en el repo (sin referencias en package.json/CI/código). `[POTENCIALMENTE NO UTILIZADO]`.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| distDir | `process.argv[2] \|\| path.join(__dirname, 'dist')` | string | Raíz del build a procesar | 23, 68 |
| bundlesFixed | 0 inicial | number | Contador de bundles corregidos | 69, 75 |
| htmlFixed | 0 inicial | number | Contador de HTML corregidos | 70, 80 |

## Estructura (funciones / clases / tipos)

- `walk(dir, files)` (líneas 25–32): recorrido recursivo de archivos.
- `fixBundle(file)` (líneas 34–52): reemplazos `import.meta.env` → `process.env.NODE_ENV`.
- `fixHtml(file)` (líneas 54–66): marca scripts del bundle como `module`.
- Main (líneas 68–85).

## Análisis línea por línea

```js
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
```

**Explicación de las líneas 1–52:**

- **Líneas 1–18**: cabecera estándar que documenta con precisión los dos bugs: `import.meta.env` de zustand devtools en bundle cargado sin `type="module"` (spinner rojo colgado), y la falta de `type="module"` en los `<script>` del export.
- **Líneas 20–21**: imports `fs`, `path`.
- **Línea 23**: `distDir` desde `argv[2]` o `./dist` junto al script (si el script estuviera en la raíz, coincide con `dist/` del proyecto).
- **Líneas 25–32** (`walk`): recorre recursivamente directorios con `readdirSync({withFileTypes:true})` y acumula rutas de archivos.
- **Líneas 34–52** (`fixBundle`):
  - **Línea 35**: lee el archivo completo.
  - **Línea 36**: cortocircuito si no contiene `import.meta`.
  - **Líneas 41–45**: cuatro reemplazos encadenados sobre el texto:
    1. `import.meta.env?import.meta.env.MODE:void 0` → `process.env.NODE_ENV` (patrón real de zustand devtools, con el ternario colapsado).
    2. Variante case-insensitive del mismo patrón (`/gi`).
    3. `import.meta.env.MODE` → `process.env.NODE_ENV`.
    4. Cualquier `import.meta.env` restante → `process.env.NODE_ENV`.
  - **Línea 47–51**: si hubo cambios, escribe el archivo y devuelve true.
  - `[NOTA]`: `process.env.NODE_ENV` es sustituido por Metro en build por su valor ("production"), así que el bundle final queda con un literal; si Metro no lo inyectara, en navegador `process` no existe y rompería (depende de esa premisa documentada en el comentario de las líneas 39–40).

```js
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
```

**Explicación de las líneas 54–85:**

- **Líneas 54–66** (`fixHtml`): regex que transforma `<script src="*.js" defer></script>` en `<script type="module" src="*.js" defer></script>`. Solo afecta scripts con `defer` y extensión `.js`; conserva otros.
- **Línea 68**: log del directorio procesado.
- **Líneas 69–70**: contadores.
- **Líneas 71–84**: itera sobre todos los archivos bajo `distDir` (recursivo, incluye subcarpetas); filtra `.js` → `fixBundle` y `.html` → `fixHtml`; registra cada cambio con la ruta relativa.
- **Línea 85**: resumen final.
- `[OBSERVACIÓN TÉCNICA]`: escribir de vuelta todos los archivos del build puede no ser idempotente en presencia de otros patchers (p. ej. `patch-import-meta.js` ya sustituyó `import.meta` y eliminó `defer`, por lo que `fixHtml` no encontraría `<script src="..." defer>` y `fixBundle` no hallaría `import.meta`; ejecutarlos en serie es inofensivo pero redundante).

## Fichas de funciones y métodos

### walk(dir, files) (líneas 25–32)
- Firma: `walk(dir, files = [])` → `string[]`.
- Propósito: listar recursivamente todos los archivos bajo `dir`.
- Parámetros: `dir` (string), `files` (array acumulador opcional).
- Retorno: array de rutas. Excepciones: propaga errores de `readdirSync`.
- Flujo: iterar entradas → recursión en directorios → acumular archivos.
- Uso: línea 71 (main).

### fixBundle(file) (líneas 34–52)
- Firma: `fixBundle(file)` → `boolean`.
- Propósito: sustituir usos de `import.meta.env` por `process.env.NODE_ENV` en un bundle JS.
- Parámetros: `file` (ruta). Retorno: `true` si modificó.
- Efectos secundarios: escritura in-place sobre el bundle.
- Riesgo: depende de que Metro haya inyectado `process.env.NODE_ENV`.

### fixHtml(file) (líneas 54–66)
- Firma: `fixHtml(file)` → `boolean`.
- Propósito: marcar como `type="module"` los `<script src="*.js" defer>`.
- Parámetros: `file` (ruta). Retorno: `true` si modificó.
- Efectos secundarios: escritura in-place sobre el HTML.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- `[POTENCIALMENTE NO UTILIZADO]`: sin referencias en `package.json`, CI ni código de la app; competidor superado por `scripts/patch-import-meta.js` (que además parchea stubs de módulos nativos y el HTML). `[NIVEL DE CERTEZA: Confirmado por código]` en el repo.
- `[NOTA]` (línea 45): el último reemplazo (`import.meta.env` → `process.env.NODE_ENV`) es más amplio que los anteriores y aplicaría a cualquier uso futuro de `import.meta.env` (p. ej. `import.meta.env.PUBLIC_*`), que quedaría erróneamente como `process.env.NODE_ENV`; a diferencia de `patch-import-meta.js`, no sustituye `import.meta` sin `.env`.
- `[NOTA]`: cabecera bien documentada (explica la causa raíz del bug del spinner rojo), útil como registro histórico de la investigación PWA (ver también `diag*.mjs`).

## Seguridad

- `[INFORMATIVO]`: sin secretos, sin red, sin entrada de usuario. Reescribe archivos del build en disco (riesgo operacional de integridad del artefacto si se ejecuta sobre un build ya publicado).
- No se detectan hallazgos clasificables.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: ejecutarlo junto a `patch-import-meta.js` es redundante pero no dañino; ejecutarlo como ÚNICO patcher sería insuficiente (no cubre TurboModuleRegistry/requireNativeModule ni trazas).
- `[RECOMENDACIÓN]`: archivarlo como documento histórico del fix PWA o eliminarlo tras confirmar que ningún flujo externo lo usa; no duplicar parches del mismo bug en dos scripts.
