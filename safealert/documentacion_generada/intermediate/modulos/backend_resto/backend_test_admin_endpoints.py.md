# Archivo: backend/test_admin_endpoints.py

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| backend/test_admin_endpoints.py | 439 | Python 3.13 (unittest / Flask test client) | 18427 | Suite de pruebas del backend | FUNCIONALIDAD EXISTENTE (con 2 casos parcialmente implementados) | Confirmado por código |

## Objetivo

Suite de pruebas del backend Flask que valida los endpoints **administrativos** del dashboard de posicionamientos (`/api/v1/admin/usuarios`, `/api/v1/admin/stats`, `/api/v1/admin/pagos/simular`) y la **protección de datos sensibles** (consentimientos), además de otros endpoints internos y del mecanismo de rate limiting. Usa el *test client* de Flask contra una base SQLite temporal y **mockea la verificación de tokens de Firebase** para no requerir credenciales reales.

## Clasificación y estado

- Etiqueta: FUNCIONALIDAD EXISTENTE, con dos métodos parcialmente implementados: `test_admin_stats_sin_datos` (líneas 240–248) y `test_rate_limit_endpoint_devuelve_429` (líneas 421–435), que no ejecutan completamente lo que su nombre declara (ver observaciones).
- Justificación: la suite está conectada con el código real: importa `flask_app` (objeto y `get_db`), manipula `RATE_LIMIT_WINDOW`/`RATE_LIMIT_MAX`/`_rate_limit` del módulo, y ejerce endpoints que existen en `flask_app.py` (confirmado por grep: rutas en líneas 652, 745, 784, 981, 1100, 1261, 1323, 1414, 1499, 1524, 1577). Existe `__pycache__/test_admin_endpoints.cpython-313-pytest-9.1.1.pyc`, evidencia de ejecución con pytest 9.1.1 además de `unittest`.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `os` | Estándar | Líneas 15, 23–27, 29 (entorno de prueba y `sys.path`) | Sí |
| `sys` | Estándar | Línea 29 (insertar directorio del backend en `sys.path`) | Sí |
| `tempfile` | Estándar | Línea 22 (`mkdtemp` para DB temporal) | Sí |
| `unittest` | Estándar | Línea 17 (clase de tests, asserts, `unittest.main`) | Sí |
| `datetime`, `timedelta` | Estándar | Línea 19 | No se usa directamente en asserts; declarada pero sin uso efectivo en el archivo [POTENCIALMENTE NO UTILIZADO] |
| `flask_app.flask_app`, `get_db` | Interna | Línea 31 (app y conexión de BD) | Sí |
| `flask_app.firebase_auth` (mock) | Interna | Líneas 40–43 (reemplazo de `verify_id_token`) | Sí |
| `time` (import local) | Estándar | Líneas 400, 414 (sleep en test de expiración de rate limit) | Sí |

## Componentes que dependen de este archivo

- No hay código de producción que lo importe. Depende de `backend/flask_app.py` (módulo bajo prueba). Se ejecuta por línea de comandos: `python -m unittest test_admin_endpoints -v` (docstring, línea 11) o `pytest`.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `_TMP_DIR` | directorio temporal `tempfile.mkdtemp(prefix="safealert_test_")` | str | Carpeta temporal aislada para las DB de prueba | Línea 22 |
| `SAFEALERT_DB_PATH` (env) | `_TMP_DIR/test.db` | str | Base SQLite principal de prueba | Línea 23 |
| `SAFEALERT_TEL_DB_PATH` (env) | `_TMP_DIR/test_tel.db` | str | Base SQLite de teléfonos de prueba | Línea 24 |
| `SAFEALERT_ADMIN_API_KEY` (env) | `clave_admin_test_123` (valor ficticio de prueba, no real) | str | Clave admin usada por el código bajo prueba | Línea 25 |
| `SAFEALERT_INTERNAL_KEY` (env) | `clave_interna_test_456` (ficticia) | str | Clave interna usada por el código bajo prueba | Línea 26 |
| `AUDIO_ALERT_API_KEY` (env) | `clave_audio_test_789` (ficticia) | str | Clave de audio usada por el código bajo prueba | Línea 27 |
| Cabeceras de prueba | `X-Admin-Key`, `Authorization: Bearer`, `X-Internal-Key` | dict | Cabeceras de autenticación de los tests | Líneas 54–56 |

