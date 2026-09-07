# Archivo: backend/flask_app.py

> [NOTA] Documento parte 1 de 3 del análisis del módulo **backend_flask** (auditoría técnica SafeAlert). Por su extensión (1591 líneas), la sección `## Análisis línea por línea` se divide en tres partes: la **parte 1 (líneas 1–560)** se incluye al final de este archivo; la **parte 2 (líneas 561–1100)** está en `backend_flask_app.py.parte2.md` y la **parte 3 (líneas 1101–1591)** en `backend_flask_app.py.parte3.md`. Orden de lectura recomendado: este archivo y luego las partes 2 y 3.

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| backend/flask_app.py | 1591 | Python 3.13 / Flask (docstring líneas 1–19) | 71890 | API REST backend: módulo de aplicación Flask (backend unificado SafeAlert + AdminDigital) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

`flask_app.py` es el punto de entrada único del backend "unificado" SafeAlert + AdminDigital (ERP). Responsabilidades reales detectadas:

- Construir la aplicación Flask instanciando la App Factory `create_app()` del ERP AdminDigital (módulo externo `app`, importado desde `/home/oaf/agrupacion_api`), con un fallback a una app Flask mínima si el ERP no está instalado (líneas 59–65).
- Configurar CORS para orígenes de móvil/web (líneas 116–122) e inicializar Firebase Admin para verificación de ID tokens (líneas 97–110).
- Registrar **27 endpoints HTTP** (ver `## Estructura`): endpoints heredados de SafeAlert (`/api/...`) para registro de usuarios, estado de suscripción, confirmación de pagos, webhook de Mercado Pago, vinculación de preaprobaciones, tickets de pago, subida de grabaciones de audio SOS y sincronización de contactos de emergencia; y endpoints nuevos `/api/v1/...` ("Prompt Maestro") para registrar accesos técnicos, ubicaciones con origen (GPS/NAVEGADOR/IP/MANUAL), consentimientos, historiales, mapa operativo, KPIs del panel administrativo y purga por retención.
- Gestionar **dos bases de datos SQLite** independientes: la principal (`users`, `ubicaciones_usuario`, `consentimientos_usuario`, `accesos_tecnicos`, `payment_events`, `tickets`, `rate_limit_events`) y la de agenda telefónica de emergencia (`usuarios_emerg`, `periodo_prueba`), con creación automática de esquema e índices.
- Implementar rate limiting persistente en SQLite (eficaz con múltiples workers), obtención segura de IP con proveedor de geolocalización por IP (primario `ip-api.com` y respaldo `ipregistry.co`), política de retención configurable y health checks.

[NOTA] La capa de datos de este archivo es **SQLite** (módulo `sqlite3`); el ERP AdminDigital importado (`app.create_app`) puede aportar su propia conexión (posible MySQL), pero ese código no forma parte de este archivo.

## Clasificación y estado

**FUNCIONALIDAD EXISTENTE** — [NIVEL DE CERTEZA: Confirmado por código]. La aplicación se consume en producción por `backend/wsgi.py` línea 65 (`from flask_app import flask_app as application`) y es ejercitada por `backend/test_admin_endpoints.py`. No hay TODO/FIXME/XXX en el archivo. Sub-estados puntuales:

- Los endpoints de escritura `/api/v1/accesos`, `/api/v1/ubicaciones*` y `/api/v1/consentimientos*` **no exigen autenticación** (solo rate limit por IP): están implementados pero su exposición es deliberada (telemetría); el riesgo asociado se detalla en `## Seguridad`.
- La "purga programada" de retención (`ejecutar_purga_retencion`, líneas 1562–1575) solo se invoca mediante el endpoint manual `POST /api/v1/admin/purga`; no existe scheduler en este archivo [NIVEL DE CERTEZA: Confirmado por código] (un programador externo podría invocarla, no verificado).
- `RETENCION_LOGS_DIAS` (línea 89) se define y expone en `/api/v1/estado` pero ninguna lógica la aplica [NIVEL DE CERTEZA: Confirmado por código].
- Código aparentemente sin uso: `import uuid` (línea 29), `from collections import defaultdict` (línea 33) y la constante `PROXY_CONFIANZA` (línea 180) [POTENCIALMENTE NO UTILIZADO].
- `AUDIO_STORAGE_DIR` es una constante fija (línea 82); aunque `wsgi.py` define la variable de entorno `AUDIO_STORAGE_DIR`, este módulo no la lee [OBSERVACIÓN TÉCNICA].

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `import os` (línea 21) | Estándar | Configuración de rutas y variables de entorno (líneas 50, 71–89, 100), `os.makedirs`/`os.path.join` en BD (305, 320, 854) | Sí |
| `import sys` (línea 22) | Estándar | Inserción de ruta PythonAnywhere en `sys.path` (líneas 54–56) | Sí |
| `import hmac` (línea 23) | Estándar | Comparación segura de claves (`compare_digest`, líneas 571, 582, 836, 866, 892, 909) y firma HMAC-SHA256 webhook MP (617–622) | Sí |
| `import hashlib` (línea 24) | Estándar | `hashlib.sha256` para firma de webhook MP (línea 620) | Sí |
| `import json` (línea 25) | Estándar | Parseo/serialización de payloads (`payment_events.payload`, metadatos, idiomas) (líneas 708, 716, 729, 963, 1047, 1053) | Sí |
| `import logging` (línea 26) | Estándar | Configuración de log y logger `safealert` (líneas 91–95) | Sí |
| `import sqlite3` (línea 27) | Estándar | Conexiones a ambas BD y captura de `sqlite3.OperationalError` (líneas 170, 303–331, 520) | Sí |
| `import re` (línea 28) | Estándar | Validaciones `device_id`, `alert_id`, nombre de archivo y normalización MAC (líneas 662, 681, 754, 796, 846, 849, 911, 1253) | Sí |
| `import uuid` (línea 29) | Estándar | Sin referencias posteriores en el archivo | No — [POTENCIALMENTE NO UTILIZADO] |
| `from abc import ABC, abstractmethod` (línea 30) | Estándar | Clase base `ProveedorGeolocalizacionIP` (líneas 207–210) | Sí |
| `from datetime import datetime, timedelta` (línea 31) | Estándar | Fechas de expiración, periodo de prueba, retención y timestamps UTC (líneas 553–554, 650, 664, 691, 738, 1418–1421) | Sí |
| `from functools import wraps` (línea 32) | Estándar | Preservar metadatos en decoradores (líneas 566, 577, 589) | Sí |
| `from collections import defaultdict` (línea 33) | Estándar | Sin referencias posteriores en el archivo | No — [POTENCIALMENTE NO UTILIZADO] |
| `from time import time` (línea 34) | Estándar | Marca de tiempo del rate limiter (líneas 140, 159) | Sí |
| `from flask import request, jsonify, g` (línea 36) | Externa (Flask) | Objeto `request` en todas las vistas; `jsonify` en respuestas; `g` para conexiones BD y `firebase_uid` (líneas 36, 303–316, 599) | Sí |
| `from flask_cors import CORS` (línea 37) | Externa (Flask-CORS) | Configuración CORS global (línea 116) | Sí |
| `from dotenv import load_dotenv` (línea 38) | Externa (python-dotenv) | Carga de `.env` junto al script (líneas 50–51) | Sí |
| `import firebase_admin` + `auth`/`credentials` (líneas 40–46) | Externa opcional (firebase-admin) | Verificación de Firebase ID Tokens (líneas 98–110, 598) | Sí (degradación controlada si no está instalado) |
| `from app import create_app` (líneas 59–65) | Interna/externa (ERP AdminDigital, módulo `app` en `/home/oaf/agrupacion_api`, fuera de este repositorio) | Instanciación de la app Flask base (línea 113) | Sí; si `ImportError`, define fallback local de app mínima |
| `import urllib.request` (import dinámico, líneas 216, 252) | Estándar | Llamadas HTTP a proveedores GeoIP (ip-api.com, ipregistry.co) | Sí |
| `import ipaddress` (import dinámico, línea 197) | Estándar | Detección de IP privadas en `_es_ip_privada` | Sí |

## Componentes que dependen de este archivo

- `backend/wsgi.py` línea 65: `from flask_app import flask_app as application` — entrada WSGI de PythonAnywhere que sirve esta app en producción [NIVEL DE CERTEZA: Confirmado por código].
- `backend/test_admin_endpoints.py` líneas 31, 40–43, 51, 376, 399 y 422: importa `flask_app` y `get_db`; enmascara `verify_id_token` con un fake para pruebas de los endpoints de admin [NIVEL DE CERTEZA: Confirmado por código] (entorno de pruebas, no de producción).
- Relación inversa (dependencia de este archivo hacia el ERP): importa el módulo `app` de AdminDigital (solo disponible en el servidor `/home/oaf/agrupacion_api`); si falta, usa una app Flask mínima de respaldo (líneas 59–65).
- Búsqueda `grep "flask_app"` sobre `*.py` del proyecto: solo aparecen referencias en `backend/` (este archivo, `wsgi.py`, `test_admin_endpoints.py`). No se hallaron referencias en `functions/`, `admin/`, la app móvil ni Cloud Run [NIVEL DE CERTEZA: Confirmado por código, acotado a `*.py`].

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `_ENV_PATH` | Ruta `.env` junto al script | str | Cargar variables de entorno (PythonAnywhere) | 50–51 |
| `path` | `/home/oaf/agrupacion_api` | str | Ruta del ERP en `sys.path` | 54–56 |
| `DB_PATH` | env `SAFEALERT_DB_PATH`; default `/home/oaf/agrupacion_api/usuarios/safealert.db` | str | Ruta BD SQLite principal | 71–74, 303–310 |
| `TEL_DB_PATH` | env `SAFEALERT_TEL_DB_PATH`; default `/home/oaf/agrupacion_api/usuarios/safealert_tel.db` | str | Ruta BD SQLite de agenda telefónica | 75–78, 318–325 |
| `INTERNAL_KEY` | env `SAFEALERT_INTERNAL_KEY`; si vacío, endpoints protegidos responden 500 | str | Clave estática compartida (cabecera `X-Internal-Key`) | 79, 565–574 |
| `MP_WEBHOOK_SECRET` | env `MP_WEBHOOK_SECRET` | str | Secreto para verificar firma de webhooks Mercado Pago | 80, 605–624 |
| `AUDIO_ALERT_API_KEY` | env `AUDIO_ALERT_API_KEY` | str | Clave estática compartida (cabecera `X-API-Key`) para audio y contactos TEL | 81, 830–925 |
| `AUDIO_STORAGE_DIR` | `/home/oaf/agrupacion_api/audio` (constante fija, no lee env) | str | Directorio donde se guardan grabaciones SOS | 82, 854–855 |
| `ADMIN_API_KEY` | env `SAFEALERT_ADMIN_API_KEY` | str | Clave estática administrativa (cabecera `X-Admin-Key`) | 83, 576–585 |
| `RETENCION_ACCESOS_DIAS` | env `RETENCION_ACCESOS_DIAS`; default `90` | int | Días de retención de accesos técnicos | 86, 1566 |
| `RETENCION_UBICACIONES_DIAS` | env `RETENCION_UBICACIONES_DIAS`; default `365` | int | Días de retención de ubicaciones | 87, 1567, 1570 |
| `RETENCION_CONSENTIMIENTOS_DIAS` | env `RETENCION_CONSENTIMIENTOS_DIAS`; default `365` | int | Días de retención de consentimientos | 88, 1568, 1571 |
| `RETENCION_LOGS_DIAS` | env `RETENCION_LOGS_DIAS`; default `30` | int | Definida y expuesta, pero no aplicada por ninguna lógica | 89, 1516 |
| `logger` | logger `"safealert"` | logging.Logger | Logging de la aplicación (INFO, formato con timestamp) | 91–95 y todo el archivo |
| `_fb_cred_path` | env `FIREBASE_CREDENTIALS_PATH` | str | Ruta opcional del certificado de servicio Firebase | 100–103 |
| `flask_app` | instancia de `create_app()` o fallback | Flask | Aplicación Flask sobre la que se registran rutas, CORS y teardowns | 113 y todos los `@flask_app.route` |
| `RATE_LIMIT_WINDOW` | `60` | int | Ventana en segundos del rate limiter | 131, 142 |
| `RATE_LIMIT_MAX` | `30` | int | Máximo de eventos permitidos por ventana y clave | 132, 154 |
| `RATE_LIMIT_PURGE_EVERY` | `256` | int | Purgar eventos viejos cada N inserciones | 133, 166 |
| `_rate_limit_call_counter` | `0` | int | Contador global de llamadas al rate limiter (purga global periódica) | 135, 139, 165 |
| `PROXY_HEADERS` | `['CF-Connecting-IP', 'X-Real-IP', 'X-Forwarded-For']` | list[str] | Encabezados aceptados para obtener IP real del cliente | 179, 187 |
| `PROXY_CONFIANZA` | env `PROXY_CONFIANZA`; default `"Cloudflare,PythonAnywhere"` | list[str] | Sin uso posterior | 180 — [POTENCIALMENTE NO UTILIZADO] |
| `geoip_service` | instancia de `GeoIPService` | GeoIPService | Servicio global de geolocalización por IP | 297, 941, 1004 |

Valores mágicos de negocio detectados (significado inferido del contexto):

