# Archivo: diag*.mjs (17 scripts de diagnóstico PWA) — grupo

## Metadatos del grupo

| Campo | Valor |
| --- | --- |
| Ruta | raíz del proyecto: diag.mjs, diag2.mjs … diag17.mjs |
| Líneas totales | 377 (suma de los 17 archivos) |
| Lenguaje | JavaScript (ESM, `.mjs`) |
| Tamaño total (bytes) | 12 496 |
| Categoría | Scripts legados de diagnóstico del arranque PWA (headless browser) |
| Estado detectado | CÓDIGO LEGADO — aparentemente no utilizados |
| Nivel de certeza | Altamente probable |

## Objetivo del grupo

Serie de 17 scripts de diagnóstico creados durante la investigación del arranque fallido de la PWA web de SafeAlert (época del "spinner rojo" por `import.meta`/módulos nativos; ver `fix-pwa-build.js`, `scripts/patch-import-meta.js`, `server.log`). Todos exportan la misma firma `export default async function run(page, ui)`, es decir, son módulos de diagnóstico que reciben un objeto `page` (API de navegador headless tipo Puppeteer/Playwright) y un segundo parámetro `ui` no usado en ningún caso. Apuntan a `http://localhost:5800` (el servidor de previsualización, ver `scripts/serve.js` y `server.log`), salvo diag7/diag10/diag16/diag17 que prueban páginas HTML auxiliares (`jstest.html`, `replaytest.html`, `reactest.html`) que hoy NO existen en el proyecto. `[NIVEL DE CERTEZA: Confirmado por código]` (páginas ausentes verificadas por glob; solo existe `informe_tecnico.html` en la raíz).

Ninguno contiene cabecera estándar del proyecto, ni `package.json`/script los invoca, ni tienen referencias externas (grep global solo los halla en inventarios generados). Evidencia de uso histórico: los archivos `screenshot.png`, `screenshot2.png`, `screenshot3.png` en la raíz fueron escritos por diag11/diag12/diag15.

## Estructura común

Cada archivo exporta una única función `run(page, ui)` que: (a) opcionalmente registra listeners de eventos de página (console, pageerror, requestfailed, crash) o sesiones CDP; (b) navega a una URL de prueba; (c) espera un tiempo fijo (`waitForTimeout` 2–45 s); (d) evalúa expresiones en el DOM (existencias de `__fbBatchedBridgeConfig`, `__d`/`__r` de Metro, `React`, contenido de `#root`, scripts, título); (e) devuelve un objeto con resultados.

## Tabla resumen de las 17 mini-fichas

| Archivo | Líneas | ¿Qué hace? | Secretos | Estado |
| --- | --- | --- | --- | --- |
| diag.mjs | 31 | Captura console/pageerror/requestfailed; carga localhost:5800; extrae innerHTML de #root, nº de scripts y body text | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag2.mjs | 39 | Inspecciona el primer `<script>` (src/defer/type), descarga el bundle por fetch y comprueba contenido (registerRoot/expo) | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag3.mjs | 33 | Escucha crash/console/pageerror; espera 15 s; examina #root (childNodes, fiber React, `_reactRootContainer`/`__reactContainer$`) y globals `__error`/`__expo_global__` | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag4.mjs | 34 | Comprueba el sistema de módulos Metro en runtime (`__d`, `__r`, `__BUNDLE_START_TIME__`, React/ReactDOM) e intenta `__r(0)` manual | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag5.mjs | 26 | Carga la página, espera 20 s y vuelca consola + estado de #root y scripts (src/type/defer) | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag6.mjs | 17 | Espera 30 s; evalúa `window.__polyfillSet`, `window.__fbBatchedBridgeConfig`, #root, bodyText, `__consoleLogs` | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag7.mjs | 16 | Navega a `jstest.html` (no existe hoy); comprueba `window.__JS_ENABLED__`, título y scripts | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Confirmado por código — página ausente] |
| diag8.mjs | 24 | Test A en `jstest.html` (JS habilitado) y Test B en la página principal (bridge `__fbBatchedBridgeConfig` y #root) | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag9.mjs | 17 | Carga `index.html?_=<timestamp>` (cache bust), espera 10 s, evalúa bridge/`__d`/#root/título | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag10.mjs | 16 | Navega a `replaytest.html` (no existe hoy); usa `page.mainFrame().evaluate`; evalúa bridge/`__d`/#root | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Confirmado por código — página ausente] |
| diag11.mjs | 18 | Espera 20 s; guarda captura `C:\Claude_Code_trabajos\safealert\screenshot.png` y vuelca HTML completo + #root | Ninguno (ruta local absoluta) | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag12.mjs | 18 | Espera 45 s; captura `screenshot2.png`; abre sesión CDP para capturar mensajes de consola (primeros 20) | Ninguno (captura console del sitio) | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag13.mjs | 23 | Habilita `Console.enable` por CDP; captura consola y pageerrors; espera 15 s tras networkidle | Ninguno (captura console del sitio) | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag14.mjs | 23 | CDP `Console.enable`; captura consola y pageerrors (stack truncado a 500); espera 5 s más | Ninguno (captura console del sitio) | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag15.mjs | 10 | Espera 30 s; captura `screenshot3.png`; vuelca #root (500) y body innerHTML (1000) | Ninguno (ruta local absoluta) | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| diag16.mjs | 16 | Navega a `reactest.html` (no existe hoy); evalúa título, #root, `React`, `__d`, `__r` | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Confirmado por código — página ausente] |
| diag17.mjs | 16 | Igual que diag16 pero además devuelve `window.location.href` | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Confirmado por código — página ausente] |

