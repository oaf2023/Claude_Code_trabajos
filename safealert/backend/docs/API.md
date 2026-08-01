# API de Ubicaciones, Accesos y Consentimientos — SafeAlert

## Base URL

```
https://oaf.pythonanywhere.com/api/v1
```

## Autenticación

| Endpoint | Método | Autenticación |
|----------|--------|---------------|
| Públicos | `GET /api/v1/estado` | Ninguna |
| Usuario | `POST /api/v1/ubicaciones`, `/accesos`, `/consentimientos` | Firebase Auth (Bearer token) |
| Administrativos | `GET /api/v1/ubicaciones/mapa`, `/ubicaciones/{id}`, `/accesos/usuario/{id}`, `/consentimientos/usuario/{id}`, `/admin/usuarios`, `/admin/stats` | `X-Admin-Key` |

---

## Endpoints

### `POST /api/v1/accesos`

Registra un acceso técnico con metadatos del dispositivo y geolocalización por IP.

```bash
curl -X POST https://oaf.pythonanywhere.com/api/v1/accesos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase_token>" \
  -d '{
    "usuario_id": "abc123",
    "sesion_id": "550e8400-e29b-41d4-a716-446655440000",
    "device_id_app": "550e8400-e29b-41d4-a716-446655440000",
    "pagina_consultada": "home",
    "navegador_aproximado": "React Native",
    "sistema_operativo_aproximado": "android 15",
    "tipo_dispositivo": "telefono",
    "idioma": "es-AR",
    "zona_horaria": "America/Argentina/Buenos_Aires",
    "offset_utc_minutos": -180,
    "pantalla_ancho": 1080,
    "pantalla_alto": 2400,
    "ventana_ancho": 1080,
    "ventana_alto": 2200,
    "profundidad_color": 24,
    "metodo_autenticacion": "firebase_anonimo"
  }'
```

Respuesta: `201 {"success": true, "ip": "181.xxx.xxx.xxx"}`

---

### `POST /api/v1/ubicaciones`

Registra una ubicación con origen GPS o NAVEGADOR.

```bash
curl -X POST https://oaf.pythonanywhere.com/api/v1/ubicaciones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase_token>" \
  -d '{
    "usuario_id": "abc123",
    "sesion_id": "550e8400-e29b-41d4-a716-446655440000",
    "latitud": -34.603722,
    "longitud": -58.381592,
    "precision_metros": 12.5,
    "altitud_metros": 24.0,
    "velocidad_metros_segundo": 0,
    "rumbo_grados": null,
    "origen": "NAVEGADOR",
    "permiso_ubicacion": "GRANTED",
    "fecha_hora_dispositivo": "2026-07-30T15:48:00-03:00"
  }'
```

Respuesta: `201 {"success": true, "id": 1}`

---

### `POST /api/v1/ubicaciones/manual`

Registra una ubicación ingresada manualmente por el usuario (origen MANUAL).

```bash
curl -X POST https://oaf.pythonanywhere.com/api/v1/ubicaciones/manual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase_token>" \
  -d '{
    "usuario_id": "abc123",
    "latitud": -34.610000,
    "longitud": -58.390000,
    "direccion_confirmada": "Ubicación declarada por el usuario",
    "observaciones": "Cerca de la entrada principal"
  }'
```

Respuesta: `201 {"success": true, "id": 2}`

---

### `POST /api/v1/consentimientos`

Registra un consentimiento otorgado o rechazado.

```bash
curl -X POST https://oaf.pythonanywhere.com/api/v1/consentimientos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase_token>" \
  -d '{
    "usuario_id": "abc123",
    "sesion_id": "550e8400-e29b-41d4-a716-446655440000",
    "tipo_permiso": "UBICACION",
    "estado": "OTORGADO",
    "texto_mostrado": "La aplicación necesita acceso a tu ubicación para enviar alertas SOS",
    "version_politica": "1.0.0"
  }'
```

Respuesta: `201 {"success": true, "id": 1}`

---

### `POST /api/v1/consentimientos/revocar`

Revoca un consentimiento previamente otorgado.

```bash
curl -X POST https://oaf.pythonanywhere.com/api/v1/consentimientos/revocar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase_token>" \
  -d '{
    "usuario_id": "abc123",
    "tipo_permiso": "UBICACION"
  }'
```

Respuesta: `200 {"success": true, "message": "Consentimiento UBICACION revocado"}`

---

### `GET /api/v1/ubicaciones/ultima/<usuario_id>`

Obtiene la última ubicación registrada del usuario.

```bash
curl https://oaf.pythonanywhere.com/api/v1/ubicaciones/ultima/abc123 \
  -H "Authorization: Bearer <firebase_token>"
```

