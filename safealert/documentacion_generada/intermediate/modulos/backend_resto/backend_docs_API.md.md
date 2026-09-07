# Documento: backend/docs/API.md

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| backend/docs/API.md | 249 | Markdown (documentación técnica) | 7851 | Documentación de API REST | FUNCIONALIDAD EXISTENTE (documentación parcialmente incompleta) | Confirmado por código |

## Resumen

`API.md` documenta la API de **Ubicaciones, Accesos y Consentimientos** del backend SafeAlert (rama `/api/v1`), incluyendo autenticación, ejemplos `curl` de 10 endpoints, la política de retención con su tabla y plazos, la purga manual y los códigos de error. Está orientada a PythonAnywhere (base URL `https://oaf.pythonanywhere.com/api/v1`).

Análisis realizado con la **plantilla de resumen documental** (en lugar del análisis línea por línea), conforme a la instrucción del módulo.

## Contenido clave

1. **Base URL**: `https://oaf.pythonanywhere.com/api/v1` (línea 6).
2. **Modelo de autenticación por tipo de endpoint** (tabla líneas 11–15):
   - Público: `GET /api/v1/estado` (sin autenticación).
   - Usuario: `POST /api/v1/ubicaciones`, `/accesos`, `/consentimientos` con **Firebase Auth (Bearer token)**.
   - Administrativo: `GET /api/v1/ubicaciones/mapa`, `/ubicaciones/{id}`, `/accesos/usuario/{id}`, `/consentimientos/usuario/{id}`, `/admin/usuarios`, `/admin/stats` con **`X-Admin-Key`**.
3. **Endpoints documentados con ejemplos curl**:
   - `POST /api/v1/accesos` (líneas 21–49): registra acceso técnico con metadatos de dispositivo y geolocalización por IP. Respuesta `201` con la IP observada.
   - `POST /api/v1/ubicaciones` (líneas 53–76): registra ubicación GPS/NAVEGADOR. Respuesta `201 {"success": true, "id": N}`.
   - `POST /api/v1/ubicaciones/manual` (líneas 80–97): ubicación de origen MANUAL declarada por el usuario.
   - `POST /api/v1/consentimientos` (líneas 101–119): registra consentimiento otorgado/rechazado con texto mostrado y versión de política.
   - `POST /api/v1/consentimientos/revocar` (líneas 123–137): revoca un consentimiento por tipo.
   - `GET /api/v1/ubicaciones/ultima/{usuario_id}` (líneas 141–150): última ubicación del usuario (Bearer).
   - `GET /api/v1/ubicaciones/mapa` (líneas 154–164): ubicaciones para el mapa operativo; parámetros `usuario_id`, `origen`, `limite` (máx. 1000); requiere `X-Admin-Key`.
   - `GET /api/v1/estado` (líneas 167–174): health check.
   - `GET /api/v1/admin/usuarios` (líneas 177–188): listado de usuarios con su última ubicación; parámetros `busqueda`, `mac` (tolera formato con/sin separadores), `plan`, `limite` (máx. 500).
   - `POST /api/v1/admin/pagos/simular` (líneas 192–207): pago **simulado** (sin cobro real, no toca MercadoPago); por MAC o device_id; precios mensual 7500 / anual 75000 (implícitos); duración por defecto 32/380 días; errores 400/404/409.
   - `GET /api/v1/admin/stats` (líneas 211–220): KPIs agregados (total_usuarios, activos 24h/7d, totales y agregaciones por origen/día/dispositivo/estado de suscripción/permiso/plan).
4. **Política de retención** (tabla líneas 226–230): accesos 90 días, ubicaciones 365, consentimientos 365, con la sentencia de purga de cada uno. Purga manual vía `POST /api/v1/admin/purga` con `X-Admin-Key` (líneas 232–237).
5. **Códigos de error** (tabla líneas 243–248): 400, 401, 404, 429 (rate limit), 500.

## Relación con el código real

Los endpoints documentados existen en `backend/flask_app.py` (coincidencia de rutas confirmada por grep). Además, la suite `backend/test_admin_endpoints.py` ejercita varios de ellos (ver columna "¿Cubierto por tests?").

| Endpoint en API.md | Ruta real en flask_app.py (línea) | ¿Cubierto por tests? |
| --- | --- | --- |
| POST /api/v1/accesos | L935 | No |
| POST /api/v1/ubicaciones | L981 | Sí (setUp y ejercicios de stats) |
| POST /api/v1/ubicaciones/manual | L1063 | No |
| POST /api/v1/consentimientos | L1100 | Sí (test_consentimientos_con_clave) |
| POST /api/v1/consentimientos/revocar | L1132 | No |
| GET /api/v1/ubicaciones/ultima/{id} | L1186 | No |
| GET /api/v1/ubicaciones/mapa | L1207 | No |
| GET /api/v1/estado | L1499 | Sí (test_estado_publico) |
| GET /api/v1/admin/usuarios | L1261 | Sí (7 tests) |
| POST /api/v1/admin/pagos/simular | L1323 | Sí (7 tests) |
| GET /api/v1/admin/stats | L1414 | Sí (3 tests) |
| GET /api/v1/consentimientos/usuario/{id} | L1524 | Sí (2 tests) |
| GET /api/v1/accesos/usuario/{id} | L1540 | No |
| POST /api/v1/admin/purga | L1577 | No |

