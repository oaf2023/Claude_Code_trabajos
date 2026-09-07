# Archivo: safealert_ui*.xml + safealert_contacts_ui.xml (9 snapshots de UI Android) — grupo

## Metadatos del grupo

| Campo | Valor |
| --- | --- |
| Ruta | raíz del proyecto: safealert_ui.xml, safealert_ui2.xml, safealert_ui3.xml, safealert_ui_check.xml, safealert_ui_now.xml, safealert_ui_ok.xml, safealert_ui_postfix.xml, safealert_ui_retry.xml, safealert_contacts_ui.xml |
| Líneas totales | 9 (cada archivo es 1 línea XML minificado) |
| Tamaño total (bytes) | 75 132 |
| Lenguaje | XML (dump de jerarquía UI de Android — formato `uiautomator dump`) |
| Categoría | Snapshots legados de diagnóstico de UI (emulador Android) |
| Estado detectado | CÓDIGO LEGADO — aparentemente no utilizados |
| Nivel de certeza | Altamente probable |

## Objetivo del grupo

Capturas de la jerarquía de vistas de Android (`<hierarchy>`) obtenidas con la herramienta estándar `uiautomator dump` (o `adb shell uiautomator dump`) durante pruebas del emulador, para inspeccionar visualmente el estado de la app SafeAlert en distintas condiciones: errores de conexión con Metro, pantalla principal con modo guardia, diálogos ANR ("App no responde") del sistema y el launcher. Cada archivo es XML de una sola línea sin saltos (volcado crudo). No son consumidos por ninguna parte del proyecto. `[NIVEL DE CERTEZA: Confirmado por código]` (grep global solo los halla en inventarios generados).

## Contenido técnico común

- Raíz: `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?><hierarchy rotation="0">...`.
- Nodos `<node ...>` con atributos: `index`, `text`, `resource-id`, `class`, `package`, `content-desc`, flags (`checkable/checked/clickable/enabled/focusable/focused/scrollable/long-clickable/password/selected`), `bounds="[x1,y1][x2,y2]"` (resolución del emulador 1080x2400), `drawing-order`, `hint`.
- Los `text` pueden contener entidades XML y saltos escapados (`&#10;` para nuevas líneas), p. ej. stack traces de Java.
- Paquetes observados: `com.safealert.app` (la app), `android` (diálogos del sistema), `com.android.launcher3` (launcher).

## Tabla resumen de las 9 mini-fichas

| Archivo | Líneas | Nodos | Paquete raíz | ¿Qué muestra? | Secretos | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| safealert_ui.xml | 1 | 19 | com.safealert.app | Pantalla de error del development build: `SocketTimeoutException` al conectar con Metro `10.0.2.2:8081` (stack trace OkHttp completo), botones "Reload" y "Go To Home" | Ninguno (IP interna de emulador 10.0.2.2/10.0.2.16) | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| safealert_ui2.xml | 1 | 19 | com.safealert.app | Error de desarrollo: `java.io.IOException: unexpected end of stream on http://localhost:8081/...` + EOFException OkHttp, botones Reload/Go To Home | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| safealert_ui3.xml | 1 | 19 | com.safealert.app | Error de desarrollo similar a ui2 pero contra `http://127.0.0.1:8081/...` | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| safealert_ui_check.xml | 1 | 65 | com.safealert.app | Pantalla Home real de la app: "SafeAlert", "Modo guardia INACTIVO", botón "ACTIVAR GUARDIA", "Sin contactos de confianza — Toca para agregar", "ENVIAR ALERTA AHORA", "Probar alerta (sin SMS real)", palabras de activación (ayuda/socorro/auxilio), "Personalizar", tabs Inicio/Contactos/Config | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| safealert_ui_now.xml | 1 | 12 | android | Diálogo ANR del sistema: "SafeAlert isn't responding" con opciones "Close app"/"Wait" (resource-ids `aerr_close`/`aerr_wait`) | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| safealert_ui_ok.xml | 1 | 14 | com.safealert.app | Captura con texto vacío y `content-desc="Tools"` (probablemente el action bar de la app tras arranque "OK"); sin texto visible adicional | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Inferido] |
| safealert_ui_postfix.xml | 1 | 12 | android | Diálogo ANR del sistema: "Process system isn't responding" ("Close app"/"Wait") — mismo layout que ui_retry | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| safealert_ui_retry.xml | 1 | 12 | android | Diálogo ANR del sistema: "Process system isn't responding" (bounds casi idénticos a ui_postfix: [28,1013][1052,1519]) | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] |
| safealert_contacts_ui.xml | 1 | 26 | com.android.launcher3 | Launcher Android (Home) con apps Gallery/Phone/Messaging/WebView Browser Tester/Camera; sin SafeAlert visible; probable captura durante la prueba del selector de contactos | Ninguno | CÓDIGO LEGADO [NIVEL DE CERTEZA: Inferido] |

