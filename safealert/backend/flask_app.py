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

# ---------------------------------------------------------------------------
# Configuración del entorno
# ---------------------------------------------------------------------------

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
    "exp://*",
    "http://localhost:*",
    "http://10.0.2.2:*",
])

# ---------------------------------------------------------------------------
# Rate limiter
# Almacenado en SQLite (tabla rate_limit_events) para que sea efectivo con
# múltiples workers de Gunicorn/WSGI. La API es idéntica a la versión en
# memoria: _rate_limit(key) -> bool (True si la petición puede pasar).
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Obtención segura de IP (Prompt Maestro secciones 12)
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Proveedor de geolocalización por IP (Prompt Maestro sección 13)
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Conexiones a bases de datos
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Creación de tablas
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Funciones de validación (Prompt Maestro sección 17)
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# POST /api/internal/link-preapproval — Vincula preapproval MP con device_id
# (llamado por Cloud Function createPaymentOrder)
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# POST /api/tickets/create — Genera ticket correlativo de pago
# (llamado por PaymentService.createTicket desde la app móvil)
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# NUEVOS ENDPOINTS — API v1 (Prompt Maestro sección 11)
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# POST /api/v1/accesos — Registrar acceso técnico (sección 11)
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# POST /api/v1/ubicaciones — Recibir ubicación GPS/NAVEGADOR (sección 11)
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# POST /api/v1/ubicaciones/manual — Ubicación ingresada por usuario (sección 11)
# ---------------------------------------------------------------------------

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
def registrar_consentimiento():
    if not _rate_limit(f"consentimiento:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    data = request.get_json(silent=True) or {}
    tipo = data.get("tipo_permiso", "")
    estado = data.get("estado", "")
    if tipo not in ('UBICACION', 'CAMARA', 'MICROFONO', 'CONTACTOS', 'NOTIFICACIONES'):
        return jsonify({"error": f"tipo_permiso invalido: {tipo}"}), 400
    if estado not in ('OTORGADO', 'RECHAZADO', 'REVOCADO', 'NO_SOLICITADO'):
        return jsonify({"error": f"estado invalido: {estado}"}), 400
    ip = obtener_ip_cliente(request)
    db = get_db()
    now = datetime.utcnow().isoformat()
    db.execute("""
        INSERT INTO consentimientos_usuario (
            usuario_id, sesion_id, tipo_permiso, estado,
            texto_mostrado, version_politica, fecha_hora, ip, user_agent
        ) VALUES (?,?,?,?, ?,?,?,?,?)
    """, (
        data.get("usuario_id"), data.get("sesion_id"),
        tipo, estado,
        data.get("texto_mostrado", ""), data.get("version_politica", ""),
        now, ip, request.headers.get("User-Agent", "")
    ))
    db.commit()
    return jsonify({"success": True, "id": db.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]}), 201