- Ventana de suscripción activada por webhook: `+32 días` (línea 738); ticket `amount`: `7500` (monthly) y `75000` (annual) solo en el simulador admin (línea 1378); periodo de prueba inicial de contactos TEL: `10 días` (línea 554); en el simulador admin: `32` días monthly y `380` annual por defecto (línea 1339).
- Estados de suscripción: `not_registered`, `pending_verification`, `active`, `expired`; planes: `monthly`/`annual`; estados de pago simulados `manual_confirm`, `preapproval_link`, `ticket_created`, `admin_simulated`.
- Límites de paginación por endpoint: historial/accesos `limite` default `50` máx `200`; mapa default `200` máx `1000`; `admin/usuarios` default `200` máx `500` (líneas 1167–1168, 1212–1213, 1267–1268, 1543–1544).
- Enumerados con `CHECK` en BD: `origen` (GPS/NAVEGADOR/IP/MANUAL), `permiso_ubicacion` (GRANTED/DENIED/PROMPT/NO_DISPONIBLE/NO_SOLICITADO/ERROR), `tipo_permiso` (UBICACION/CAMARA/MICROFONO/CONTACTOS/NOTIFICACIONES), `estado` consentimiento (OTORGADO/RECHAZADO/REVOCADO/NO_SOLICITADO).
- Correo de contacto de tickets: `safealert_contacto@manejadatos.com` (líneas 826, 1397).

## Estructura (funciones / clases / tipos)

Índice de funciones, métodos y controladores (54 elementos de lógica documentados + clases):

- Configuración e inicialización: carga de `.env` (50–51), `sys.path` (54–56), fallback `create_app()` (62–65), inicialización Firebase (98–110), instancia `flask_app` (113), CORS (116–122).
- Rate limiting: `_rate_limit(key)` (138–173).
- Red/IP: `obtener_ip_cliente(request)` (182–194), `_es_ip_privada(ip)` (196–201).
- Clases GeoIP: `ProveedorGeolocalizacionIP` ABC (207–210), `IPApiProvider.consultar` (215–241), `ProveedorIPRegistry.__init__` (246–247) y `.consultar` (249–279), `GeoIPService.__init__` (284–286) y `.consultar` (288–295); instancia `geoip_service` (297).
- Conexiones BD y teardowns: `get_db` (303–310), `close_db` (312–316), `get_tel_db` (318–325), `close_tel_db` (327–331).
- Esquema BD: `_create_tables` (337–494), `_crear_indices_ubicaciones` (496–514), `_migrate_add_device_columns` (516–521), `_create_tel_tables` (523–546), `_crear_periodo_prueba_si_no_existe` (548–559).
- Seguridad: decoradores `require_internal_key` (565–574), `require_admin_key` (576–585), `require_firebase_auth` (587–603), verificador `verify_mp_signature` (605–624).
- Validación: `validar_coordenadas` (630–636), `validar_origen` (638–639), `validar_permiso` (641–642).
- Utilidades: `_handle_preapproval_event` (733–738), `normalizar_mac` (1248–1253), `ejecutar_purga_retencion` (1562–1575), bloque `__main__` (1589–1591).
- Controladores de rutas (27): ver tabla siguiente.

| # | Método | Ruta | Función (líneas) | Autenticación |
| --- | --- | --- | --- | --- |
| 1 | GET | `/api/health` | `health` (648–650) | Ninguna |
| 2 | POST | `/api/users/register` | `register_user` (652–674) | `require_firebase_auth` |
| 3 | GET | `/api/users/status/<device_id>` | `user_status` (676–697) | `require_firebase_auth` |
| 4 | POST | `/api/payments/confirm` | `confirm_payment` (699–710) | `require_internal_key` |
| 5 | POST | `/api/payments/webhook` | `mp_webhook` (712–731) | Firma HMAC MP (`x-signature`) |
| 6 | POST | `/api/internal/link-preapproval` | `link_preapproval` (745–777) | `require_internal_key` |
| 7 | POST | `/api/tickets/create` | `crear_ticket` (784–828) | `require_internal_key` |
| 8 | POST | `/api/security/upload-recording` | `upload_security_recording` (830–861) | `X-API-Key` (AUDIO_ALERT_API_KEY) |
| 9 | POST | `/api/tel/contacto` | `tel_agregar_contacto` (863–887) | `X-API-Key` |
| 10 | PUT | `/api/tel/contacto/borrar` | `tel_borrar_contacto` (889–904) | `X-API-Key` |
| 11 | GET | `/api/tel/prueba/<device_id>` | `tel_estado_prueba` (906–925) | `X-API-Key` |
| 12 | POST | `/api/v1/accesos` | `registrar_acceso` (935–975) | Ninguna (solo rate limit) |
| 13 | POST | `/api/v1/ubicaciones` | `registrar_ubicacion` (981–1057) | Ninguna (solo rate limit) |
| 14 | POST | `/api/v1/ubicaciones/manual` | `registrar_ubicacion_manual` (1063–1094) | Ninguna (solo rate limit) |
| 15 | POST | `/api/v1/consentimientos` | `registrar_consentimiento` (1100–1126) | Ninguna (solo rate limit) |
| 16 | POST | `/api/v1/consentimientos/revocar` | `revocar_consentimiento` (1132–1158) | Ninguna (solo rate limit) |
| 17 | GET | `/api/v1/ubicaciones/usuario/<usuario_id>` | `historial_ubicaciones` (1164–1180) | `require_admin_key` |
| 18 | GET | `/api/v1/ubicaciones/ultima/<usuario_id>` | `ultima_ubicacion` (1186–1201) | `require_admin_key` |
| 19 | GET | `/api/v1/ubicaciones/mapa` | `ubicaciones_mapa` (1207–1233) | `require_admin_key` |
| 20 | GET | `/api/v1/ubicaciones/<int:id>` | `detalle_ubicacion` (1239–1246) | `require_admin_key` |
| 21 | GET | `/api/v1/admin/usuarios` | `admin_usuarios` (1261–1314) | `require_admin_key` |
| 22 | POST | `/api/v1/admin/pagos/simular` | `admin_pago_simulado` (1323–1407) | `require_admin_key` |
| 23 | GET | `/api/v1/admin/stats` | `admin_stats` (1414–1493) | `require_admin_key` |
| 24 | GET | `/api/v1/estado` | `estado_sistema` (1499–1518) | Ninguna |
| 25 | GET | `/api/v1/consentimientos/usuario/<usuario_id>` | `historial_consentimientos` (1524–1534) | `require_admin_key` |
| 26 | GET | `/api/v1/accesos/usuario/<usuario_id>` | `historial_accesos` (1540–1556) | `require_admin_key` |
| 27 | POST | `/api/v1/admin/purga` | `purga_retencion` (1577–1583) | `require_admin_key` |

[NOTA] Orden de registro de rutas: `/api/v1/ubicaciones/usuario/<usuario_id>` (GET) y `/api/v1/ubicaciones/ultima/<usuario_id>` (GET) se registran antes que `/api/v1/ubicaciones/<int:id>` (GET, línea 1239); como el convertidor `<int:id>` no acepta las cadenas `usuario`/`ultima`, no hay conflicto de matcheo en Flask. El orden real de registro de `/api/v1/ubicaciones/manual` (POST) y `/api/v1/ubicaciones/<int:id>` (GET) tampoco colisiona por método HTTP distinto.

## Fichas de funciones y métodos

Fichas de los 27 controladores de rutas y de las funciones auxiliares/de soporte más relevantes. Los detalles de cada bloque de código se desarrollan en `## Análisis línea por línea` (partes 1–3).

### Fichas de controladores de rutas (endpoints)

#### `health` (líneas 648–650) — GET /api/health
- Firma: `def health()`.
- Propósito: health check simple; sin acceso a BD.
- Autenticación: ninguna. Entrada: ninguna. Salida: `{"status": "ok", "timestamp": <ISO UTC>}`, HTTP 200.
- Llamadas: `datetime.utcnow().isoformat()`. Efectos: ninguno.

#### `register_user` (líneas 652–674) — POST /api/users/register
- Firma: `def register_user()`.
- Propósito: registrar o actualizar un usuario (device) y su estado de suscripción.
- Autenticación: `require_firebase_auth` (cabecera `Authorization: Bearer <ID Token Firebase>`); además rate limit `register:{remote_addr}` (429 si supera 30/60 s).
- Entrada (JSON): `device_id`*, `name`*, `phone`*, `mac_address`, `device_unique_id`.
- Validaciones: campos obligatorios (400); `device_id` debe cumplir `^[a-zA-Z0-9\-_]{1,80}$` (400).
- Lógica: `SELECT` de estado previo; `UPDATE` si existe o `INSERT` con `subscription_status='not_registered'`; `db.commit()`.
- Salida: 200 `{"success": True, "status": ...}`; 400/401/429/500.
- SQL/tablas: `users`. Llamadas: `_rate_limit`, `get_db`.
- Riesgos: no se vincula `g.firebase_uid` con el `device_id` (un usuario autenticado puede sobrescribir el registro de otro `device_id` si lo conoce); se almacenan PII (`name`, `phone`, `mac_address`) sin cifrado.

#### `user_status` (líneas 676–697) — GET /api/users/status/<device_id>
- Firma: `def user_status(device_id: str)`.
- Propósito: devolver estado de suscripción; auto-marca `expired` si la fecha venció.
- Autenticación: `require_firebase_auth`; rate limit `status:{remote_addr}`.
- Entrada: `device_id` en la ruta (validado con el mismo regex, 400 si inválido).
- Lógica: `SELECT * FROM users`; si `subscription_status == 'active'` y expiró (comparación con `datetime.fromisoformat`, excepción silenciada), ejecuta `UPDATE ... SET subscription_status='expired'`.
- Salida: 200 con `device_id`, `status`, `plan_type`, `expires_at`; fila inexistente devuelve `status: "not_registered"` (200, no 404).
- SQL/tablas: `users`. Llamadas: `_rate_limit`, `get_db`.
- Riesgos: acceso sin comprobar propiedad del `device_id` (IDOR de estado de suscripción entre usuarios autenticados).

#### `confirm_payment` (líneas 699–710) — POST /api/payments/confirm
- Firma: `def confirm_payment()`.
- Propósito: confirmación interna de pago (llamada desde backend de pago/Cloud Function con clave interna).
- Autenticación: `require_internal_key` (cabecera `X-Internal-Key`).
- Entrada (JSON): `device_id`, `plan_type` (`monthly`/`annual`), `mp_reference` (opcional).
- Validaciones: `device_id` presente y `plan_type` válido (400 si no).
- Lógica: `UPDATE users SET subscription_status='pending_verification', plan_type=?, mp_preapproval_id=COALESCE(...)`; `INSERT` en `payment_events` con `event_type='manual_confirm'` y payload completo en JSON; `commit`.
- Salida: 200 `{"success": True, "status": "pending_verification"}`.
- SQL/tablas: `users`, `payment_events`.
- Riesgos: clave estática compartida; el payload completo (posible PII de pago) se persiste en `payment_events.payload` sin política de retención sobre esta tabla.

#### `mp_webhook` (líneas 712–731) — POST /api/payments/webhook
- Firma: `def mp_webhook()`.
- Propósito: recibir notificaciones de Mercado Pago y activar suscripciones.
- Autenticación: verificación de firma HMAC-SHA256 (`x-signature` con parámetros `ts`/`v1`, `x-request-id`, query `data.id`) mediante `verify_mp_signature` (401 si falta o es inválida).
- Entrada: cuerpo JSON del webhook. Lógica: parseo JSON (400 si inválido); si `type` es `subscription_authorized_payment` o `subscription_preapproval`, llama a `_handle_preapproval_event`; registra siempre un evento en `payment_events` con `event_type`, `mp_reference = data.id` y el payload íntegro; `commit`.
- Salida: 200 `{"received": True}`.
- SQL/tablas: `payment_events` (+ `users` vía `_handle_preapproval_event`). Llamadas: `verify_mp_signature`, `_handle_preapproval_event`, `get_db`.
- Riesgos: sin rate limit ni deduplicación: un evento replayado vuelve a extender la suscripción (ver `_handle_preapproval_event`); el timestamp `ts` de la firma no se valida contra el reloj (replay de firma posible); payload completo almacenado sin retención.

#### `_handle_preapproval_event` (líneas 733–738) — auxiliar de webhook
- Firma: `def _handle_preapproval_event(db, data, now)`.
- Propósito: buscar usuario por `mp_preapproval_id` y, si el estado es `authorized`, activar la suscripción `+32 días`.
- SQL/tablas: `SELECT`/`UPDATE users` por `mp_preapproval_id`.
- Riesgos: suma acumulativa de 32 días por cada evento `authorized` (incluidos duplicados/replays) sin verificar pagos reales ni límites; no hay `commit` propio (lo hace `mp_webhook`).

#### `link_preapproval` (líneas 745–777) — POST /api/internal/link-preapproval
- Firma: `def link_preapproval()`.
- Propósito: vincular una preaprobación de Mercado Pago a un `device_id` (invocado por la Cloud Function `createPaymentOrder`).
- Autenticación: `require_internal_key`.
- Entrada (JSON): `device_id`, `mp_preapproval_id` (ambos obligatorios), `plan_type` (opcional).
- Validaciones: presencia (400); regex de `device_id` (400).
- Lógica: si el usuario no existe, `INSERT` con nombre genérico `'Usuario SafeAlert'` y plan opcional; si existe, `UPDATE` del `mp_preapproval_id`; `INSERT` en `payment_events` (`preapproval_link`); `commit`; log INFO con `device`, `mp` y `plan`.
- Salida: 200 `{"success": True}`.
- SQL/tablas: `users`, `payment_events`.
- Riesgos: `mp_preapproval_id` (identificador de recurso de pago) se escribe en logs; clave interna estática compartida; permite crear usuarios arbitrarios con solo la clave interna.

