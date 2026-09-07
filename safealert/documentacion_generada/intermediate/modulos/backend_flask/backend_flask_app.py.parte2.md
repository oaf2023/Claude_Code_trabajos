# Archivo: backend/flask_app.py

> [NOTA] **Parte 2 de 3** del análisis línea por línea del módulo **backend_flask** (auditoría SafeAlert). Continúa el rango de líneas **561–1100** del archivo `backend/flask_app.py`. La parte 1 (líneas 1–560) y las secciones resumen (Metadatos, Seguridad, Riesgos, etc.) están en `backend_flask_app.py.md`; la parte 3 (líneas 1101–1591) en `backend_flask_app.py.parte3.md`.

## Análisis línea por línea (parte 2 de 3: líneas 561–1100)

#### Bloque 17 (líneas 561–603) — Decoradores de autenticación y autorización

```py
# ---------------------------------------------------------------------------
# Decoradores de seguridad
# ---------------------------------------------------------------------------

def require_internal_key(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not INTERNAL_KEY:
            return jsonify({"error": "Configuracion interna incorrecta"}), 500
        provided = request.headers.get("X-Internal-Key", "")
        if not hmac.compare_digest(provided, INTERNAL_KEY):
            return jsonify({"error": "No autorizado"}), 401
        return f(*args, **kwargs)
    return wrapper

def require_admin_key(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not ADMIN_API_KEY:
            return jsonify({"error": "Configuracion administrativa incorrecta"}), 500
        provided = request.headers.get("X-Admin-Key", "")
        if not hmac.compare_digest(provided, ADMIN_API_KEY):
            return jsonify({"error": "No autorizado"}), 401
        return f(*args, **kwargs)
    return wrapper

def require_firebase_auth(f):
    """Exige un Firebase ID Token válido (Bearer) y expone g.firebase_uid."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if firebase_auth is None:
            return jsonify({"error": "Autenticacion no disponible en el servidor"}), 500
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token requerido"}), 401
        try:
            token = auth_header.split(" ", 1)[1]
            decoded = firebase_auth.verify_id_token(token)
            g.firebase_uid = decoded.get("uid", "")
        except Exception:
            return jsonify({"error": "Token invalido o expirado"}), 401
        return f(*args, **kwargs)
    return wrapper
```

**Explicación de las líneas 561–603:**

Tres decoradores de seguridad que envuelven las vistas: dos basados en claves estáticas compartidas (cabeceras `X-Internal-Key` y `X-Admin-Key`) y uno basado en Firebase ID Tokens (Bearer).

- **Líneas 565–574**: `require_internal_key` — si `INTERNAL_KEY` no está configurada responde 500 (configuración incorrecta, cierre a la baja); compara la cabecera `X-Internal-Key` con `hmac.compare_digest` (comparación constante en tiempo, evita timing attacks); si no coincide, 401. Protege `confirm_payment`, `link_preapproval` y `crear_ticket`.
- **Líneas 576–585**: `require_admin_key` — equivalente con `X-Admin-Key` y `ADMIN_API_KEY`; 500 si la clave no está configurada; 401 si no coincide. Protege los endpoints de lectura administrativa y el simulador de pagos.
- **Líneas 587–603**: `require_firebase_auth` — exige `Authorization: Bearer <token>` (401 si falta el prefijo); si `firebase_auth` es `None` (librería ausente) responde 500; verifica el token con `firebase_auth.verify_id_token(token)` y expone `g.firebase_uid = decoded["uid"]`; ante cualquier excepción responde 401 "Token invalido o expirado". Protege `register_user` y `user_status`.
- [RIESGO] `require_firebase_auth` verifica autenticidad del token pero no autoriza por recurso: el `uid` no se usa en `register_user`/`user_status` para comprobar propiedad del `device_id` (IDOR).
- [NOTA] Todos usan `@wraps(f)` para conservar metadatos de las funciones envueltas.

#### Bloque 18 (líneas 605–624) — Verificación de firma HMAC del webhook de Mercado Pago

```py
def verify_mp_signature(x_signature: str, x_request_id: str, data_id: str) -> bool:
    if not MP_WEBHOOK_SECRET:
        logger.error("[SafeAlert] MP_WEBHOOK_SECRET no configurado")
        return False
    if not x_signature:
        return False
    try:
        parts = dict(p.split("=", 1) for p in x_signature.split(",") if "=" in p)
        ts, v1 = parts.get("ts", ""), parts.get("v1", "")
        if not ts or not v1:
            return False
        signed_template = f"id:{data_id};request-id:{x_request_id};ts:{ts}"
        expected = hmac.new(
            MP_WEBHOOK_SECRET.encode("utf-8"),
            signed_template.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, v1)
    except Exception:
        return False
```

**Explicación de las líneas 605–624:**

Reconstruye y verifica la firma HMAC-SHA256 que Mercado Pago envía en la cabecera `x-signature` (formato `ts=...;v1=...`).

- **Líneas 606–608**: si el secreto no está configurado, loguea error y devuelve `False`.
- **Líneas 609–610**: sin cabecera de firma, `False`.
- **Líneas 611–615**: parsea la firma separando pares `clave=valor` por comas; extrae `ts` y `v1`; si faltan, `False`.
- **Líneas 616–622**: construye la plantilla oficial de Mercado Pago `id:<data_id>;request-id:<x_request_id>;ts:<ts>` y calcula el HMAC-SHA256 esperado con `MP_WEBHOOK_SECRET`; compara en tiempo constante con `hmac.compare_digest`.
- **Líneas 623–624**: cualquier excepción devuelve `False`.
- [RIESGO] `ts` (timestamp de la firma) no se compara con el reloj del servidor: una firma capturada puede reutilizarse (replay) mientras el evento no se deduplique (ver `mp_webhook`).

#### Bloque 19 (líneas 630–650) — Validadores y health check simple

