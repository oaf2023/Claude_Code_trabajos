# Archivo: server.log — mini-ficha

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | server.log (raíz del proyecto) |
| Líneas totales | 22 |
| Lenguaje | Texto (log de servidor HTTP) |
| Tamaño (bytes) | 1 144 |
| Categoría | Log de ejecución (artefacto de diagnóstico del servidor local 5800) |
| Estado detectado | CÓDIGO LEGADO — registro de una sesión pasada |
| Nivel de certeza | Altamente probable |

## Mini-ficha

| Campo | Contenido |
| --- | --- |
| Archivo | server.log |
| Líneas | 22 |
| Qué hace | Registro de una sesión de un servidor HTTP local con logging de peticiones, en el puerto 5800, durante el 2026-08-26 entre 16:42 y 16:44 UTC. Documenta la carga del build web de SafeAlert: peticiones a `/index.html` y a tres bundles de Metro (`/_expo/static/js/web/__expo-metro-runtime-*.js`, `__common-*.js`, `index-*.js` de ~2,19 MB el mayor), todas respondidas 200 con tamaños en bytes. Se observa que el segundo `index.html` (16:43:34) pesa más (2 098 bytes vs. 1 558), coherente con la inyección de etiquetas PWA/polyfills realizada por el post-procesador entre ambas cargas |
| Secretos encontrados | Ninguno. Solo rutas de assets públicos, tamaños y marcas de tiempo. No hay tokens, cabeceras de autorización, IPs de clientes ni datos personales |
| Estado | CÓDIGO LEGADO / APARENTEMENTE NO UTILIZADO [NIVEL DE CERTEZA: Altamente probable] — log de una sesión puntual, sin consumidores |

## Análisis del contenido

```text
[2026-08-26T16:42:03.283Z] Server started
[2026-08-26T16:42:03.294Z] Listening on 5800
[2026-08-26T16:42:06.247Z] GET /index.html
  -> 200 (1558 bytes)
[2026-08-26T16:42:18.862Z] GET /index.html
  -> 200 (1558 bytes)
[2026-08-26T16:42:18.885Z] GET /_expo/static/js/web/__expo-metro-runtime-ea47b717f89e3e290956da6f9acce0d9.js
[2026-08-26T16:42:18.887Z] GET /_expo/static/js/web/__common-42cd7c92281bbc8b468392f997e6545a.js
[2026-08-26T16:42:18.889Z] GET /_expo/static/js/web/index-25ac43976e78112dfee17af46fe8ccb4.js
  -> 200 (10145 bytes)
  -> 200 (2244 bytes)
  -> 200 (2194710 bytes)
[2026-08-26T16:43:34.886Z] GET /index.html
  -> 200 (2098 bytes)
[2026-08-26T16:43:34.909Z] GET /_expo/static/js/web/__expo-metro-runtime-ea47b717f89e3e290956da6f9acce0d9.js
[2026-08-26T16:43:34.912Z] GET /_expo/static/js/web/__common-42cd7c92281bbc8b468392f997e6545a.js
[2026-08-26T16:43:34.914Z] GET /_expo/static/js/web/index-25ac43976e78112dfee17af46fe8ccb4.js
  -> 200 (10145 bytes)
  -> 200 (2244 bytes)
  -> 200 (2194710 bytes)
[2026-08-26T16:44:40.107Z] GET /_expo/static/js/web/__common-42cd7c92281bbc8b468392f997e6545a.js
  -> 200 (2194710 bytes)
```

**Explicación de las líneas 1–22:**

- **Líneas 1–2**: arranque del servidor y escucha en el puerto 5800 (el mismo puerto de `scripts/serve.js`, de `npx serve` en `web:serve` y de los `diag*.mjs`).
- **Líneas 3–4**: primera carga de `/index.html` (1 558 bytes) — build sin etiquetas PWA inyectadas aún.
- **Líneas 5–12**: segunda carga de `index.html` seguida de los tres bundles de Metro (runtime, common e index), con respuestas 200: 10 145 / 2 244 / 2 194 710 bytes (~2,19 MB el bundle `index`). La carga del navegador solicita los tres en el mismo instante.
- **Líneas 13–20**: nueva recarga del `index.html` (ahora 2 098 bytes: +540 bytes respecto de la primera, coherente con la inyección del bloque PWA/polyfill/registro SW por el post-procesador, p. ej. `scripts/patch-import-meta.js`/`fix-pwa-build.js`), seguida de los tres bundles con los mismos hashes y tamaños.
- **Líneas 21–22**: petición aislada del bundle `__common-*.js` (2 194 710 bytes) un minuto después, posiblemente de un `diag*.mjs` re-ejecutando la carga o de una recarga parcial.

`[OBSERVACIÓN TÉCNICA]` (líneas 18–22): el orden de las líneas de respuesta sugiere que el log asocia las tres respuestas 200 (10 145/2 244/2 194 710) a las tres peticiones previas, pero la línea 22 repite el tamaño 2 194 710 atribuido antes a `index-*.js` mientras el path es `__common-*.js`; el formato de logging agrupa las respuestas desfasadas respecto de las peticiones (probable escritura diferida o intercalada del logger), por lo que la correspondencia exacta path→bytes no es del todo fiable. `[NIVEL DE CERTEZA: Inferido]`.

- `[NOTA]`: este log NO fue producido por `scripts/serve.js`, que no registra peticiones (solo imprime la URL al arrancar); corresponde a un servidor con logging de requests (p. ej. `npx serve` con logs o un wrapper de diagnóstico de la época). `[NIVEL DE CERTEZA: Inferido]`.
- `[NOTA]`: la fecha coincide con la cabecera de `scripts/patch-import-meta.js` (2026-08-26) y con los `diag*.mjs`: es evidencia de la sesión de diagnóstico del arranque PWA.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]`: el log confirma que el build web se sirvió por HTTP en el puerto 5800 y que los bundles se cargaron con éxito (200) en esa sesión; complementa la cronología del diagnóstico PWA (diag*.mjs, fix-pwa-build.js, patch-import-meta.js).
- `[POTENCIALMENTE NO UTILIZADO]`: ningún proceso lo escribe hoy ni lo consume; es un artefacto residual en la raíz del proyecto.

## Seguridad

- `[INFORMATIVO]`: el log no contiene datos sensibles: sin IPs de clientes, sin user-agents, sin cabeceras, sin tokens, sin rutas de archivos de usuario. Expone únicamente nombres de assets públicos del build y sus tamaños.
- Sin hallazgos CRÍTICO/ALTO/MEDIO. `[NIVEL DE CERTEZA: Confirmado por código]` (revisión de las 22 líneas).

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: un log de servidor en la raíz puede acumularse si se repite la práctica; conviene no versionarlo (revisar `.gitignore`) y ubicar logs futuros en una carpeta ignorada.
- `[RECOMENDACIÓN]`: conservarlo como evidencia histórica de la sesión de diagnóstico o eliminarlo; no aporta valor operativo vigente.