## Notas por archivo (detalle de las mini-fichas)

### diag.mjs (31 líneas)
- Exporta `run(page, ui)`. Registra `console` (errores aparte), `pageerror` y `requestfailed`; navega a `http://localhost:5800` con `networkidle` y timeout 60 s; espera 5 s; evalúa `#root` (primeros 500 caracteres), nº de `<script>` y `body.innerText` (500). Devuelve `{errors, logs(30), rootHTML, scriptCount, bodyText}`.
- Secretos: ninguno.
- Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag2.mjs (39 líneas)
- Inspecciona el primer `<script>` (src/defer/type/textLen); descarga su contenido por `fetch` (status/size/primeros 500/últimos 200); reintenta y comprueba `startsWith`, `includes('registerRoot')`, `includes('expo')`. Devuelve `{userAgent, jsEnabled, scriptSrc, bundleCheck, manualExec}`.
- Secretos: ninguno.
- Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag3.mjs (33 líneas)
- Listeners `crash`, `console`, `pageerror`, `requestfailed`; `goto` con `load`; espera 15 s (por scripts con defer); examina `#root` (childNodes, innerHTML 300, `_reactRootContainer`/`__reactContainer$`) y `window.__error`, `__expo_global__`, `__EXPO_GLOBAL__`.
- Secretos: ninguno. Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag4.mjs (34 líneas)
- Verifica runtime Metro (`__d`, `__r`, `__BUNDLE_START_TIME__`, `React`, `ReactDOM`) y ejecuta `__r(0)` manual capturando error/stack.
- Secretos: ninguno. Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag5.mjs (26 líneas)
- Listeners console/pageerror/crash; `goto` `load`; espera 20 s; devuelve `{events, state}` con childNodes/#root/bodyText/scripts/título.
- Secretos: ninguno. Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag6.mjs (17 líneas)
- Espera 30 s (el más largo de espera tras carga); evalúa `__polyfillSet`, `__fbBatchedBridgeConfig` (polyfill del puente RN), #root, bodyText, `__consoleLogs`.
- Secretos: ninguno. Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag7.mjs (16 líneas)
- Navega a `http://localhost:5800/jstest.html`. Evalúa `window.__JS_ENABLED__`, título, readyState, nº de scripts. La página de prueba no existe en el repo actual. `[OBSERVACIÓN TÉCNICA]`: hoy devolvería error de navegación/404.
- Secretos: ninguno. Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Confirmado por código — recurso ausente].

### diag8.mjs (24 líneas)
- Test A en `jstest.html`; Test B en la página principal (bridge + #root, JSON del bridge recortado a 100). Compara ambos para aislar si el problema era del bundle o del HTML.
- Secretos: ninguno. Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag9.mjs (17 líneas)
- Carga `index.html?_=<Date.now()>` para evitar caché; espera 10 s; evalúa bridge/`__d`/#root/título.
- Secretos: ninguno. Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag10.mjs (16 líneas)
- Navega a `replaytest.html` (no existe hoy); fuerza contexto con `page.mainFrame().evaluate`; evalúa bridge/`__d`/#root/título.
- Secretos: ninguno. Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Confirmado por código — recurso ausente].

### diag11.mjs (18 líneas)
- Espera 20 s; `page.screenshot` a `C:\Claude_Code_trabajos\safealert\screenshot.png` (fullPage) y `page.content()` completo + #root (500).
- `[NOTA]`/`[INFORMATIVO]` (seguridad): la ruta absoluta local del desarrollador queda codificada en el script; además el archivo `screenshot.png` generado existe en la raíz del repo.
- Secretos: ninguno. Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag12.mjs (18 líneas)
- Espera 45 s; captura `screenshot2.png`; abre sesión CDP (`newCDPSession`) y acumula `Console.messageAdded` (20) tras 5 s; devuelve título/rootLen/mensajes.
- `[NOTA]` (seguridad): captura mensajes de consola del sitio: si la app en desarrollo llegara a loguear tokens/Firebase en consola, estos quedarían en memoria del diagnóstico (no se persisten aquí). No contiene secretos hardcodeados.
- Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag13.mjs (23 líneas)
- CDP con `Console.enable` explícito antes de navegar; captura consola (30) y pageerrors (10); `networkidle` + 15 s.
- Igual nota de consola que diag12. Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag14.mjs (23 líneas)
- Variante de diag13: navega primero, habilita consola CDP después y espera 5 s adicionales; pageerrors truncados a 500 caracteres.
- Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag15.mjs (10 líneas)
- Espera 30 s; captura `screenshot3.png`; devuelve #root (500) y body.innerHTML (1000). Es el más corto.
- Ruta absoluta local codificada. Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable].

