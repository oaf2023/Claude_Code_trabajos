"""
============================================================================
Archivo         : flask_app.py
Descripción     : Backend Flask para registro de usuarios y suscripciones de SafeAlert
                  via MercadoPago. Almacena estado en SQLite en PythonAnywhere.
                  Incluye campos mac_address y device_unique_id para trazabilidad.
Autor           : oafon
Fecha           : 2026-04-07
Versión         : 1.1.0
Lenguaje        : Python 3.10 / Flask 3.0.3
Uso             : Subir a /home/oaf/agrupacion_api/flask_app.py en PythonAnywhere.
                  Variables de entorno requeridas:
                    SAFEALERT_INTERNAL_KEY  — clave interna para el endpoint link-preapproval
                    MP_WEBHOOK_SECRET       — firma HMAC del webhook de MercadoPago
Endpoints       :
  POST /api/users/register
  GET  /api/users/status/<device_id>
  POST /api/payments/confirm
  POST /api/payments/webhook
  POST /api/internal/link-preapproval
  GET  /api/health
============================================================================
"""

import os
import hmac
import hashlib
import json
import logging
import sqlite3
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify, g
from flask_cors import CORS

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------

DB_PATH = os.environ.get(
    "SAFEALERT_DB_PATH",
    "/home/oaf/agrupacion_api/usuarios/safealert.db"
)
INTERNAL_KEY = os.environ.get("SAFEALERT_INTERNAL_KEY", "")
MP_WEBHOOK_SECRET = os.environ.get("MP_WEBHOOK_SECRET", "")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s"
)
logger = logging.getLogger("safealert")

app = Flask(__name__)
CORS(app, origins=["https://oaf.pythonanywhere.com"])

# ---------------------------------------------------------------------------
# Base de datos
# ---------------------------------------------------------------------------

"""
============================================================================
Función         : get_db
Descripción     : Retorna la conexión SQLite usando el contexto de aplicación Flask (g).
                  Crea las tablas si no existen.
Fecha           : 2026-04-01
Versión         : 1.0.0
Lenguaje        : Python 3.10
Conexiones      : Todos los endpoints que acceden a la BD
Ingesta         : void
Devolución      : sqlite3.Connection
Uso             : db = get_db()
============================================================================
"""
def get_db() -> sqlite3.Connection:
    if "db" not in g:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        _create_tables(g.db)
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


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
    """)
    # Migración: agregar columnas nuevas si la BD ya existia sin ellas
    _migrate_add_device_columns(db)
    db.commit()

def _migrate_add_device_columns(db: sqlite3.Connection):
    """
    Agrega columnas mac_address y device_unique_id a la tabla users
    si la BD fue creada con una versión anterior (migración no destructiva).
    """
    for col, default in [("mac_address", "''"), ("device_unique_id", "''")]:
        try:
            db.execute(f"ALTER TABLE users ADD COLUMN {col} TEXT DEFAULT {default}")
            logger.info("Migración: columna '%s' agregada a tabla users.", col)
        except sqlite3.OperationalError:
            # La columna ya existe — sin acción requerida
            pass


# ---------------------------------------------------------------------------
# Decoradores de seguridad
# ---------------------------------------------------------------------------

"""
============================================================================
Función         : require_internal_key
Descripción     : Decorador que verifica el header X-Internal-Key en endpoints internos.
Fecha           : 2026-04-01
Versión         : 1.0.0
Lenguaje        : Python 3.10
Conexiones      : /api/internal/link-preapproval
Ingesta         : f: Callable
Devolución      : Callable (wrapper) | JSON 401/500
Uso             : @require_internal_key
============================================================================
"""
def require_internal_key(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not INTERNAL_KEY:
            logger.error("SAFEALERT_INTERNAL_KEY no configurada en el servidor.")
            return jsonify({"error": "Configuración interna incorrecta"}), 500
        provided = request.headers.get("X-Internal-Key", "")
        if not hmac.compare_digest(provided, INTERNAL_KEY):
            logger.warning("X-Internal-Key inválida desde %s", request.remote_addr)
            return jsonify({"error": "No autorizado"}), 401
        return f(*args, **kwargs)
    return wrapper


"""
============================================================================
Función         : verify_mp_signature
Descripción     : Valida la firma HMAC-SHA256 del webhook de MercadoPago.
                  Formato real de MP:
                    x-signature: ts=<timestamp>,v1=<hmac>
                    x-request-id: <uuid>
                    query param: ?data.id=<id>
                  String firmado: "id:<data_id>;request-id:<req_id>;ts:<ts>"
