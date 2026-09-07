# Archivo: scripts/serve.js

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | scripts/serve.js |
| Líneas totales | 59 |
| Lenguaje | JavaScript (Node.js, CommonJS) |
| Tamaño (bytes) | 1869 |
| Categoría | Servidor HTTP estático de desarrollo/previsualización |
| Estado detectado | APARENTEMENTE NO UTILIZADO en el pipeline actual (reemplazado por `npx serve`) |
| Nivel de certeza | Confirmado por código |

## Objetivo

Servidor HTTP estático mínimo para servir el build de producción (`dist/`) durante pruebas manuales de la PWA. Cabecera: "Usa lectura síncrona para evitar race conditions con archivos grandes (bundles de Metro)". Sirve cualquier archivo bajo `dist/` en el puerto 5800.

## Clasificación y estado

Etiqueta: `APARENTEMENTE NO UTILIZADO` en la configuración vigente, con evidencia de uso histórico.

`package.json` (línea 13) define `"web:serve": "npx serve dist -l 5800 --no-clipboard"` — usa el paquete `serve`, no este script. No hay otras referencias. Sin embargo, `server.log` (raíz) y los 17 `diag*.mjs` apuntan sistemáticamente a `http://localhost:5800`, por lo que el puerto 5800 fue el estándar de las sesiones de diagnóstico PWA; es probable que este script (o `npx serve`) se ejecutara manualmente entonces. `[NIVEL DE CERTEZA: Altamente probable]` para uso histórico manual; `[NIVEL DE CERTEZA: No determinado]` respecto a otros entornos.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `http` (node:http) | estándar | Creación del servidor | Sí |
| `fs` (node:fs) | estándar | Lectura síncrona de archivos | Sí |
| `path` (node:path) | estándar | Resolución y extensión de archivos | Sí |

Sin dependencias npm externas.

## Componentes que dependen de este archivo

Ninguno en el repo (sin referencias de `package.json`, scripts ni código de la app). Consumidores indirectos históricos: `server.log` y `diag*.mjs` (todos usan `http://localhost:5800`).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| DIST | `path.resolve(__dirname, '..', 'dist')` | string | Raíz de archivos servidos | 17, 38 |
| PORT | `5800` | number | Puerto de escucha | 18, 57 |
| MIME_TYPES | mapa extensión → content-type | object | Cabeceras por tipo | 20–32, 43 |
| server | `http.createServer(...)` | Server | Instancia HTTP | 34, 57 |

## Estructura (funciones / clases / tipos)

- Callback de petición HTTP (líneas 34–55), inline en `http.createServer`.
- Callback de arranque (líneas 57–59), inline en `server.listen`.
- Sin funciones nombradas ni clases.

## Análisis línea por línea