#### `crear_ticket` (líneas 784–828) — POST /api/tickets/create
- Firma: `def crear_ticket()`.
- Propósito: generar ticket correlativo de pago (invocado por `PaymentService.createTicket` de la app móvil).
- Autenticación: `require_internal_key`; rate limit `ticket:{remote_addr}`.
- Entrada (JSON): `device_id`, `user_name`, `plan_type` (`monthly`/`annual`), `amount` (entero).
- Validaciones: campos y plan (400); regex `device_id` (400); `amount` convertible a `int` (400).
- Lógica: obtiene `MAX(ticket_number)+1` (número correlativo), `INSERT` en `tickets`, `INSERT` en `payment_events` (`ticket_created`), `commit`, log INFO.
- Salida: 201 con `success`, `ticket` (`ticket_number`, `date` dd/mm/yyyy, `time` HH:MM, `plan_type`, `amount`, `contact_email`).
- SQL/tablas: `tickets`, `payment_events`.
- Riesgos: correlativo calculado con `MAX+1` sin transacción/lock: con workers concurrentes puede duplicarse y violar el `UNIQUE(ticket_number)` (500); el correo de contacto es un valor fijo en el código.

#### `upload_security_recording` (líneas 830–861) — POST /api/security/upload-recording
- Firma: `def upload_security_recording()`.
- Propósito: recibir grabaciones de audio SOS desde la app y guardarlas en disco.
- Autenticación: cabecera `X-API-Key` comparada con `AUDIO_ALERT_API_KEY` (401; 500 si la clave no está configurada).
- Entrada: multipart/form-data con `archivo` (obligatorio), `alertId`, `userId` (obligatorios), `filename` (opcional).
- Validaciones: `alertId` con `^[a-zA-Z0-9_\-]{1,64}$`; `filename` solo si cumple `^[a-zA-Z0-9_\-]{1,100}\.(m4a|mp4|aac|wav|caf)$`; si no, se usa `security-{alert_id}.m4a`.
- Lógica: `os.makedirs(AUDIO_STORAGE_DIR, exist_ok=True)` y `audio_file.save()`; log INFO con ruta absoluta, `user` y `alert`.
- Salida: 200 `{"success": True, "path": filename}`; 500 `{"error": "Error interno"}` ante `OSError`.
- Efectos secundarios: escritura de archivos binarios en el sistema de archivos del servidor.
- Riesgos: sin límite de tamaño/bytes ni control de tipo MIME real (solo extensión del nombre) → agotamiento de disco y almacenamiento de contenido sensible (audio de emergencia) en directorio fijo con nombres predecibles; la extensión permitida depende del nombre de archivo provisto por el cliente (validado) o generado.

#### `tel_agregar_contacto` (líneas 863–887) — POST /api/tel/contacto
- Firma: `def tel_agregar_contacto()`.
- Propósito: sincronizar un contacto de emergencia del dispositivo en la BD TEL y garantizar registro en `periodo_prueba`.
- Autenticación: `X-API-Key` (`AUDIO_ALERT_API_KEY`) (401).
- Entrada (JSON): `device_id`, `nombre`, `telefono` (obligatorios), `principal` (booleano).
- Validaciones: presencia (400); regex `device_id` (400).
- Lógica: `SELECT` por `(device_id, telefono)`; `UPDATE` (restaurando `borrado=0`) o `INSERT` en `usuarios_emerg`; `_crear_periodo_prueba_si_no_existe(db, device_id)`; `commit`; log INFO mostrando solo los últimos 4 dígitos del teléfono.
- Salida: 200 `{"success": True}`.
- SQL/tablas: `usuarios_emerg` (BD TEL), `periodo_prueba` (vía auxiliar).
- Riesgos: datos personales de contactos (nombre y teléfono completos) almacenados en texto plano; el borrado real es lógico (soft delete).

#### `tel_borrar_contacto` (líneas 889–904) — PUT /api/tel/contacto/borrar
- Firma: `def tel_borrar_contacto()`.
- Propósito: marcar un contacto como borrado (soft delete, `borrado=1`).
- Autenticación: `X-API-Key` (401). Entrada (JSON): `device_id`, `telefono` (obligatorios).
- Lógica: `UPDATE usuarios_emerg SET borrado=1, updated_at=?` por `(device_id, telefono)`; `commit`; log de últimos 4 dígitos.
- Salida: 200 `{"success": True}`. SQL/tablas: `usuarios_emerg`.

#### `tel_estado_prueba` (líneas 906–925) — GET /api/tel/prueba/<device_id>
- Firma: `def tel_estado_prueba(device_id: str)`.
- Propósito: consultar el periodo de prueba gratuito de un dispositivo (contactos de emergencia).
- Autenticación: `X-API-Key` (401). Entrada: `device_id` en ruta (regex, 400).
- Lógica: `SELECT` en `periodo_prueba`; si no existe devuelve `activo: False` (200). Si existe, calcula `expirado` comparando `fecha_expiracion` con la hora UTC actual cuando no hay pago (excepción de parseo silenciada).
- Salida: 200 con `device_id`, `activo`, `expirado`, `pago`, `fecha_primer_contacto`, `fecha_expiracion`.
- SQL/tablas: `periodo_prueba` (BD TEL).

#### `registrar_acceso` (líneas 935–975) — POST /api/v1/accesos
- Firma: `def registrar_acceso()`.
- Propósito: registrar un acceso técnico (trazabilidad auditable) con geolocalización por IP.
- Autenticación: ninguna (solo rate limit `acceso:{remote_addr}`, 429).
- Entrada (JSON): `usuario_id`, `sesion_id`, `device_id_app`, `pagina_consultada`, metadatos de navegador/idioma/pantalla, `metodo_autenticacion`; el resto se deriva del servidor (IP, user-agent, método y ruta reales, geo).
- Lógica: obtiene IP (`obtener_ip_cliente`), consulta `geoip_service`, `INSERT` masivo en `accesos_tecnicos` (con `fecha_hora` y `creado_en` del servidor; `codigo_respuesta` fijo `200`), `commit`.
- Salida: 201 `{"success": True, "ip": ip}`.
- SQL/tablas: `accesos_tecnicos`. Llamadas: `_rate_limit`, `obtener_ip_cliente`, `geoip_service.consultar`, `get_db`.
- Riesgos: endpoint abierto (sin autenticación): cualquiera puede insertar filas falsas con `usuario_id` arbitrario (envenenamiento de trazabilidad y del mapa operativo); los valores `idiomas` se serializan con `json.dumps` sin validar tipo (una lista malformada o tipos no serializables lanzarían excepción 500).

#### `registrar_ubicacion` (líneas 981–1057) — POST /api/v1/ubicaciones
- Firma: `def registrar_ubicacion()`.
- Propósito: registrar una ubicación con origen GPS/NAVEGADOR (o IP) y metadatos del dispositivo (Prompt Maestro).
- Autenticación: ninguna (solo rate limit `ubicacion:{remote_addr}`, 429).
- Entrada (JSON): `origen` (obligatorio y válido), `latitud`/`longitud` (obligatorias para GPS/NAVEGADOR), `precision_metros` (>= 0), `permiso_ubicacion` (enumerado válido), más decenas de campos opcionales (altitud, velocidad, rumbo, fecha dispositivo, dirección, metadatos, etc.).
- Validaciones: `validar_origen` (400); coordenadas requeridas según origen (400); `validar_coordenadas` (400); `precision >= 0` (400); `validar_permiso` (400).
- Lógica: geo por IP del cliente; `INSERT` masivo (más de 50 columnas) en `ubicaciones_usuario` con `creado_en` y `fecha_hora_servidor` del servidor; `metadatos` serializado solo si viene; `commit`.
- Salida: 201 `{"success": True, "id": <last_insert_rowid>}`.
- SQL/tablas: `ubicaciones_usuario`. Llamadas: `_rate_limit`, `validar_origen`, `validar_coordenadas`, `validar_permiso`, `obtener_ip_cliente`, `geoip_service.consultar`, `get_db`.
- Riesgos: sin autenticación ni vinculación de identidad: cualquier cliente puede reportar ubicaciones de cualquier `usuario_id` (falsificación de posiciones, impacto directo en mapa operativo y "última ubicación"); campos numéricos como `precision_metros`, altitud, etc. no se validan en tipo (valores no numéricos → 500 de sqlite3 por tipo); la fecha del dispositivo no se valida.

#### `registrar_ubicacion_manual` (líneas 1063–1094) — POST /api/v1/ubicaciones/manual
- Firma: `def registrar_ubicacion_manual()`.
- Propósito: registrar una ubicación ingresada manualmente por el usuario (origen `MANUAL`).
- Autenticación: ninguna (rate limit `ubicacion_manual:{remote_addr}`).
- Entrada (JSON): `latitud` y `longitud` obligatorias; `usuario_id`, `sesion_id`, `device_id_app`, `fecha_hora_dispositivo`, `direccion_confirmada`, `observaciones` opcionales.
- Validaciones: presencia de coordenadas (400); `validar_coordenadas` (400).
- Lógica: `INSERT` reducido (13 columnas) con `origen='MANUAL'`, `permiso_ubicacion='NO_SOLICITADO'` e IP del cliente; `commit`.
- Salida: 201 `{"success": True, "id": <id>}`.
- SQL/tablas: `ubicaciones_usuario`.

#### `registrar_consentimiento` (líneas 1100–1126) — POST /api/v1/consentimientos
- Firma: `def registrar_consentimiento()`.
- Propósito: registrar el consentimiento (o rechazo) de un permiso del usuario (auditoría de privacidad).
- Autenticación: ninguna (rate limit `consentimiento:{remote_addr}`).
- Entrada (JSON): `tipo_permiso` (enumerado de 5 valores), `estado` (`OTORGADO`/`RECHAZADO`/`REVOCADO`/`NO_SOLICITADO`), `usuario_id`, `sesion_id`, `texto_mostrado`, `version_politica`.
- Validaciones: `tipo_permiso` y `estado` contra enumerados (400).
- Lógica: `INSERT` en `consentimientos_usuario` con IP y User-Agent reales; `commit`.
- Salida: 201 `{"success": True, "id": <id>}`.
- SQL/tablas: `consentimientos_usuario`.
- Riesgos: sin autenticación: se puede registrar consentimiento de cualquier usuario (integridad del registro de consentimiento, relevante en términos de privacidad/RGPD); el registro es de solo inserción (append), no reemplaza estados previos.

#### `revocar_consentimiento` (líneas 1132–1158) — POST /api/v1/consentimientos/revocar
- Firma: `def revocar_consentimiento()`.
- Propósito: registrar la revocación de un permiso (nuevo registro con `estado='REVOCADO'`).
- Autenticación: ninguna (rate limit `consentimiento:{remote_addr}`).
- Entrada (JSON): `usuario_id` y `tipo_permiso` obligatorios; `sesion_id`, `texto_mostrado`, `version_politica` opcionales.
- Validaciones: presencia (400); `tipo_permiso` válido (400).
- Lógica: `INSERT` con `estado='REVOCADO'`; `commit`.
- Salida: 200 `{"success": True, "message": "Consentimiento <tipo> revocado"}`.
- SQL/tablas: `consentimientos_usuario`.
- Riesgos: la revocación no altera ni anula registros anteriores (modelo append); consultar "último estado" requiere lógica externa.

#### `historial_ubicaciones` (líneas 1164–1180) — GET /api/v1/ubicaciones/usuario/<usuario_id>
- Firma: `def historial_ubicaciones(usuario_id: str)`.
- Propósito: historial de ubicaciones de un usuario (panel administrativo).
- Autenticación: `require_admin_key`. Entrada: `usuario_id` (ruta), query `limite` (default 50, máx 200).
- Lógica: `SELECT` acotado de columnas por `usuario_id`, orden `fecha_hora_servidor DESC`, `LIMIT ?`.
- Salida: 200 con lista JSON de objetos. SQL/tablas: `ubicaciones_usuario`.
- Riesgos: devuelve IP y direcciones de ubicación (información sensible) a quien posea la clave admin estática.

#### `ultima_ubicacion` (líneas 1186–1201) — GET /api/v1/ubicaciones/ultima/<usuario_id>
- Firma: `def ultima_ubicacion(usuario_id: str)`.
- Propósito: última ubicación conocida de un usuario.
- Autenticación: `require_admin_key`. Entrada: `usuario_id` en ruta.
- Lógica: `SELECT ... ORDER BY fecha_hora_servidor DESC LIMIT 1`.
- Salida: 200 con el registro; 404 `{"error": "Sin ubicaciones registradas"}` si no existe.
- SQL/tablas: `ubicaciones_usuario`.

#### `ubicaciones_mapa` (líneas 1207–1233) — GET /api/v1/ubicaciones/mapa
- Firma: `def ubicaciones_mapa()`.
- Propósito: datos para el mapa operativo con filtros opcionales.
- Autenticación: `require_admin_key`. Entrada (query): `usuario_id`, `origen` (validado con `validar_origen`; si es inválido se ignora), `limite` (default 200, máx 1000).
- Lógica: construcción dinámica de SQL con filtros parametrizados (`WHERE 1=1 AND ...`), orden descendente y `LIMIT`.
- Salida: 200 con lista JSON. SQL/tablas: `ubicaciones_usuario`.
- Nota: concatenación de SQL solo con sentencias fijas y valores por parámetros (sin inyección).

#### `detalle_ubicacion` (líneas 1239–1246) — GET /api/v1/ubicaciones/<int:id>
- Firma: `def detalle_ubicacion(id: int)`.
- Propósito: detalle completo de una ubicación por id.
- Autenticación: `require_admin_key`.
- Lógica: `SELECT * FROM ubicaciones_usuario WHERE id = ?`.
- Salida: 200 con todas las columnas; 404 si no existe.