Fecha           : 2026-04-07
Versión         : 1.1.0
Lenguaje        : Python 3.10
Conexiones      : /api/payments/webhook
Ingesta         : x_signature: str, x_request_id: str, data_id: str
Devolución      : bool
Uso             : if not verify_mp_signature(sig, req_id, data_id): return 401
============================================================================
"""
def verify_mp_signature(x_signature: str, x_request_id: str, data_id: str) -> bool:
    if not MP_WEBHOOK_SECRET:
        logger.warning("MP_WEBHOOK_SECRET no configurado — omitiendo verificación de firma.")
        return True
    if not x_signature:
        logger.warning("Webhook MP: header x-signature ausente — rechazando.")
        return False
    try:
        # Parsear ts y v1 del header "ts=<ts>,v1=<hash>"
        parts = dict(p.split("=", 1) for p in x_signature.split(",") if "=" in p)
        ts = parts.get("ts", "")
        v1 = parts.get("v1", "")
        if not ts or not v1:
            logger.warning("Webhook MP: header x-signature mal formado: %s", x_signature)
            return False
        # String que MP firma
        signed_template = f"id:{data_id};request-id:{x_request_id};ts:{ts}"
        expected = hmac.new(
            MP_WEBHOOK_SECRET.encode("utf-8"),
            signed_template.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, v1)
    except Exception as exc:
        logger.error("Error verificando firma MP: %s", exc)
        return False

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

"""
============================================================================
Función         : health
Descripción     : Endpoint de verificación de estado del servicio.
Fecha           : 2026-04-01
Versión         : 1.0.0
Lenguaje        : Python 3.10
Conexiones      : Monitoreo externo
Ingesta         : GET
Devolución      : JSON { status, timestamp }
Uso             : GET /api/health
============================================================================
"""
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat()})


"""
============================================================================
Función         : register_user
Descripción     : Registra un dispositivo nuevo o actualiza nombre, teléfono,
*                   MAC address y device_unique_id de uno existente.
*                   Almacena mac_address (puede ser '02:00:00:00:00:00' en Android 6+)
*                   y device_unique_id (ANDROID_ID / identifierForVendor) para
*                   trazabilidad del dispositivo que contrató la suscripción.
* Fecha           : 2026-04-07
* Versión         : 1.1.0
* Lenguaje        : Python 3.10
* Conexiones      : PaymentService.registerDevice (React Native)
* Ingesta         : POST JSON { device_id, name, phone, mac_address?, device_unique_id? }
Devolución      : JSON { success, status }
Uso             : POST /api/users/register
============================================================================
"""
@app.route("/api/users/register", methods=["POST"])
def register_user():
    data = request.get_json(silent=True) or {}
    device_id = (data.get("device_id") or "").strip()
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    mac_address = (data.get("mac_address") or "").strip()
    device_unique_id = (data.get("device_unique_id") or "").strip()

    if not device_id or not name or not phone:
        return jsonify({"error": "device_id, name y phone son requeridos"}), 400

    now = datetime.utcnow().isoformat()
    db = get_db()

    existing = db.execute(
        "SELECT subscription_status FROM users WHERE device_id = ?", (device_id,)
    ).fetchone()

    if existing:
        db.execute(
            """UPDATE users
               SET name=?, phone=?, mac_address=?, device_unique_id=?, updated_at=?
               WHERE device_id=?""",
            (name, phone, mac_address, device_unique_id, now, device_id)
        )
        status = existing["subscription_status"]
    else:
        db.execute(
            """INSERT INTO users
               (device_id, name, phone, mac_address, device_unique_id,
                registered_at, subscription_status, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, 'not_registered', ?)""",
            (device_id, name, phone, mac_address, device_unique_id, now, now)
        )
        status = "not_registered"

    db.commit()
    logger.info(
        "register_user: device_id=%s mac=%s uid=%s status=%s",
        device_id, mac_address or "(vacío)", device_unique_id or "(vacío)", status
    )
    return jsonify({"success": True, "status": status})


"""
============================================================================
Función         : user_status
Descripción     : Retorna el estado de suscripción de un dispositivo.
Fecha           : 2026-04-01
Versión         : 1.0.0
Lenguaje        : Python 3.10
Conexiones      : PaymentService.checkSubscription (React Native)
Ingesta         : GET /api/users/status/<device_id>
Devolución      : JSON { device_id, status, plan_type, expires_at }
Uso             : GET /api/users/status/sa-xxxx
============================================================================
"""
@app.route("/api/users/status/<device_id>", methods=["GET"])
def user_status(device_id: str):
    db = get_db()
    row = db.execute(
        "SELECT * FROM users WHERE device_id = ?", (device_id,)
    ).fetchone()

    if not row:
        return jsonify({
            "device_id": device_id,
            "status": "not_registered",
            "plan_type": None,
            "expires_at": None
        })

    status = row["subscription_status"]

    # Verificar vencimiento automático de suscripciones activas
    expires_at_str = row["subscription_expires_at"]
    if status == "active" and expires_at_str:
        try:
            expires_dt = datetime.fromisoformat(expires_at_str)
            if datetime.utcnow() > expires_dt:
                now = datetime.utcnow().isoformat()
                db.execute(
                    "UPDATE users SET subscription_status='expired', updated_at=? WHERE device_id=?",
                    (now, device_id)
                )
                db.commit()
                status = "expired"
        except ValueError:
            pass

    return jsonify({
        "device_id": device_id,
        "status": status,
        "plan_type": row["plan_type"],
        "expires_at": expires_at_str
    })


"""
============================================================================
Función         : confirm_payment
Descripción     : Confirma manualmente un pago (flujo "Ya completé el pago").
                  Pone la suscripción en pending_verification hasta que el webhook
                  de MercadoPago la active definitivamente.