# ---------------------------------------------------------------------------
# POST /api/v1/consentimientos/revocar — Revocar consentimiento (sección 10)
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/consentimientos/revocar", methods=["POST"])
def revocar_consentimiento():
    if not _rate_limit(f"consentimiento:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    data = request.get_json(silent=True) or {}
    usuario_id = data.get("usuario_id", "")
    tipo = data.get("tipo_permiso", "")
    if not usuario_id or not tipo:
        return jsonify({"error": "usuario_id y tipo_permiso requeridos"}), 400
    if tipo not in ('UBICACION', 'CAMARA', 'MICROFONO', 'CONTACTOS', 'NOTIFICACIONES'):
        return jsonify({"error": f"tipo_permiso invalido: {tipo}"}), 400
    ip = obtener_ip_cliente(request)
    db = get_db()
    now = datetime.utcnow().isoformat()
    db.execute("""
        INSERT INTO consentimientos_usuario (
            usuario_id, sesion_id, tipo_permiso, estado,
            texto_mostrado, version_politica, fecha_hora, ip, user_agent
        ) VALUES (?,?,?,?, ?,?,?,?,?)
    """, (
        usuario_id, data.get("sesion_id"),
        tipo, "REVOCADO",
        data.get("texto_mostrado", ""), data.get("version_politica", ""),
        now, ip, request.headers.get("User-Agent", "")
    ))
    db.commit()
    return jsonify({"success": True, "message": f"Consentimiento {tipo} revocado"}), 200

# ---------------------------------------------------------------------------
# GET /api/v1/ubicaciones/usuario/<usuario_id> — Historial (sección 11)
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/ubicaciones/usuario/<usuario_id>", methods=["GET"])
@require_admin_key
def historial_ubicaciones(usuario_id: str):
    limite = request.args.get("limite", 50, type=int)
    limite = min(limite, 200)
    db = get_db()
    rows = db.execute("""
        SELECT id, usuario_id, fecha_hora_servidor, latitud, longitud,
               precision_metros, origen, permiso_ubicacion,
               ip, pais_ip, ciudad_ip, proveedor,
               direccion_estimada, direccion_confirmada
        FROM ubicaciones_usuario
        WHERE usuario_id = ?
        ORDER BY fecha_hora_servidor DESC
        LIMIT ?
    """, (usuario_id, limite)).fetchall()
    return jsonify([dict(r) for r in rows])

# ---------------------------------------------------------------------------
# GET /api/v1/ubicaciones/ultima/<usuario_id> — Última ubicación (sección 11)
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/ubicaciones/ultima/<usuario_id>", methods=["GET"])
@require_admin_key
def ultima_ubicacion(usuario_id: str):
    db = get_db()
    row = db.execute("""
        SELECT id, usuario_id, fecha_hora_servidor, latitud, longitud,
               precision_metros, origen, permiso_ubicacion,
               ip, pais_ip, ciudad_ip, direccion_confirmada
        FROM ubicaciones_usuario
        WHERE usuario_id = ?
        ORDER BY fecha_hora_servidor DESC
        LIMIT 1
    """, (usuario_id,)).fetchone()
    if not row:
        return jsonify({"error": "Sin ubicaciones registradas"}), 404
    return jsonify(dict(row))

# ---------------------------------------------------------------------------
# GET /api/v1/ubicaciones/mapa — Datos para mapa operativo (sección 11, 16)
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/ubicaciones/mapa", methods=["GET"])
@require_admin_key
def ubicaciones_mapa():
    usuario_id = request.args.get("usuario_id", "")
    origen = request.args.get("origen", "")
    limite = request.args.get("limite", 200, type=int)
    limite = min(limite, 1000)
    db = get_db()
    query = """
        SELECT id, usuario_id, fecha_hora_servidor, latitud, longitud,
               precision_metros, origen, permiso_ubicacion,
               ip, pais_ip, ciudad_ip, proveedor, precision_ip_km,
               direccion_estimada, direccion_confirmada
        FROM ubicaciones_usuario
        WHERE 1=1
    """
    params = []
    if usuario_id:
        query += " AND usuario_id = ?"
        params.append(usuario_id)
    if origen and validar_origen(origen):
        query += " AND origen = ?"
        params.append(origen)
    query += " ORDER BY fecha_hora_servidor DESC LIMIT ?"
    params.append(limite)
    rows = db.execute(query, params).fetchall()
    return jsonify([dict(r) for r in rows])

# ---------------------------------------------------------------------------
# GET /api/v1/ubicaciones/<id> — Detalle de ubicación (sección 11)
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/ubicaciones/<int:id>", methods=["GET"])
@require_admin_key
def detalle_ubicacion(id: int):
    db = get_db()
    row = db.execute("SELECT * FROM ubicaciones_usuario WHERE id = ?", (id,)).fetchone()
    if not row:
        return jsonify({"error": "Ubicacion no encontrada"}), 404
    return jsonify(dict(row))

def normalizar_mac(mac: str) -> str:
    """
    Normaliza una dirección MAC eliminando separadores y llevándola a minúsculas.
    Ej: "AA:BB:CC:DD:EE:FF" -> "aabbccddeeff"
    """
    return re.sub(r"[^0-9a-fA-F]", "", mac or "").lower()


# ---------------------------------------------------------------------------
# GET /api/v1/admin/usuarios — Listado de usuarios con última ubicación
# (Panel de administración: dashboard de posicionamientos)
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/admin/usuarios", methods=["GET"])
@require_admin_key
def admin_usuarios():
    busqueda = request.args.get("busqueda", "").strip()
    mac = normalizar_mac(request.args.get("mac", ""))
    plan = request.args.get("plan", "").strip()
    limite = request.args.get("limite", 200, type=int)
    limite = min(limite, 500)
    db = get_db()
    query = """
        SELECT
            u.device_id, u.name, u.phone, u.mac_address, u.device_unique_id,
            u.registered_at, u.subscription_status, u.plan_type,
            u.subscription_expires_at, u.updated_at,
            ul.id AS ultima_ubicacion_id,
            ul.latitud AS ultima_latitud,
            ul.longitud AS ultima_longitud,
            ul.origen AS ultimo_origen,
            ul.precision_metros AS ultima_precision,
            ul.fecha_hora_servidor AS ultima_fecha_hora,
            ul.direccion_confirmada AS ultima_direccion,
            (SELECT COUNT(*) FROM ubicaciones_usuario uu WHERE uu.usuario_id = u.device_id) AS total_ubicaciones
        FROM users u
        LEFT JOIN ubicaciones_usuario ul ON ul.id = (
            SELECT id FROM ubicaciones_usuario
            WHERE usuario_id = u.device_id
            ORDER BY fecha_hora_servidor DESC, id DESC
            LIMIT 1
        )
        WHERE 1=1
    """
    params = []
    if busqueda:
        like = f"%{busqueda}%"
        query += " AND (u.device_id LIKE ? OR u.name LIKE ? OR u.phone LIKE ? OR u.mac_address LIKE ?)"
        params.extend([like, like, like, like])
    if mac:
        query += " AND replace(lower(u.mac_address), ':', '') LIKE ?"
        params.append(f"%{mac}%")
    if plan:
        query += " AND u.plan_type = ?"
        params.append(plan)
    query += " ORDER BY COALESCE(ul.fecha_hora_servidor, u.updated_at) DESC LIMIT ?"
    params.append(limite)
    rows = db.execute(query, params).fetchall()
    resultado = []
    for r in rows:
        d = dict(r)
        d["ultima_ubicacion_id"] = d.get("ultima_ubicacion_id")
        resultado.append(d)
    return jsonify({
        "total": len(resultado),
        "usuarios": resultado
    })

# ---------------------------------------------------------------------------
# POST /api/v1/admin/pagos/simular — Genera un pago simulado (pruebas)
# Busca al usuario por MAC address (o device_id), activa la suscripción
# con el plan indicado, registra el evento de pago simulado y genera el
# ticket correlativo. No hay cobro real (no toca MercadoPago).
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/admin/pagos/simular", methods=["POST"])
@require_admin_key
def admin_pago_simulado():
    if not _rate_limit(f"pago_sim:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    data = request.get_json(silent=True) or {}
    mac = normalizar_mac(data.get("mac_address", ""))
    device_id = str(data.get("device_id", "")).strip()
    plan_type = data.get("plan_type", "monthly").strip()
    dias = int(data.get("dias", 0) or 0)

    if plan_type not in ("monthly", "annual"):
        return jsonify({"error": "plan_type debe ser monthly o annual"}), 400
    if not mac and not device_id:
        return jsonify({"error": "Se requiere mac_address o device_id"}), 400
    if dias <= 0:
        dias = 32 if plan_type == "monthly" else 380

    db = get_db()
    now = datetime.utcnow().isoformat()

    if device_id:
        row = db.execute("SELECT * FROM users WHERE device_id = ?", (device_id,)).fetchone()
        if not row:
            return jsonify({"error": "device_id no encontrado"}), 404
    else:
        rows = db.execute(
            "SELECT * FROM users WHERE replace(lower(mac_address), ':', '') LIKE ?",
            (f"%{mac}%",)
        ).fetchall()
        if not rows:
            return jsonify({"error": "No se encontró un usuario con esa MAC"}), 404
        if len(rows) > 1:
            return jsonify({"error": "La MAC coincide con varios usuarios. Usá device_id para desambiguar."}), 409
        row = rows[0]

    expires_at = (datetime.utcnow() + timedelta(days=dias)).isoformat()

    db.execute(
        "UPDATE users SET subscription_status='active', plan_type=?, "
        "subscription_expires_at=?, updated_at=? WHERE device_id=?",
        (plan_type, expires_at, now, row["device_id"])
    )

    db.execute(
        "INSERT INTO payment_events (device_id, event_type, mp_reference, payload, created_at) "
        "VALUES (?, 'admin_simulated', ?, ?, ?)",
        (row["device_id"], "", json.dumps({"plan_type": plan_type, "dias": dias,
                                           "simulado": True, "por_mac": bool(mac)}), now)
    )

    ticket_row = db.execute(
        "SELECT COALESCE(MAX(ticket_number), 0) AS ultimo FROM tickets"
    ).fetchone()
    ticket_number = int(ticket_row["ultimo"]) + 1
    amount = 75000 if plan_type == "annual" else 7500
    db.execute(
        "INSERT INTO tickets (ticket_number, device_id, user_name, plan_type, amount, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (ticket_number, row["device_id"], row["name"], plan_type, amount, now)
    )
    db.commit()

    logger.info("[SafeAlert] Pago simulado (admin): device=%s mac=%s plan=%s dias=%d ticket=%d",
                row["device_id"], row["mac_address"], plan_type, dias, ticket_number)

    return jsonify({
        "success": True,
        "ticket": {
            "ticket_number": ticket_number,
            "date": datetime.utcnow().strftime("%d/%m/%Y"),
            "time": datetime.utcnow().strftime("%H:%M"),
            "plan_type": plan_type,
            "amount": amount,
            "contact_email": "safealert_contacto@manejadatos.com",
        },
        "usuario": {
            "device_id": row["device_id"],
            "name": row["name"],
            "mac_address": row["mac_address"],
            "subscription_status": "active",
            "plan_type": plan_type,
            "subscription_expires_at": expires_at,
        },
    })

# ---------------------------------------------------------------------------
# GET /api/v1/admin/stats — KPIs agregados para el dashboard
# (Panel de administración: métricas, actividad, orígenes, dispositivos)
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/admin/stats", methods=["GET"])
@require_admin_key
def admin_stats():
    db = get_db()
    ahora = datetime.utcnow()
    hace_24h = (ahora - timedelta(hours=24)).isoformat()
    hace_7d = (ahora - timedelta(days=7)).isoformat()
    hace_30d = (ahora - timedelta(days=30)).isoformat()

    total_usuarios = db.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
    usuarios_activos_24h = db.execute(
        "SELECT COUNT(DISTINCT usuario_id) c FROM ubicaciones_usuario WHERE fecha_hora_servidor >= ?",
        (hace_24h,)
    ).fetchone()["c"]
    usuarios_activos_7d = db.execute(
        "SELECT COUNT(DISTINCT usuario_id) c FROM ubicaciones_usuario WHERE fecha_hora_servidor >= ?",
        (hace_7d,)
    ).fetchone()["c"]
    total_ubicaciones = db.execute("SELECT COUNT(*) c FROM ubicaciones_usuario").fetchone()["c"]
    total_accesos = db.execute("SELECT COUNT(*) c FROM accesos_tecnicos").fetchone()["c"]
    total_consentimientos = db.execute("SELECT COUNT(*) c FROM consentimientos_usuario").fetchone()["c"]

    ubicaciones_24h = db.execute(
        "SELECT COUNT(*) c FROM ubicaciones_usuario WHERE fecha_hora_servidor >= ?",
        (hace_24h,)
    ).fetchone()["c"]
    accesos_24h = db.execute(
        "SELECT COUNT(*) c FROM accesos_tecnicos WHERE fecha_hora >= ?",
        (hace_24h,)
    ).fetchone()["c"]

    por_origen = db.execute(
        "SELECT origen, COUNT(*) c FROM ubicaciones_usuario GROUP BY origen"
    ).fetchall()
    por_dia = db.execute(
        "SELECT substr(fecha_hora_servidor, 1, 10) dia, COUNT(*) c "
        "FROM ubicaciones_usuario WHERE fecha_hora_servidor >= ? "
        "GROUP BY dia ORDER BY dia",
        (hace_30d,)
    ).fetchall()
    por_dispositivo = db.execute(
        "SELECT tipo_dispositivo, COUNT(*) c FROM accesos_tecnicos "
        "WHERE tipo_dispositivo IS NOT NULL AND tipo_dispositivo != '' "
        "GROUP BY tipo_dispositivo ORDER BY c DESC LIMIT 10"
    ).fetchall()
    por_estado_suscripcion = db.execute(
        "SELECT subscription_status, COUNT(*) c FROM users GROUP BY subscription_status"
    ).fetchall()
    por_estado_consentimiento = db.execute(
        "SELECT estado, COUNT(*) c FROM consentimientos_usuario GROUP BY estado"
    ).fetchall()
    por_permiso_ubicacion = db.execute(
        "SELECT permiso_ubicacion, COUNT(*) c FROM ubicaciones_usuario "
        "WHERE permiso_ubicacion IS NOT NULL GROUP BY permiso_ubicacion"
    ).fetchall()
    por_plan = db.execute(
        "SELECT COALESCE(plan_type, 'sin_plan') plan_type, COUNT(*) c FROM users "
        "GROUP BY plan_type ORDER BY c DESC"
    ).fetchall()

    return jsonify({
        "kpis": {
            "total_usuarios": total_usuarios,
            "usuarios_activos_24h": usuarios_activos_24h,
            "usuarios_activos_7d": usuarios_activos_7d,
            "total_ubicaciones": total_ubicaciones,
            "ubicaciones_24h": ubicaciones_24h,
            "total_accesos": total_accesos,
            "accesos_24h": accesos_24h,
            "total_consentimientos": total_consentimientos,
        },
        "ubicaciones_por_origen": [dict(r) for r in por_origen],
        "ubicaciones_por_dia": [dict(r) for r in por_dia],
        "accesos_por_dispositivo": [dict(r) for r in por_dispositivo],
        "usuarios_por_estado_suscripcion": [dict(r) for r in por_estado_suscripcion],
        "consentimientos_por_estado": [dict(r) for r in por_estado_consentimiento],
        "ubicaciones_por_permiso": [dict(r) for r in por_permiso_ubicacion],
        "usuarios_por_plan": [dict(r) for r in por_plan],
        "generado_en": ahora.isoformat(),
    })

# ---------------------------------------------------------------------------
# GET /api/v1/estado — Health check extendido (sección 11)
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/estado", methods=["GET"])
def estado_sistema():
    db = get_db()
    total_ubicaciones = db.execute("SELECT COUNT(*) as c FROM ubicaciones_usuario").fetchone()["c"]
    total_accesos = db.execute("SELECT COUNT(*) as c FROM accesos_tecnicos").fetchone()["c"]
    total_consentimientos = db.execute("SELECT COUNT(*) as c FROM consentimientos_usuario").fetchone()["c"]
    db_ok = True
    try:
        db.execute("SELECT 1").fetchone()
    except Exception:
        db_ok = False
    ip_actual = obtener_ip_cliente(request)
    return jsonify({
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "base_datos": {"conectada": db_ok, "ubicaciones": total_ubicaciones, "accesos": total_accesos, "consentimientos": total_consentimientos},
        "servidor": {"ip_publica": ip_actual, "proveedor_geo": "ip-api.com"},
        "retencion": {"accesos_dias": RETENCION_ACCESOS_DIAS, "ubicaciones_dias": RETENCION_UBICACIONES_DIAS, "consentimientos_dias": RETENCION_CONSENTIMIENTOS_DIAS, "logs_dias": RETENCION_LOGS_DIAS},
        "version_api": "v1"
    })

# ---------------------------------------------------------------------------
# GET /api/v1/consentimientos/usuario/<usuario_id> — Historial consents (sección 11)
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/consentimientos/usuario/<usuario_id>", methods=["GET"])
@require_admin_key
def historial_consentimientos(usuario_id: str):
    db = get_db()
    rows = db.execute("""
        SELECT id, tipo_permiso, estado, version_politica, fecha_hora
        FROM consentimientos_usuario
        WHERE usuario_id = ?
        ORDER BY fecha_hora DESC
    """, (usuario_id,)).fetchall()
    return jsonify([dict(r) for r in rows])

# ---------------------------------------------------------------------------
# GET /api/v1/accesos/usuario/<usuario_id> — Historial accesos (sección 11)
# ---------------------------------------------------------------------------

@flask_app.route("/api/v1/accesos/usuario/<usuario_id>", methods=["GET"])
@require_admin_key
def historial_accesos(usuario_id: str):
    limite = request.args.get("limite", 50, type=int)
    limite = min(limite, 200)
    db = get_db()
    rows = db.execute("""
        SELECT id, fecha_hora, ip, metodo_http, ruta_consultada, endpoint,
               codigo_respuesta, user_agent, navegador_aproximado,
               sistema_operativo_aproximado, tipo_dispositivo,
               pais_ip, ciudad_ip, proveedor
        FROM accesos_tecnicos
        WHERE usuario_id = ?
        ORDER BY fecha_hora DESC
        LIMIT ?
    """, (usuario_id, limite)).fetchall()
    return jsonify([dict(r) for r in rows])

# ---------------------------------------------------------------------------
# Política de retención — Purga programada (Prompt Maestro sección 19)
# ---------------------------------------------------------------------------

def ejecutar_purga_retencion():
    """Elimina registros antiguos según política de retención configurada."""
    db = get_db()
    ahora = datetime.utcnow().isoformat()
    corte_accesos = (datetime.utcnow() - timedelta(days=RETENCION_ACCESOS_DIAS)).isoformat()
    corte_ubicaciones = (datetime.utcnow() - timedelta(days=RETENCION_UBICACIONES_DIAS)).isoformat()
    corte_consentimientos = (datetime.utcnow() - timedelta(days=RETENCION_CONSENTIMIENTOS_DIAS)).isoformat()
    eliminados_accesos = db.execute("DELETE FROM accesos_tecnicos WHERE fecha_hora < ?", (corte_accesos,)).rowcount
    eliminados_ubicaciones = db.execute("DELETE FROM ubicaciones_usuario WHERE creado_en < ?", (corte_ubicaciones,)).rowcount
    eliminados_consentimientos = db.execute("DELETE FROM consentimientos_usuario WHERE fecha_hora < ?", (corte_consentimientos,)).rowcount
    db.commit()
    logger.info("[Retencion] Purga completada: accesos=%d ubicaciones=%d consents=%d",
                eliminados_accesos, eliminados_ubicaciones, eliminados_consentimientos)
    return {"accesos": eliminados_accesos, "ubicaciones": eliminados_ubicaciones, "consentimientos": eliminados_consentimientos}

@flask_app.route("/api/v1/admin/purga", methods=["POST"])
@require_admin_key
def purga_retencion():
    if not _rate_limit(f"purga:{request.remote_addr}"):
        return jsonify({"error": "Demasiadas solicitudes"}), 429
    resultado = ejecutar_purga_retencion()
    return jsonify({"success": True, "eliminados": resultado})

# ---------------------------------------------------------------------------
# Ejecución
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    DEBUG_MODE = os.environ.get("FLASK_DEBUG", "0") == "1"
    flask_app.run(debug=DEBUG_MODE)