#### `admin_usuarios` (líneas 1261–1314) — GET /api/v1/admin/usuarios
- Firma: `def admin_usuarios()`.
- Propósito: listado de usuarios con su última ubicación y conteo total de ubicaciones (dashboard de posicionamientos).
- Autenticación: `require_admin_key`. Entrada (query): `busqueda`, `mac`, `plan`, `limite` (default 200, máx 500).
- Lógica: `SELECT` de columnas de `users` + subconsulta correlacionada para la última ubicación (`LEFT JOIN` sobre el id de la última fila por `fecha_hora_servidor DESC, id DESC`) + subconsulta `COUNT(*)` de ubicaciones; filtros: `busqueda` con `LIKE` parametrizado sobre device_id/name/phone/mac_address; `mac` normalizada con `normalizar_mac` y `LIKE` sobre `replace(lower(mac_address),':','')`; `plan` por igualdad; orden por `COALESCE(ul.fecha_hora_servidor, u.updated_at) DESC`.
- Salida: 200 `{"total": n, "usuarios": [...]}`.
- SQL/tablas: `users`, `ubicaciones_usuario`. Llamadas: `normalizar_mac`, `get_db`.
- Riesgos: devuelve PII (name, phone, mac_address, device_unique_id) a todo poseedor de la clave admin; consulta pesada con subconsultas por fila (escalabilidad con muchos usuarios).

#### `admin_pago_simulado` (líneas 1323–1407) — POST /api/v1/admin/pagos/simular
- Firma: `def admin_pago_simulado()`.
- Propósito: activar una suscripción sin cobro real (solo pruebas) buscando al usuario por MAC o `device_id`, y generar ticket correlativo.
- Autenticación: `require_admin_key`; rate limit `pago_sim:{remote_addr}`.
- Entrada (JSON): `mac_address` o `device_id`, `plan_type` (default `monthly`), `dias` (int, default 32/380 según plan).
- Validaciones: `plan_type` válido (400); `mac` o `device_id` presente (400); `dias > 0` (si no, usa default). Búsqueda por MAC con `LIKE` sobre MAC normalizada; 404 si no existe; 409 si la MAC coincide con varios usuarios.
- Lógica: `UPDATE users SET subscription_status='active', plan_type=?, subscription_expires_at=?`; `INSERT` en `payment_events` (`admin_simulated`); correlativo `MAX+1`; `INSERT` en `tickets` con `amount` fijo (7500 monthly / 75000 annual); `commit`; log INFO con `device`, `mac` (MAC completa en log), `plan`, `dias`, `ticket`.
- Salida: 200 con `success`, `ticket` (mismo formato que `crear_ticket`) y `usuario` (device_id, name, mac_address, estado, plan, expiración).
- SQL/tablas: `users`, `payment_events`, `tickets`.
- Riesgos: endpoint de "pruebas" que otorga suscripciones activas sin verificación de pago: si la clave admin se filtra, cualquiera activa suscripciones ilimitadas y genera tickets; loguea la MAC completa (PII); mismo riesgo de concurrencia de `MAX+1` que `crear_ticket`.

#### `admin_stats` (líneas 1414–1493) — GET /api/v1/admin/stats
- Firma: `def admin_stats()`.
- Propósito: KPIs agregados del panel administrativo.
- Autenticación: `require_admin_key`.
- Lógica: múltiples consultas: `COUNT(*)` de users/ubicaciones/accesos/consentimientos; usuarios activos distintos por ubicaciones en 24 h/7 d; actividad 24 h; `GROUP BY` de origen, día (últimos 30 d con `substr(fecha_hora_servidor,1,10)`), tipo de dispositivo (top 10), estado de suscripción, estado de consentimiento, permiso de ubicación y plan.
- Salida: 200 con `kpis` y agregados; `generado_en` ISO.
- SQL/tablas: `users`, `ubicaciones_usuario`, `accesos_tecnicos`, `consentimientos_usuario`.
- Riesgos: expone métricas de negocio/privacidad (incluidos estados de consentimiento y permisos) a la clave admin estática; varias consultas secuenciales sin índices dedicados (rendimiento a gran escala).

#### `estado_sistema` (líneas 1499–1518) — GET /api/v1/estado
- Firma: `def estado_sistema()`.
- Propósito: health check extendido con conteos, estado de BD, IP pública y política de retención.
- Autenticación: ninguna.
- Lógica: `COUNT(*)` de las tres tablas de trazabilidad; prueba `SELECT 1`; obtiene IP del cliente.
- Salida: 200 `{"status": "ok", "timestamp", "base_datos": {...}, "servidor": {"ip_publica": ...}, "retencion": {...}, "version_api": "v1"}`.
- Riesgos: expone sin autenticación la IP pública del servidor, conteos de tablas y parámetros de retención (reconocimiento para atacantes).

#### `historial_consentimientos` (líneas 1524–1534) — GET /api/v1/consentimientos/usuario/<usuario_id>
- Firma: `def historial_consentimientos(usuario_id: str)`.
- Propósito: historial de consentimientos de un usuario. Autenticación: `require_admin_key`.
- Lógica: `SELECT` acotado (id, tipo, estado, versión, fecha) ordenado descendente.
- Salida: 200 con lista JSON. SQL/tablas: `consentimientos_usuario`.

#### `historial_accesos` (líneas 1540–1556) — GET /api/v1/accesos/usuario/<usuario_id>
- Firma: `def historial_accesos(usuario_id: str)`.
- Propósito: historial de accesos técnicos de un usuario. Autenticación: `require_admin_key`.
- Entrada: query `limite` (default 50, máx 200).
- Lógica: `SELECT` acotado de columnas de trazabilidad por `usuario_id`, orden descendente, `LIMIT`.
- Salida: 200 con lista JSON. SQL/tablas: `accesos_tecnicos`.

#### `purga_retencion` (líneas 1577–1583) — POST /api/v1/admin/purga
- Firma: `def purga_retencion()`.
- Propósito: ejecutar manualmente la purga por política de retención.
- Autenticación: `require_admin_key`; rate limit `purga:{remote_addr}`.
- Lógica: delega en `ejecutar_purga_retencion()`.
- Salida: 200 `{"success": True, "eliminados": {"accesos": n, "ubicaciones": n, "consentimientos": n}}`.

### Fichas de funciones auxiliares y de soporte

- `_rate_limit(key)` (138–173): verifica/inscribe eventos en `rate_limit_events` (ventana 60 s, máx 30 por clave); `DELETE` de eventos vencidos por clave en cada llamada; si supera el máximo hace `commit` y devuelve `False` (429 en vistas); purga global cada 256 llamadas (`sqlite3.OperationalError` silenciado). Riesgo: escritura en BD por cada petición (costo de IO); clave típica `<prefijo>:<remote_addr>`.
- `obtener_ip_cliente(request)` (182–194): recorre `PROXY_HEADERS` y usa el primer valor no privado (IPv4/IPv6); si todos son privados o vacíos, usa `request.remote_addr` (y lo descarta si es privado). Riesgo: confía en cabeceras de proxy sin verificar que la petición provenga de un proxy confiable (`PROXY_CONFIANZA` no se usa): un cliente directo puede falsear `X-Forwarded-For` con una IP pública.
- `_es_ip_privada(ip)` (196–201): usa `ipaddress.ip_address().is_private`; ante `ValueError` devuelve `True` (trata IPs inválidas como privadas y las descarta).
- `require_internal_key` (565–574): exige `X-Internal-Key` igual a `INTERNAL_KEY` vía `hmac.compare_digest`; si la clave no está configurada responde 500; si no coincide, 401. Aplica a pagos/tickets/preaprobaciones.
- `require_admin_key` (576–585): equivalente con `X-Admin-Key`/`ADMIN_API_KEY`; protege todos los endpoints de lectura administrativa y el simulador de pagos.
- `require_firebase_auth` (587–603): exige `Authorization: Bearer <token>`, verifica con `firebase_auth.verify_id_token` y expone `g.firebase_uid`; 500 si `firebase-admin` no está instalado; 401 si falta el prefijo `Bearer ` o el token es inválido/expirado. Riesgo: no comprueba verificación de email/anonimidad del token; el `uid` verificado no se usa para autorizar recursos.
- `verify_mp_signature(x_signature, x_request_id, data_id)` (605–624): reconstruye `id:<data_id>;request-id:<x_request_id>;ts:<ts>` y calcula HMAC-SHA256 con `MP_WEBHOOK_SECRET`; compara con `v1` usando `compare_digest`. `False` si falta el secreto (con log de error), falta firma o falla el parseo. Riesgo: `ts` no se valida contra el reloj (replay de firma).
- Validadores (630–642): `validar_coordenadas(lat, lon)` valida rangos -90..90 y -180..180 y devuelve `(bool, mensaje)`; `validar_origen(origen)` y `validar_permiso(permiso)` validan contra enumerados.
- `normalizar_mac(mac)` (1248–1253): elimina separadores y pasa a minúsculas (`"AA:BB:.."` → `"aabbcc.."`) para búsquedas.
- `_crear_periodo_prueba_si_no_existe(db, device_id)` (548–559): crea el periodo de prueba (10 días desde `datetime.utcnow()`) si no existe para el `device_id`.
- `ejecutar_purga_retencion()` (1562–1575): borra accesos (`fecha_hora`), ubicaciones (`creado_en`) y consentimientos (`fecha_hora`) anteriores a los umbrales de retención; devuelve conteos y loguea INFO.
- Decoradores de teardown `close_db`/`close_tel_db` (312–316, 327–331): cierran las conexiones de `g` al finalizar el contexto de la petición.
- `_crear_indices_ubicaciones` (496–514) y `_migrate_add_device_columns` (516–521): índices de trazabilidad y migración idempotente de columnas `mac_address`/`device_unique_id`.
- Funciones de esquema `_create_tables` (337–494), `_create_tel_tables` (523–546): creación idempotente (`CREATE TABLE IF NOT EXISTS`) de los esquemas detallados en `## Clases / interfaces / tipos`.

## Clases / interfaces / tipos

### `ProveedorGeolocalizacionIP` (líneas 207–210) — interfaz abstracta
- Responsabilidad: contrato de consulta de geolocalización por IP.
- Campos/métodos: `consultar(ip: str) -> dict` (abstracto). Relaciones: implementada por `IPApiProvider` y `ProveedorIPRegistry`; consumida por `GeoIPService`.

### `IPApiProvider` (líneas 212–241)
- Responsabilidad: proveedor primario gratuito `ip-api.com` (plan free 45 req/min).
- Métodos: `consultar(ip)` — llama `http://ip-api.com/json/{ip}?fields=...` (HTTP sin TLS) con timeout de 5 s; normaliza a: `ip`, `pais`, `codigo_pais`, `provincia`, `ciudad`, `latitud`, `longitud`, `precision_km` (fijo 50), `proveedor`, `asn` (primer token), `operador_movil`, `posible_vpn/proxy/hosting`; si el status no es `success` devuelve `{"ip", "error": "No disponible"}`; ante excepción loguea `[GeoIP]` y devuelve `{"ip", "error": str(exc)}`.
- Ciclo de vida: instanciado como `GeoIPService.primary`. Riesgo: el error incluye el texto de la excepción (puede filtrar detalles internos a quien llame a `consultar`).

### `ProveedorIPRegistry` (líneas 243–279)
- Responsabilidad: proveedor de respaldo `ipregistry.co` (gratuito 100 req/día).
- Campos: `api_key` (parámetro o env `IPREGISTRY_API_KEY`; si está vacío devuelve error `"Sin API key"`).
- Métodos: `consultar(ip)` — URL `https://api.ipregistry.co/{ip}?key=...` con timeout 5 s; mapea `location`/`connection`; clasifica `type` en `vpn/proxy/hosting/mobile`; ante excepción loguea y devuelve dict de error.
- Riesgos: la API key viaja en la URL (query string) [INFORMATIVO]; no se registra en logs.

### `GeoIPService` (líneas 281–295)
- Responsabilidad: servicio desacoplado con primario y fallback.
- Campos: `primary` (`IPApiProvider`), `fallback` (`ProveedorIPRegistry`).
- Métodos: `consultar(ip)` — si `ip` vacía o privada devuelve `{"ip", "error": "IP privada"}`; consulta primario y, si el resultado trae `error`, consulta el fallback y lo devuelve. Instancia global `geoip_service` en línea 297.