Respuesta: `200 { "id": 1, "latitud": -34.603722, "origen": "NAVEGADOR", ... }`

---

### `GET /api/v1/ubicaciones/mapa`

Obtiene ubicaciones para el mapa operativo. Requiere `X-Admin-Key`.

```bash
curl https://oaf.pythonanywhere.com/api/v1/ubicaciones/mapa?usuario_id=abc123&limite=100 \
  -H "X-Admin-Key: <admin_key>"
```

Parámetros: `usuario_id`, `origen` (GPS/NAVEGADOR/IP/MANUAL), `limite` (max 1000)

---

### `GET /api/v1/estado`

Health check del sistema con estadísticas.

```bash
curl https://oaf.pythonanywhere.com/api/v1/estado
```

---

### `GET /api/v1/admin/usuarios`

Listado de usuarios con su última ubicación registrada (dashboard de posicionamientos). Requiere `X-Admin-Key`.

```bash
curl "https://oaf.pythonanywhere.com/api/v1/admin/usuarios?busqueda=juan&mac=AA:BB:CC:DD:EE:FF&plan=monthly&limite=200" \
  -H "X-Admin-Key: <admin_key>"
```

Parámetros: `busqueda` (device_id/nombre/teléfono/MAC), `mac` (dirección MAC, tolera formato con o sin separadores), `plan` (monthly/annual/sin_plan), `limite` (max 500)

Respuesta: `200 {"total": N, "usuarios": [{"device_id", "name", "phone", "mac_address", "subscription_status", "plan_type", "ultima_latitud", "ultima_longitud", "ultimo_origen", "ultima_fecha_hora", "total_ubicaciones", ...}]}`

---

### `POST /api/v1/admin/pagos/simular`

Genera un pago simulado (herramienta de pruebas) para un usuario, buscado por MAC address o device_id. Activa la suscripción, registra el evento `admin_simulated` y genera un ticket correlativo. **No hay cobro real** (no toca MercadoPago). Requiere `X-Admin-Key`.

```bash
curl -X POST https://oaf.pythonanywhere.com/api/v1/admin/pagos/simular \
  -H "X-Admin-Key: <admin_key>" \
  -H "Content-Type: application/json" \
  -d '{"mac_address": "AA:BB:CC:DD:EE:FF", "plan_type": "monthly", "dias": 32}'
```

Cuerpo: `mac_address` (o `device_id`), `plan_type` (monthly/annual, obligatorio), `dias` (duración; 32 mensual / 380 anual por defecto)

Respuesta: `200 {"success": true, "ticket": {"ticket_number", "date", "time", "plan_type", "amount", "contact_email"}, "usuario": {"device_id", "name", "mac_address", "subscription_status", "plan_type", "subscription_expires_at"}}`

Errores: `400` plan inválido o sin MAC/device_id · `404` MAC/device no encontrado · `409` MAC duplicada en varios usuarios

---

### `GET /api/v1/admin/stats`

KPIs agregados para el dashboard. Requiere `X-Admin-Key`.

```bash
curl https://oaf.pythonanywhere.com/api/v1/admin/stats \
  -H "X-Admin-Key: <admin_key>"
```

Respuesta: `200 {"kpis": {"total_usuarios", "usuarios_activos_24h", "usuarios_activos_7d", "total_ubicaciones", "ubicaciones_24h", "total_accesos", "accesos_24h", "total_consentimientos"}, "ubicaciones_por_origen": [...], "ubicaciones_por_dia": [...], "accesos_por_dispositivo": [...], "usuarios_por_estado_suscripcion": [...], "consentimientos_por_estado": [...], "ubicaciones_por_permiso": [...], "usuarios_por_plan": [...], "generado_en": ...}`

---

## Política de Retención

| Tabla | Retención | Purga |
|-------|-----------|-------|
| `accesos_tecnicos` | 90 días | `DELETE WHERE fecha_hora < datetime('now', '-90 days')` |
| `ubicaciones_usuario` | 365 días | `DELETE WHERE creado_en < datetime('now', '-365 days')` |
| `consentimientos_usuario` | 365 días | `DELETE WHERE fecha_hora < datetime('now', '-365 days')` |

Ejecutar purga manual (requiere `X-Admin-Key`):

```bash
curl -X POST https://oaf.pythonanywhere.com/api/v1/admin/purga \
  -H "X-Admin-Key: <admin_key>"
```

---

## Códigos de Error

| Código | Significado |
|--------|-------------|
| 400 | Datos inválidos (coordenadas, origen, permisos) |
| 401 | No autorizado (token/key inválido) |
| 404 | Recurso no encontrado |
| 429 | Demasiadas solicitudes (rate limit) |
| 500 | Error interno del servidor |