```py
def validar_coordenadas(lat: float, lon: float) -> tuple[bool, str]:
    errores = []
    if lat is not None and (lat < -90 or lat > 90):
        errores.append("latitud fuera de rango (-90 a 90)")
    if lon is not None and (lon < -180 or lon > 180):
        errores.append("longitud fuera de rango (-180 a 180)")
    return (len(errores) == 0, "; ".join(errores))

def validar_origen(origen: str) -> bool:
    return origen in ('GPS', 'NAVEGADOR', 'IP', 'MANUAL')

def validar_permiso(permiso: str) -> bool:
    return permiso in ('GRANTED', 'DENIED', 'PROMPT', 'NO_DISPONIBLE', 'NO_SOLICITADO', 'ERROR')

# ---------------------------------------------------------------------------
# Endpoints existentes (SafeAlert original)
# ---------------------------------------------------------------------------

@flask_app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat()})
```

**Explicación de las líneas 630–650:**

Funciones de validación puras (Prompt Maestro sección 17) y el primer endpoint del archivo (`/api/health`).

- **Líneas 630–636**: `validar_coordenadas(lat, lon)` — valida rangos de latitud (-90..90) y longitud (-180..180) solo si el valor no es `None`; devuelve `(bool, mensaje)` con los errores acumulados separados por `; `.
- **Líneas 638–639**: `validar_origen(origen)` — devuelve `True` solo para `GPS/NAVEGADOR/IP/MANUAL` (mismo enumerado que el `CHECK` de la tabla).
- **Líneas 641–642**: `validar_permiso(permiso)` — valida contra los 6 estados de permiso (mismo enumerado que el `CHECK` de `ubicaciones_usuario`).
- **Líneas 648–650**: `health` — responde 200 `{"status": "ok", "timestamp": ...}` sin tocar la BD (sondeo de plataforma). Sin autenticación ni rate limit.

#### Bloque 20 (líneas 652–674) — POST /api/users/register

```py
@flask_app.route("/api/users/register", methods=["POST"])
@require_firebase_auth
def register_user():
    if not _rate_limit(f"register:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    data = request.get_json(silent=True) or {}
    device_id, name, phone = data.get("device_id", "").strip(), data.get("name", "").strip(), data.get("phone", "").strip()
    mac, uid = data.get("mac_address", "").strip(), data.get("device_unique_id", "").strip()
    if not device_id or not name or not phone:
        return jsonify({"error": "device_id, name y phone son requeridos"}), 400
    if not re.match(r'^[a-zA-Z0-9\-_]{1,80}$', device_id):
        return jsonify({"error": "device_id invalido"}), 400
    now = datetime.utcnow().isoformat()
    db = get_db()
    existing = db.execute("SELECT subscription_status FROM users WHERE device_id = ?", (device_id,)).fetchone()
    if existing:
        db.execute("UPDATE users SET name=?, phone=?, mac_address=?, device_unique_id=?, updated_at=? WHERE device_id=?", (name, phone, mac, uid, now, device_id))
        status = existing["subscription_status"]
    else:
        db.execute("INSERT INTO users (device_id, name, phone, mac_address, device_unique_id, registered_at, subscription_status, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'not_registered', ?)", (device_id, name, phone, mac, uid, now, now))
        status = "not_registered"
    db.commit()
    return jsonify({"success": True, "status": status})
```

**Explicación de las líneas 652–674:**

Registra o actualiza un usuario/device en la tabla `users`; exige Firebase ID Token y aplica rate limit.

- **Línea 655**: rate limit con clave `register:<remote_addr>` (429 si supera 30 en 60 s). [OBSERVACIÓN TÉCNICA] la clave depende de `remote_addr`, que bajo proxy puede ser compartida o falseable.
- **Línea 657**: cuerpo JSON con `silent=True`; si el JSON es inválido o vacío usa `{}`.
- **Líneas 658–659**: extrae y recorta `device_id`, `name`, `phone`, `mac_address`, `device_unique_id`.
- **Líneas 660–661**: campos obligatorios (400).
- **Líneas 662–663**: valida `device_id` con `^[a-zA-Z0-9\-_]{1,80}$` (400 si no cumple).
- **Línea 664**: `now = datetime.utcnow().isoformat()` (timestamp naive UTC).
- **Líneas 666–672**: si el usuario existe, `UPDATE` de datos (conservando `subscription_status` previo); si no, `INSERT` con `subscription_status='not_registered'`. Uso de consultas parametrizadas (sin inyección SQL).
- **Línea 673**: `db.commit()`.
- **Línea 674**: 200 `{"success": True, "status": ...}`.
- [RIESGO] No se valida que `g.firebase_uid` corresponda al `device_id` que se está registrando: un cliente autenticado puede sobrescribir datos de otro `device_id`.

#### Bloque 21 (líneas 676–697) — GET /api/users/status/<device_id>

```py
@flask_app.route("/api/users/status/<device_id>", methods=["GET"])
@require_firebase_auth
def user_status(device_id: str):
    if not _rate_limit(f"status:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    if not re.match(r'^[a-zA-Z0-9\-_]{1,80}$', device_id):
        return jsonify({"error": "device_id invalido"}), 400
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE device_id = ?", (device_id,)).fetchone()
    if not row:
        return jsonify({"device_id": device_id, "status": "not_registered", "plan_type": None, "expires_at": None})
    status = row["subscription_status"]
    expires_at_str = row["subscription_expires_at"]
    if status == "active" and expires_at_str:
        try:
            if datetime.utcnow() > datetime.fromisoformat(expires_at_str):
                db.execute("UPDATE users SET subscription_status='expired', updated_at=? WHERE device_id=?", (datetime.utcnow().isoformat(), device_id))
                db.commit()
                status = "expired"
        except Exception:
            pass
    return jsonify({"device_id": device_id, "status": status, "plan_type": row["plan_type"], "expires_at": expires_at_str})
```

**Explicación de las líneas 676–697:**

Consulta el estado de suscripción de un device y aplica expiración automática si la fecha venció.

