"""
============================================================================
Archivo         : test_admin_endpoints.py
Descripción     : Tests de los endpoints administrativos del dashboard de
                  posicionamientos: /api/v1/admin/usuarios y
                  /api/v1/admin/stats, más protección de consentimientos.
Autor           : oafon / AI Assistant
Fecha           : 2026-07-31
Versión         : 1.0.0
Lenguaje        : Python 3.13 / unittest / Flask test client
Uso             : python -m unittest test_admin_endpoints -v
============================================================================
"""

import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta

# --- Entorno de prueba: DB temporal y claves de prueba ---
_TMP_DIR = tempfile.mkdtemp(prefix="safealert_test_")
os.environ["SAFEALERT_DB_PATH"] = os.path.join(_TMP_DIR, "test.db")
os.environ["SAFEALERT_TEL_DB_PATH"] = os.path.join(_TMP_DIR, "test_tel.db")
os.environ["SAFEALERT_ADMIN_API_KEY"] = "clave_admin_test_123"
os.environ["SAFEALERT_INTERNAL_KEY"] = "clave_interna_test_456"
os.environ["AUDIO_ALERT_API_KEY"] = "clave_audio_test_789"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask_app import flask_app, get_db  # noqa: E402


class AdminEndpointsTestCase(unittest.TestCase):
    """Pruebas de los endpoints admin del dashboard de posicionamientos."""

    @classmethod
    def setUpClass(cls):
        cls.app = flask_app
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()
        cls.admin_headers = {"X-Admin-Key": "clave_admin_test_123"}

    def setUp(self):
        """Registra un usuario de prueba y una ubicación."""
        self.client.post("/api/users/register", json={
            "device_id": "dev-test-001",
            "name": "Usuario Prueba",
            "phone": "+5491100000000",
        })
        self.client.post("/api/v1/ubicaciones", json={
            "usuario_id": "dev-test-001",
            "latitud": -34.603722,
            "longitud": -58.381592,
            "precision_metros": 12.5,
            "origen": "GPS",
            "permiso_ubicacion": "GRANTED",
        })

    # ------------------------------------------------------------------
    # /api/v1/admin/usuarios
    # ------------------------------------------------------------------

    def test_admin_usuarios_requiere_clave(self):
        resp = self.client.get("/api/v1/admin/usuarios")
        self.assertEqual(resp.status_code, 401)

    def test_admin_usuarios_con_clave(self):
        resp = self.client.get("/api/v1/admin/usuarios", headers=self.admin_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("usuarios", data)
        self.assertGreaterEqual(data["total"], 1)
        primero = data["usuarios"][0]
        self.assertEqual(primero["device_id"], "dev-test-001")
        self.assertEqual(primero["name"], "Usuario Prueba")
        self.assertAlmostEqual(primero["ultima_latitud"], -34.603722)
        self.assertEqual(primero["ultimo_origen"], "GPS")
        self.assertGreaterEqual(primero["total_ubicaciones"], 1)

    def test_admin_usuarios_busqueda(self):
        resp = self.client.get(
            "/api/v1/admin/usuarios?busqueda=Prueba", headers=self.admin_headers
        )
        data = resp.get_json()
        self.assertEqual(data["total"], 1)

    def test_admin_usuarios_limite(self):
        for i in range(3):
            self.client.post("/api/users/register", json={
                "device_id": f"dev-test-{i:03d}",
                "name": f"Usuario {i}",
                "phone": f"+54911{i:07d}",
            })
        resp = self.client.get(
            "/api/v1/admin/usuarios?limite=2", headers=self.admin_headers
        )
        data = resp.get_json()
        self.assertEqual(data["total"], 2)

    # ------------------------------------------------------------------
    # /api/v1/admin/stats
    # ------------------------------------------------------------------

    def test_admin_stats_requiere_clave(self):
        resp = self.client.get("/api/v1/admin/stats")
        self.assertEqual(resp.status_code, 401)

    def test_admin_stats_con_clave(self):
        resp = self.client.get("/api/v1/admin/stats", headers=self.admin_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        kpis = data["kpis"]
        self.assertGreaterEqual(kpis["total_usuarios"], 1)
        self.assertGreaterEqual(kpis["total_ubicaciones"], 1)
        self.assertEqual(kpis["usuarios_activos_24h"], 1)
        self.assertGreaterEqual(kpis["usuarios_activos_7d"], 1)
        origenes = {r["origen"] for r in data["ubicaciones_por_origen"]}
        self.assertIn("GPS", origenes)
        self.assertEqual(data["usuarios_por_estado_suscripcion"][0]["subscription_status"], "not_registered")
        self.assertGreaterEqual(len(data["ubicaciones_por_dia"]), 1)
        self.assertIn("generado_en", data)

    def test_admin_stats_sin_datos(self):
        # Usa otra app con DB limpia (mismo módulo, DB compartida por setUpClass;
        # basta verificar estructura con claves presentes)
        resp = self.client.get("/api/v1/admin/stats", headers=self.admin_headers)
        data = resp.get_json()
        for clave in ("ubicaciones_por_origen", "ubicaciones_por_dia",
                      "accesos_por_dispositivo", "consentimientos_por_estado",
                      "ubicaciones_por_permiso", "usuarios_por_plan"):
            self.assertIn(clave, data)

    # ------------------------------------------------------------------
    # Protección de consentimientos
    # ------------------------------------------------------------------

    def test_consentimientos_requiere_clave_admin(self):
        resp = self.client.get("/api/v1/consentimientos/usuario/dev-test-001")
        self.assertEqual(resp.status_code, 401)

    def test_consentimientos_con_clave(self):
        self.client.post("/api/v1/consentimientos", json={
            "usuario_id": "dev-test-001",
            "tipo_permiso": "UBICACION",
            "estado": "OTORGADO",
            "version_politica": "1.0.0",
        })
        resp = self.client.get(
            "/api/v1/consentimientos/usuario/dev-test-001",
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertGreaterEqual(len(data), 1)
        self.assertEqual(data[0]["tipo_permiso"], "UBICACION")

    # ------------------------------------------------------------------
    # /api/v1/estado (público, usado por el dashboard)
    # ------------------------------------------------------------------

    def test_estado_publico(self):
        resp = self.client.get("/api/v1/estado")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("base_datos", data)


if __name__ == "__main__":
    unittest.main(verbosity=2)