## Notas por archivo (detalle)

### safealert_ui.xml (1 línea, 9 396 bytes, 19 nodos)
- Contenido relevante (textos): "There was a problem loading the project." / "This development build encountered the following error." / `java.net.SocketTimeoutException: failed to connect to /10.0.2.2 (port 8081) from /10.0.2.16 (port 48816) after 10000ms` + stack trace OkHttp completo (connect → okhttp3 RealConnection → ExchangeFinder…). Botones: "Reload", "Go To Home".
- Interpretación: el development build del emulador no pudo alcanzar el servidor Metro en `10.0.2.2:8081` (host del emulador Android).
- Secretos: ninguno. `[INFORMATIVO]`: IPs internas del emulador (10.0.2.2/10.0.2.16) no sensibles.

### safealert_ui2.xml (1 línea, 8 874 bytes, 19 nodos)
- Error: `java.io.IOException: unexpected end of stream on http://localhost:8081/...` con `Caused by: java.io.EOFException: \n not found: limit=0` (OkHttp/Okio). Botones Reload / Go To Home.
- Interpretación: mismo escenario de conexión con Metro pero con fallo de lectura HTTP (stream cortado) contra `localhost:8081`.

### safealert_ui3.xml (1 línea, 8 874 bytes, 19 nodos)
- Mismo error que ui2 pero contra `http://127.0.0.1:8081/...`. Tamaño idéntico a ui2 (8 874 bytes): variante de la misma captura cambiando el host probado.

### safealert_ui_check.xml (1 línea, 23 426 bytes, 65 nodos)
- Captura de la pantalla principal REAL de SafeAlert (la más rica del grupo). Textos: "SafeAlert", "Modo guardia INACTIVO", iconos/emojis, "ACTIVAR GUARDIA", "Sin contactos de confianza", "Toca para agregar contactos", "ENVIAR ALERTA AHORA" ("Envía tu ubicación inmediatamente"), "Probar alerta (sin SMS real)", "Palabras de activación", lista "ayuda | socorro | auxilio", "Personalizar", tabs "Inicio/Contactos/Config". `content-desc` relevantes: "Activar modo guardia", "Abrir gestión de contactos", "Enviar alerta SOS ahora", "Abrir prueba de alerta", "Abrir ajustes de activación por voz".
- Interpretación: corresponde al Home de la app con guardia apagada, sin contactos cargados; útil como evidencia del estado esperado de la UI.
- `[NOTA]` (privacidad): sin datos personales; muestra solo textos de interfaz.

### safealert_ui_now.xml (1 línea, 4 463 bytes, 12 nodos)
- Diálogo ANR: "SafeAlert isn't responding", botones "Close app"/"Wait" (`resource-id` `android:id/aerr_close`, `android:id/aerr_wait`). Package `android`.
- Interpretación: la app dejó de responder (probablemente durante las pruebas del arranque PWA/diagnósticos de la época).