- **Líneas 679–682**: rate limit `status:<remote_addr>` y validación de `device_id` (400).
- **Línea 684**: `SELECT * FROM users WHERE device_id = ?` (parametrizada).
- **Líneas 685–686**: si no existe, responde 200 con `status: "not_registered"` (no usa 404; el cliente distingue por `status`).
- **Líneas 687–696**: si el estado es `active` y hay fecha de expiración, la compara con `datetime.utcnow()`; si venció, hace `UPDATE ... SET subscription_status='expired'` y ajusta la variable local. El `try/except Exception: pass` silencia errores de parseo de fecha (`fromisoformat`).
- **Línea 697**: respuesta 200 con `device_id`, `status`, `plan_type` y `expires_at`.
- [RIESGO] IDOR: cualquier usuario autenticado (sin relación con el `uid` de Firebase) consulta el estado de cualquier `device_id` conocido.

#### Bloque 22 (líneas 699–710) — POST /api/payments/confirm

```py
@flask_app.route("/api/payments/confirm", methods=["POST"])
@require_internal_key
def confirm_payment():
    data = request.get_json(silent=True) or {}
    device_id, plan_type, mp_ref = data.get("device_id", ""), data.get("plan_type", ""), data.get("mp_reference", "")
    if not device_id or plan_type not in ("monthly", "annual"):
        return jsonify({"error": "Datos invalidos"}), 400
    db, now = get_db(), datetime.utcnow().isoformat()
    db.execute("UPDATE users SET subscription_status='pending_verification', plan_type=?, mp_preapproval_id=COALESCE(NULLIF(?, ''), mp_preapproval_id), updated_at=? WHERE device_id=?", (plan_type, mp_ref, now, device_id))
    db.execute("INSERT INTO payment_events (device_id, event_type, mp_reference, payload, created_at) VALUES (?, 'manual_confirm', ?, ?, ?)", (device_id, mp_ref, json.dumps(data), now))
    db.commit()
    return jsonify({"success": True, "status": "pending_verification"})
```

**Explicación de las líneas 699–710:**

Endpoint interno (clave `X-Internal-Key`) que marca un pago como pendiente de verificación y registra el evento.

- **Línea 702**: cuerpo JSON (silencioso).
- **Líneas 703–705**: extrae `device_id`, `plan_type` (`monthly`/`annual`) y `mp_reference` opcional; 400 si falta `device_id` o el plan no es válido. No valida formato de `device_id` aquí (a diferencia de otros endpoints) [OBSERVACIÓN TÉCNICA].
- **Línea 707**: `UPDATE users SET subscription_status='pending_verification', plan_type=?, mp_preapproval_id=COALESCE(NULLIF(?, ''), mp_preapproval_id) ...` — conserva un `mp_preapproval_id` existente si llega vacío.
- **Línea 708**: `INSERT` en `payment_events` con `event_type='manual_confirm'` y el cuerpo completo en JSON (`payload`).
- **Línea 709**: `commit`.
- **Línea 710**: 200 `{"success": True, "status": "pending_verification"}`. La activación final queda supeditada al webhook MP.

#### Bloque 23 (líneas 712–738) — POST /api/payments/webhook y auxiliar de preaprobación

```py
@flask_app.route("/api/payments/webhook", methods=["POST"])
def mp_webhook():
    payload, sig, rid, did = request.get_data(), request.headers.get("x-signature", ""), request.headers.get("x-request-id", ""), request.args.get("data.id", "")
    try:
        data = json.loads(payload)
    except Exception:
        return jsonify({"error": "JSON invalido"}), 400
    if not sig:
        logger.warning("[SafeAlert] Webhook MP sin firma")
        return jsonify({"error": "Firma requerida"}), 401
    if not verify_mp_signature(sig, rid, did):
        logger.warning("[SafeAlert] Webhook MP firma invalida")
        return jsonify({"error": "Firma invalida"}), 401
    event_type = data.get("type", "")
    db, now = get_db(), datetime.utcnow().isoformat()
    if event_type in ("subscription_authorized_payment", "subscription_preapproval"):
        _handle_preapproval_event(db, data, now)
    db.execute("INSERT INTO payment_events (device_id, event_type, mp_reference, payload, created_at) VALUES (?, ?, ?, ?, ?)", (None, event_type, str(data.get("id", "")), json.dumps(data), now))
    db.commit()
    return jsonify({"received": True})

def _handle_preapproval_event(db, data, now):
    mp_id = str(data.get("data", {}).get("id") or data.get("id", ""))
    status = data.get("data", {}).get("status") or data.get("status")
    row = db.execute("SELECT device_id FROM users WHERE mp_preapproval_id = ?", (mp_id,)).fetchone()
    if row and status == "authorized":
        db.execute("UPDATE users SET subscription_status='active', subscription_expires_at=?, updated_at=? WHERE device_id=?", ((datetime.utcnow() + timedelta(days=32)).isoformat(), now, row["device_id"]))
```

**Explicación de las líneas 712–738:**

Receptor de notificaciones de Mercado Pago: valida la firma, procesa eventos de preaprobación/suscripción y registra todos los eventos recibidos en `payment_events`.

- **Línea 714**: captura el cuerpo crudo (`request.get_data()`), la cabecera `x-signature`, `x-request-id` y el parámetro de query `data.id`.
- **Líneas 715–718**: parsea el JSON; si es inválido, 400.
- **Líneas 719–724**: sin firma o con firma inválida → 401 con log de advertencia. (El log no incluye detalles de la firma.)
- **Línea 725**: `event_type` del cuerpo.
- **Líneas 726–729**: para eventos de `subscription_authorized_payment` o `subscription_preapproval`, invoca `_handle_preapproval_event`; después registra SIEMPRE el evento recibido en `payment_events` con `device_id=None` y `mp_reference=data.id` (payload íntegro en JSON) y hace `commit`.
- **Línea 731**: responde 200 `{"received": True}` (Mercado Pago espera confirmación rápida).
- **Líneas 733–738**: `_handle_preapproval_event`: obtiene `mp_id` (anidado en `data.data.id` o `data.id`) y `status`; busca el usuario por `mp_preapproval_id`; si existe y el estado es `authorized`, activa la suscripción con expiración `now + 32 días`.
- [ALTO] Riesgo de replay: no hay deduplicación por `id` de evento ni validación del `ts` de la firma; eventos repetidos acumulan `+32 días` en cada ejecución. [OBSERVACIÓN TÉCNICA] `_handle_preapproval_event` no hace `commit` propio (lo hace `mp_webhook`).