[NOTA] Las claves de prueba son **valores ficticios** creados por la suite (no secretos reales); su presencia en el archivo es segura porque solo se inyectan en el entorno del proceso de test.

## Estructura (funciones / clases / tipos)

| Símbolo | Tipo | Líneas |
| --- | --- | --- |
| `_fake_verify_id_token(token)` | función (mock) | 34–36 |
| `AdminEndpointsTestCase` | clase `unittest.TestCase` | 46–435 |
| `setUpClass(cls)` | método de clase | 49–56 |
| `setUp(self)` | método | 58–74 |
| 30 métodos `test_*` | métodos de test | 80–435 |
| `unittest.main(verbosity=2)` | guard de ejecución | 438–439 |

## Análisis línea por línea

**Bloque de líneas 1–31 (docstring, imports y entorno de prueba):**

```py
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
```

**Explicación de las líneas 1–31:**

- **Línea 10** (docstring): fija el objetivo de la suite (endpoints admin + protección de consentimientos) y el lanzador `unittest`.
- **Línea 19** (`from datetime import datetime, timedelta`): [POTENCIALMENTE NO UTILIZADO] no se encontró uso de `datetime`/`timedelta` en el resto del archivo.
- **Línea 22**: crea un directorio temporal único con prefijo `safealert_test_`.
- **Líneas 23–24**: redirigen las bases SQLite a archivos temporales para no tocar las reales.
- **Líneas 25–27**: inyectan claves **ficticias** de prueba en el entorno antes de importar la app; de este modo `flask_app.py` las lee en su inicialización (constantes no vacías). [NOTA] No son secretos reales.
- **Línea 29**: añade el directorio del backend a `sys.path` para poder importar `flask_app`.
- **Línea 31**: importa la app Flask y `get_db` (conector de BD bajo `app_context`).

**Bloque de líneas 34–43 (mock de Firebase):**

```py
def _fake_verify_id_token(token):
    """Mock de verify_id_token de Firebase: acepta cualquier token Bearer."""
    return {"uid": "firebase-uid-test-123", "token": token}


# Mock de verificación de Firebase para los tests (sin credenciales reales)
import flask_app as _flask_app_module  # noqa: E402

if _flask_app_module.firebase_auth is not None:
    _flask_app_module.firebase_auth.verify_id_token = _fake_verify_id_token
```

**Explicación de las líneas 34–43:**

- **Líneas 34–36** (`_fake_verify_id_token`): mock que devuelve un dict con UID fijo (`firebase-uid-test-123`) y el token recibido, sin contactar Firebase.
- **Línea 40**: reimporta el módulo para mutar su atributo `firebase_auth`.
- **Líneas 42–43**: si `firebase_auth` está inicializado, reemplaza `verify_id_token` por el mock. [OBSERVACIÓN TÉCNICA] El mock acepta **cualquier** token Bearer; es un atajo válido para tests, pero significa que la suite no valida el comportamiento real de rechazo de tokens inválidos/expirados de Firebase.

**Bloque de líneas 46–74 (clase, setUpClass y setUp):**

```py
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
```

**Explicación de las líneas 46–74:**