### Modelo de datos (esquemas SQLite creados por este módulo)
- BD principal (`DB_PATH`): `users` (device_id PK, name, phone, mac_address, device_unique_id, registered_at, subscription_status, plan_type, mp_preapproval_id, subscription_expires_at, updated_at), `rate_limit_events` (id, rl_key, ts; índice `(rl_key, ts)`), `payment_events` (id, device_id, event_type, mp_reference, payload JSON, created_at), `tickets` (id, ticket_number UNIQUE, device_id, user_name, plan_type, amount, created_at), `ubicaciones_usuario` (60+ columnas de ubicación, permisos, IP/geo, dispositivo y navegador, con `CHECK` en `origen` y `permiso_ubicacion`; índices por usuario_id, fecha, origen, ip, sesion_id), `consentimientos_usuario` (usuario_id, sesion_id, tipo_permiso/estado con `CHECK`, texto_mostrado, version_politica, fecha_hora, ip, user_agent), `accesos_tecnicos` (usuario_id, sesion_id, device_id_app, fecha_hora, ip, método/ruta/página/endpoint HTTP, código, user_agent/referer, navegador/OS/tipo, idioma, pantalla, geo, posible_vpn/proxy/hosting, metodo_autenticacion; índices por fecha y usuario).
- BD TEL (`TEL_DB_PATH`): `usuarios_emerg` (id, device_id, nombre, telefono, borrado, principal, created_at, updated_at; índice UNIQUE `(device_id, telefono)`) y `periodo_prueba` (device_id PK, fecha_primer_contacto, fecha_expiracion, pago).
- Nota: no hay clases ORM ni tipos `dataclass`/`TypedDict`; los tipos usados son funciones, clases GeoIP y `sqlite3.Row` (row_factory) para filas.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] (líneas 1–19 vs `backend/wsgi.py` líneas 4–12): el docstring declara "Python 3.13 / Flask" y versión 3.1.0, mientras que `wsgi.py` declara Python 3.10. La versión real del intérprete no es verificable desde el repositorio. [NIVEL DE CERTEZA: No determinado]
- [OBSERVACIÓN TÉCNICA] (líneas 29, 33, 180): `import uuid`, `from collections import defaultdict` y la constante `PROXY_CONFIANZA` no tienen uso posterior en el archivo [POTENCIALMENTE NO UTILIZADO]; `PROXY_CONFIANZA` sugiere una intención de validar proxies confiables que no llegó a implementarse.
- [OBSERVACIÓN TÉCNICA] (línea 82): `AUDIO_STORAGE_DIR` es constante fija; `wsgi.py` (línea 44) define la variable de entorno `AUDIO_STORAGE_DIR` pero `flask_app.py` no la lee → la configuración de wsgi para ese directorio es inefectiva aquí.
- [OBSERVACIÓN TÉCNICA] (línea 89 y 1516): `RETENCION_LOGS_DIAS` se define y se expone en `/api/v1/estado`, pero ninguna rutina la aplica; tampoco hay retención para `payment_events`, `tickets` ni `users` (crecimiento indefinido y PII persistente).
- [OBSERVACIÓN TÉCNICA] (líneas 553, 650, 664, 738, etc.): uso generalizado de `datetime.utcnow()` (naive UTC), API deprecada en Python 3.12+; conviene `datetime.now(timezone.utc)`.
- [OBSERVACIÓN TÉCNICA] (líneas 655, 680, 937, ...): las claves del rate limiter se basan en `request.remote_addr`; si el despliegue en PythonAnywhere coloca a todos los clientes tras un proxy, todos compartirían la misma clave y el límite (30/60 s) se agotaría globalmente. [NIVEL DE CERTEZA: Inferido]
- [OBSERVACIÓN TÉCNICA] (líneas 135, 139, 165): `_rate_limit_call_counter` es contador en memoria por worker; la purga global "cada 256 inserciones" no está sincronizada entre workers de Gunicorn/WSGI.
- [OBSERVACIÓN TÉCNICA] (líneas 62–65): el fallback `create_app()` (app Flask mínima) existe "para pruebas locales sin el ERP"; en producción `wsgi.py` garantiza que el ERP esté en `sys.path`.
- [OBSERVACIÓN TÉCNICA] (líneas 959, 1042): `registrar_acceso` y `registrar_ubicacion` almacenan `codigo_respuesta` fijo (200 o 201) tomado de la petición que genera el registro, no del endpoint consultado por el usuario final; la semántica del campo es ambigua.
- [OBSERVACIÓN TÉCNICA] (líneas 804–805, 1374–1377): generación de correlativo de tickets con `MAX(ticket_number)+1` fuera de transacción; susceptible de colisión `UNIQUE` bajo concurrencia.
- [OBSERVACIÓN TÉCNICA] (líneas 826, 1397): el correo `safealert_contacto@manejadatos.com` está duplicado como constante en dos respuestas.
- [OBSERVACIÓN TÉCNICA] (líneas 963, 1047): `json.dumps(data.get("idiomas", []))` asume una lista serializable; un tipo inesperado provocaría 500.
- [OBSERVACIÓN TÉCNICA] (líneas 656 y similares): `request.get_json(silent=True) or {}` evita 400 automático por JSON malformado (se trata como cuerpo vacío), lo que puede ocultar errores de cliente.
- [OBSERVACIÓN TÉCNICA] (línea 197): `import ipaddress` dentro de la función se ejecuta por cada llamada (menor, pero evitable con import a nivel de módulo).
- [OBSERVACIÓN TÉCNICA]: mensajes de error sin acentos ("Configuracion interna incorrecta", "No autorizado", "Datos invalidos") frente a docstrings acentuados; inconsistencia menor de estilo.

## Seguridad

Hallazgos clasificados sobre `backend/flask_app.py`. No se modificó código.

- [ALTO] Endpoints de escritura v1 sin autenticación (`POST /api/v1/accesos`, `/api/v1/ubicaciones`, `/api/v1/ubicaciones/manual`, `/api/v1/consentimientos`, `/api/v1/consentimientos/revocar`, líneas 935–1158): cualquier cliente puede insertar filas con `usuario_id` arbitrario (falsificación de ubicaciones, accesos y consentimientos ajenos), envenenando trazabilidad, mapa operativo, historiales y estadísticas de privacidad. Única mitigación: rate limit por IP (30/60 s).
- [ALTO] Control de acceso por recurso ausente en endpoints autenticados por Firebase (`register_user`, `user_status`, líneas 652–697): `g.firebase_uid` no se vincula con el `device_id` operado; un usuario autenticado puede consultar/sobrescribir el registro de otro `device_id` (IDOR) si conoce/adivina el identificador (alfanumérico de hasta 80 caracteres).
- [ALTO] Webhook de Mercado Pago sin idempotencia ni validación temporal (líneas 712–738): no se verifica el timestamp `ts` de la firma ni si el evento ya fue procesado; cada evento `authorized` replayado suma +32 días a la suscripción, permitiendo extender accesos de pago indefinidamente.
- [ALTO] Endpoint de pruebas `POST /api/v1/admin/pagos/simular` (líneas 1323–1407) activo en el mismo despliegue: con la clave admin estática otorga suscripciones `active` sin verificación de pago y genera tickets correlativos; no está aislado por flag de entorno.
- [MEDIO] Suplantación de IP de cliente (líneas 179–194): se confía en `CF-Connecting-IP`, `X-Real-IP` y `X-Forwarded-For` sin comprobar que la petición provenga de un proxy confiable (la constante `PROXY_CONFIANZA` no se usa); un atacante directo puede falsear su IP pública, alterar la geo por IP registrada y evadir correlaciones por IP.
- [MEDIO] Subida de grabaciones de emergencia sin límite de tamaño ni validación real de contenido (líneas 830–861): solo se valida la extensión del nombre; el directorio `AUDIO_STORAGE_DIR` es fijo y predecible (`security-{alert_id}.m4a`); riesgo de agotamiento de disco y de almacenamiento prolongado de audio sensible.
- [MEDIO] Claves estáticas compartidas en cabeceras (`X-Internal-Key`, `X-Admin-Key`, `X-API-Key`): secretos únicos, sin rotación ni hash, compartidos con múltiples consumidores; su filtración otorga acceso total a endpoints internos/administrativos. Dependen de TLS (no exigido por la app).
- [MEDIO] Exposición de información sin autenticación en `GET /api/v1/estado` (líneas 1499–1518): IP pública del servidor, conteos de tablas de trazabilidad y política de retención.
- [MEDIO] Datos personales y de geolocalización en reposo sin cifrado y sin retención aplicada a todas las tablas: `users` (name, phone, MAC), `ubicaciones_usuario`/`accesos_tecnicos` (IP, direcciones), `payment_events.payload` (webhooks completos de pago) y `tickets` no entran en la purga por retención; la purga es manual.
- [MEDIO] Datos personales en logs: `link_preapproval` loguea `mp_preapproval_id` (línea 776) y `admin_pago_simulado` loguea la MAC completa (línea 1387). El resto de logs de TEL truncan a 4 dígitos (correcto).
- [BAJO] Endpoints de audio/TEL sin rate limit (`/api/security/upload-recording`, `/api/tel/*`): protegidos solo por la clave estática compartida; un abuso con clave filtrada no tiene límite de frecuencia.
- [BAJO] Sin validaciones de formato/tipo en muchos campos opcionales de los POST v1 (altitud, velocidad, rumbo, `idiomas`, etc.): tipos inesperados provocan excepciones 500 no controladas (falta de manejador global de errores).
- [BAJO] Uso de `datetime.utcnow()` (deprecado) y fechas naive: riesgo de errores de cálculo de expiración si se introducen fechas con zona horaria.
- [INFORMATIVO] CORS con comodines `exp://*`, `http://localhost:*`, `http://10.0.2.2:*` (líneas 116–122): razonable para desarrollo móvil; sin `allow_credentials`, mitiga fuga de credenciales por CORS.
- [INFORMATIVO] SQL: todas las consultas dinámicas usan parámetros (`?`); la concatenación de SQL solo añade cláusulas fijas. No se detectó inyección SQL [NIVEL DE CERTEZA: Confirmado por código].
- [INFORMATIVO] Firebase Admin opcional: si `firebase-admin` no está instalado, los endpoints con `require_firebase_auth` devuelven 500 (cierre a la baja) y se loguea advertencia; no hay riesgo de bypass por ausencia.
- [INFORMATIVO] No existe manejador global de errores (`@app.errorhandler`): errores no capturados devuelven la página HTML por defecto de Flask (fuga de traza en modo debug si `FLASK_DEBUG=1`).

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Pérdida de integridad y privacidad por escritura v1 no autenticada. [RECOMENDACIÓN] Autenticar los POST v1 con Firebase ID Token y vincular `g.firebase_uid` al `usuario_id` (o firmar con clave por sesión); mantener rate limit por usuario+IP y validar tipos/longitudes de todos los campos.
- [RIESGO] Abuso del webhook de pagos. [RECOMENDACIÓN] Guardar `id` de evento ya procesado (idempotencia), validar la ventana del `ts` de la firma (± 5 min), verificar montos/planes y desacoplar la activación de una tarea de verificación.
- [RIESGO] Fuga de claves estáticas con impacto total. [RECOMENDACIÓN] Usar un gestor de secretos, rotación periódica, claves distintas por consumidor y TLS obligatorio; registrar auditoría de uso.
- [RIESGO] Activación de suscripciones de prueba en producción. [RECOMENDACIÓN] Excluir `/api/v1/admin/pagos/simular` mediante flag de entorno o red interna/identidad admin fuerte.
- [RIESGO] Falsificación de IP/geo y correlación. [RECOMENDACIÓN] Implementar la verificación de proxies usando `PROXY_CONFIANZA` (o `ProxyFix` de Werkzeug con `x_for`/`x_proto` según proxy real) y basar el rate limit en la IP ya saneada.
- [RIESGO] Disco y almacenamiento de audio sensible. [RECOMENDACIÓN] Fijar `MAX_CONTENT_LENGTH`, validar firma mágica/Content-Type, renombrar con UUID, aplicar retención al audio y cifrar en reposo si es viable.
- [RIESGO] Crecimiento indefinido de BD y PII. [RECOMENDACIÓN] Aplicar retención también a `payment_events`/`tickets`/`users` (anonimización), usar `RETENCION_LOGS_DIAS` y programar la purga (scheduler) en lugar de solo el endpoint manual.
- [RIESGO] Concurrencia de tickets y límites del rate limiter por IP. [RECOMENDACIÓN] Calcular el correlativo dentro de `BEGIN IMMEDIATE` (o usar `AUTOINCREMENT`/secuencia) y reemplazar `MAX+1`; revisar la clave del rate limit bajo proxy.
- [RIESGO] Errores 500 no controlados por tipos inválidos. [RECOMENDACIÓN] Manejador global de errores JSON, validación estricta de tipos y límites de longitud/cuerpo en los POST v1.
- [RIESGO] Logs con PII y secretos. [RECOMENDACIÓN] No loguear MAC completa ni identificadores de preaprobación; revisar que ningún secreto se imprima a logs (no se detectó impresión de claves [NIVEL DE CERTEZA: Confirmado por código]).
- [RECOMENDACIÓN] Modernizar fechas a `datetime.now(timezone.utc)` y documentar la versión real de Python; alinear el docstring con `wsgi.py`.

## Análisis línea por línea

[NOTA] Sección dividida en tres partes por extensión del archivo (1591 líneas). Esta es la **parte 1 de 3 (líneas 1–560)**; continúa en `backend_flask_app.py.parte2.md` (líneas 561–1100) y `backend_flask_app.py.parte3.md` (líneas 1101–1591).

#### Bloque 1 (líneas 1–34) — Docstring del módulo e importaciones de la biblioteca estándar

```py
"""
============================================================================
Archivo         : flask_app.py
Descripción     : Backend unificado SafeAlert + AdminDigital.
                  Implementa el Prompt Maestro: registro de accesos,
                  ubicaciones con origen (GPS/NAVEGADOR/IP/MANUAL),
                  consentimientos, geolocalización por IP, mapa operativo,
                  trazabilidad auditable y política de retención.
                  Incluye endpoints administrativos para el dashboard de
                  posicionamientos: listado de usuarios con última ubicación
                  (/api/v1/admin/usuarios) y KPIs agregados
                  (/api/v1/admin/stats).
Autor           : oafon / AI Assistant
Fecha           : 2026-07-31
Versión         : 3.1.0
Lenguaje        : Python 3.13 / Flask
Uso             : WSGI para PythonAnywhere
============================================================================
"""

import os
import sys
import hmac
import hashlib
import json
import logging
import sqlite3
import re
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from functools import wraps
from collections import defaultdict
from time import time
```

**Explicación de las líneas 1–34:**

El bloque abre el módulo con un docstring de identificación (descripción, autor, fecha 2026-07-31, versión 3.1.0, lenguaje declarado Python 3.13, uso WSGI en PythonAnywhere) que anuncia las capacidades reales del archivo: registro de accesos, ubicaciones con origen, consentimientos, geolocalización por IP, mapa operativo, trazabilidad y retención. Después importa la biblioteca estándar necesaria para todo el módulo.