#### Bloque 24 (líneas 745–777) — POST /api/internal/link-preapproval

```py
@flask_app.route("/api/internal/link-preapproval", methods=["POST"])
@require_internal_key
def link_preapproval():
    data = request.get_json(silent=True) or {}
    device_id = data.get("device_id", "").strip()
    mp_id = data.get("mp_preapproval_id", "").strip()
    plan_type = data.get("plan_type", "").strip()
    if not device_id or not mp_id:
        return jsonify({"error": "device_id y mp_preapproval_id son requeridos"}), 400
    if not re.match(r'^[a-zA-Z0-9\-_]{1,80}$', device_id):
        return jsonify({"error": "device_id invalido"}), 400
    db = get_db()
    now = datetime.utcnow().isoformat()
    row = db.execute("SELECT device_id FROM users WHERE device_id = ?", (device_id,)).fetchone()
    if not row:
        db.execute(
            "INSERT INTO users (device_id, name, phone, registered_at, subscription_status, plan_type, mp_preapproval_id, updated_at) "
            "VALUES (?, 'Usuario SafeAlert', '', ?, 'not_registered', ?, ?, ?)",
            (device_id, now, plan_type or None, mp_id, now)
        )
    else:
        db.execute(
            "UPDATE users SET mp_preapproval_id=?, plan_type=COALESCE(NULLIF(?, ''), plan_type), updated_at=? WHERE device_id=?",
            (mp_id, plan_type, now, device_id)
        )
    db.execute(
        "INSERT INTO payment_events (device_id, event_type, mp_reference, payload, created_at) "
        "VALUES (?, 'preapproval_link', ?, ?, ?)",
        (device_id, mp_id, json.dumps(data), now)
    )
    db.commit()
    logger.info("[SafeAlert] Preapproval vinculado: device=%s mp=%s plan=%s", device_id, mp_id, plan_type)
    return jsonify({"success": True}), 200
```

**Explicación de las líneas 745–777:**

Vincula una preaprobación de Mercado Pago a un `device_id` (invocado por la Cloud Function `createPaymentOrder` según el comentario de líneas 740–743).

- **Líneas 748–755**: extrae y valida `device_id` y `mp_preapproval_id` (obligatorios, 400) y el formato de `device_id` (400).
- **Líneas 756–757**: `now` ISO UTC.
- **Líneas 758–764**: si el usuario no existe, lo crea con nombre genérico `'Usuario SafeAlert'`, teléfono vacío, `status='not_registered'` y el plan/preaprobación recibidos.
- **Líneas 765–769**: si existe, actualiza `mp_preapproval_id` y `plan_type` (conservando el plan previo si el nuevo viene vacío).
- **Líneas 770–775**: registra el evento `preapproval_link` en `payment_events` (payload completo) y hace `commit`.
- **Línea 776**: log INFO con `device`, `mp` (identificador de preaprobación, dato sensible en logs) y `plan`.
- **Línea 777**: 200 `{"success": True}`.
- [RIESGO] Con la clave interna se pueden crear usuarios arbitrarios o vincular preaprobaciones ajenas a cualquier `device_id`; el `mp_preapproval_id` queda en logs.

#### Bloque 25 (líneas 784–828) — POST /api/tickets/create

```py
@flask_app.route("/api/tickets/create", methods=["POST"])
@require_internal_key
def crear_ticket():
    if not _rate_limit(f"ticket:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    data = request.get_json(silent=True) or {}
    device_id = data.get("device_id", "").strip()
    user_name = data.get("user_name", "").strip()
    plan_type = data.get("plan_type", "").strip()
    amount = data.get("amount")
    if not device_id or plan_type not in ("monthly", "annual"):
        return jsonify({"error": "device_id y plan_type (monthly|annual) son requeridos"}), 400
    if not re.match(r'^[a-zA-Z0-9\-_]{1,80}$', device_id):
        return jsonify({"error": "device_id invalido"}), 400
    try:
        amount_int = int(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "amount debe ser un número entero"}), 400
    db = get_db()
    now = datetime.utcnow().isoformat()
    ticket_row = db.execute("SELECT COALESCE(MAX(ticket_number), 0) AS ultimo FROM tickets").fetchone()
    ticket_number = int(ticket_row["ultimo"]) + 1
    db.execute(
        "INSERT INTO tickets (ticket_number, device_id, user_name, plan_type, amount, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (ticket_number, device_id, user_name, plan_type, amount_int, now)
    )
    db.execute(
        "INSERT INTO payment_events (device_id, event_type, mp_reference, payload, created_at) "
        "VALUES (?, 'ticket_created', '', ?, ?)",
        (device_id, json.dumps({"ticket_number": ticket_number, "plan_type": plan_type, "amount": amount_int}), now)
    )
    db.commit()
    logger.info("[SafeAlert] Ticket creado: %d device=%s plan=%s", ticket_number, device_id, plan_type)
    return jsonify({
        "success": True,
        "ticket": {
            "ticket_number": ticket_number,
            "date": datetime.utcnow().strftime("%d/%m/%Y"),
            "time": datetime.utcnow().strftime("%H:%M"),
            "plan_type": plan_type,
            "amount": amount_int,
            "contact_email": "safealert_contacto@manejadatos.com",
        }
    }), 201
```

**Explicación de las líneas 784–828:**

Genera un ticket correlativo de pago (invocado por `PaymentService.createTicket` desde la app móvil).

- **Líneas 787–788**: rate limit `ticket:<remote_addr>` (429).
- **Líneas 789–797**: cuerpo JSON; exige `device_id` y `plan_type` (`monthly`/`annual`) → 400; valida formato de `device_id` → 400.
- **Líneas 798–801**: convierte `amount` a entero; `TypeError`/`ValueError` → 400.
- **Líneas 802–805**: calcula el correlativo con `SELECT COALESCE(MAX(ticket_number), 0) ... + 1`. [RIESGO] Fuera de transacción: dos workers concurrentes pueden obtener el mismo número y violar `UNIQUE(ticket_number)` (error 500).
- **Líneas 806–810**: `INSERT` en `tickets`.
- **Líneas 811–815**: `INSERT` en `payment_events` (`ticket_created`) con payload JSON del ticket.
- **Línea 816**: `commit`.
- **Línea 817**: log INFO con número de ticket, device y plan.
- **Líneas 818–828**: responde 201 con los datos del ticket (fecha/hora formateadas `%d/%m/%Y` y `%H:%M` en UTC) y el correo de contacto fijo `safealert_contacto@manejadatos.com`.