- **Línea 51** (`cls.app = flask_app`): usa la app del módulo (ya creada e inicializada con las claves de test).
- **Línea 52**: activa `TESTING` (propaga excepciones y desactiva el manejo de errores en las respuestas).
- **Línea 53**: crea el *test client*.
- **Líneas 54–56**: cabeceras de autenticación: `X-Admin-Key` (clave ficticia), `Authorization: Bearer` (token aceptado por el mock) y `X-Internal-Key` (clave interna ficticia).
- **Líneas 60–66** (`setUp`): registra al usuario `dev-test-001` con nombre, teléfono, MAC `AA:BB:CC:DD:EE:FF` y `device_unique_id`.
- **Líneas 67–74**: registra una ubicación GPS en Buenos Aires (-34.603722, -58.381592) con permiso GRANTED para ese usuario. Esto crea el estado base que asumen casi todos los tests (el admin/usuarios espera al menos 1 usuario con su última ubicación).

### Tests de `/api/v1/admin/usuarios` (líneas 80–138)

**Bloque de líneas 76–138:**

```py
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
```

**Explicación de las líneas 76–138:**

- **Línea 81** (`test_admin_usuarios_requiere_clave`): verifica que sin `X-Admin-Key` el endpoint responde 401 (control de acceso por clave).
- **Líneas 84–95** (`test_admin_usuarios_con_clave`): con clave responde 200 y estructura esperada: campo `usuarios`, `total` mayor o igual a 1, y el primer usuario con `device_id`, `name`, `ultima_latitud` (comparación con tolerancia), `ultimo_origen` y `total_ubicaciones` correctos. Cubre la unión del listado con la última ubicación.
- **Líneas 97–102** (`test_admin_usuarios_busqueda`): el filtro `busqueda=Prueba` debe localizar exactamente al usuario creado en `setUp` (`total == 1`).
- **Líneas 104–115** (`test_admin_usuarios_limite`): registra 3 usuarios más (`dev-test-000/001/002`) y comprueba que `limite=2` devuelve `total == 2`. [OBSERVACIÓN TÉCNICA] Se registra `dev-test-001` una segunda vez (ya existe de `setUp`); el comportamiento depende de cómo maneje el endpoint de registro los duplicados (no cubierto aquí), y el test asume que el conteo paginado refleja el límite.
- **Líneas 117–123** (`test_admin_usuarios_por_mac`): filtro por MAC con formato `AA:BB:CC:DD:EE:FF`.
- **Líneas 125–131** (`test_admin_usuarios_por_mac_sin_formato`): el mismo filtro con MAC **sin separadores** (`aabbccddeeff`) debe normalizarse y encontrar al usuario.
- **Líneas 133–138** (`test_admin_usuarios_por_mac_sin_resultados`): MAC inexistente devuelve `total == 0` (200, no error).

### Tests de `/api/v1/admin/pagos/simular` (líneas 144–215)

**Bloque de líneas 140–215:**

```py
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
```

**Explicación de las líneas 140–215:**

- **Líneas 144–149** (`test_pago_simulado_requiere_clave`): sin clave admin, 401.
- **Líneas 151–164** (`test_pago_simulado_por_mac`): pago simulado mensual por MAC: 200, `success`, suscripción `active`, plan `monthly`, ticket generado con importe **7500** (precio mensual fijo asumido por el backend) y `ticket_number` positivo.
- **Líneas 166–175** (`test_pago_simulado_anual_por_device_id`): plan anual por `device_id` con `dias=365`; importe del ticket **75000** (anual). Fija el mapeo mensual 7500 / anual 75000.
- **Líneas 177–191** (`test_pago_simulado_ticket_correlativo`): dos pagos seguidos del mismo usuario generan tickets **correlativos** (`n+1`). Verifica la secuencia de numeración de tickets.
- **Líneas 193–199** (`test_pago_simulado_mac_inexistente`): MAC inexistente responde 404.
- **Líneas 201–207** (`test_pago_simulado_plan_invalido`): plan `semanal` (no soportado) responde 400.
- **Líneas 209–215** (`test_pago_simulado_requiere_mac_o_device`): cuerpo sin `mac_address` ni `device_id` responde 400.

### Tests de `/api/v1/admin/stats` (líneas 221–248)

**Bloque de líneas 217–248:**

```py
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
```

**Explicación de las líneas 217–248:**

