"""
============================================================================
Archivo         : flask_app.py
Descripción     : Punto de entrada unificado para el Backend del ERP de Obras
                  y el Backend de SafeAlert (MercadoPago).
                  Configurado para despliegue en PythonAnywhere.
Autor           : oafon / AI Assistant
Fecha           : 2026-04-08
Versión         : 2.0.0
============================================================================
"""

import os
import sys
import hmac
import hashlib
import json
import logging
import sqlite3
from datetime import datetime, timedelta
from functools import wraps

from flask import request, jsonify, g
from flask_cors import CORS

# --- CONFIGURACIÓN DE RUTAS PARA PYTHONANYWHERE ---
path = '/home/oaf/agrupacion_api'
if path not in sys.path:
    sys.path.insert(0, path)

# Importación de la App Factory del ERP (AdminDigital)
from app import create_app

# ---------------------------------------------------------------------------
# Configuración Original de SafeAlert (extraída de modelodeapp.py)
# ---------------------------------------------------------------------------

DB_PATH = os.environ.get(
    "SAFEALERT_DB_PATH",
    "/home/oaf/agrupacion_api/usuarios/safealert.db"
)
INTERNAL_KEY = os.environ.get("SAFEALERT_INTERNAL_KEY", "")
MP_WEBHOOK_SECRET = os.environ.get("MP_WEBHOOK_SECRET", "")
AUDIO_ALERT_API_KEY = os.environ.get("AUDIO_ALERT_API_KEY", "Familia2026##")
AUDIO_STORAGE_DIR = "/home/oaf/agrupacion_api/audio"
TEL_DB_PATH = os.environ.get(
    "SAFEALERT_TEL_DB_PATH",
    "/home/oaf/agrupacion_api/usuarios/safealert_tel.db"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s"
)
logger = logging.getLogger("safealert")

# Inicialización de la App del ERP (Fase 1-4)
flask_app = create_app()

# Habilitar CORS para el dominio de PythonAnywhere
CORS(flask_app, origins=["https://oaf.pythonanywhere.com"])

# ---------------------------------------------------------------------------
# Lógica de Base de Datos de SafeAlert (modelodeapp.py)
# ---------------------------------------------------------------------------

def get_db() -> sqlite3.Connection:
    """Retorna la conexión SQLite usando el contexto de aplicación Flask (g)."""
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

# ---------------------------------------------------------------------------
# Base de datos de contactos de emergencia y período de prueba (safealert_tel)
# ---------------------------------------------------------------------------

def get_tel_db() -> sqlite3.Connection:
    """Retorna la conexión a safealert_tel.db (contactos + período de prueba)."""
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

def _create_tel_tables(db: sqlite3.Connection):
    """
    ============================================================================
    Función         : _create_tel_tables
    Descripción     : Crea las tablas usuarios_emerg y periodo_prueba en la
                      base de datos safealert_tel.db si no existen.
    Fecha           : 2026-04-10
    Versión         : 1.0.0
    Lenguaje        : Python 3.x / SQLite
    Conexiones      : get_tel_db
    Ingesta         : db: sqlite3.Connection
    Devolución      : None
    Uso             : _create_tel_tables(db)
    ============================================================================
    """
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

def _crear_periodo_prueba_si_no_existe(db: sqlite3.Connection, device_id: str):
    """Registra el período de prueba la primera vez que se agrega un contacto."""
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
    _migrate_add_device_columns(db)
    db.commit()

def _migrate_add_device_columns(db: sqlite3.Connection):
    for col, default in [("mac_address", "''"), ("device_unique_id", "''")]:
        try:
            db.execute(f"ALTER TABLE users ADD COLUMN {col} TEXT DEFAULT {default}")
        except sqlite3.OperationalError:
            pass

# ---------------------------------------------------------------------------
# Seguridad SafeAlert
# ---------------------------------------------------------------------------