#### Bloque 26 (líneas 830–861) — POST /api/security/upload-recording

```py
@flask_app.route("/api/security/upload-recording", methods=["POST"])
def upload_security_recording():
    provided_key = request.headers.get("X-API-Key", "")
    if not AUDIO_ALERT_API_KEY:
        logger.error("[SafeAlert] AUDIO_ALERT_API_KEY no configurada")
        return jsonify({"error": "Configuracion interna incorrecta"}), 500
    if not hmac.compare_digest(provided_key, AUDIO_ALERT_API_KEY):
        logger.warning("[SafeAlert] API Key invalida para upload")
        return jsonify({"error": "No autorizado"}), 401
    if "archivo" not in request.files:
        return jsonify({"error": "Se requiere el campo 'archivo'"}), 400
    audio_file = request.files["archivo"]
    alert_id = request.form.get("alertId", "").strip()
    user_id = request.form.get("userId", "").strip()
    if not alert_id or not user_id:
        return jsonify({"error": "alertId y userId requeridos"}), 400
    if not re.match(r'^[a-zA-Z0-9_\-]{1,64}$', alert_id):
        return jsonify({"error": "alertId invalido"}), 400
    client_filename = request.form.get("filename", "").strip()
    if client_filename and re.match(r'^[a-zA-Z0-9_\-]{1,100}\.(m4a|mp4|aac|wav|caf)$', client_filename):
        filename = client_filename
    else:
        filename = f"security-{alert_id}.m4a"
    try:
        os.makedirs(AUDIO_STORAGE_DIR, exist_ok=True)
        save_path = os.path.join(AUDIO_STORAGE_DIR, filename)
        audio_file.save(save_path)
        logger.info("[SafeAlert] Audio guardado: %s | user=%s | alert=%s", save_path, user_id, alert_id)
        return jsonify({"success": True, "path": filename}), 200
    except OSError as exc:
        logger.error("[SafeAlert] Error al guardar audio: %s", exc)
        return jsonify({"error": "Error interno"}), 500
```

**Explicación de las líneas 830–861:**

Recibe grabaciones de audio SOS (multipart) y las persiste en disco en `AUDIO_STORAGE_DIR`.

- **Líneas 832–838**: autenticación por `X-API-Key` vs `AUDIO_ALERT_API_KEY` (500 si no está configurada; 401 si no coincide, con log de advertencia).
- **Líneas 839–841**: exige el campo de archivo `archivo` (400).
- **Líneas 842–845**: `alertId` y `userId` obligatorios (400).
- **Líneas 846–847**: valida `alertId` con `^[a-zA-Z0-9_\-]{1,64}$`.
- **Líneas 848–852**: el nombre de archivo lo puede proponer el cliente pero debe cumplir `^[a-zA-Z0-9_\-]{1,100}\.(m4a|mp4|aac|wav|caf)$`; si no, genera `security-{alert_id}.m4a`.
- **Líneas 853–856**: crea el directorio (si falta) y guarda con `audio_file.save()`.
- **Línea 857**: log INFO con la ruta absoluta, `user` y `alert`.
- **Líneas 858–861**: 200 `{"success": True, "path": filename}` o 500 ante `OSError`.
- [MEDIO] Riesgos: sin límite de tamaño de subida (Flask no define `MAX_CONTENT_LENGTH`), sin verificación del contenido real (solo extensión del nombre), y el nombre por defecto es predecible; el directorio es fijo (constante, no de entorno).
- [NOTA] No existe endpoint que sirva o descargue estos archivos dentro de este módulo.

#### Bloque 27 (líneas 863–887) — POST /api/tel/contacto

```py
@flask_app.route("/api/tel/contacto", methods=["POST"])
def tel_agregar_contacto():
    provided_key = request.headers.get("X-API-Key", "")
    if not AUDIO_ALERT_API_KEY or not hmac.compare_digest(provided_key, AUDIO_ALERT_API_KEY):
        return jsonify({"error": "No autorizado"}), 401
    data = request.get_json(silent=True) or {}
    device_id = data.get("device_id", "").strip()
    nombre = data.get("nombre", "").strip()
    telefono = data.get("telefono", "").strip()
    principal = 1 if data.get("principal") else 0
    if not device_id or not nombre or not telefono:
        return jsonify({"error": "device_id, nombre y telefono requeridos"}), 400
    if not re.match(r'^[a-zA-Z0-9\-_]{1,80}$', device_id):
        return jsonify({"error": "device_id invalido"}), 400
    db = get_tel_db()
    now = datetime.utcnow().isoformat()
    existing = db.execute("SELECT id FROM usuarios_emerg WHERE device_id = ? AND telefono = ?", (device_id, telefono)).fetchone()
    if existing:
        db.execute("UPDATE usuarios_emerg SET nombre=?, borrado=0, principal=?, updated_at=? WHERE device_id=? AND telefono=?", (nombre, principal, now, device_id, telefono))
    else:
        db.execute("INSERT INTO usuarios_emerg (device_id, nombre, telefono, borrado, principal, created_at, updated_at) VALUES (?,?,?,0,?,?,?)", (device_id, nombre, telefono, principal, now, now))
    _crear_periodo_prueba_si_no_existe(db, device_id)
    db.commit()
    logger.info("[SafeAlert-TEL] Contacto sync: device=%s tel=%s", device_id, telefono[-4:])
    return jsonify({"success": True}), 200
```

**Explicación de las líneas 863–887:**

Sincroniza un contacto de emergencia del dispositivo en la BD TEL (`usuarios_emerg`), con upsert y reactivación de contactos previamente borrados.