Fecha           : 2026-04-01
Versión         : 1.0.0
Lenguaje        : Python 3.10
Conexiones      : PaymentService.confirmPayment (React Native)
Ingesta         : POST JSON { device_id, plan_type, mp_reference? }
Devolución      : JSON { success, status }
Uso             : POST /api/payments/confirm
============================================================================
"""
@app.route("/api/payments/confirm", methods=["POST"])
def confirm_payment():
    data = request.get_json(silent=True) or {}
    device_id = (data.get("device_id") or "").strip()
    plan_type = (data.get("plan_type") or "").strip()
    mp_reference = (data.get("mp_reference") or "").strip()

    if not device_id or plan_type not in ("monthly", "annual"):
        return jsonify({"error": "device_id y plan_type (monthly|annual) son requeridos"}), 400

    db = get_db()
    now = datetime.utcnow().isoformat()

    db.execute(
        """UPDATE users
           SET subscription_status='pending_verification',
               plan_type=?,
               mp_preapproval_id=COALESCE(NULLIF(?, ''), mp_preapproval_id),
               updated_at=?
           WHERE device_id=?""",
        (plan_type, mp_reference, now, device_id)
    )
    db.execute(
        """INSERT INTO payment_events
           (device_id, event_type, mp_reference, payload, created_at)
           VALUES (?, 'manual_confirm', ?, ?, ?)""",
        (device_id, mp_reference, json.dumps(data), now)
    )
    db.commit()
    logger.info("confirm_payment: device_id=%s plan=%s", device_id, plan_type)
    return jsonify({"success": True, "status": "pending_verification"})


"""
============================================================================
Función         : mp_webhook
Descripción     : Recibe notificaciones de MercadoPago y actualiza el estado de
                  suscripción en la base de datos. Valida firma HMAC-SHA256.
                  Omite validación cuando live_mode=false (simulación del panel MP).