def require_internal_key(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not INTERNAL_KEY:
            return jsonify({"error": "Configuración interna incorrecta"}), 500
        provided = request.headers.get("X-Internal-Key", "")
        if not hmac.compare_digest(provided, INTERNAL_KEY):
            return jsonify({"error": "No autorizado"}), 401
        return f(*args, **kwargs)
    return wrapper

def verify_mp_signature(x_signature: str, x_request_id: str, data_id: str) -> bool:
    if not MP_WEBHOOK_SECRET: return True
    if not x_signature: return False
    try:
        parts = dict(p.split("=", 1) for p in x_signature.split(",") if "=" in p)
        ts, v1 = parts.get("ts", ""), parts.get("v1", "")
        if not ts or not v1: return False
        signed_template = f"id:{data_id};request-id:{x_request_id};ts:{ts}"
        expected = hmac.new(MP_WEBHOOK_SECRET.encode("utf-8"), signed_template.encode("utf-8"), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, v1)
    except: return False

# ---------------------------------------------------------------------------
# Endpoints Replicados de SafeAlert (modelodeapp.py)
# ---------------------------------------------------------------------------

@flask_app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat()})

@flask_app.route("/api/users/register", methods=["POST"])
def register_user():
    data = request.get_json(silent=True) or {}
    device_id, name, phone = data.get("device_id", "").strip(), data.get("name", "").strip(), data.get("phone", "").strip()
    mac, uid = data.get("mac_address", "").strip(), data.get("device_unique_id", "").strip()

    if not device_id or not name or not phone:
        return jsonify({"error": "device_id, name y phone son requeridos"}), 400

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

@flask_app.route("/api/users/status/<device_id>", methods=["GET"])
def user_status(device_id: str):
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE device_id = ?", (device_id,)).fetchone()
    if not row: return jsonify({"device_id": device_id, "status": "not_registered", "plan_type": None, "expires_at": None})
    
    status = row["subscription_status"]
    expires_at_str = row["subscription_expires_at"]
    if status == "active" and expires_at_str:
        try:
            if datetime.utcnow() > datetime.fromisoformat(expires_at_str):
                db.execute("UPDATE users SET subscription_status='expired', updated_at=? WHERE device_id=?", (datetime.utcnow().isoformat(), device_id))
                db.commit()
                status = "expired"
        except: pass
    return jsonify({"device_id": device_id, "status": status, "plan_type": row["plan_type"], "expires_at": expires_at_str})

@flask_app.route("/api/payments/confirm", methods=["POST"])
def confirm_payment():
    data = request.get_json(silent=True) or {}
    device_id, plan_type, mp_ref = data.get("device_id", ""), data.get("plan_type", ""), data.get("mp_reference", "")
    if not device_id or plan_type not in ("monthly", "annual"): return jsonify({"error": "Datos inválidos"}), 400
    
    db, now = get_db(), datetime.utcnow().isoformat()
    db.execute("UPDATE users SET subscription_status='pending_verification', plan_type=?, mp_preapproval_id=COALESCE(NULLIF(?, ''), mp_preapproval_id), updated_at=? WHERE device_id=?", (plan_type, mp_ref, now, device_id))
    db.execute("INSERT INTO payment_events (device_id, event_type, mp_reference, payload, created_at) VALUES (?, 'manual_confirm', ?, ?, ?)", (device_id, mp_ref, json.dumps(data), now))
    db.commit()
    return jsonify({"success": True, "status": "pending_verification"})

@flask_app.route("/api/payments/webhook", methods=["POST"])
def mp_webhook():
    payload, sig, rid, did = request.get_data(), request.headers.get("x-signature", ""), request.headers.get("x-request-id", ""), request.args.get("data.id", "")
    try: data = json.loads(payload)
    except: return jsonify({"error": "JSON inválido"}), 400
    
    if data.get("live_mode") is not False and MP_WEBHOOK_SECRET and sig:
        if not verify_mp_signature(sig, rid, did): return jsonify({"error": "Firma inválida"}), 401
    
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

# ---------------------------------------------------------------------------
# Endpoint SafeAlert — Grabación de Seguridad (60s)
# ---------------------------------------------------------------------------