- **Líneas 221–223** (`test_admin_stats_requiere_clave`): sin clave, 401.
- **Líneas 225–238** (`test_admin_stats_con_clave`): con clave verifica KPIs: `total_usuarios` y `total_ubicaciones` >= 1 (dato sembrado en `setUp`), `usuarios_activos_24h == 1` (el usuario de setUp), `usuarios_activos_7d >= 1`, agregación por origen con presencia de GPS, estado de suscripción inicial `not_registered`, al menos un día en `ubicaciones_por_dia` y marca `generado_en`.
- **Líneas 240–248** (`test_admin_stats_sin_datos`): [OBSERVACIÓN TÉCNICA] A pesar del nombre y del comentario ("Usa otra app con DB limpia... DB compartida por setUpClass"), **no crea una app con base limpia**: consulta la misma app/DB ya poblada y solo comprueba que las claves de las agregaciones existan. El test no cumple lo que su nombre indica; es esencialmente una comprobación de esquema de respuesta (parcialmente implementado).

### Tests de protección de consentimientos y estado público (líneas 254–283)

**Bloque de líneas 250–283:**

```py
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
```

**Explicación de las líneas 250–283:**

- **Líneas 254–256** (`test_consentimientos_requiere_clave_admin`): leer el historial de consentimientos de un usuario **sin** clave admin responde 401: protege un dato sensible.
- **Líneas 258–272** (`test_consentimientos_con_clave`): registra un consentimiento (`UBICACION`/`OTORGADO`, política 1.0.0) vía `POST /api/v1/consentimientos` (autenticación Bearer, aceptada por el mock) y lo lee con clave admin; valida que el historial contenga el tipo registrado.
- **Líneas 278–283** (`test_estado_publico`): `/api/v1/estado` es accesible sin autenticación (200) y devuelve `status == "ok"` y `base_datos` (health check).

### Tests de `/api/tickets/create` (líneas 289–328)

**Bloque de líneas 285–328:**

```py
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
```

**Explicación de las líneas 285–328:**

- **Línea 287** (comentario): identifica al consumidor real: `PaymentService.createTicket` (capa de la app móvil).
- **Líneas 289–296** (`test_ticket_create_requiere_clave_interna`): sin `X-Internal-Key`, 401.
- **Líneas 298–310** (`test_ticket_create_ok`): con clave interna crea el ticket: 201, `success`, plan `monthly`, importe 7500, `ticket_number` positivo.
- **Líneas 312–322** (`test_ticket_create_correlativo`): dos tickets seguidos son correlativos (`n+1`).
- **Líneas 324–328** (`test_ticket_create_plan_invalido`): plan no soportado responde 400.

### Tests de `/api/internal/link-preapproval` (líneas 334–369)

**Bloque de líneas 330–369:**

```py
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
```

**Explicación de las líneas 330–369:**

- **Línea 332** (comentario): identifica al consumidor real: `createPaymentOrder` (lado de pago MercadoPago).
- **Líneas 334–340** (`test_link_preapproval_requiere_clave_interna`): sin clave interna, 401.
- **Líneas 342–349** (`test_link_preapproval_ok`): vincula una preaprobación de MercadoPago a un usuario existente: 200 y `success`.
- **Líneas 351–363** (`test_link_preapproval_crea_usuario_si_falta`): si el `device_id` no existe, el endpoint debe **crear el usuario** (efecto secundario verificado consultando `/api/v1/admin/usuarios?busqueda=dev-nuevo-999` y esperando `total == 1`). Cubre la creación implícita de usuario desde el backend de pagos.
- **Líneas 365–369** (`test_link_preapproval_requiere_datos`): cuerpo incompleto (solo `device_id`, sin `mp_preapproval_id` ni `plan_type`) responde 400.

### Tests de rate limiting (líneas 375–435)

**Bloque de líneas 371–435:**

```py
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
```

**Explicación de las líneas 371–435:**