- **Línea 21** (`import os`): acceso a variables de entorno y rutas de archivos (BD, `.env`, directorio de audio).
- **Línea 22** (`import sys`): manipulación de `sys.path` para el despliegue PythonAnywhere (líneas 54–56).
- **Líneas 23–24** (`hmac`, `hashlib`): comparación segura de claves (`hmac.compare_digest`) y firma HMAC-SHA256 del webhook de Mercado Pago.
- **Línea 25** (`json`): parseo/serialización de cuerpos y payloads persistidos (eventos de pago, metadatos, idiomas).
- **Línea 26** (`logging`): configuración del logger de la aplicación.
- **Línea 27** (`sqlite3`): motor de base de datos (SQLite embebido), conexiones por petición en `g`.
- **Línea 28** (`re`): expresiones regulares de validación (device_id, alertId, nombres de archivo, MAC).
- **Línea 29** (`import uuid`): sin uso posterior — [POTENCIALMENTE NO UTILIZADO].
- **Línea 30** (`from abc import ABC, abstractmethod`): base de la jerarquía de proveedores de geolocalización.
- **Línea 31** (`datetime`, `timedelta`): timestamps UTC y cálculos de expiración/retensión.
- **Línea 32** (`wraps`): preservación de metadatos en los decoradores de autenticación.
- **Línea 33** (`defaultdict`): sin uso posterior — [POTENCIALMENTE NO UTILIZADO].
- **Línea 34** (`time`): marcas de tiempo del rate limiter.

#### Bloque 2 (líneas 36–65) — Importaciones de Flask/CORS/dotenv, Firebase opcional, carga de `.env` y App Factory del ERP

```py
from flask import request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv

try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth, credentials as firebase_credentials
except ImportError:
    firebase_admin = None
    firebase_auth = None
    firebase_credentials = None

# Carga de variables de entorno desde .env (PythonAnywhere no posee sección
# "Environment variables"; se usa el archivo .env junto a este script).
_ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_ENV_PATH, override=False)

# --- CONFIGURACIÓN DE RUTAS PARA PYTHONANYWHERE ---
path = '/home/oaf/agrupacion_api'
if path not in sys.path:
    sys.path.insert(0, path)

# Importación de la App Factory del ERP (AdminDigital)
try:
    from app import create_app
except ImportError:
    def create_app():
        """App Flask mínima para pruebas locales sin el ERP."""
        from flask import Flask
        return Flask(__name__)
```

**Explicación de las líneas 36–65:**

Configura las dependencias de terceros y el arranque de la app: Flask (`request`, `jsonify`, `g`), Flask-CORS y python-dotenv; intenta importar `firebase-admin` de forma opcional (si falta, las variables quedan en `None` y la verificación de tokens se degrada); carga el `.env` ubicado junto al script (PythonAnywhere no gestiona variables de entorno por su UI); agrega la ruta del ERP a `sys.path`; e importa la App Factory del ERP AdminDigital con un fallback local.

- **Líneas 36–38**: objetos de Flask y extensiones usados en todo el módulo.
- **Líneas 40–46**: import opcional de `firebase_admin`. Si no está instalado se setean `firebase_admin/firebase_auth/firebase_credentials = None`; cada uso posterior verifica esa condición (p. ej. `require_firebase_auth`, línea 591).
- **Líneas 50–51**: `_ENV_PATH` apunta al `.env` del mismo directorio del script; `load_dotenv(..., override=False)` no pisa variables ya definidas en el entorno (relevante porque `wsgi.py` define rutas BD antes de importar este módulo).
- **Línea 54**: `path = '/home/oaf/agrupacion_api'` — ruta física del despliegue en PythonAnywhere (valor del entorno de producción, no configurable).
- **Líneas 55–56**: inserta la ruta en `sys.path` si no está.
- **Líneas 59–65**: importa `create_app` del ERP AdminDigital; si no existe, define un `create_app()` de respaldo que devuelve una app Flask vacía "para pruebas locales". [OBSERVACIÓN TÉCNICA] el fallback implica que sin el ERP la app solo expone las rutas de este archivo.

#### Bloque 3 (líneas 71–95) — Configuración de entorno, rutas de BD, claves y política de retención

```py
DB_PATH = os.environ.get(
    "SAFEALERT_DB_PATH",
    "/home/oaf/agrupacion_api/usuarios/safealert.db"
)
TEL_DB_PATH = os.environ.get(
    "SAFEALERT_TEL_DB_PATH",
    "/home/oaf/agrupacion_api/usuarios/safealert_tel.db"
)
INTERNAL_KEY = os.environ.get("SAFEALERT_INTERNAL_KEY", "")
MP_WEBHOOK_SECRET = os.environ.get("MP_WEBHOOK_SECRET", "")
AUDIO_ALERT_API_KEY = os.environ.get("AUDIO_ALERT_API_KEY", "")
AUDIO_STORAGE_DIR = "/home/oaf/agrupacion_api/audio"
ADMIN_API_KEY = os.environ.get("SAFEALERT_ADMIN_API_KEY", "")

# --- Política de retención (Fase 5) ---
RETENCION_ACCESOS_DIAS = int(os.environ.get("RETENCION_ACCESOS_DIAS", "90"))
RETENCION_UBICACIONES_DIAS = int(os.environ.get("RETENCION_UBICACIONES_DIAS", "365"))
RETENCION_CONSENTIMIENTOS_DIAS = int(os.environ.get("RETENCION_CONSENTIMIENTOS_DIAS", "365"))
RETENCION_LOGS_DIAS = int(os.environ.get("RETENCION_LOGS_DIAS", "30"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("safealert")
```

**Explicación de las líneas 71–95:**

Constantes de configuración leídas de variables de entorno (con valores por defecto apuntando al entorno PythonAnywhere), política de retención en días y configuración del logger.

- **Líneas 71–78**: rutas de las dos bases SQLite. `SAFEALERT_DB_PATH` (BD principal de usuarios/ubicaciones) y `SAFEALERT_TEL_DB_PATH` (agenda telefónica TEL). `wsgi.py` (líneas 42–43) define ambas antes de importar el módulo.
- **Línea 79**: `INTERNAL_KEY` (clave interna para pagos/tickets). Valor: [SECRETO OCULTO]. Si queda vacía, `require_internal_key` responde 500.
- **Línea 80**: `MP_WEBHOOK_SECRET` para verificar webhooks de Mercado Pago. Valor: [SECRETO OCULTO].
- **Línea 81**: `AUDIO_ALERT_API_KEY` para subida de audio y contactos TEL. Valor: [SECRETO OCULTO].
- **Línea 82**: `AUDIO_STORAGE_DIR` fijo a `/home/oaf/agrupacion_api/audio`. [OBSERVACIÓN TÉCNICA] no lee la variable de entorno `AUDIO_STORAGE_DIR` que sí define `wsgi.py`.
- **Línea 83**: `ADMIN_API_KEY` para endpoints administrativos. Valor: [SECRETO OCULTO].
- **Líneas 86–89**: días de retención de accesos (90), ubicaciones (365), consentimientos (365) y logs (30). Este último no se aplica en ninguna rutina [OBSERVACIÓN TÉCNICA].
- **Líneas 91–95**: log a nivel INFO con timestamp y formato estándar; `logger` nombrado `"safealert"` usado en todo el archivo. No imprime secretos.

#### Bloque 4 (líneas 97–122) — Inicialización de Firebase Admin, instancia de la app y CORS

```py
# Inicialización de Firebase Admin (verificación de ID tokens en endpoints críticos)
if firebase_admin is not None:
    try:
        _fb_cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH", "")
        if _fb_cred_path and os.path.exists(_fb_cred_path):
            _fb_cred = firebase_credentials.Certificate(_fb_cred_path)
            firebase_admin.initialize_app(_fb_cred)
        else:
            firebase_admin.initialize_app()
        logger.info("[SafeAlert] Firebase Admin inicializado correctamente.")
    except Exception as exc:
        logger.warning("[SafeAlert] Firebase Admin no disponible: %s", exc)
else:
    logger.warning("[SafeAlert] firebase-admin no instalado — verificación de ID tokens desactivada.")

# Inicialización de la App del ERP
flask_app = create_app()

# CORS ampliado para móvil + web
CORS(flask_app, origins=[
    "https://oaf.pythonanywhere.com",
    "https://oaf2023.github.io",
    "exp://*",
    "http://localhost:*",
    "http://10.0.2.2:*",
])
```

**Explicación de las líneas 97–122:**

Inicializa Firebase Admin (si la librería está disponible) usando el certificado de servicio si existe en la ruta indicada o el ADC (Application Default Credentials); crea la aplicación Flask con la App Factory del ERP; configura CORS global.

- **Líneas 98–110**: si `firebase_admin` está instalado, intenta inicializar: con `FIREBASE_CREDENTIALS_PATH` si el archivo existe, o bien `initialize_app()` sin credenciales explícitas (ADC). Cualquier error se registra como advertencia y la app continúa sin verificación de tokens (fallo degradado).
- **Línea 113**: `flask_app = create_app()` — instancia única de la app (del ERP o del fallback) sobre la que se registran rutas, teardowns y CORS.
- **Líneas 116–122**: CORS global con orígenes de producción (`oaf.pythonanywhere.com`), GitHub Pages (`oaf2023.github.io`) y comodines de desarrollo móvil/web (`exp://*` para Expo Go, `http://localhost:*`, `http://10.0.2.2:*` para emulador Android). No usa `supports_credentials=True` [INFORMATIVO].

#### Bloque 5 (líneas 131–173) — Rate limiter persistente en SQLite

```py
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX = 30
RATE_LIMIT_PURGE_EVERY = 256  # purgar eventos viejos cada N inserciones

_rate_limit_call_counter = 0


def _rate_limit(key: str) -> bool:
    global _rate_limit_call_counter
    now = time()
    db = get_db()
    cutoff = now - RATE_LIMIT_WINDOW

    # Limpiar eventos vencidos de esta clave en cada llamada (barato con índice)
    db.execute(
        "DELETE FROM rate_limit_events WHERE rl_key = ? AND ts < ?",
        (key, cutoff),
    )

    row = db.execute(
        "SELECT COUNT(*) AS c FROM rate_limit_events WHERE rl_key = ? AND ts >= ?",
        (key, cutoff),
    ).fetchone()
    if row["c"] >= RATE_LIMIT_MAX:
        db.commit()
        return False

    db.execute(
        "INSERT INTO rate_limit_events (rl_key, ts) VALUES (?, ?)",
        (key, now),
    )
    db.commit()

    # Purga global periódica para evitar crecimiento indefinido de la tabla
    _rate_limit_call_counter += 1
    if _rate_limit_call_counter % RATE_LIMIT_PURGE_EVERY == 0:
        try:
            db.execute("DELETE FROM rate_limit_events WHERE ts < ?", (cutoff,))
            db.commit()
        except sqlite3.OperationalError:
            pass

    return True
```

**Explicación de las líneas 131–173:**

Rate limiter con almacenamiento en SQLite (tabla `rate_limit_events`) para que funcione de forma compartida entre workers WSGI. Política: ventana de 60 segundos y máximo de 30 eventos por clave.

- **Líneas 131–133**: constantes: ventana 60 s, máximo 30 eventos, y purga global cada 256 inserciones.
- **Línea 135**: contador global (por proceso worker) que decide cuándo purgar la tabla completa [OBSERVACIÓN TÉCNICA] (no sincronizado entre workers).
- **Líneas 138–141**: declara el contador global, toma `time()` y la conexión `get_db()` (la misma de la petición). La tabla se crea bajo demanda en `get_db()`.
- **Líneas 144–148**: `DELETE` de eventos vencidos de esa clave en cada llamada (mantiene la tabla acotada por clave gracias al índice `(rl_key, ts)`).
- **Líneas 150–156**: cuenta eventos dentro de la ventana; si alcanzó `RATE_LIMIT_MAX` (30), hace `commit` del borrado previo y devuelve `False` (la vista responderá 429).
- **Líneas 158–162**: inserta el evento actual y hace `commit` (persistencia inmediata para que otros workers lo vean).
- **Líneas 165–171**: purga global de eventos vencidos cada 256 llamadas; ante `sqlite3.OperationalError` (p. ej. BD bloqueada) la ignora silenciosamente.
- **Línea 173**: devuelve `True` (petición permitida). Nota: cada llamada implica 1 DELETE + 1 SELECT + 1 INSERT + 2 commits sobre SQLite (costo de escritura por petición).

#### Bloque 6 (líneas 179–201) — Obtención segura de la IP del cliente

```py
PROXY_HEADERS = ['CF-Connecting-IP', 'X-Real-IP', 'X-Forwarded-For']
PROXY_CONFIANZA = os.environ.get("PROXY_CONFIANZA", "Cloudflare,PythonAnywhere").split(",")

def obtener_ip_cliente(request) -> str:
    """
    Obtiene la IP del cliente validando encabezados de proxies confiables.
    Soporta IPv4 e IPv6.
    """
    for header in PROXY_HEADERS:
        val = request.headers.get(header, "").strip()
        if val:
            ip = val.split(",")[0].strip()
            if ip and not _es_ip_privada(ip):
                return ip
    ip = request.remote_addr or ""
    return ip if not _es_ip_privada(ip) else ""

def _es_ip_privada(ip: str) -> bool:
    import ipaddress
    try:
        return ipaddress.ip_address(ip).is_private
    except ValueError:
        return True
```

**Explicación de las líneas 179–201:**

Obtiene la IP "real" del cliente a partir de cabeceras de proxy (Cloudflare/PythonAnywhere) descartando IPs privadas/reservadas, con respaldo en `request.remote_addr`.