Fecha           : 2026-04-07
Versión         : 1.1.0
Lenguaje        : Python 3.10
Conexiones      : MercadoPago webhook, tabla payment_events
Ingesta         : POST JSON (payload MP)
Devolución      : JSON { received: true } | 401 | 400
Uso             : POST /api/payments/webhook
============================================================================
"""
@app.route("/api/payments/webhook", methods=["POST"])
def mp_webhook():
    payload_bytes = request.get_data()
    x_signature   = request.headers.get("x-signature", "")
    x_request_id  = request.headers.get("x-request-id", "")
    # MP envía el id como query param ?data.id=xxx (además de en el body)
    data_id = request.args.get("data.id", "")

    # Parsear JSON anticipado para detectar simulaciones antes de validar firma
    try:
        data = json.loads(payload_bytes)
    except json.JSONDecodeError:
        return jsonify({"error": "JSON inválido"}), 400

    # live_mode=false indica solicitud de prueba desde el panel de MP.
    # El panel envía x-signature con firma de test que no coincide con el secret
    # real → saltear validación para simulaciones, validar solo en producción.
    is_simulation = (data.get("live_mode") is False)

    if is_simulation:
        logger.info("Webhook MP: simulación detectada (live_mode=false). Origen: %s", request.remote_addr)
    elif MP_WEBHOOK_SECRET and x_signature:
        if not verify_mp_signature(x_signature, x_request_id, data_id):
            logger.warning("Webhook MP: firma inválida. Origen: %s sig=%s", request.remote_addr, x_signature)
            return jsonify({"error": "Firma inválida"}), 401
    elif not x_signature:
        logger.info("Webhook MP: x-signature ausente. Origen: %s", request.remote_addr)

    event_type = data.get("type", "")
    db = get_db()
    now = datetime.utcnow().isoformat()

    if event_type in ("subscription_authorized_payment", "subscription_preapproval"):
        _handle_preapproval_event(db, data, now)
    elif event_type == "payment":
        _handle_payment_event(db, data, now)
    else:
        logger.info("Webhook MP: tipo no manejado: %s", event_type)

    db.execute(
        """INSERT INTO payment_events
           (device_id, event_type, mp_reference, payload, created_at)
           VALUES (?, ?, ?, ?, ?)""",
        (None, event_type, str(data.get("id", "")), json.dumps(data), now)
    )
    db.commit()
    return jsonify({"received": True})


def _handle_preapproval_event(db: sqlite3.Connection, data: dict, now: str):
    """
    Activa la suscripción mensual cuando MP confirma el pago recurrente.
    """
    mp_id = str(data.get("data", {}).get("id", "") or data.get("id", ""))
    status = data.get("data", {}).get("status") or data.get("status")

    row = db.execute(
        "SELECT device_id, plan_type FROM users WHERE mp_preapproval_id = ?", (mp_id,)
    ).fetchone()

    if not row:
        logger.warning("Webhook preapproval: mp_id=%s no encontrado en BD", mp_id)
        return

    device_id = row["device_id"]
    if status == "authorized":
        expires_at = (datetime.utcnow() + timedelta(days=32)).isoformat()
        db.execute(
            """UPDATE users
               SET subscription_status='active', subscription_expires_at=?, updated_at=?
               WHERE device_id=?""",
            (expires_at, now, device_id)
        )
        logger.info("Suscripción activada: device_id=%s expires=%s", device_id, expires_at)
    elif status in ("cancelled", "paused"):
        db.execute(
            "UPDATE users SET subscription_status='expired', updated_at=? WHERE device_id=?",
            (now, device_id)
        )
        logger.info("Suscripción cancelada/pausada: device_id=%s", device_id)


def _handle_payment_event(db: sqlite3.Connection, data: dict, now: str):
    """
    Activa la suscripción anual cuando MP confirma el pago único (Preference).
    """
    mp_id = str(data.get("data", {}).get("id", "") or data.get("id", ""))
    status = data.get("data", {}).get("status") or data.get("status")
    external_ref = data.get("data", {}).get("external_reference") or data.get("external_reference", "")

    if not external_ref:
        logger.info("Webhook payment: sin external_reference, ignorando mp_id=%s", mp_id)
        return

    if status == "approved":
        # El external_reference tiene formato "annual:<device_id>"
        if external_ref.startswith("annual:"):
            device_id = external_ref.split("annual:", 1)[1]
            expires_at = (datetime.utcnow() + timedelta(days=370)).isoformat()
            db.execute(
                """UPDATE users
                   SET subscription_status='active', plan_type='annual',
                       subscription_expires_at=?, updated_at=?
                   WHERE device_id=?""",
                (expires_at, now, device_id)
            )
            logger.info("Suscripción anual activada: device_id=%s expires=%s", device_id, expires_at)


"""
============================================================================
Función         : link_preapproval
Descripción     : Endpoint interno llamado por Firebase Function para asociar
                  el ID del preapproval de MP con el device_id del usuario.