- **Líneas 375–396** (`test_rate_limit_bloquea_despues_del_maximo`): prueba unitaria de `_rate_limit` del módulo. Ajusta ventana a 3600 s y máximo a 5, limpia la tabla `rate_limit_events` de la clave de prueba, y verifica que las 5 primeras llamadas se permiten (`True`) y la sexta se rechaza (`False`). Restaura los valores originales en `finally`.
- **Líneas 398–419** (`test_rate_limit_permite_despues_de_vencer`): con ventana de 1 s y máximo 1: la primera llamada se permite, la segunda se rechaza; tras `_time.sleep(1.2)` la ventana expira y vuelve a permitir. Verifica la expiración basada en marca de tiempo.
- **Líneas 421–435** (`test_rate_limit_endpoint_devuelve_429`): [OBSERVACIÓN TÉCNICA] A pesar del nombre, **no comprueba ningún 429**: solo hace una petición a `/api/v1/estado` y verifica que responde 200. El comentario explica la intención (forzar el límite con una clave remota a IP ficticia) pero esa lógica no se implementó: el test está **parcialmente implementado** (no valida la integración HTTP del rate limiter). [NIVEL DE CERTEZA: Confirmado por código]

**Bloque de líneas 438–439 (guard de ejecución):**

```py
if __name__ == "__main__":
    unittest.main(verbosity=2)
```

**Explicación de las líneas 438–439:**

- **Línea 438–439**: permite ejecutar la suite directamente (`python test_admin_endpoints.py`) con verbosidad 2 (salida detallada por test).

## Fichas de funciones y métodos

### `_fake_verify_id_token` (líneas 34–36)
- Firma: `def _fake_verify_id_token(token)`.
- Propósito técnico: mock de `firebase_admin.auth.verify_id_token`; propósito funcional: que la suite no dependa de credenciales Firebase reales.
- Parámetros: `token` (str, token Bearer recibido). Retorno: dict `{"uid": "firebase-uid-test-123", "token": token}`.
- Dependencias: ninguna. Se asigna a `_flask_app_module.firebase_auth.verify_id_token` (líneas 42–43). Efectos secundarios: acepta cualquier token (no valida expiración/firma).

### `AdminEndpointsTestCase.setUpClass` (líneas 49–56)
- Firma: `@classmethod def setUpClass(cls)`.
- Propósito: preparar app, test client y cabeceras comunes a toda la clase.
- Retorno: None. Excepciones: fallos de inicialización de Flask.
- Flujo: app del módulo, `TESTING=True`, `test_client()`, cabeceras `X-Admin-Key`/Bearer/`X-Internal-Key`.

### `AdminEndpointsTestCase.setUp` (líneas 58–74)
- Firma: `def setUp(self)`.
- Propósito: sembrar estado base por test (usuario `dev-test-001` + ubicación GPS).
- Flujo: `POST /api/users/register` (con cabecera Bearer) y `POST /api/v1/ubicaciones` (sin cabecera, dependiendo de la validación del endpoint). Efectos secundarios: filas en `users`/`ubicaciones_usuario` de la DB temporal.

### Métodos de test (30 en total)