- **Línea 179**: `PROXY_HEADERS` — encabezados aceptados en orden de prioridad.
- **Línea 180**: `PROXY_CONFIANZA` se lee del entorno pero nunca se usa para validar al emisor [POTENCIALMENTE NO UTILIZADO] → riesgo de suplantación de cabeceras (ver `## Seguridad`).
- **Líneas 182–194**: `obtener_ip_cliente(request)`: recorre las cabeceras; toma el primer elemento de una lista (soporte de cadenas `"ip1, ip2"`); si la IP no es privada la devuelve. Si ninguna cabecera sirve, usa `request.remote_addr` (lo descarta si es privada). Soporta IPv4 e IPv6 mediante `_es_ip_privada`.
- **Líneas 196–201**: `_es_ip_privada(ip)`: usa `ipaddress.ip_address(ip).is_private`; ante `ValueError` (IP inválida) devuelve `True`, tratando la IP como no utilizable. El `import ipaddress` dentro de la función se ejecuta en cada llamada [OBSERVACIÓN TÉCNICA].

#### Bloque 7 (líneas 207–241) — Interfaz de geolocalización por IP y proveedor primario ip-api.com

```py
class ProveedorGeolocalizacionIP(ABC):
    @abstractmethod
    def consultar(self, ip: str) -> dict:
        ...

class IPApiProvider(ProveedorGeolocalizacionIP):
    """Proveedor gratuito ip-api.com (plan free: 45 req/min)."""

    def consultar(self, ip: str) -> dict:
        import urllib.request
        url = f"http://ip-api.com/json/{ip}?fields=status,query,country,countryCode,regionName,city,lat,lon,isp,org,as,mobile,proxy,hosting"
        try:
            with urllib.request.urlopen(url, timeout=5) as resp:
                data = json.loads(resp.read().decode())
            if data.get("status") != "success":
                return {"ip": ip, "error": "No disponible"}
            return {
                "ip": data.get("query", ip),
                "pais": data.get("country", ""),
                "codigo_pais": data.get("countryCode", ""),
                "provincia": data.get("regionName", ""),
                "ciudad": data.get("city", ""),
                "latitud": data.get("lat"),
                "longitud": data.get("lon"),
                "precision_km": 50,
                "proveedor": data.get("isp", data.get("org", "")),
                "asn": data.get("as", "").split(" ")[0] if data.get("as") else "",
                "operador_movil": data.get("org", "") if data.get("mobile") else "",
                "posible_vpn": data.get("proxy", False),
                "posible_proxy": data.get("proxy", False),
                "posible_hosting": data.get("hosting", False),
            }
        except Exception as exc:
            logger.warning("[GeoIP] Error consultando %s: %s", ip, exc)
            return {"ip": ip, "error": str(exc)}
```

**Explicación de las líneas 207–241:**

Define la interfaz abstracta del proveedor de geolocalización y la implementación primaria que consume la API gratuita de `ip-api.com`.

- **Líneas 207–210**: clase abstracta `ProveedorGeolocalizacionIP` con método abstracto `consultar(ip) -> dict`; contrato común para primario y fallback.
- **Líneas 212–213**: `IPApiProvider` con docstring que indica el plan gratuito (45 req/min).
- **Línea 216**: `import urllib.request` local (solo se necesita al consultar).
- **Línea 217**: URL del proveedor **en HTTP (sin TLS)** con selección de campos; incluye la IP en el path. La respuesta viaja sin cifrar [INFORMATIVO].
- **Líneas 218–221**: petición con timeout de 5 s; parsea JSON. Si el estado no es `success`, devuelve error `"No disponible"`.
- **Líneas 223–238**: normaliza la respuesta a un diccionario estable con claves en español usadas por las tablas (`pais`, `codigo_pais`, `provincia`, `ciudad`, `latitud`, `longitud`, `precision_km` fijo en 50, `proveedor`, `asn` (primer token del campo `as`), `operador_movil` cuando `mobile` es verdadero, y flags `posible_vpn/proxy/hosting`).
- **Líneas 239–241**: ante cualquier excepción loguea advertencia `[GeoIP]` (incluye el texto de la excepción en el log) y devuelve un dict con `error` (el texto del error se propaga al llamador).

#### Bloque 8 (líneas 243–297) — Proveedor de respaldo ipregistry.co y servicio GeoIP con fallback

```py
class ProveedorIPRegistry(ProveedorGeolocalizacionIP):
    """Proveedor de respaldo ipregistry.co (gratuito 100 req/día)."""

    def __init__(self, api_key: str = ""):
        self.api_key = api_key or os.environ.get("IPREGISTRY_API_KEY", "")

    def consultar(self, ip: str) -> dict:
        if not self.api_key:
            return {"ip": ip, "error": "Sin API key"}
        import urllib.request
        url = f"https://api.ipregistry.co/{ip}?key={self.api_key}"
        try:
            with urllib.request.urlopen(url, timeout=5) as resp:
                data = json.loads(resp.read().decode())
            if "error" in data:
                return {"ip": ip, "error": data["error"].get("message", "")}
            loc = data.get("location", {})
            conn = data.get("connection", {})
            return {
                "ip": data.get("ip", ip),
                "pais": loc.get("country", {}).get("name", ""),
                "codigo_pais": loc.get("country", {}).get("code", ""),
                "provincia": loc.get("region", {}).get("name", ""),
                "ciudad": loc.get("city", ""),
                "latitud": loc.get("latitude"),
                "longitud": loc.get("longitude"),
                "precision_km": loc.get("accuracy", 50),
                "proveedor": conn.get("organization", ""),
                "asn": conn.get("asn", {}).get("number", ""),
                "operador_movil": conn.get("organization", "") if conn.get("type") == "mobile" else "",
                "posible_vpn": conn.get("type") == "vpn",
                "posible_proxy": conn.get("type") == "proxy",
                "posible_hosting": conn.get("type") == "hosting",
            }
        except Exception as exc:
            logger.warning("[GeoIP] Error ipregistry %s: %s", ip, exc)
            return {"ip": ip, "error": str(exc)}

class GeoIPService:
    """Servicio desacoplado con proveedor primario y fallback."""

    def __init__(self):
        self.primary = IPApiProvider()
        self.fallback = ProveedorIPRegistry()

    def consultar(self, ip: str) -> dict:
        if not ip or _es_ip_privada(ip):
            return {"ip": ip, "error": "IP privada"}
        resultado = self.primary.consultar(ip)
        if "error" not in resultado:
            return resultado
        resultado = self.fallback.consultar(ip)
        return resultado

geoip_service = GeoIPService()
```

**Explicación de las líneas 243–297:**

Implementa el proveedor de respaldo `ipregistry.co` y el servicio `GeoIPService` que orquesta primario + fallback; crea la instancia global usada por los endpoints.

- **Líneas 246–247**: `__init__` guarda la API key (parámetro o variable de entorno `IPREGISTRY_API_KEY`). Valor de la clave: [SECRETO OCULTO].
- **Líneas 249–251**: sin clave devuelve error `"Sin API key"` (fallback degradado, no excepción).
- **Línea 253**: URL HTTPS con la API key en query string [INFORMATIVO]; el plan gratuito limita a 100 req/día (documentado en el docstring).
- **Líneas 255–258**: respuesta con campo `error` se traduce a mensaje de error.
- **Líneas 259–276**: mapea `location` y `connection` al mismo formato normalizado que `IPApiProvider` (mismo contrato); clasifica `connection.type` en `mobile`, `vpn`, `proxy`, `hosting`.
- **Líneas 277–279**: ante excepción loguea y devuelve dict con `error`.
- **Líneas 281–295**: `GeoIPService`: `__init__` instancia primario (`IPApiProvider`) y fallback (`ProveedorIPRegistry`); `consultar` descarta IPs vacías/privadas (error `"IP privada"`) y usa el fallback únicamente si el primario devuelve `error`.
- **Línea 297**: `geoip_service = GeoIPService()` — instancia singleton de módulo usada en `registrar_acceso` (941) y `registrar_ubicacion` (1004).

#### Bloque 9 (líneas 303–331) — Conexiones a bases de datos y teardowns

```py
def get_db() -> sqlite3.Connection:
    if "db" not in g:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        _create_tables(g.db)
    return g.db

@flask_app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def get_tel_db() -> sqlite3.Connection:
    if "tel_db" not in g:
        os.makedirs(os.path.dirname(TEL_DB_PATH), exist_ok=True)
        g.tel_db = sqlite3.connect(TEL_DB_PATH)
        g.tel_db.row_factory = sqlite3.Row
        g.tel_db.execute("PRAGMA journal_mode=WAL")
        _create_tel_tables(g.tel_db)
    return g.tel_db

@flask_app.teardown_appcontext
def close_tel_db(exception):
    db = g.pop("tel_db", None)
    if db is not None:
        db.close()
```

**Explicación de las líneas 303–331:**

Patrón de conexión por petición: cada petición obtiene (y cachea en `g`) una conexión SQLite nueva; al terminar el contexto de la petición, los teardowns registrados la cierran.

- **Líneas 303–310**: `get_db()` — si no hay conexión en `g["db"]`, crea el directorio padre (si falta), conecta a `DB_PATH`, activa `row_factory = sqlite3.Row` (acceso por nombre de columna), activa `PRAGMA journal_mode=WAL` (escrituras concurrentes con lecturas) y asegura el esquema con `_create_tables`. Devuelve la conexión cacheada. Motor: SQLite embebido (archivo local).
- **Líneas 312–316**: `close_db` registrado con `@flask_app.teardown_appcontext`: al finalizar el contexto extrae y cierra la conexión (evita fugas entre peticiones). El parámetro `exception` no se usa.
- **Líneas 318–325**: `get_tel_db()` — equivalente para la BD de agenda telefónica (`TEL_DB_PATH`), con su esquema `_create_tel_tables`.
- **Líneas 327–331**: teardown de la conexión TEL.
- Nota: no se configura `check_same_thread` (por defecto `True`) ni timeout de bloqueo explícito; cada petición usa su propia conexión, por lo que no hay uso cross-thread.

#### Bloque 10 (líneas 337–379) — Creación de tablas (parte 1): users, rate_limit_events, payment_events y tickets

```py
def _create_tables(db: sqlite3.Connection):
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            device_id              TEXT PRIMARY KEY,
            name                   TEXT NOT NULL,
            phone                  TEXT NOT NULL,
            mac_address            TEXT DEFAULT '',
            device_unique_id       TEXT DEFAULT '',
            registered_at          TEXT NOT NULL,
            subscription_status    TEXT NOT NULL DEFAULT 'not_registered',
            plan_type              TEXT,
            mp_preapproval_id      TEXT,
            subscription_expires_at TEXT,
            updated_at             TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS rate_limit_events (
            id     INTEGER PRIMARY KEY AUTOINCREMENT,
            rl_key TEXT NOT NULL,
            ts     REAL NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_rate_limit_key_ts
            ON rate_limit_events(rl_key, ts);

        CREATE TABLE IF NOT EXISTS payment_events (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id         TEXT,
            event_type        TEXT NOT NULL,
            mp_reference      TEXT,
            payload           TEXT,
            created_at        TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_number INTEGER UNIQUE NOT NULL,
            device_id     TEXT NOT NULL,
            user_name     TEXT DEFAULT '',
            plan_type     TEXT NOT NULL,
            amount        INTEGER NOT NULL,
            created_at    TEXT NOT NULL
        );
```

**Explicación de las líneas 337–379:**

Primera parte de `_create_tables` (idempotente, `IF NOT EXISTS`), que define el esquema de negocio de la BD principal dentro de un `executescript`.

- **Línea 337**: firma `_create_tables(db)`.
- **Líneas 339–351**: tabla `users` con `device_id` como clave primaria textual; campos `name`, `phone` (PII) y fechas como TEXT ISO; `subscription_status` con default `not_registered`; `plan_type`; `mp_preapproval_id` (para vincular webhooks de Mercado Pago); `subscription_expires_at`; `updated_at`. No hay `CHECK` ni FK.
- **Líneas 353–357**: `rate_limit_events` para el rate limiter SQLite (`rl_key` + `ts` REAL, época Unix).
- **Líneas 359–360**: índice compuesto `(rl_key, ts)` que acelera los DELETE/COUNT del rate limiter.
- **Líneas 362–369**: `payment_events`: bitácora de eventos de pago con `event_type`, `mp_reference` y `payload` en JSON (TEXT) — el payload completo puede contener datos del pagador [INFORMATIVO].
- **Líneas 371–379**: `tickets`: ticket correlativo con `ticket_number` UNIQUE; `amount` INTEGER (precios en la moneda local sin decimales: 7500/75000).

#### Bloque 11 (líneas 381–436) — Creación de tablas (parte 2): ubicaciones_usuario

