"""
============================================================================
Archivo         : flask_app.py
Descripcion     : Backend SafeAlert - WRAPPER de compatibilidad.
                  La implementacion canonica vive en
                  safealert/backend/flask_app.py (backend unificado v3.1,
                  27+ endpoints, panel admin, retencion de datos).
                  Este modulo re-exporta flask_app para mantener
                  compatibilidad con despliegues o scripts que importan
                  desde la carpeta python/ (legacy).
                  El codigo duplicado historico se conserva en
                  flask_app_legacy.py como referencia.
Autor           : oafon / AI Assistant
Fecha           : 2026-08-22
Version         : 3.1.0
Lenguaje        : Python 3.13 / Flask
Uso             : from flask_app import flask_app as application
============================================================================
"""

import importlib.util
import os

# ---------------------------------------------------------------------------
# Cargar el backend canonico desde safealert/backend/flask_app.py
# (unica fuente de verdad). Se usa importlib para evitar la auto-importacion
# que ocurriria con `import flask_app` (mismo nombre de modulo).
# ---------------------------------------------------------------------------

_CANONICAL_PATH = os.path.normpath(
    os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..",
        "safealert",
        "backend",
        "flask_app.py",
    )
)


def _load_canonical():
    """Carga y devuelve el módulo canónico del backend SafeAlert."""
    spec = importlib.util.spec_from_file_location("safealert_canonical", _CANONICAL_PATH)
    if spec is None or spec.loader is None:
        raise ImportError(f"No se pudo resolver el modulo canonico en {_CANONICAL_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


try:
    _canonical = _load_canonical()
    flask_app = _canonical.flask_app
except Exception as exc:  # noqa: BLE001
    # Fallback informativo si el backend canonico no esta disponible
    # (por ejemplo, en un despliegue que solo copio esta carpeta).
    from flask import Flask

    _fallback = Flask(__name__)

    @_fallback.route("/api/health")
    def _health_fallback():
        from flask import jsonify
        return jsonify({
            "status": "degraded",
            "detail": f"Backend canonico no disponible: {exc}",
        })

    flask_app = _fallback  # noqa: F811

if __name__ == "__main__":
    flask_app.run(debug=False)