- **Líneas 865–867**: autenticación `X-API-Key` (401 si falta clave configurada o no coincide).
- **Líneas 868–872**: extrae `device_id`, `nombre`, `telefono` y `principal` (booleano → 0/1).
- **Líneas 873–876**: campos obligatorios (400) y formato de `device_id` (400).
- **Líneas 877–883**: usa `get_tel_db()`; si el par `(device_id, telefono)` existe, `UPDATE` restaurando `borrado=0`; si no, `INSERT`.
- **Línea 884**: garantiza el periodo de prueba del device (`_crear_periodo_prueba_si_no_existe`).
- **Línea 885**: `commit`.
- **Línea 886**: log INFO trunca el teléfono a los últimos 4 dígitos (buena práctica de minimización).
- **Línea 887**: 200 `{"success": True}`.
- [NOTA] No aplica rate limit; la protección es solo la clave compartida.

#### Bloque 28 (líneas 889–925) — PUT /api/tel/contacto/borrar y GET /api/tel/prueba/<device_id>

```py
@flask_app.route("/api/tel/contacto/borrar", methods=["PUT"])
def tel_borrar_contacto():
    provided_key = request.headers.get("X-API-Key", "")
    if not AUDIO_ALERT_API_KEY or not hmac.compare_digest(provided_key, AUDIO_ALERT_API_KEY):
        return jsonify({"error": "No autorizado"}), 401
    data = request.get_json(silent=True) or {}
    device_id = data.get("device_id", "").strip()
    telefono = data.get("telefono", "").strip()
    if not device_id or not telefono:
        return jsonify({"error": "device_id y telefono requeridos"}), 400
    db = get_tel_db()
    now = datetime.utcnow().isoformat()
    db.execute("UPDATE usuarios_emerg SET borrado=1, updated_at=? WHERE device_id=? AND telefono=?", (now, device_id, telefono))
    db.commit()
    logger.info("[SafeAlert-TEL] Contacto borrado: device=%s tel=%s", device_id, telefono[-4:])
    return jsonify({"success": True}), 200

@flask_app.route("/api/tel/prueba/<device_id>", methods=["GET"])
def tel_estado_prueba(device_id: str):
    provided_key = request.headers.get("X-API-Key", "")
    if not AUDIO_ALERT_API_KEY or not hmac.compare_digest(provided_key, AUDIO_ALERT_API_KEY):
        return jsonify({"error": "No autorizado"}), 401
    if not re.match(r'^[a-zA-Z0-9\-_]{1,80}$', device_id):
        return jsonify({"error": "device_id invalido"}), 400
    db = get_tel_db()
    row = db.execute("SELECT * FROM periodo_prueba WHERE device_id = ?", (device_id,)).fetchone()
    if not row:
        return jsonify({"device_id": device_id, "activo": False, "expirado": False, "pago": False, "fecha_primer_contacto": None, "fecha_expiracion": None})
    pago = bool(row["pago"])
    fecha_exp = row["fecha_expiracion"]
    expirado = False
    if not pago and fecha_exp:
        try:
            expirado = datetime.utcnow() > datetime.fromisoformat(fecha_exp)
        except Exception:
            pass
    return jsonify({"device_id": device_id, "activo": True, "expirado": expirado, "pago": pago, "fecha_primer_contacto": row["fecha_primer_contacto"], "fecha_expiracion": fecha_exp})
```

**Explicación de las líneas 889–925:**

`tel_borrar_contacto` aplica borrado lógico (`borrado=1`) a un contacto; `tel_estado_prueba` consulta el periodo de prueba de un dispositivo.

- **Líneas 891–893 y 908–910**: autenticación por `X-API-Key` (401).
- **Líneas 894–898**: exige `device_id` y `telefono` (400) — no valida formato de `device_id` en el borrado [OBSERVACIÓN TÉCNICA].
- **Línea 901**: `UPDATE ... SET borrado=1` por `(device_id, telefono)` (soft delete; el dato persiste).
- **Línea 903**: log con teléfono truncado.
- **Líneas 911–912**: en `tel_estado_prueba` se valida el `device_id` de la ruta (400).
- **Líneas 914–916**: si no existe registro de prueba, responde 200 con `activo: False` y campos nulos.
- **Líneas 917–924**: si existe, calcula `expirado` cuando no hay pago y la fecha de expiración ya pasó (parseo con `fromisoformat`, excepción silenciada).
- **Línea 925**: respuesta 200 con el estado completo del periodo de prueba.
- [NOTA] La consulta de prueba expone si el usuario pagó (`pago`) a quien posea la clave compartida.

#### Bloque 29 (líneas 935–975) — POST /api/v1/accesos

```py
@flask_app.route("/api/v1/accesos", methods=["POST"])
def registrar_acceso():
    if not _rate_limit(f"acceso:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    data = request.get_json(silent=True) or {}
    ip = obtener_ip_cliente(request)
    geo = geoip_service.consultar(ip) if ip else {}
    db = get_db()
    now = datetime.utcnow().isoformat()
    db.execute("""
        INSERT INTO accesos_tecnicos (
            usuario_id, sesion_id, device_id_app, fecha_hora, ip,
            metodo_http, ruta_consultada, pagina_consultada, endpoint,
            codigo_respuesta, user_agent, referer,
            navegador_aproximado, sistema_operativo_aproximado, tipo_dispositivo,
            idioma, idiomas, zona_horaria, offset_utc_minutos,
            pantalla_ancho, pantalla_alto, ventana_ancho, ventana_alto, profundidad_color,
            pais_ip, provincia_ip, ciudad_ip, proveedor, asn,
            posible_vpn, posible_proxy, posible_hosting,
            metodo_autenticacion, creado_en
        ) VALUES (?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?)
    """, (
        data.get("usuario_id"), data.get("sesion_id"), data.get("device_id_app"),
        now, ip,
        request.method, request.path, data.get("pagina_consultada"), request.path,
        200, request.headers.get("User-Agent", ""), request.headers.get("Referer", ""),
        data.get("navegador_aproximado"), data.get("sistema_operativo_aproximado"),
        data.get("tipo_dispositivo"),
        data.get("idioma"), json.dumps(data.get("idiomas", [])),
        data.get("zona_horaria"), data.get("offset_utc_minutos"),
        data.get("pantalla_ancho"), data.get("pantalla_alto"),
        data.get("ventana_ancho"), data.get("ventana_alto"), data.get("profundidad_color"),
        geo.get("pais", ""), geo.get("provincia", ""), geo.get("ciudad", ""),
        geo.get("proveedor", ""), geo.get("asn", ""),
        1 if geo.get("posible_vpn") else 0,
        1 if geo.get("posible_proxy") else 0,
        1 if geo.get("posible_hosting") else 0,
        data.get("metodo_autenticacion"), now
    ))
    db.commit()
    return jsonify({"success": True, "ip": ip}), 201
```