**Coherencia de retención**: la tabla de retención de API.md coincide con `002_retencion_purga.sql` (90/365/365), con `RETENCION_*_DIAS` de `.env.example` y con los defaults de `flask_app.py` (líneas 86–89); el endpoint `/api/v1/admin/purga` existe (L1577) y borra con los mismos cortes (L1566–1571). La purga de logs (30 días) no tiene endpoint ni tabla asociada todavía.

**Incompletitudes de la documentación** (endpoints reales existentes en `flask_app.py` que API.md **no** documenta):
- `GET /api/health` (L648), `POST /api/users/register` (L652), `GET /api/users/status/{device_id}` (L676).
- Pagos: `POST /api/payments/confirm` (L699), `POST /api/payments/webhook` (L712, webhook MercadoPago), `POST /api/tickets/create` (L784), `POST /api/internal/link-preapproval` (L745).
- Audio y teléfono: `POST /api/security/upload-recording` (L830), `POST /api/tel/contacto` (L863), `PUT /api/tel/contacto/borrar` (L889), `GET /api/tel/prueba/{device_id}` (L906).
- Consultas v1: `GET /api/v1/ubicaciones/usuario/{usuario_id}` (L1164), `GET /api/v1/ubicaciones/{id}` (L1239).

[NIVEL DE CERTEZA: Confirmado por código] para la existencia de las rutas documentadas y la coherencia de plazos de retención. Los detalles de comportamiento (respuestas exactas, validaciones) provienen del propio documento y no se verificaron ejecutando la app.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El documento mezcla dos estilos de ruta: rutas de usuario sin prefijo de versión (`/api/users/register`, `/api/tickets/create`, `/api/internal/link-preapproval`, descritas en `test_admin_endpoints.py`) y rutas versionadas `/api/v1`. La tabla de autenticación solo menciona las `/api/v1`; los endpoints internos (`/api/tickets/create`, `/api/internal/*`) usan `X-Internal-Key` y no aparecen en API.md.
- [OBSERVACIÓN TÉCNICA] API.md describe el despliegue en PythonAnywhere (base URL `oaf.pythonanywhere.com`); el backend también se despliega en Cloud Run (`cloud-run/Dockerfile`), donde la base URL sería distinta.
- [NOTA] El ejemplo de `POST /api/v1/accesos` incluye un `usuario_id` y UUIDs como datos de ejemplo, no reales.
- [OBSERVACIÓN TÉCNICA] `test_rate_limit_endpoint_devuelve_429` existe en la suite (líneas 421–435) pero no verifica el 429 real; API.md documenta 429 como código de error del rate limiter, implementado en `flask_app.py` (tabla `rate_limit_events`, líneas 126–168), sin cobertura de integración efectiva.

## Seguridad

- [INFORMATIVO] El documento no contiene secretos reales: los valores de claves aparecen como placeholders (`<firebase_token>`, `<admin_key>`).
- [INFORMATIVO] Define correctamente el modelo de control de acceso por tipo de endpoint (público / usuario / admin) y la protección de lecturas sensibles (`consentimientos/usuario`, `accesos/usuario`, `ubicaciones/mapa`, admin) detrás de `X-Admin-Key`.
- [MEDIO] Uso de una **clave única compartida** (`X-Admin-Key`) para todos los endpoints administrativos: sin roles, sin rotación documentada y sin caducidad; un solo actor con la clave tiene acceso total a ubicaciones, consentimientos y estadísticas de todos los usuarios. [RECOMENDACIÓN] Migrar a autenticación con roles (p. ej. Firebase Auth admin) o claves por operador con auditoría.
- [MEDIO] Los ejemplos `curl` transmiten la `X-Admin-Key` como cabecera (correcto frente a URL), pero el documento no exige explícitamente HTTPS ni advierte sobre su gestión; la base URL es HTTPS, lo que mitiga la exposición en tránsito. [RECOMENDACIÓN] Añadir una sección de gestión segura de claves (rotación, almacenamiento).
- [INFORMATIVO] Documenta la política de retención y su ejecución (purga), alineada con el derecho a la limitación de conservación; no documenta el borrado a petición del usuario (derecho de supresión), que tampoco existe en las migraciones analizadas.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Documentación incompleta: faltan los endpoints de pago real (webhook MP), registro de usuario, tickets internos, audio y teléfono, que son superficie de ataque relevante. [RECOMENDACIÓN] Completar API.md con todos los endpoints reales (o generar la documentación desde los decoradores de ruta).
- [RIESGO] Deriva documentación/código: los precios fijos 7500/75000 y duraciones 32/380 días están implícitos en ejemplos y tests; si cambian en el backend, API.md queda desactualizado. [RECOMENDACIÓN] Referenciar la fuente única de configuración de precios.
- [RECOMENDACIÓN] Añadir a la documentación el manejo de errores detallado de cada endpoint y la lista de campos obligatorios/opcionales.
- [RECOMENDACIÓN] Indicar en API.md las diferencias de despliegue (PythonAnywhere vs. Cloud Run) y la configuración de CORS y proxies.