```py
        --- Tabla de ubicaciones (Prompt Maestro secciones 8-9) ---
        CREATE TABLE IF NOT EXISTS ubicaciones_usuario (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id            TEXT NOT NULL,
            sesion_id             TEXT,
            device_id_app         TEXT,
            fecha_hora_servidor   TEXT NOT NULL DEFAULT (datetime('now')),
            fecha_hora_dispositivo TEXT,
            latitud               REAL,
            longitud              REAL,
            precision_metros      REAL,
            altitud_metros        REAL,
            velocidad_metros_segundo REAL,
            rumbo_grados          REAL,
            origen                TEXT NOT NULL CHECK (origen IN ('GPS','NAVEGADOR','IP','MANUAL')),
            permiso_ubicacion     TEXT CHECK (permiso_ubicacion IN ('GRANTED','DENIED','PROMPT','NO_DISPONIBLE','NO_SOLICITADO','ERROR')),
            ip                    TEXT,
            pais_ip               TEXT,
            codigo_pais_ip        TEXT,
            provincia_ip          TEXT,
            ciudad_ip             TEXT,
            codigo_postal_ip      TEXT,
            latitud_ip            REAL,
            longitud_ip           REAL,
            precision_ip_km       REAL,
            proveedor             TEXT,
            operador_movil_estimado TEXT,
            asn                   TEXT,
            posible_vpn           INTEGER DEFAULT 0,
            posible_proxy         INTEGER DEFAULT 0,
            posible_hosting       INTEGER DEFAULT 0,
            metodo_http           TEXT,
            ruta_consultada       TEXT,
            pagina_consultada     TEXT,
            referer               TEXT,
            codigo_respuesta      INTEGER,
            user_agent            TEXT,
            navegador_aproximado  TEXT,
            sistema_operativo_aproximado TEXT,
            tipo_dispositivo      TEXT,
            idioma                TEXT,
            idiomas               TEXT,
            zona_horaria          TEXT,
            offset_utc_minutos    INTEGER,
            pantalla_ancho        INTEGER,
            pantalla_alto         INTEGER,
            ventana_ancho         INTEGER,
            ventana_alto          INTEGER,
            profundidad_color     INTEGER,
            direccion_estimada    TEXT,
            direccion_confirmada  TEXT,
            proveedor_geocodificacion TEXT,
            observaciones         TEXT,
            metadatos             TEXT,
            creado_en             TEXT NOT NULL DEFAULT (datetime('now'))
        );
```

**Explicación de las líneas 381–436:**

Tabla central de ubicaciones del "Prompt Maestro": registra coordenadas, origen (con `CHECK`), permiso de ubicación (con `CHECK`), datos de IP/geo (del proveedor), contexto HTTP/navegador/dispositivo/pantalla, dirección estimada/confirmada y metadatos libres.

- **Línea 382–386**: `id` autogenerado; `usuario_id` (obligatorio, sin FK); `sesion_id`; `device_id_app`; `fecha_hora_servidor` con default `datetime('now')` (SQLite, UTC).
- **Líneas 389–394**: coordenadas y datos cinemáticos opcionales (`latitud`, `longitud`, `precision_metros`, `altitud`, `velocidad`, `rumbo`).
- **Línea 395**: `origen` con restricción `CHECK` a `GPS/NAVEGADOR/IP/MANUAL` — valida a nivel de BD lo que también validan `validar_origen` y la vista.
- **Línea 396**: `permiso_ubicacion` con `CHECK` sobre los 6 estados del permiso.
- **Líneas 397–411**: bloque IP/geo del proveedor (IP, país, ciudad, coordenadas de IP, precisión en km, proveedor, operador móvil, ASN, flags `posible_vpn/proxy/hosting` como INTEGER 0/1).
- **Líneas 412–432**: contexto de la petición (método, rutas, referer, código de respuesta, user-agent), navegador/OS/tipo de dispositivo, idiomas, zona horaria, dimensiones de pantalla y ventana, profundidad de color, dirección estimada/confirmada y proveedor de geocodificación.
- **Líneas 433–435**: `observaciones` y `metadatos` (JSON TEXT, serializado por la vista) y `creado_en` con default `datetime('now')`.
- [INFORMATIVO] Volumen de datos personales y de geolocalización en una sola fila; sin FK ni política de borrado en cascada (la purga es manual por fechas).

#### Bloque 12 (líneas 438–450) — Creación de tablas (parte 3): consentimientos_usuario

```py
        --- Tabla de consentimientos (Prompt Maestro sección 10) ---
        CREATE TABLE IF NOT EXISTS consentimientos_usuario (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id        TEXT NOT NULL,
            sesion_id         TEXT,
            tipo_permiso      TEXT NOT NULL CHECK (tipo_permiso IN ('UBICACION','CAMARA','MICROFONO','CONTACTOS','NOTIFICACIONES')),
            estado            TEXT NOT NULL CHECK (estado IN ('OTORGADO','RECHAZADO','REVOCADO','NO_SOLICITADO')),
            texto_mostrado    TEXT,
            version_politica  TEXT,
            fecha_hora        TEXT NOT NULL DEFAULT (datetime('now')),
            ip                TEXT,
            user_agent        TEXT
        );
```

**Explicación de las líneas 438–450:**

Tabla de auditoría de consentimientos de permisos (privacidad): modelo de solo inserción (append) con enumerados en `CHECK`.

- **Línea 439**: nombre de la tabla.
- **Línea 443**: `tipo_permiso` con `CHECK` sobre los 5 permisos (UBICACION, CAMARA, MICROFONO, CONTACTOS, NOTIFICACIONES).
- **Línea 444**: `estado` con `CHECK` sobre OTORGADO/RECHAZADO/REVOCADO/NO_SOLICITADO.
- **Líneas 445–446**: `texto_mostrado` (el texto exacto del consentimiento mostrado al usuario) y `version_politica` (versión de la política) — trazabilidad de privacidad.
- **Líneas 447–449**: `fecha_hora` con default `datetime('now')`; IP y User-Agent del momento del consentimiento.
- [NOTA] No existe columna de "vigencia" ni lógica de estado actual: la revocación es un registro nuevo (ver `revocar_consentimiento`, líneas 1132–1158).

#### Bloque 13 (líneas 452–494) — Creación de tablas (parte 4): accesos_tecnicos y cierre del esquema

```py
        --- Tabla de accesos técnicos (Prompt Maestro sección 11) ---
        CREATE TABLE IF NOT EXISTS accesos_tecnicos (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id        TEXT,
            sesion_id         TEXT,
            device_id_app     TEXT,
            fecha_hora        TEXT NOT NULL DEFAULT (datetime('now')),
            ip                TEXT,
            metodo_http       TEXT,
            ruta_consultada   TEXT,
            pagina_consultada TEXT,
            endpoint          TEXT,
            codigo_respuesta  INTEGER,
            user_agent        TEXT,
            referer           TEXT,
            navegador_aproximado TEXT,
            sistema_operativo_aproximado TEXT,
            tipo_dispositivo  TEXT,
            idioma            TEXT,
            idiomas           TEXT,
            zona_horaria      TEXT,
            offset_utc_minutos INTEGER,
            pantalla_ancho    INTEGER,
            pantalla_alto     INTEGER,
            ventana_ancho     INTEGER,
            ventana_alto      INTEGER,
            profundidad_color INTEGER,
            pais_ip           TEXT,
            provincia_ip      TEXT,
            ciudad_ip         TEXT,
            proveedor         TEXT,
            asn               TEXT,
            posible_vpn       INTEGER DEFAULT 0,
            posible_proxy     INTEGER DEFAULT 0,
            posible_hosting   INTEGER DEFAULT 0,
            metodo_autenticacion TEXT,
            creado_en         TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """)

    _crear_indices_ubicaciones(db)
    _migrate_add_device_columns(db)
    db.commit()
```

**Explicación de las líneas 452–494:**

Última tabla del esquema (accesos técnicos, trazabilidad auditable) y cierre de `_create_tables`.

- **Líneas 453–489**: `accesos_tecnicos`: similar a `ubicaciones_usuario` en contexto (usuario, sesión, dispositivo, HTTP, navegador/OS/pantalla, geo por IP) pero sin coordenadas, con `endpoint` y `metodo_autenticacion`. `usuario_id` es opcional (NULL permitido).
- **Línea 490**: cierre del `executescript`.
- **Líneas 492–493**: tras crear tablas llama a `_crear_indices_ubicaciones(db)` (índices de trazabilidad) y `_migrate_add_device_columns(db)` (columnas añadidas en migraciones de `users`).
- **Línea 494**: `db.commit()` — persiste el esquema.

#### Bloque 14 (líneas 496–521) — Índices de trazabilidad y migración idempotente de columnas

```py
def _crear_indices_ubicaciones(db: sqlite3.Connection):
    db.executescript("""
        CREATE INDEX IF NOT EXISTS idx_ubicaciones_usuario_id
            ON ubicaciones_usuario(usuario_id);
        CREATE INDEX IF NOT EXISTS idx_ubicaciones_fecha
            ON ubicaciones_usuario(fecha_hora_servidor DESC);
        CREATE INDEX IF NOT EXISTS idx_ubicaciones_origen
            ON ubicaciones_usuario(origen);
        CREATE INDEX IF NOT EXISTS idx_ubicaciones_ip
            ON ubicaciones_usuario(ip);
        CREATE INDEX IF NOT EXISTS idx_ubicaciones_sesion
            ON ubicaciones_usuario(sesion_id);
        CREATE INDEX IF NOT EXISTS idx_consentimientos_usuario
            ON consentimientos_usuario(usuario_id);
        CREATE INDEX IF NOT EXISTS idx_accesos_tecnicos_fecha
            ON accesos_tecnicos(fecha_hora DESC);
        CREATE INDEX IF NOT EXISTS idx_accesos_tecnicos_usuario
            ON accesos_tecnicos(usuario_id);
    """)

def _migrate_add_device_columns(db: sqlite3.Connection):
    for col, default in [("mac_address", "''"), ("device_unique_id", "''")]:
        try:
            db.execute(f"ALTER TABLE users ADD COLUMN {col} TEXT DEFAULT {default}")
        except sqlite3.OperationalError:
            pass
```

**Explicación de las líneas 496–521:**

Crea los índices que aceleran las consultas de historiales, mapa y estadísticas; migra columnas nuevas de `users` tolerando que ya existan.

- **Líneas 496–514**: `_crear_indices_ubicaciones`: índices por `usuario_id`, `fecha_hora_servidor DESC` (historial/última), `origen`, `ip`, `sesion_id` en `ubicaciones_usuario`; por `usuario_id` en `consentimientos_usuario`; por `fecha_hora DESC` y `usuario_id` en `accesos_tecnicos`. No hay índice en `payment_events` ni en `tickets` por `device_id` (consultas por ese campo serán escaneos) [OBSERVACIÓN TÉCNICA].
- **Líneas 516–521**: `_migrate_add_device_columns`: para cada columna nueva (`mac_address`, `device_unique_id`) ejecuta `ALTER TABLE ... ADD COLUMN`; si ya existe, SQLite lanza `sqlite3.OperationalError` (duplicate column) que se ignora (migración idempotente). [INFORMATIVO] El nombre de columna proviene de una lista fija del código (no de entrada de usuario), por lo que el f-string no introduce inyección SQL.

#### Bloque 15 (líneas 523–546) — Esquema de la BD TEL: usuarios_emerg y periodo_prueba

```py
def _create_tel_tables(db: sqlite3.Connection):
    db.executescript("""
        CREATE TABLE IF NOT EXISTS usuarios_emerg (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id   TEXT    NOT NULL,
            nombre      TEXT    NOT NULL,
            telefono    TEXT    NOT NULL,
            borrado     INTEGER NOT NULL DEFAULT 0,
            principal   INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT    NOT NULL,
            updated_at  TEXT    NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_emerg_device_tel
            ON usuarios_emerg(device_id, telefono);

        CREATE TABLE IF NOT EXISTS periodo_prueba (
            device_id             TEXT PRIMARY KEY,
            fecha_primer_contacto TEXT NOT NULL,
            fecha_expiracion      TEXT NOT NULL,
            pago                  INTEGER NOT NULL DEFAULT 0
        );
    """)
    db.commit()
```

**Explicación de las líneas 523–546:**

Esquema de la segunda base SQLite (agenda telefónica de contactos de emergencia y periodo de prueba gratuito).

- **Líneas 525–534**: `usuarios_emerg`: contactos de emergencia por dispositivo con borrado lógico (`borrado` 0/1) y flag `principal`; `nombre` y `telefono` son datos personales.
- **Líneas 536–537**: índice UNIQUE `(device_id, telefono)` — garantiza un único registro por par; el código hace el upsert manualmente consultando ese par.
- **Líneas 539–544**: `periodo_prueba`: control del periodo gratuito (10 días) por `device_id` con `pago` (0/1).
- **Línea 546**: `db.commit()`.

#### Bloque 16 (líneas 548–559) — Auxiliar de creación de periodo de prueba

```py
def _crear_periodo_prueba_si_no_existe(db: sqlite3.Connection, device_id: str):
    existing = db.execute(
        "SELECT device_id FROM periodo_prueba WHERE device_id = ?", (device_id,)
    ).fetchone()
    if not existing:
        now = datetime.utcnow()
        fecha_exp = (now + timedelta(days=10)).isoformat()
        db.execute(
            "INSERT INTO periodo_prueba (device_id, fecha_primer_contacto, fecha_expiracion, pago) VALUES (?,?,?,0)",
            (device_id, now.isoformat(), fecha_exp)
        )
        db.commit()
```

**Explicación de las líneas 548–559:**

Garantiza que todo `device_id` que sincronice contactos tenga un periodo de prueba de 10 días.

- **Líneas 549–551**: consulta si el `device_id` ya existe en `periodo_prueba`.
- **Líneas 552–558**: si no existe, calcula expiración con `datetime.utcnow() + timedelta(days=10)` (fechas ISO naive UTC), inserta el registro con `pago=0` y hace `commit`.
- **Línea 554**: valor mágico `10` días de prueba [NOTA].
- [OBSERVACIÓN TÉCNICA] `datetime.utcnow()` deprecado en Python 3.12+; además, el alta se dispara al agregar un contacto (`tel_agregar_contacto`, línea 884), no al primer uso real de la app.

[NOTA] **Fin de la parte 1 de 3 (líneas 1–560).** La parte 2 (líneas 561–1100: decoradores de seguridad, verificador de firma MP, validadores, endpoints `/api/...` heredados y endpoints v1 de acceso/ubicación) continúa en `backend_flask_app.py.parte2.md`. La parte 3 (líneas 1101–1591: consentimientos, historiales, mapa, endpoints admin, retención y arranque) continúa en `backend_flask_app.py.parte3.md`.
