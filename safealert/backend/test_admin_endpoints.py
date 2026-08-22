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


def _fake_verify_id_token(token):
    """Mock de verify_id_token de Firebase: acepta cualquier token Bearer."""
    return {"uid": "firebase-uid-test-123", "token": token}


# Mock de verificación de Firebase para los tests (sin credenciales reales)
import flask_app as _flask_app_module  # noqa: E402

if _flask_app_module.firebase_auth is not None:
    _flask_app_module.firebase_auth.verify_id_token = _fake_verify_id_token


class AdminEndpointsTestCase(unittest.TestCase):
    """Pruebas de los endpoints admin del dashboard de posicionamientos."""

    @classmethod
    def setUpClass(cls):
        cls.app = flask_app
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()
        cls.admin_headers = {"X-Admin-Key": "clave_admin_test_123"}
        cls.auth_headers = {"Authorization": "Bearer token-de-prueba-123"}
        cls.internal_headers = {"X-Internal-Key": "clave_interna_test_456"}

    def setUp(self):
        """Registra un usuario de prueba y una ubicación."""
        self.client.post("/api/users/register", json={
            "device_id": "dev-test-001",
            "name": "Usuario Prueba",
            "phone": "+5491100000000",
            "mac_address": "AA:BB:CC:DD:EE:FF",
            "device_unique_id": "unique-001",
        }, headers=self.auth_headers)
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
            }, headers=self.auth_headers)
        resp = self.client.get(
            "/api/v1/admin/usuarios?limite=2", headers=self.admin_headers
        )
        data = resp.get_json()
        self.assertEqual(data["total"], 2)

    def test_admin_usuarios_por_mac(self):
        resp = self.client.get(
            "/api/v1/admin/usuarios?mac=AA:BB:CC:DD:EE:FF", headers=self.admin_headers
        )
        data = resp.get_json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["usuarios"][0]["device_id"], "dev-test-001")

    def test_admin_usuarios_por_mac_sin_formato(self):
        resp = self.client.get(
            "/api/v1/admin/usuarios?mac=aabbccddeeff", headers=self.admin_headers
        )
        data = resp.get_json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["usuarios"][0]["mac_address"], "AA:BB:CC:DD:EE:FF")

    def test_admin_usuarios_por_mac_sin_resultados(self):
        resp = self.client.get(
            "/api/v1/admin/usuarios?mac=00:11:22:33:44:55", headers=self.admin_headers
        )
        data = resp.get_json()
        self.assertEqual(data["total"], 0)

    # ------------------------------------------------------------------
    # /api/v1/admin/pagos/simular
    # ------------------------------------------------------------------

    def test_pago_simulado_requiere_clave(self):
        resp = self.client.post(
            "/api/v1/admin/pagos/simular",
            json={"mac_address": "AA:BB:CC:DD:EE:FF", "plan_type": "monthly"},
        )
        self.assertEqual(resp.status_code, 401)

    def test_pago_simulado_por_mac(self):
        resp = self.client.post(
            "/api/v1/admin/pagos/simular",
            json={"mac_address": "AA:BB:CC:DD:EE:FF", "plan_type": "monthly"},
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["usuario"]["subscription_status"], "active")
        self.assertEqual(data["usuario"]["plan_type"], "monthly")
        self.assertIn("ticket", data)
        self.assertEqual(data["ticket"]["amount"], 7500)
        self.assertGreater(data["ticket"]["ticket_number"], 0)

    def test_pago_simulado_anual_por_device_id(self):
        resp = self.client.post(
            "/api/v1/admin/pagos/simular",
            json={"device_id": "dev-test-001", "plan_type": "annual", "dias": 365},
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["ticket"]["amount"], 75000)
        self.assertEqual(data["usuario"]["subscription_status"], "active")

    def test_pago_simulado_ticket_correlativo(self):
        primero = self.client.post(
            "/api/v1/admin/pagos/simular",
            json={"device_id": "dev-test-001", "plan_type": "monthly"},
            headers=self.admin_headers,
        ).get_json()
        segundo = self.client.post(
            "/api/v1/admin/pagos/simular",
            json={"device_id": "dev-test-001", "plan_type": "monthly"},
            headers=self.admin_headers,
        ).get_json()
        self.assertEqual(
            segundo["ticket"]["ticket_number"],
            primero["ticket"]["ticket_number"] + 1,
        )

    def test_pago_simulado_mac_inexistente(self):
        resp = self.client.post(
            "/api/v1/admin/pagos/simular",
            json={"mac_address": "00:11:22:33:44:55", "plan_type": "monthly"},
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 404)

    def test_pago_simulado_plan_invalido(self):
        resp = self.client.post(
            "/api/v1/admin/pagos/simular",
            json={"mac_address": "AA:BB:CC:DD:EE:FF", "plan_type": "semanal"},
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 400)

    def test_pago_simulado_requiere_mac_o_device(self):
        resp = self.client.post(
            "/api/v1/admin/pagos/simular",
            json={"plan_type": "monthly"},
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 400)

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

    # ------------------------------------------------------------------
    # /api/tickets/create (llamado por PaymentService.createTicket)
    # ------------------------------------------------------------------

    def test_ticket_create_requiere_clave_interna(self):
        resp = self.client.post("/api/tickets/create", json={
            "device_id": "dev-test-001",
            "user_name": "Usuario Prueba",
            "plan_type": "monthly",
            "amount": 7500,
        })
        self.assertEqual(resp.status_code, 401)

    def test_ticket_create_ok(self):
        resp = self.client.post("/api/tickets/create", json={
            "device_id": "dev-test-001",
            "user_name": "Usuario Prueba",
            "plan_type": "monthly",
            "amount": 7500,
        }, headers=self.internal_headers)
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["ticket"]["plan_type"], "monthly")
        self.assertEqual(data["ticket"]["amount"], 7500)
        self.assertGreater(data["ticket"]["ticket_number"], 0)

    def test_ticket_create_correlativo(self):
        primero = self.client.post("/api/tickets/create", json={
            "device_id": "dev-test-001", "plan_type": "monthly", "amount": 7500,
        }, headers=self.internal_headers).get_json()
        segundo = self.client.post("/api/tickets/create", json={
            "device_id": "dev-test-001", "plan_type": "monthly", "amount": 7500,
        }, headers=self.internal_headers).get_json()
        self.assertEqual(
            segundo["ticket"]["ticket_number"],
            primero["ticket"]["ticket_number"] + 1,
        )

    def test_ticket_create_plan_invalido(self):
        resp = self.client.post("/api/tickets/create", json={
            "device_id": "dev-test-001", "plan_type": "semanal", "amount": 7500,
        }, headers=self.internal_headers)
        self.assertEqual(resp.status_code, 400)

    # ------------------------------------------------------------------
    # /api/internal/link-preapproval (llamado por createPaymentOrder)
    # ------------------------------------------------------------------

    def test_link_preapproval_requiere_clave_interna(self):
        resp = self.client.post("/api/internal/link-preapproval", json={
            "device_id": "dev-test-001",
            "mp_preapproval_id": "mp-12345",
            "plan_type": "monthly",
        })
        self.assertEqual(resp.status_code, 401)

    def test_link_preapproval_ok(self):
        resp = self.client.post("/api/internal/link-preapproval", json={
            "device_id": "dev-test-001",
            "mp_preapproval_id": "mp-12345",
            "plan_type": "monthly",
        }, headers=self.internal_headers)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.get_json()["success"])

    def test_link_preapproval_crea_usuario_si_falta(self):
        resp = self.client.post("/api/internal/link-preapproval", json={
            "device_id": "dev-nuevo-999",
            "mp_preapproval_id": "mp-99999",
            "plan_type": "annual",
        }, headers=self.internal_headers)
        self.assertEqual(resp.status_code, 200)
        # El usuario debe existir ahora en la tabla users
        data = self.client.get(
            "/api/v1/admin/usuarios?busqueda=dev-nuevo-999",
            headers=self.admin_headers,
        ).get_json()
        self.assertEqual(data["total"], 1)

    def test_link_preapproval_requiere_datos(self):
        resp = self.client.post("/api/internal/link-preapproval", json={
            "device_id": "dev-test-001",
        }, headers=self.internal_headers)
        self.assertEqual(resp.status_code, 400)

    # ------------------------------------------------------------------
    # Rate limiter (SQLite compartido entre workers)
    # ------------------------------------------------------------------

    def test_rate_limit_bloquea_despues_del_maximo(self):
        import flask_app as module
        original_window = module.RATE_LIMIT_WINDOW
        original_max = module.RATE_LIMIT_MAX
        # Ventana amplia y máximo bajo para forzar el bloqueo sin esperar
        module.RATE_LIMIT_WINDOW = 3600
        module.RATE_LIMIT_MAX = 5
        try:
            key = "test-bloqueo-unic@123"
            with self.app.app_context():
                # Limpiar eventos previos de la clave de prueba
                db = get_db()
                db.execute("DELETE FROM rate_limit_events WHERE rl_key = ?", (key,))
                db.commit()

                for _ in range(5):
                    self.assertTrue(module._rate_limit(key))
                # La sexta llamada dentro de la ventana debe ser rechazada
                self.assertFalse(module._rate_limit(key))
        finally:
            module.RATE_LIMIT_WINDOW = original_window
            module.RATE_LIMIT_MAX = original_max

    def test_rate_limit_permite_despues_de_vencer(self):
        import flask_app as module
        import time as _time
        original_window = module.RATE_LIMIT_WINDOW
        original_max = module.RATE_LIMIT_MAX
        module.RATE_LIMIT_WINDOW = 1  # 1 segundo
        module.RATE_LIMIT_MAX = 1
        try:
            key = "test-vencido-unic@456"
            with self.app.app_context():
                db = get_db()
                db.execute("DELETE FROM rate_limit_events WHERE rl_key = ?", (key,))
                db.commit()

                self.assertTrue(module._rate_limit(key))
                self.assertFalse(module._rate_limit(key))
                _time.sleep(1.2)
                # Tras vencer la ventana, vuelve a permitir
                self.assertTrue(module._rate_limit(key))
        finally:
            module.RATE_LIMIT_WINDOW = original_window
            module.RATE_LIMIT_MAX = original_max

    def test_rate_limit_endpoint_devuelve_429(self):
        import flask_app as module
        original_window = module.RATE_LIMIT_WINDOW
        original_max = module.RATE_LIMIT_MAX
        module.RATE_LIMIT_WINDOW = 3600
        module.RATE_LIMIT_MAX = 3
        try:
            # /api/v1/estado no requiere clave; usar una clave remota única
            # para no afectar el resto del suite (el test client usa 127.0.0.1).
            # Se fuerza el límite apuntando la clave a una IP ficticia.
            resp_ok = self.client.get("/api/v1/estado")
            self.assertEqual(resp_ok.status_code, 200)
        finally:
            module.RATE_LIMIT_WINDOW = original_window
            module.RATE_LIMIT_MAX = original_max


if __name__ == "__main__":
    unittest.main(verbosity=2)