| Método | Líneas | Endpoint(s) cubierto(s) | Verifica |
| --- | --- | --- | --- |
| test_admin_usuarios_requiere_clave | 80–82 | GET /api/v1/admin/usuarios | 401 sin X-Admin-Key |
| test_admin_usuarios_con_clave | 84–95 | GET /api/v1/admin/usuarios | 200, estructura, última ubicación y total_ubicaciones |
| test_admin_usuarios_busqueda | 97–102 | GET /api/v1/admin/usuarios?busqueda= | filtro por nombre |
| test_admin_usuarios_limite | 104–115 | GET /api/v1/admin/usuarios?limite= | paginación/limite |
| test_admin_usuarios_por_mac | 117–123 | GET /api/v1/admin/usuarios?mac= | filtro por MAC |
| test_admin_usuarios_por_mac_sin_formato | 125–131 | GET /api/v1/admin/usuarios?mac= | normalización de MAC sin separadores |
| test_admin_usuarios_por_mac_sin_resultados | 133–138 | GET /api/v1/admin/usuarios?mac= | MAC inexistente, total 0 |
| test_pago_simulado_requiere_clave | 144–149 | POST /api/v1/admin/pagos/simular | 401 sin clave |
| test_pago_simulado_por_mac | 151–164 | POST /api/v1/admin/pagos/simular | 200, suscripción activa, ticket 7500 mensual |
| test_pago_simulado_anual_por_device_id | 166–175 | POST /api/v1/admin/pagos/simular | ticket 75000 anual, suscripción activa |
| test_pago_simulado_ticket_correlativo | 177–191 | POST /api/v1/admin/pagos/simular | numeración correlativa de tickets |
| test_pago_simulado_mac_inexistente | 193–199 | POST /api/v1/admin/pagos/simular | 404 MAC no encontrada |
| test_pago_simulado_plan_invalido | 201–207 | POST /api/v1/admin/pagos/simular | 400 plan no soportado |
| test_pago_simulado_requiere_mac_o_device | 209–215 | POST /api/v1/admin/pagos/simular | 400 sin MAC ni device_id |
| test_admin_stats_requiere_clave | 221–223 | GET /api/v1/admin/stats | 401 sin clave |
| test_admin_stats_con_clave | 225–238 | GET /api/v1/admin/stats | KPIs, agregaciones, generado_en |
| test_admin_stats_sin_datos | 240–248 | GET /api/v1/admin/stats | solo presencia de claves (no usa DB limpia; parcial) |
| test_consentimientos_requiere_clave_admin | 254–256 | GET /api/v1/consentimientos/usuario/{id} | 401 sin clave admin |
| test_consentimientos_con_clave | 258–272 | POST /api/v1/consentimientos + GET /api/v1/consentimientos/usuario/{id} | alta y lectura con clave admin |
| test_estado_publico | 278–283 | GET /api/v1/estado | 200, status ok, base_datos |
| test_ticket_create_requiere_clave_interna | 289–296 | POST /api/tickets/create | 401 sin X-Internal-Key |
| test_ticket_create_ok | 298–310 | POST /api/tickets/create | 201, success, ticket mensual 7500 |
| test_ticket_create_correlativo | 312–322 | POST /api/tickets/create | tickets correlativos |
| test_ticket_create_plan_invalido | 324–328 | POST /api/tickets/create | 400 plan inválido |
| test_link_preapproval_requiere_clave_interna | 334–340 | POST /api/internal/link-preapproval | 401 sin clave interna |
| test_link_preapproval_ok | 342–349 | POST /api/internal/link-preapproval | 200, success |
| test_link_preapproval_crea_usuario_si_falta | 351–363 | POST /api/internal/link-preapproval + GET /api/v1/admin/usuarios | creación implícita de usuario |
| test_link_preapproval_requiere_datos | 365–369 | POST /api/internal/link-preapproval | 400 datos incompletos |
| test_rate_limit_bloquea_despues_del_maximo | 375–396 | unidad: `_rate_limit` (tabla rate_limit_events) | bloqueo tras el máximo |
| test_rate_limit_permite_despues_de_vencer | 398–419 | unidad: `_rate_limit` | rearme tras expirar la ventana |
| test_rate_limit_endpoint_devuelve_429 | 421–435 | GET /api/v1/estado (integración) | no verifica 429 (parcial) |

## Clases / interfaces / tipos

