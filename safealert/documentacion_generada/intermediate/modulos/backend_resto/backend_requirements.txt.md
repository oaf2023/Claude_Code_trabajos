# Archivo: backend/requirements.txt

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| backend/requirements.txt | 4 | Python (pip) | 86 | Manifest de dependencias | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Manifiesto `pip` del backend Flask. Declara las dependencias mínimas para ejecutar la aplicación en los hosts de despliegue (PythonAnywhere vía `wsgi.py` y Cloud Run vía `gunicorn flask_app:flask_app`). Todas las dependencias declaradas tienen uso real confirmado en `flask_app.py` o `wsgi.py`.

## Clasificación y estado

- Etiqueta: FUNCIONALIDAD EXISTENTE.
- Justificación: cada paquete declarado se importa efectivamente en el código del backend (ver sección siguiente, confirmado por grep). La ausencia de otras dependencias (driver MySQL, pytest, gunicorn) da lugar a observaciones técnicas relevantes, pero no invalida el archivo para su propósito de despliegue.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `flask>=3.0,<4.0` | Externa | `flask_app.py` (app, enrutado `@flask_app.route`) | Sí |
| `flask-cors>=5.0,<6.0` | Externa | `flask_app.py` línea 116 (`CORS(flask_app, origins=[...])`) | Sí |
| `firebase-admin>=6.0,<7.0` | Externa | `flask_app.py` (verificación de tokens Firebase Auth, p. ej. `firebase_auth.verify_id_token`; mockeada en `test_admin_endpoints.py` línea 43) | Sí |
| `python-dotenv>=1.0,<2.0` | Externa | `wsgi.py` líneas 56–57 (`load_dotenv`) | Sí |

## Componentes que dependen de este archivo

- Consumido por los entornos de despliegue: PythonAnywhere (importa el backend vía `wsgi.py`) y Cloud Run (`cloud-run/Dockerfile`, que instala dependencias del backend).
- Ningún código del repositorio importa el archivo directamente; es un artefacto de instalación.

## Variables globales y constantes

No aplica: el archivo no define variables; solo contiene cuatro líneas de requisitos con rangos de versión.

## Estructura (funciones / clases / tipos)

No aplica: no hay lógica ejecutable.

## Análisis línea por línea

**Bloque de líneas 1–4 (requisitos completos):**

```text
flask>=3.0,<4.0
flask-cors>=5.0,<6.0
firebase-admin>=6.0,<7.0
python-dotenv>=1.0,<2.0
```

**Explicación de las líneas 1–4:**

- **Línea 1** (`flask>=3.0,<4.0`): framework web; rango acotado a Flask 3.x (excluye 4.0). Uso confirmado en `flask_app.py` (creación de app, decoradores de ruta).
- **Línea 2** (`flask-cors>=5.0,<6.0`): extensión CORS; usada en `flask_app.py` línea 116 con lista de orígenes. Necesaria porque la API es consumida por clientes web (PWA/dashboard admin).
- **Línea 3** (`firebase-admin>=6.0,<7.0`): SDK administrativo de Firebase; se usa para verificar tokens Bearer de Firebase Auth en los endpoints de usuario (los tests la importan de forma condicional, línea 42 de `test_admin_endpoints.py`: `if _flask_app_module.firebase_auth is not None`).
- **Línea 4** (`python-dotenv>=1.0,<2.0`): carga del archivo `.env`; usada en `wsgi.py` líneas 55–59.

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] **No hay dependencia de MySQL.** Aunque la descripción general del proyecto lo presenta como "backend Flask + MySQL", el código real (`wsgi.py`, migraciones `backend/sql/*.sql` y `flask_app.py`) trabaja con **SQLite** (`safealert.db`): los `.sql` declaran "Base de datos: SQLite (safealert.db)" y `wsgi.py` fija rutas `.db`. No se declara `mysqlclient`/`pymysql`/`SQLAlchemy`. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] No se declara `pytest`, aunque la evidencia local (`backend/__pycache__/test_admin_endpoints.cpython-313-pytest-9.1.1.pyc`) indica que el suite se ejecutó con pytest 9.1.1 (además del `unittest` indicado en el docstring del test). La suite es compatible con ambos lanzadores.
- [OBSERVACIÓN TÉCNICA] No se declara `gunicorn` aunque `cloud-run/Dockerfile` lo invoca: en ese despliegue la dependencia se instala probablemente en la propia imagen Docker, no vía este archivo.
- [NOTA] Rangos de versión amplios sin bloqueo de versiones exactas ni hashes: reproducible en mayor/menor, no bit a bit.

## Seguridad

- [INFORMATIVO] No hay secretos ni credenciales en el archivo.
- [BAJO] Rangos de versión sin fijar (solo límites mayor/menor) permiten que `pip` resuelva versiones distintas en cada instalación; sin un lock con hashes, la cadena de suministro depende del índice de paquetes. [RECOMENDACIÓN] Generar un lock (`pip freeze`/`uv lock`/`pip-tools`) para despliegues reproducibles.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Si el proyecto migrara a MySQL (como sugiere su descripción general), faltarían las dependencias necesarias (conector y posiblemente ORM). [RECOMENDACIÓN] Confirmar si el objetivo es MySQL en producción; de ser así, añadir el driver correspondiente o documentar que el backend actual es SQLite.
- [RECOMENDACIÓN] Fijar versiones exactas o usar lockfile para despliegues estables y auditables.