```js
/* ============================================================================
 * Archivo         : scripts/serve.js
 * Descripción     : Server HTTP estático para servir el build de producción.
 *                   Usa lectura síncrona para evitar race conditions con
 *                   archivos grandes (bundles de Metro).
 * Autor           : oafon
 * Fecha           : 2026-08-26
 * Versión         : 2.0.0
 * Lenguaje        : Node.js
 * Uso             : node scripts/serve.js
 * ============================================================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = 5800;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(DIST, urlPath);

  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`SafeAlert server running at http://localhost:${PORT}`);
});
```

**Explicación de las líneas 1–59:**

- **Líneas 1–11**: cabecera estándar (v2.0.0). El comentario de "lectura síncrona" justifica el diseño: evita condiciones de carrera percibidas con bundles grandes.
- **Líneas 13–15**: imports `http`, `fs`, `path`.
- **Línea 17**: `DIST` = carpeta `dist/` del proyecto (hermano de `scripts/`).
- **Línea 18**: puerto 5800 (mismo puerto que usan `web:serve` y los `diag*.mjs`).
- **Líneas 20–32**: mapa `MIME_TYPES` para tipos comunes de la PWA (HTML/JS/CSS/JSON/imágenes/fuentes). Los `.woff2` están correctamente mapeados.
- **Línea 34**: crea el servidor HTTP.
- **Línea 35**: toma la ruta del request descartando la query string (`split('?')[0]`).
- **Línea 36**: `/` se traduce a `/index.html`.
- **Línea 38**: `filePath = path.join(DIST, urlPath)`. `[RIESGO]` **Alto**: no hay saneo de `urlPath` (no se rechazan `..`, no se verifica que `filePath` quede bajo `DIST`). Una petición tipo `GET /../package.json` o `/%2e%2e/...` resuelve `path.join(DIST, '/../package.json')` = directorio padre de `dist`, leyendo archivos fuera del build (p. ej. `package.json`, `.env` si existiera en la raíz del proyecto). `[NIVEL DE CERTEZA: Confirmado por código]` (el servidor devuelve 200 con el contenido si el archivo existe; el `catch` solo cubre errores de lectura).
- **Líneas 40–50**: intenta leer el archivo de forma síncrona (`readFileSync`) — bloquea el event loop por request, aceptable para un servidor local de un solo usuario; calcula content-type por extensión (default `application/octet-stream`) y responde 200 con:
  - `Cache-Control: no-store, no-cache, must-revalidate` (fuerza recarga, correcto para previsualizar builds recientes),
  - `Access-Control-Allow-Origin: *` (CORS abierto; irrelevante para assets propios pero amplio si el server se expusiera).
- **Líneas 51–54**: en cualquier error de lectura responde 404 plano "Not found" (no distingue 403, 500, etc.; tampoco registra logs de peticiones).
- **Líneas 57–59**: escucha en `PORT` y loguea la URL.
- `[NOTA]`: no hay soporte SPA fallback: rutas de navegación distintas de `/` (p. ej. `/history` en refresh) devuelven 404, porque el build `web.output: "single"` de Expo genera un único `index.html` y este server no lo sirve como fallback. `[OBSERVACIÓN TÉCNICA]`.

## Fichas de funciones y métodos

### Callback de petición HTTP (líneas 34–55)
- Firma: `(req, res) => { ... }` (inline en `http.createServer`).
- Propósito técnico: servir archivos estáticos desde `DIST`.
- Parámetros: `req` (IncomingMessage), `res` (ServerResponse).
- Retorno: ninguno; escribe la respuesta.
- Excepciones: captura errores de `readFileSync` y responde 404.
- Flujo: parsear URL → mapear `/` → unir ruta → leer archivo → responder 200 o 404.
- Efectos secundarios y riesgos: lectura síncrona (bloqueante); path traversal posible (ver Seguridad).

### Callback de arranque (líneas 57–59)
- Firma: `() => { console.log(...) }`.
- Propósito: informar que el server está activo.
- Sin riesgos.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (línea 38): `path.join(DIST, urlPath)` permite escalar fuera de `DIST` mediante `..`; además, rutas absolutas tipo `//etc/passwd` (doble slash) se comportan distinto según plataforma. Servidor solo local, pero si se expone en LAN/red el impacto sube.
- `[OBSERVACIÓN TÉCNICA]` (líneas 40–50): `readFileSync` bloquea el event loop; con bundles Metro de ~2 MB (ver `server.log`) y múltiples peticiones simultáneas degrada el rendimiento (la cabecera del archivo lo acepta explícitamente como trade-off).
- `[NOTA]`: sin logs de acceso — el `server.log` de la raíz no proviene de este script (formato distinto: `[timestamp] GET ... -> 200 (bytes)`), sino de algún servidor con logging (¿`npx serve` con opción de logs?). `[NIVEL DE CERTEZA: Inferido]`.
- `[POTENCIALMENTE NO UTILIZADO]` frente a `web:serve` (`npx serve dist -l 5800`).

## Seguridad

- `[ALTO]` (línea 38): path traversal / directory escape — lectura de cualquier archivo legible por el proceso fuera de `dist/` (potencialmente `package.json`, `.env`, credenciales locales) si el servidor es alcanzable por terceros (LAN/red).
- `[INFORMATIVO]` (línea 48): `Access-Control-Allow-Origin: *` permite a cualquier origen leer las respuestas (sin credenciales no agrava, pero es innecesariamente amplio).
- `[BAJO]`: sin límite de tamaño de respuesta, sin timeouts ni rate limiting (servidor local de confianza).
- No hay autenticación ni logging de datos personales. Archivos servidos son assets públicos del build; el riesgo deriva del escape de ruta, no del contenido.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Alto si se expone el puerto 5800 más allá de localhost: path traversal.
- `[RECOMENDACIÓN]`: si se vuelve a usar, validar `urlPath` (rechazar `..`, `\`, `%2e`, rutas absolutas) o usar `path.resolve` + comprobar prefijo `DIST`; añadir fallback SPA a `index.html` y, opcionalmente, servir solo en `127.0.0.1`.
- `[RECOMENDACIÓN]`: mantener `npx serve` en `web:serve` (ya hace el fallback y saneo de rutas) o documentar cuál es el server canónico de previsualización para evitar la duplicidad.