### safealert_ui_ok.xml (1 línea, 5 079 bytes, 14 nodos)
- Package `com.safealert.app`; nodos sin texto; único `content-desc` no vacío: "Tools". `bounds` 1080x2400.
- `[OBSERVACIÓN TÉCNICA]`: el nombre del archivo sugiere una captura "OK" tras arranque correcto, pero el contenido no muestra textos de la app; el `content-desc="Tools"` parece corresponder a la action bar/toolbar. Interpretación: `[NIVEL DE CERTEZA: Inferido]`.

### safealert_ui_postfix.xml (1 línea, 4 469 bytes, 12 nodos)
- Diálogo ANR del sistema: "Process system isn't responding", botones Close app/Wait (ids `aerr_*`). bounds [28,1013][1052,1519].
- Interpretación: el propio proceso del sistema Android se colgó (no solo SafeAlert).

### safealert_ui_retry.xml (1 línea, 4 469 bytes, 12 nodos)
- Prácticamente idéntico a ui_postfix (bounds y tamaño iguales): "Process system isn't responding". Nombre sugiere captura en un reintento posterior del mismo problema.

### safealert_contacts_ui.xml (1 línea, 10 018 bytes, 26 nodos)
- Launcher Android (package `com.android.launcher3`): workspace con apps "Gallery", "Phone", "Messaging", "WebView Browser Tester", "Camera"; `content-desc`: Search/Gallery/Home/Phone/… ; resource-ids del launcher (`launcher`, `drag_layer`, `workspace`, `hotseat`, `qsb_widget`…).
- Interpretación: captura del Home del emulador; probablemente tomada mientras se probaba el flujo de selección de contactos (o tras cerrar/fallar la app). `[NIVEL DE CERTEZA: Inferido]`.

## Fichas de funciones y métodos

No aplica: los archivos son datos estáticos (volcados XML), no código ejecutable.

## Clases / interfaces / tipos

No aplica en sentido de código. Los nodos XML describen vistas Android (`android.widget.FrameLayout`, `LinearLayout`, `ComposeView` en la app, etc.). En `safealert_ui*.xml` (app) aparece `androidx.compose.ui.platform.ComposeView`, indicando que en esa época la vista raíz usaba Compose (librería de terceros de la UI de error del dev build de Expo/RN).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]`: los archivos ui/ui2/ui3 evidencian una fase de desarrollo en la que el emulador no conectaba con Metro (puertos/hosts 8081 probados: `10.0.2.2`, `localhost`, `127.0.0.1`).
- `[OBSERVACIÓN TÉCNICA]`: ui_now/ui_postfix/ui_retry documentan ANR del sistema/la app durante pruebas; correlaciona con la época de inestabilidad que motivó los `diag*.mjs` y `server.log`.
- `[NOTA]`: XML de una sola línea, sin indentación (volcado directo de `uiautomator`); difícil de revisar manualmente pero válido.
- `[POTENCIALMENTE NO UTILIZADO]`: sin referencias; conservados como evidencia de pruebas de UI en emulador.

## Seguridad

- `[INFORMATIVO]` (ui.xml): el stack trace expone IPs internas del emulador y nombres de clases de librerías (OkHttp/Okio); sin datos de usuario.
- `[INFORMATIVO]`: el resto de snapshots no contiene textos con datos personales (teléfonos, ubicaciones, contactos reales). No se detectaron secretos (tokens, claves) en ninguno de los 9 archivos. `[NIVEL DE CERTEZA: Confirmado por código]` (revisión de atributos `text`/`content-desc` extraídos).
- Clasificación general: sin hallazgos CRÍTICO/ALTO/MEDIO.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: si se reutilizan como referencia visual, pueden confundir (estados de error/ANR antiguos que ya no aplican).
- `[RECOMENDACIÓN]`: conservarlos como evidencia histórica de las pruebas de UI (carpeta raíz, sin uso), o archivarlos fuera de la rama principal; no incorporarlos a documentación técnica vigente sin aclarar que corresponden a una fase superada (Metro/emulador, antes de la PWA estable).
