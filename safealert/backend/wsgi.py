"""
============================================================================
Archivo         : wsgi.py
Descripción     : Entrada WSGI para Flask unificado en PythonAnywhere.
                  NO define secretos placeholder: todas las claves se cargan
                  desde /home/oaf/agrupacion_api/.env por python-dotenv.
Autor           : oafon
Fecha           : 2026-08-01
Versión         : 3.1.0
Lenguaje        : Python 3.10 / Flask
Uso             : Web tab -> WSGI configuration file -> pegar este contenido
============================================================================
"""

import os
import sys
import time

# ---------------------------------------------------------------------------
# Ruta base del proyecto
# ---------------------------------------------------------------------------

project_home = "/home/oaf/agrupacion_api"

if project_home not in sys.path:
    sys.path.insert(0, project_home)

# ---------------------------------------------------------------------------
# Zona horaria
# ---------------------------------------------------------------------------

os.environ["TZ"] = "America/Argentina/Buenos_Aires"
if hasattr(time, "tzset"):
    time.tzset()

# ---------------------------------------------------------------------------
# Variables operativas (no sensibles)
# ---------------------------------------------------------------------------

os.environ["AGRUPACION_API_PATH"] = project_home

os.environ["SAFEALERT_DB_PATH"] = "/home/oaf/agrupacion_api/usuarios/safealert.db"
os.environ["SAFEALERT_TEL_DB_PATH"] = "/home/oaf/agrupacion_api/usuarios/safealert_tel.db"
os.environ["AUDIO_STORAGE_DIR"] = "/home/oaf/agrupacion_api/audio"
os.environ["REMATAS_DB_PATH"] = "/home/oaf/rematas/db/rematas.db"

# ---------------------------------------------------------------------------
# Carga de secretos desde .env
# IMPORTANTE: No definir aqui las claves (SAFEALERT_INTERNAL_KEY,
# SAFEALERT_ADMIN_API_KEY, AUDIO_ALERT_API_KEY, MP_WEBHOOK_SECRET, ...).
# Si se definen con valores de relleno aqui, pisarian al archivo .env.
# El archivo .env vive en: /home/oaf/agrupacion_api/.env
# ---------------------------------------------------------------------------

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(project_home, ".env"), override=False)
except ImportError:
    pass

# ---------------------------------------------------------------------------
# Entrada Flask WSGI (backend unificado v3.1 con rutas /api/v1/admin/*)
# ---------------------------------------------------------------------------

from flask_app import flask_app as application