**Explicación de las líneas 935–975:**

Endpoint de telemetría del "Prompt Maestro" (sección 11) que registra un acceso técnico con geolocalización por IP. **No exige autenticación** (solo rate limit).

- **Líneas 937–938**: rate limit `acceso:<remote_addr>` (429).
- **Línea 939**: cuerpo JSON silencioso.
- **Líneas 940–941**: obtiene la IP del cliente (cabeceras de proxy o `remote_addr`) y consulta `geoip_service` solo si hay IP.
- **Líneas 944–955**: `INSERT` de 34 columnas en `accesos_tecnicos` (todo parametrizado).
- **Líneas 956–973**: valores: `fecha_hora`/`creado_en` = `now` del servidor; `ip` calculada; `metodo_http`, `ruta_consultada` y `endpoint` = método/ruta REAL de la petición; `pagina_consultada` viene del cliente; `codigo_respuesta` fijo `200` (aunque el endpoint responde 201) [OBSERVACIÓN TÉCNICA]; User-Agent y Referer reales del request; resto de campos desde el JSON del cliente (con `json.dumps` para `idiomas`); flags geo convertidos a 0/1.
- **Línea 974**: `commit`.
- **Línea 975**: 201 `{"success": True, "ip": ip}` (devuelve la IP vista por el servidor).
- [ALTO] Sin autenticación: cualquiera puede insertar accesos con `usuario_id` arbitrario (envenenamiento de trazabilidad). [RIESGO] `json.dumps(data.get("idiomas", []))` puede lanzar excepción si `idiomas` no es serializable (500 sin manejador global).

#### Bloque 30 (líneas 981–1006) — POST /api/v1/ubicaciones (validaciones y preparación)

```py
@flask_app.route("/api/v1/ubicaciones", methods=["POST"])
def registrar_ubicacion():
    if not _rate_limit(f"ubicacion:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    data = request.get_json(silent=True) or {}
    origen = data.get("origen", "")
    if not validar_origen(origen):
        return jsonify({"error": f"Origen invalido: {origen}. Debe ser GPS, NAVEGADOR, IP o MANUAL"}), 400
    lat = data.get("latitud")
    lon = data.get("longitud")
    if origen in ("GPS", "NAVEGADOR") and (lat is None or lon is None):
        return jsonify({"error": "latitud y longitud son requeridas para GPS/NAVEGADOR"}), 400
    if lat is not None and lon is not None:
        valido, error = validar_coordenadas(lat, lon)
        if not valido:
            return jsonify({"error": error}), 400
    precision = data.get("precision_metros")
    if precision is not None and precision < 0:
        return jsonify({"error": "precision_metros debe ser >= 0"}), 400
    permiso = data.get("permiso_ubicacion", "NO_SOLICITADO")
    if permiso and not validar_permiso(permiso):
        return jsonify({"error": f"Estado de permiso invalido: {permiso}"}), 400
    ip = obtener_ip_cliente(request)
    geo = geoip_service.consultar(ip) if ip else {}
    db = get_db()
    now = datetime.utcnow().isoformat()
```

**Explicación de las líneas 981–1006:**

Primera mitad de `registrar_ubicacion`: rate limit, validaciones de origen/coordenadas/precisión/permiso y preparación de IP/geo.

- **Líneas 983–984**: rate limit `ubicacion:<remote_addr>` (429).
- **Líneas 985–988**: `origen` obligatorio y válido (`validar_origen`) → 400 con mensaje.
- **Líneas 989–992**: para `GPS`/`NAVEGADOR`, `latitud` y `longitud` son obligatorias (400).
- **Líneas 993–996**: si vienen ambas coordenadas, valida rangos con `validar_coordenadas` (400).
- **Líneas 997–999**: `precision_metros` debe ser `>= 0` (400) — sin validar tipo numérico (una cadena provocaría `TypeError`/500) [OBSERVACIÓN TÉCNICA].
- **Líneas 1000–1002**: `permiso_ubicacion` (default `NO_SOLICITADO`) validado contra el enumerado (400).
- **Líneas 1003–1004**: IP del cliente y geolocalización.
- **Líneas 1005–1006**: `get_db()` y `now`.
- [ALTO] Sin autenticación: permite reportar ubicaciones de `usuario_id` ajenos (falsificación de posiciones). [NOTA] Ningún campo se valida por tipo/longitud más allá de lo indicado.

#### Bloque 31 (líneas 1007–1057) — POST /api/v1/ubicaciones (inserción y respuesta)