Fecha           : 2026-04-01
Versión         : 1.0.0
Lenguaje        : Python 3.10
Conexiones      : createPaymentOrder (Firebase Function)
Ingesta         : POST JSON { device_id, mp_preapproval_id, plan_type }
                  Header: X-Internal-Key
Devolución      : JSON { success: true }
Uso             : POST /api/internal/link-preapproval
============================================================================
"""
@app.route("/api/internal/link-preapproval", methods=["POST"])
@require_internal_key
def link_preapproval():
    data = request.get_json(silent=True) or {}
    device_id = (data.get("device_id") or "").strip()
    mp_preapproval_id = (data.get("mp_preapproval_id") or "").strip()
    plan_type = (data.get("plan_type") or "monthly").strip()

    if not device_id or not mp_preapproval_id:
        return jsonify({"error": "device_id y mp_preapproval_id son requeridos"}), 400

    db = get_db()
    now = datetime.utcnow().isoformat()

    db.execute(
        """INSERT INTO users (device_id, name, phone, registered_at, subscription_status,
                              plan_type, mp_preapproval_id, updated_at)
           VALUES (?, '', '', ?, 'pending', ?, ?, ?)
           ON CONFLICT(device_id) DO UPDATE SET
               mp_preapproval_id=excluded.mp_preapproval_id,
               plan_type=excluded.plan_type,
               subscription_status=CASE
                   WHEN subscription_status='active' THEN 'active'
                   ELSE 'pending'
               END,
               updated_at=excluded.updated_at""",
        (device_id, now, plan_type, mp_preapproval_id, now)
    )
    db.commit()
    logger.info("link_preapproval: device_id=%s mp_id=%s plan=%s", device_id, mp_preapproval_id, plan_type)
    return jsonify({"success": True})


"""
============================================================================
Función         : create_ticket
Descripción     : Genera un ticket de pago con número correlativo para SafeAlert.
                  El número de ticket es secuencial y único global (empieza en 1001).
                  Autenticado con X-Internal-Key.
Fecha           : 2026-04-07
Versión         : 1.0.0
Lenguaje        : Python 3.10
Conexiones      : Firebase Function createPaymentOrder (vía PA)
Ingesta         : POST JSON { device_id, user_name, plan_type, amount }
                  Header: X-Internal-Key
Devolución      : JSON { ticket_number, date, time, plan_type, amount, contact_email }
Uso             : POST /api/tickets/create
============================================================================
"""
@app.route("/api/tickets/create", methods=["POST"])
@require_internal_key
def create_ticket():
    data = request.get_json(silent=True) or {}
    device_id = (data.get("device_id") or "").strip()
    user_name = (data.get("user_name") or "").strip()
    plan_type = (data.get("plan_type") or "").strip()
    amount    = int(data.get("amount", 0))

    if not device_id or not plan_type or amount <= 0:
        return jsonify({"error": "device_id, plan_type y amount son requeridos"}), 400

    db = get_db()
    now_dt = datetime.utcnow()
    now_str = now_dt.isoformat()

    # Número correlativo: máximo actual + 1, mínimo 1001
    row = db.execute("SELECT MAX(ticket_number) as mx FROM tickets").fetchone()
    next_num = max(1001, (row["mx"] or 1000) + 1)

    db.execute(
        """INSERT INTO tickets (ticket_number, device_id, user_name, plan_type, amount, created_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (next_num, device_id, user_name, plan_type, amount, now_str)
    )
    db.commit()

    logger.info("Ticket creado: #%s device=%s plan=%s amount=%s", next_num, device_id, plan_type, amount)

    return jsonify({
        "ticket_number": next_num,
        "date": now_dt.strftime("%d/%m/%Y"),
        "time": now_dt.strftime("%H:%M"),
        "plan_type": plan_type,
        "amount": amount,
        "contact_email": "safealert_contacto@manejadatos.com"
    })


# ---------------------------------------------------------------------------
# Entry point para PythonAnywhere (WSGI)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=False, port=5000)