@flask_app.route("/api/security/upload-recording", methods=["POST"])
def upload_security_recording():
    """
    ============================================================================
    Función         : upload_security_recording
    Descripción     : Recibe y persiste la grabación de audio de 60s enviada por la
                      app SafeAlert luego de disparar una alerta de emergencia.
    Fecha           : 2026-04-09
    Versión         : 1.0.0
    Lenguaje        : Python 3.x / Flask
    Conexiones      : AudioAlertApiService.ts (cliente móvil)
    Ingesta         : multipart/form-data: archivo(.m4a), alertId, userId, duration
    Devolución      : JSON { success, path } | error
    Uso             : POST /api/security/upload-recording
                      Header: X-API-Key: <AUDIO_ALERT_API_KEY>
    ============================================================================
    """
    # --- Autenticación por API Key ---
    provided_key = request.headers.get("X-API-Key", "")
    if not AUDIO_ALERT_API_KEY:
        logger.error("[SafeAlert] AUDIO_ALERT_API_KEY no configurada en el servidor.")
        return jsonify({"error": "Configuración interna incorrecta"}), 500
    if not hmac.compare_digest(provided_key, AUDIO_ALERT_API_KEY):
        logger.warning("[SafeAlert] Intento de subida con API Key inválida.")
        return jsonify({"error": "No autorizado"}), 401

    # --- Validación del archivo ---
    if "archivo" not in request.files:
        return jsonify({"error": "Se requiere el campo 'archivo' (audio)"}), 400

    audio_file = request.files["archivo"]
    alert_id = request.form.get("alertId", "").strip()
    user_id  = request.form.get("userId", "").strip()

    if not alert_id or not user_id:
        return jsonify({"error": "alertId y userId son requeridos"}), 400

    # --- Sanitización del alertId para evitar path traversal ---
    import re
    if not re.match(r'^[a-zA-Z0-9_\-]{1,64}$', alert_id):
        return jsonify({"error": "alertId inválido"}), 400

    # --- Nombre del archivo: usa el enviado por el cliente (deviceId_timestamp.ext)
    #     con validación estricta para prevenir path traversal ---
    client_filename = request.form.get("filename", "").strip()
    if client_filename and re.match(r'^[a-zA-Z0-9_\-]{1,100}\.(m4a|mp4|aac|wav|caf)$', client_filename):
        filename = client_filename
    else:
        # Fallback si el cliente no envía nombre válido
        filename = f"security-{alert_id}.m4a"

    # --- Guardar en disco ---
    try:
        os.makedirs(AUDIO_STORAGE_DIR, exist_ok=True)
        save_path = os.path.join(AUDIO_STORAGE_DIR, filename)
        audio_file.save(save_path)
        logger.info(
            "[SafeAlert] Audio de seguridad guardado: %s | user=%s | alert=%s",
            save_path, user_id, alert_id
        )
        return jsonify({"success": True, "path": filename}), 200
    except OSError as exc:
        logger.error("[SafeAlert] Error al guardar audio en disco: %s", exc)
        return jsonify({"error": "Error interno al guardar el archivo"}), 500

# ---------------------------------------------------------------------------
# Endpoints SafeAlert — Contactos de Emergencia y Período de Prueba
# ---------------------------------------------------------------------------

@flask_app.route("/api/tel/contacto", methods=["POST"])
def tel_agregar_contacto():
    """
    ============================================================================
    Función         : tel_agregar_contacto
    Descripción     : Inserta o actualiza un contacto en usuarios_emerg.
                      Si es el primer contacto del equipo, inicia el período
                      de prueba de 10 días en periodo_prueba.
                      El borrado lógico se resetea a 0 si el contacto ya existía.
    Fecha           : 2026-04-10
    Versión         : 1.0.0
    Lenguaje        : Python 3.x / Flask
    Conexiones      : TrialService.ts (cliente móvil)
    Ingesta         : JSON { device_id, nombre, telefono, principal }
    Devolución      : JSON { success: true }
    Uso             : POST /api/tel/contacto
    ============================================================================
    """
    provided_key = request.headers.get("X-API-Key", "")
    if not AUDIO_ALERT_API_KEY or not hmac.compare_digest(provided_key, AUDIO_ALERT_API_KEY):
        return jsonify({"error": "No autorizado"}), 401

    data = request.get_json(silent=True) or {}
    device_id = data.get("device_id", "").strip()
    nombre    = data.get("nombre", "").strip()
    telefono  = data.get("telefono", "").strip()
    principal = 1 if data.get("principal") else 0

    if not device_id or not nombre or not telefono:
        return jsonify({"error": "device_id, nombre y telefono son requeridos"}), 400

    import re
    if not re.match(r'^[a-zA-Z0-9\-_]{1,80}$', device_id):
        return jsonify({"error": "device_id inválido"}), 400

    db  = get_tel_db()
    now = datetime.utcnow().isoformat()

    existing = db.execute(
        "SELECT id FROM usuarios_emerg WHERE device_id = ? AND telefono = ?",
        (device_id, telefono)
    ).fetchone()

    if existing:
        db.execute(
            "UPDATE usuarios_emerg SET nombre=?, borrado=0, principal=?, updated_at=? "
            "WHERE device_id=? AND telefono=?",
            (nombre, principal, now, device_id, telefono)
        )
    else:
        db.execute(
            "INSERT INTO usuarios_emerg (device_id, nombre, telefono, borrado, principal, created_at, updated_at) "
            "VALUES (?,?,?,0,?,?,?)",
            (device_id, nombre, telefono, principal, now, now)
        )

    _crear_periodo_prueba_si_no_existe(db, device_id)
    db.commit()

    logger.info("[SafeAlert-TEL] Contacto sincronizado: device=%s tel=%s", device_id, telefono[-4:])
    return jsonify({"success": True}), 200