```py
    db.execute("""
        INSERT INTO ubicaciones_usuario (
            usuario_id, sesion_id, device_id_app,
            fecha_hora_servidor, fecha_hora_dispositivo,
            latitud, longitud, precision_metros,
            altitud_metros, velocidad_metros_segundo, rumbo_grados,
            origen, permiso_ubicacion,
            ip, pais_ip, codigo_pais_ip, provincia_ip, ciudad_ip,
            codigo_postal_ip, latitud_ip, longitud_ip, precision_ip_km,
            proveedor, operador_movil_estimado, asn,
            posible_vpn, posible_proxy, posible_hosting,
            metodo_http, ruta_consultada, pagina_consultada, referer,
            codigo_respuesta, user_agent,
            navegador_aproximado, sistema_operativo_aproximado, tipo_dispositivo,
            idioma, idiomas, zona_horaria, offset_utc_minutos,
            pantalla_ancho, pantalla_alto, ventana_ancho, ventana_alto, profundidad_color,
            direccion_estimada, direccion_confirmada,
            proveedor_geocodificacion, observaciones, metadatos,
            creado_en
        ) VALUES (
            ?,?,?, ?,?, ?,?,?, ?,?,?, ?,?, ?,?,?,?,?, ?,?,?,?, ?,?,?, ?,?,?, ?,?,?,?, ?,?, ?,?,?, ?,?,?,?, ?,?,?,?,?, ?,?, ?,?,?, ?
        )
    """, (
        data.get("usuario_id"), data.get("sesion_id"), data.get("device_id_app"),
        now, data.get("fecha_hora_dispositivo"),
        lat, lon, precision,
        data.get("altitud_metros"), data.get("velocidad_metros_segundo"), data.get("rumbo_grados"),
        origen, permiso,
        ip, geo.get("pais", ""), geo.get("codigo_pais", ""), geo.get("provincia", ""),
        geo.get("ciudad", ""), data.get("codigo_postal_ip"),
        geo.get("latitud"), geo.get("longitud"), geo.get("precision_km"),
        geo.get("proveedor", ""), geo.get("operador_movil", ""), geo.get("asn", ""),
        1 if geo.get("posible_vpn") else 0,
        1 if geo.get("posible_proxy") else 0,
        1 if geo.get("posible_hosting") else 0,
        request.method, request.path, data.get("pagina_consultada"),
        request.headers.get("Referer", ""),
        201, request.headers.get("User-Agent", ""),
        data.get("navegador_aproximado"), data.get("sistema_operativo_aproximado"),
        data.get("tipo_dispositivo"),
        data.get("idioma"), json.dumps(data.get("idiomas", [])),
        data.get("zona_horaria"), data.get("offset_utc_minutos"),
        data.get("pantalla_ancho"), data.get("pantalla_alto"),
        data.get("ventana_ancho"), data.get("ventana_alto"), data.get("profundidad_color"),
        data.get("direccion_estimada"), data.get("direccion_confirmada"),
        data.get("proveedor_geocodificacion"), data.get("observaciones"),
        json.dumps(data.get("metadatos", {})) if data.get("metadatos") else None,
        now
    ))
    db.commit()
    return jsonify({"success": True, "id": db.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]}), 201
```

**Explicación de las líneas 1007–1057:**

Inserción masiva (54 columnas) en `ubicaciones_usuario` y respuesta con el id generado.

- **Líneas 1007–1028**: `INSERT` de todas las columnas de la tabla (todo parametrizado con `?`).
- **Líneas 1029–1055**: mapeo de valores: datos del dispositivo y geo del proveedor; `fecha_hora_servidor` y `creado_en` = `now` del servidor; `codigo_respuesta` fijo `201`; `user_agent` y `referer` reales de la petición; `idiomas` y `metadatos` serializados con `json.dumps` (metadatos solo si vienen; si no, `None`).
- **Línea 1056**: `commit`.
- **Línea 1057**: devuelve 201 con el `id` insertado obtenido vía `SELECT last_insert_rowid()` sobre la misma conexión (correcto por conexión en SQLite).
- [RIESGO] Errores de tipo de SQLite (p. ej. `latitud` como cadena no numérica, `pantalla_ancho` no entero) producirían 500 sin manejador global; la fecha/hora del dispositivo no se valida ni normaliza.

#### Bloque 32 (líneas 1063–1100) — POST /api/v1/ubicaciones/manual y cabecera del endpoint de consentimientos

```py
@flask_app.route("/api/v1/ubicaciones/manual", methods=["POST"])
def registrar_ubicacion_manual():
    if not _rate_limit(f"ubicacion_manual:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    data = request.get_json(silent=True) or {}
    lat = data.get("latitud")
    lon = data.get("longitud")
    if lat is None or lon is None:
        return jsonify({"error": "latitud y longitud son requeridas"}), 400
    valido, error = validar_coordenadas(lat, lon)
    if not valido:
        return jsonify({"error": error}), 400
    ip = obtener_ip_cliente(request)
    db = get_db()
    now = datetime.utcnow().isoformat()
    db.execute("""
        INSERT INTO ubicaciones_usuario (
            usuario_id, sesion_id, device_id_app,
            fecha_hora_servidor, fecha_hora_dispositivo,
            latitud, longitud,
            origen, permiso_ubicacion,
            ip, direccion_confirmada, observaciones, creado_en
        ) VALUES (?,?,?, ?,?, ?,?, ?,?, ?,?,?,?)
    """, (
        data.get("usuario_id"), data.get("sesion_id"), data.get("device_id_app"),
        now, data.get("fecha_hora_dispositivo"),
        lat, lon,
        "MANUAL", "NO_SOLICITADO",
        ip, data.get("direccion_confirmada", ""), data.get("observaciones", ""), now
    ))
    db.commit()
    return jsonify({"success": True, "id": db.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]}), 201

# ---------------------------------------------------------------------------
# POST /api/v1/consentimientos — Registrar consentimiento (sección 10, 11)
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/consentimientos", methods=["POST"])
```

**Explicación de las líneas 1063–1100:**

Registro de ubicación de origen manual (el usuario la escribe) con un insert reducido, y cabecera del siguiente endpoint.

- **Líneas 1065–1066**: rate limit `ubicacion_manual:<remote_addr>` (429).
- **Líneas 1067–1074**: `latitud` y `longitud` obligatorias y validadas por rango (400).
- **Línea 1075**: IP del cliente (sin geolocalización: el origen MANUAL no consulta geo por IP).
- **Líneas 1078–1092**: `INSERT` reducido (13 columnas) con `origen='MANUAL'` y `permiso_ubicacion='NO_SOLICITADO'` fijos; `direccion_confirmada` y `observaciones` opcionales.
- **Líneas 1093–1094**: `commit` y respuesta 201 con el `id`.
- **Líneas 1096–1100**: comentarios y decorador de ruta del endpoint `POST /api/v1/consentimientos` (función `registrar_consentimiento`, analizada en la parte 3, líneas 1101 en adelante).

[NOTA] **Fin de la parte 2 de 3 (líneas 561–1100).** La parte 3 (líneas 1101–1591) continúa en `backend_flask_app.py.parte3.md`.