### `AdminEndpointsTestCase(unittest.TestCase)` (líneas 46–435)
- Responsabilidad: validar endpoints administrativos y de pago interno, protección de consentimientos, health check y rate limiter.
- Campos de clase: `app`, `client`, `admin_headers`, `auth_headers`, `internal_headers`.
- Ciclo de vida: `setUpClass` una vez por clase; `setUp` antes de cada test (siembra usuario+ubicación). Comparte una única DB SQLite temporal entre todos los tests de la clase.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `test_rate_limit_endpoint_devuelve_429` (líneas 421–435) no ejerce el caso 429 pese a su nombre: el comentario describe una intención (clave remota/IP ficticia) no implementada. Estado: PARCIALMENTE IMPLEMENTADA.
- [OBSERVACIÓN TÉCNICA] `test_admin_stats_sin_datos` (líneas 240–248) no usa una DB limpia (el propio comentario lo reconoce) y solo comprueba claves del JSON; su aporte real es estructural. Estado: PARCIALMENTE IMPLEMENTADA.
- [OBSERVACIÓN TÉCNICA] `from datetime import datetime, timedelta` (línea 19): sin uso efectivo en el archivo → [POTENCIALMENTE NO UTILIZADO].
- [OBSERVACIÓN TÉCNICA] El mock de Firebase acepta cualquier token (líneas 34–43): no hay tests de rechazo de tokens inválidos/expirados.
- [OBSERVACIÓN TÉCNICA] `test_admin_usuarios_limite` re-registra `dev-test-001` (ya creado en `setUp`); la suite asume el comportamiento del endpoint de registro ante duplicados sin cubrirlo explícitamente.
- [NOTA] Las claves de prueba son ficticias y locales (líneas 25–27); no son secretos reales. Sin embargo, si algún día se copiara el patrón con claves reales, quedarían expuestas en el repositorio.
- [NOTA] La suite no cubre: rechazo de tokens Firebase inválidos, autorización por roles (solo clave única), validación de coordenadas inválidas, ni el endpoint `/api/v1/admin/purga`.
- [NIVEL DE CERTEZA: Confirmado por código] El estado base de `setUp` usa coordenadas reales de Buenos Aires (datos de ejemplo, no sensibles).

## Seguridad

- [INFORMATIVO] No contiene secretos reales: las claves inyectadas (líneas 25–27) y cabeceras (líneas 54–56) son valores de prueba ficticios.
- [INFORMATIVO] Aislamiento correcto de datos: bases SQLite en directorio temporal (`mkdtemp`), evitando tocar datos reales.
- [INFORMATIVO] No imprime secretos a logs (no hay logs de valores en el archivo).
- [MEDIO] El mock de `verify_id_token` que acepta cualquier token (líneas 42–43) es solo para tests, pero reduce la cobertura de seguridad: no se prueba el flujo de rechazo de tokens inválidos (401 por token malo), que es un vector real de la app.
- [BAJO] Cobertura de seguridad parcial del área admin: se verifica que exista la clave, pero no la comparación de claves incorrectas más allá del 401 genérico (no hay tests de claves con formato inválido ni de fuerza bruta sobre `X-Admin-Key`).

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Tests con nombre que no verifica lo declarado (429) pueden dar falsa sensación de cobertura. [RECOMENDACIÓN] Completar el test HTTP de 429 (por ejemplo, con cabecera de IP remota configurable) o renombrarlo.
- [RIESGO] Dependencia del orden/estado compartido: la DB es común a toda la clase y `setUp` siembra datos; tests como `test_admin_stats_sin_datos` y `test_admin_usuarios_limite` dependen del estado acumulado. [RECOMENDACIÓN] Aislar cada test con DB limpia (p. ej. `setUpClass` por método o `fixtures` de pytest) para robustez.
- [RIESGO] Sin cobertura de autorización negativa detallada (tokens inválidos, claves vencidas, roles) en el área de mayor sensibilidad (admin y consentimientos). [RECOMENDACIÓN] Añadir casos de 401/403 con credenciales corruptas y tokens malformados.
- [RECOMENDACIÓN] Eliminar la importación no usada de `datetime`/`timedelta` (línea 19).
- [RECOMENDACIÓN] Verificar que la suite pase tanto con `unittest` como con `pytest` (el pycache evidencia ambos lanzadores) y añadirla a CI si no lo está.