@flask_app.route("/api/tel/contacto/borrar", methods=["PUT"])
def tel_borrar_contacto():
    """
    ============================================================================
    Función         : tel_borrar_contacto
    Descripción     : Marca el campo borrado=1 en usuarios_emerg (borrado lógico).
                      El contacto queda registrado pero inactivo.
    Fecha           : 2026-04-10
    Versión         : 1.0.0
    Lenguaje        : Python 3.x / Flask
    Conexiones      : TrialService.ts (cliente móvil)
    Ingesta         : JSON { device_id, telefono }
    Devolución      : JSON { success: true }
    Uso             : PUT /api/tel/contacto/borrar
    ============================================================================
    """
    provided_key = request.headers.get("X-API-Key", "")
    if not AUDIO_ALERT_API_KEY or not hmac.compare_digest(provided_key, AUDIO_ALERT_API_KEY):
        return jsonify({"error": "No autorizado"}), 401

    data     = request.get_json(silent=True) or {}
    device_id = data.get("device_id", "").strip()
    telefono  = data.get("telefono", "").strip()

    if not device_id or not telefono:
        return jsonify({"error": "device_id y telefono son requeridos"}), 400

    db  = get_tel_db()
    now = datetime.utcnow().isoformat()
    db.execute(
        "UPDATE usuarios_emerg SET borrado=1, updated_at=? WHERE device_id=? AND telefono=?",
        (now, device_id, telefono)
    )
    db.commit()

    logger.info("[SafeAlert-TEL] Contacto marcado borrado: device=%s tel=%s", device_id, telefono[-4:])
    return jsonify({"success": True}), 200


@flask_app.route("/api/tel/prueba/<device_id>", methods=["GET"])
def tel_estado_prueba(device_id: str):
    """
    ============================================================================
    Función         : tel_estado_prueba
    Descripción     : Devuelve el estado del período de prueba para el equipo.
                      Calcula si la prueba expiró comparando fecha_expiracion
                      con la fecha UTC actual. Si expiró y pago=0 → expirado=True.
    Fecha           : 2026-04-10
    Versión         : 1.0.0
    Lenguaje        : Python 3.x / Flask
    Conexiones      : TrialService.ts (cliente móvil)
    Ingesta         : device_id (URL param)
    Devolución      : JSON { device_id, activo, expirado, pago, fecha_primer_contacto, fecha_expiracion }
    Uso             : GET /api/tel/prueba/<device_id>
    ============================================================================
    """
    provided_key = request.headers.get("X-API-Key", "")
    if not AUDIO_ALERT_API_KEY or not hmac.compare_digest(provided_key, AUDIO_ALERT_API_KEY):
        return jsonify({"error": "No autorizado"}), 401

    import re
    if not re.match(r'^[a-zA-Z0-9\-_]{1,80}$', device_id):
        return jsonify({"error": "device_id inválido"}), 400

    db  = get_tel_db()
    row = db.execute(
        "SELECT * FROM periodo_prueba WHERE device_id = ?", (device_id,)
    ).fetchone()

    if not row:
        return jsonify({
            "device_id": device_id,
            "activo": False,
            "expirado": False,
            "pago": False,
            "fecha_primer_contacto": None,
            "fecha_expiracion": None,
        })

    pago      = bool(row["pago"])
    fecha_exp = row["fecha_expiracion"]
    expirado  = False

    if not pago and fecha_exp:
        try:
            expirado = datetime.utcnow() > datetime.fromisoformat(fecha_exp)
        except Exception:
            pass

    return jsonify({
        "device_id": device_id,
        "activo": True,
        "expirado": expirado,
        "pago": pago,
        "fecha_primer_contacto": row["fecha_primer_contacto"],
        "fecha_expiracion": fecha_exp,
    })

# ---------------------------------------------------------------------------
# Ejecución
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    flask_app.run(debug=True)