### diag16.mjs (16 líneas)
- Navega a `reactest.html` (no existe hoy); evalúa título/#root/`React`/`__d`/`__r`.
- Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Confirmado por código — recurso ausente].

### diag17.mjs (16 líneas)
- Idéntico a diag16 añadiendo `window.location.href`. Página `reactest.html` ausente.
- Estado: CÓDIGO LEGADO [NIVEL DE CERTEZA: Confirmado por código — recurso ausente].

## Fichas de funciones (comunes)

### run(page, ui) — en cada diagN.mjs (líneas 1..N)
- Firma: `export default async function run(page, ui) { ... }` (línea 1 en los 17 archivos; resto de líneas varía).
- Propósito técnico: gancho de diagnóstico ejecutado por un orquestador headless externo que provee `page`; devuelve observaciones del arranque de la PWA.
- Parámetros:

| Parámetro | Tipo | Finalidad |
| --- | --- | --- |
| page | Page (Puppeteer/Playwright-like) | Control del navegador headless |
| ui | sin usar en ninguno | Parámetro reservado; `[POTENCIALMENTE NO UTILIZADO]` |

- Retorno: objeto JSON-serializable con los resultados de cada prueba. Excepciones: ninguna manejada (propagarían al orquestador).
- Dependencias: `http://localhost:5800`, URLs de prueba auxiliares, API CDP, `page.evaluate`, `waitForTimeout` (API no estándar de Puppeteer; sugiere orquestador Puppeteer).
- Llamadas: solo desde el orquestador externo (no presente en el repo). Efectos secundarios: escritura de capturas de pantalla (diag11/12/15); nada más.

## Variables globales y constantes

- Por archivo: solo constantes locales dentro de `run` (`errors`, `logs`, `events`, `results`, `client`, etc.).
- URLs/constantes repetidas: `http://localhost:5800` (todos menos diag7/10/16/17 que usan páginas auxiliares), timeouts de espera 2 000–45 000 ms, rutas `C:\Claude_Code_trabajos\safealert\screenshot*.png` (diag11/12/15).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (17 archivos): dependen de un orquestador headless y de páginas HTML auxiliares (`jstest.html`, `replaytest.html`, `reactest.html`) que no existen en el estado actual del proyecto; solo reutilizables si se reconstruye ese entorno.
- `[OBSERVACIÓN TÉCNICA]` (diag7/10/16/17): navegarían a recursos inexistentes hoy (error 404), por lo que están funcionalmente obsoletos.
- `[OBSERVACIÓN TÉCNICA]` (diag12–14): el uso de sesiones CDP (`newCDPSession`) indica experimentación con captura de consola nativa del navegador.
- `[NOTA]`: la numeración 1–17 sin `diag1.mjs` (el primero es `diag.mjs`) es una convención de nombres inconsistente pero inocua.
- `[NOTA]` (privacidad/gobierno de datos): los snapshots de pantalla y los logs capturados podrían contener datos de la app (nombres, ubicaciones simuladas) si se ejecutaran contra un entorno con datos reales; en el uso registrado apuntan a un build local de prueba.
- `[POTENCIALMENTE NO UTILIZADO]`: ningún script del repo los invoca; se conservan como evidencia histórica del diagnóstico PWA (relacionados con `fix-pwa-build.js`, `patch-import-meta.js`, `server.log`).

## Seguridad

- `[INFORMATIVO]` (diag11/12/15): rutas absolutas locales del desarrollador hardcodeadas (`C:\Claude_Code_trabajos\safealert\screenshot*.png`); no son secretos, pero revelan el árbol de directorios de trabajo.
- `[INFORMATIVO]` (diag12–14): capturan mensajes de consola del sitio bajo prueba; no persisten nada por sí mismos. Ninguno contiene tokens ni claves hardcodeadas. `[NIVEL DE CERTEZA: Confirmado por código]`.
- No se detectan secretos. Clasificación general: sin hallazgos CRÍTICO/ALTO/MEDIO.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: si alguien ejecutara estos scripts contra una instancia con datos reales, los logs de consola capturados podrían incluir datos personales en memoria del diagnóstico.
- `[RECOMENDACIÓN]`: mantenerlos solo como referencia histórica de la solución PWA (o eliminarlos de la rama principal); no incorporarlos a pipelines.
- `[RECOMENDACIÓN]`: documentar en un único lugar (p. ej. este grupo) la cronología del diagnóstico: `fix-pwa-build.js` (2026-08-22) → `patch-web-html.js` → `patch-import-meta.js` v7 (2026-08-26) + `server.log`, que explica por qué existen 17 variantes de diagnóstico.
