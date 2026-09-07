# Archivo: informe_tecnico.html — mini-ficha (informe antiguo)

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | informe_tecnico.html (raíz del proyecto) |
| Líneas totales | 848 |
| Lenguaje | HTML5 + CSS embebido (estático, sin JavaScript) |
| Tamaño (bytes) | 54 708 |
| Categoría | Informe/documento generado (reporte técnico autocontenido) |
| Estado detectado | CÓDIGO LEGADO — informe histórico desactualizado |
| Nivel de certeza | Altamente probable |

## Mini-ficha

| Campo | Contenido |
| --- | --- |
| Archivo | informe_tecnico.html |
| Líneas | 848 |
| Qué hace | Documento HTML autocontenido (estilos embebidos, sin JS) que resume el estado del proyecto SafeAlert a fecha de generación 2026-08-22, versión 1.2.0, "último commit 0024". Incluye 17 secciones: resumen ejecutivo con estadísticas (21 servicios, 11 pantallas, 67 tests OK, 36 commits, 82% cobertura en 6 archivos, 7 Cloud Functions), diagrama ASCII de arquitectura, flujo de alerta SOS, stack tecnológico, estructura del proyecto, plan maestro Fases 0–5 y A–C, pantallas/navegación, tabla de 21 servicios, stores Zustand, design system, backend Flask (endpoints y seguridad), Cloud Functions, CI/CD, tests, sección de i18n retirada, seguridad y privacidad, historial de 36 commits y próximos pasos |
| Secretos encontrados | Ninguno con valor real. El mensaje del commit "0012" (línea 792) menciona textualmente "token MP APP_USR- real" sin incluir el valor del token; se cita `[SECRETO OCULTO]` como referencia nominal, no como dato. Se nombran claves por rol (`AUDIO_ALERT_API_KEY`, `SAFEALERT_INTERNAL_KEY`, `X-Admin-Key`, `X-Internal-Key`, `X-API-Key`) sin valores |
| Estado | CÓDIGO LEGADO [NIVEL DE CERTEZA: Altamente probable] — sin referencias en el repo (grep solo lo halla en inventarios generados); informe puntual de la etapa "Fase A–C" |

## Detalle del contenido y análisis

### Estructura (líneas 1–848)

| Sección | Líneas aprox. | Contenido |
| --- | --- | --- |
| Cabecera + CSS | 1–152 | Estilos embebidos (paleta, tarjetas, badges, tablas, stats) |
| Header + navegación | 156–184 | Título "SafeAlert — Informe Técnico", generado 2026-08-22, v1.2.0, commit 0024; menú ancla a 17 secciones |
| 1. Resumen ejecutivo | 189–215 | Stats y badges de fases Completado (Fase 0–5, A, B, C) |
| 2. Arquitectura | 218–302 | Diagrama ASCII, flujo SOS, almacenamiento (Firestore/SQLite/AsyncStorage) |
| 3. Stack | 305–380 | Cards de frontend/backend/Firebase/voz/pagos/infraestructura/PWA |
| 4. Estructura del proyecto | 383–428 | Árbol de carpetas con comentarios (incluye `public/` PWA, `python/` legacy) |
| 5. Plan Maestro | 431–472 | Cards de Fases 0–5 + A–C |
| 6. Pantallas y navegación | 475–510 | Diagrama + tabla de rutas de expo-router |
| 7. Servicios (21) | 513–540 | Tabla de servicios con archivos y responsabilidades |
| 8. Stores Zustand | 543–553 | Persistencia y campos por store |
| 9. Design System | 556–573 | Tokens/componentes/principios |
| 10. Backend Flask | 576–624 | Endpoints (28 rutas), SQLite `safealert.db`/`safealert_tel.db`, seguridad |
| 11. Cloud Functions (7) | 627–640 | Triggers y propósito |
| 12. CI/CD | 643–682 | GitHub Actions + Cloud Run |
| 13. Tests | 685–709 | 67 tests, cobertura 81,92% statements (6 archivos), 31 tests Python |
| 14. i18n | 712–716 | Retirada en Fase B (código muerto) |
| 15. Seguridad | 719–769 | Firebase Auth, API keys, Sentry, privacidad, validación, permisos Android |
| 16. Commits | 772–805 | Lista de 36 commits (hash + mensaje); incluye resúmenes de Fases A–C |
| 17. Próximos pasos | 808–836 | Pendientes (deploy backend/functions/APK/subir commits) y features sugeridas |
| Footer | 840–848 | Cierre |

### Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]`: el informe refleja una arquitectura intermedia que ya no coincide con el estado actual del proyecto descrito en el contexto de auditoría: menciona backend en `PythonAnywhere` con `SQLite` y un wrapper `python/flask_app.py`, mientras la arquitectura vigente usa `backend/` Flask + MySQL desplegado en Cloud Run. Además lista carpetas/rutas (`python/`, `start-metro.ps1`) que pueden haber cambiado. `[NIVEL DE CERTEZA: Inferido]` (basado en el contexto de auditoría y en la existencia actual de `backend/`, `cloud-run/`, `admin/`).
- `[OBSERVACIÓN TÉCNICA]`: es HTML "documento" autocontenido (CSS embebido, `lang="es"`, meta viewport) pensado para abrirse en navegador o imprimirse; no es parte del sitio web servido.
- `[NOTA]`: los números de commits (0024 como último) y el recuento "36 commits total" son instantáneas; la línea 816 indica que el repo estaba "12 commits por delante de origin/main" en esa fecha.
- `[NOTA]`: el informe cita conceptos de seguridad ya implementados (IDOR cerrado, `require_firebase_auth` real, rate limiter, redacción de Sentry), útiles como registro histórico de la evolución del proyecto.
- `[POTENCIALMENTE NO UTILIZADO]`: ningún código lo referencia; documento de difusión interna.

### Seguridad

- `[INFORMATIVO]` (línea 792): un mensaje de commit del historial menciona "token MP APP_USR- real" (Mercado Pago). El documento no contiene el valor del token; se trata de una alusión textual. `[SECRETO OCULTO]` por precaución si el archivo se distribuye: no incluye claves, contraseñas ni datos personales de usuarios reales. `[NIVEL DE CERTEZA: Confirmado por código]` (revisión de líneas 776–805 y resto del documento).
- `[INFORMATIVO]`: nombra claves internas por rol (`SAFEALERT_INTERNAL_KEY`, `AUDIO_ALERT_API_KEY`, `X-Admin-Key`, etc.) y variables de entorno (`EXPO_PUBLIC_ENABLE_PAYMENTS_DEMO`, `PAYMENTS_ENABLED`) sin valores.
- Sin hallazgos CRÍTICO/ALTO/MEDIO.

### Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: al ser un informe desactualizado, su lectura como documentación vigente puede inducir a error (backend, estructura y estados que ya no aplican).
- `[RECOMENDACIÓN]`: tratarlo como documento histórico; si se desea documentación vigente, reemplazarlo por un informe generado del estado actual (la auditoría `documentacion_generada/` cubre ese objetivo). No contiene datos que obliguen a eliminarlo.
