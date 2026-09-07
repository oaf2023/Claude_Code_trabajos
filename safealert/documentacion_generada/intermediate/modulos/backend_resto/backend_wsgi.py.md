# Archivo: backend/wsgi.py

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| backend/wsgi.py | 65 | Python 3.10 (entrada WSGI Flask) | 2625 | Configuración de despliegue / punto de entrada WSGI | FUNCIONALIDAD EXISTENTE | Altamente probable |

[NIVEL DE CERTEZA: Confirmado por código] respecto del contenido y la función que declara; el uso efectivo como config WSGI de PythonAnywhere es externo al repositorio.

## Objetivo

`wsgi.py` es el punto de entrada WSGI del backend Flask "unificado" cuando se despliega en **PythonAnywhere** (el encabezado del archivo y los comentarios lo indican: "Web tab -> WSGI configuration file"). Su responsabilidad es preparar el entorno antes de importar la aplicación Flask:

1. Fijar en `sys.path` la ruta base del proyecto (`project_home`).
2. Configurar la zona horaria del proceso.
3. Publicar en `os.environ` las rutas operativas no sensibles (bases SQLite, almacenamiento de audio) que consumirá `flask_app.py`.
4. Cargar los secretos desde el archivo `.env` externo con `python-dotenv` (sin valores placeholder).
5. Importar y exponer la instancia `application = flask_app` (variable estándar que el servidor WSGI de PythonAnywhere invoca).

[NOTA] El archivo evita deliberadamente definir secretos con valores de relleno para que el `.env` real no sea pisado.

## Clasificación y estado

- Etiqueta: FUNCIONALIDAD EXISTENTE.
- Justificación: script de arranque íntegro y coherente con el backend real: importa `flask_app.flask_app` (existente en `backend/flask_app.py`, línea 113: `flask_app = create_app()`), y fija variables (`SAFEALERT_DB_PATH`, `SAFEALERT_TEL_DB_PATH`, `AUDIO_STORAGE_DIR`) que `flask_app.py` efectivamente consume vía `os.environ` (confirmado por grep en `flask_app.py` líneas 72–89). El despliegue PythonAnywhere es externo al repositorio, por lo que el arranque efectivo no se puede observar aquí.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `os` | Estándar | Líneas 32, 40–45 (fijar variables de entorno); 57 (unir rutas) | Sí |
| `sys` | Estándar | Líneas 25–26 (insertar `project_home` en `sys.path`) | Sí |
| `time` | Estándar | Líneas 33–34 (`tzset`) | Sí |
| `dotenv.load_dotenv` | Externa (python-dotenv) | Líneas 56–57 (cargar `.env`) | Sí (declarada en `requirements.txt`) |
| `flask_app.flask_app` | Interna (`backend/flask_app.py`) | Línea 65 (exponer como `application`) | Sí |

## Componentes que dependen de este archivo

- No se encontraron importaciones locales de `wsgi` en el repositorio (grep sobre `*.py`: solo se referencia a sí mismo y al import de `flask_app`).
- El despliegue en la nube usa **otro** punto de entrada: `cloud-run/Dockerfile` línea 15 ejecuta `gunicorn --bind :8080 flask_app:flask_app` (no `wsgi.py`). Por tanto `wsgi.py` es exclusivo del hosting PythonAnywhere.
- Existe `backend/__pycache__/wsgi.cpython-313.pyc`, evidencia de que el módulo fue importado/ejecutado localmente con CPython 3.13.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `project_home` | `/home/oaf/agrupacion_api` | str (constante) | Ruta base del backend en PythonAnywhere; se inserta en `sys.path` | Líneas 23–26, 40, 57 |
| `SAFEALERT_DB_PATH` | `/home/oaf/agrupacion_api/usuarios/safealert.db` | str (env) | Ruta de la base SQLite principal de usuarios | Línea 42; consumida por `flask_app.py` |
| `SAFEALERT_TEL_DB_PATH` | `/home/oaf/agrupacion_api/usuarios/safealert_tel.db` | str (env) | Ruta de la base SQLite de contactos telefónicos | Línea 43; consumida por `flask_app.py` |
| `AUDIO_STORAGE_DIR` | `/home/oaf/agrupacion_api/audio` | str (env) | Directorio de almacenamiento de grabaciones de audio | Línea 44; consumida por `flask_app.py` (guardado de uploads) |
| `REMATAS_DB_PATH` | `/home/oaf/rematas/db/rematas.db` | str (env) | Ruta de la base de un proyecto distinto ("rematas") | Línea 45; sin referencias en el código SafeAlert analizado |
| `AGRUPACION_API_PATH` | `/home/oaf/agrupacion_api` | str (env) | Alias de entorno de `project_home` | Línea 40 |
| `TZ` | `America/Argentina/Buenos_Aires` | str (env) | Zona horaria del proceso | Línea 32 |
| `application` | objeto `flask_app` de `flask_app.py` | Flask app | Instancia expuesta al servidor WSGI | Línea 65 |

Valores mágicos: las rutas absolutas `/home/oaf/...` codifican el layout del servidor PythonAnywhere de la cuenta `oaf`; no son secretos pero revelan estructura interna del despliegue.

## Estructura (funciones / clases / tipos)

Script de configuración **lineal**, sin funciones, clases ni tipos definidos. No exporta símbolos propios salvo el alias `application` (línea 65).

## Análisis línea por línea

**Bloque de líneas 1–13 (docstring de cabecera):**

```py
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
```

**Explicación de las líneas 1–13:**

Docstring que identifica el archivo (autor, fecha, versión 3.1.0) y su propósito. Aporta información técnica relevante: (a) la ubicación del `.env` real (`/home/oaf/agrupacion_api/.env`), (b) la intención de no usar secretos placeholder, y (c) el mecanismo de despliegue ("WSGI configuration file" de PythonAnywhere).

- **Línea 5**: indica que ninguna clave se define con valores de relleno en este archivo.
- **Línea 6**: la fuente de secretos es el `.env` externo al repositorio.

**Bloque de líneas 15–26 (imports y ruta base):**

```py
import os
import sys
import time

# ---------------------------------------------------------------------------
# Ruta base del proyecto
# ---------------------------------------------------------------------------

project_home = "/home/oaf/agrupacion_api"

if project_home not in sys.path:
    sys.path.insert(0, project_home)
```

**Explicación de las líneas 15–26:**

- **Línea 15** (`import os`): acceso a variables de entorno.
- **Línea 16** (`import sys`): manipulación de `sys.path`.
- **Línea 17** (`import time`): necesario para `tzset()` en línea 34.
- **Línea 23** (`project_home = "/home/oaf/agrupacion_api"`): constante con la ruta base del proyecto en el servidor. [OBSERVACIÓN TÉCNICA] Ruta Linux fija; si el repo se ejecuta en otro host las rutas deben adaptarse (el backend local de Windows no puede ejecutar este archivo tal cual).
- **Líneas 25–26**: insertan `project_home` al inicio de `sys.path` si aún no está, para que `from flask_app import ...` (línea 65) resuelva correctamente.

**Bloque de líneas 28–45 (zona horaria y variables operativas):**

```py
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
```

**Explicación de las líneas 28–45:**

- **Línea 32**: fija `TZ=America/Argentina/Buenos_Aires` en el entorno del proceso.
- **Líneas 33–34**: `time.tzset()` reaplica la zona horaria a las funciones de tiempo del proceso (solo disponible en Unix; el guard `hasattr` lo hace seguro en plataformas sin `tzset`).
- **Línea 40**: publica `AGRUPACION_API_PATH` (alias de `project_home`).
- **Líneas 42–45**: publican las rutas operativas: `SAFEALERT_DB_PATH` (base SQLite principal), `SAFEALERT_TEL_DB_PATH` (base de contactos), `AUDIO_STORAGE_DIR` (audio) y `REMATAS_DB_PATH`. [OBSERVACIÓN TÉCNICA] `REMATAS_DB_PATH` apunta a un proyecto ajeno (`/home/oaf/rematas/...`); en el código SafeAlert analizado no se encontraron referencias que lo consuman: [POTENCIALMENTE NO UTILIZADO] para este backend.

**Bloque de líneas 47–59 (carga de secretos con dotenv):**

```py
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
```

**Explicación de las líneas 47–59:**

- **Líneas 49–52** (comentario con valor técnico): enumeran los secretos que NO deben definirse aquí (`SAFEALERT_INTERNAL_KEY`, `SAFEALERT_ADMIN_API_KEY`, `AUDIO_ALERT_API_KEY`, `MP_WEBHOOK_SECRET`, ...) y explican el motivo: un valor de relleno definiría la variable antes de cargar `.env` y, al usar `override=False`, impediría que el valor real la reemplace.
- **Línea 55–59**: `try/except ImportError` en torno a `from dotenv import load_dotenv` y la llamada `load_dotenv(os.path.join(project_home, ".env"), override=False)`. Con `override=False`, dotenv no sobreescribe variables ya presentes en `os.environ` (p. ej. las rutas fijadas en las líneas 40–45), lo que es coherente con el diseño comentado. [RIESGO] Si `python-dotenv` no está instalado, el `ImportError` se traga silenciosamente y el proceso arranca sin secretos (sin log ni fallo temprano), dejando constantes de clave vacías en `flask_app.py`.

**Bloque de líneas 61–65 (importación de la aplicación Flask):**

```py
# ---------------------------------------------------------------------------
# Entrada Flask WSGI (backend unificado v3.1 con rutas /api/v1/admin/*)
# ---------------------------------------------------------------------------

from flask_app import flask_app as application
```

**Explicación de las líneas 61–65:**

- **Líneas 62–63** (comentario): describe el artefacto importado como "backend unificado v3.1 con rutas /api/v1/admin/*", coherente con los endpoints administrativos confirmados en `flask_app.py` (líneas 1261, 1323, 1414, 1524, 1540, 1577).
- **Línea 65** (`from flask_app import flask_app as application`): importa el módulo interno `flask_app` y renombra su objeto de aplicación a `application`, el nombre convencional que el servidor WSGI (PythonAnywhere) busca para servir la app. En este momento se ejecuta el cuerpo del módulo `flask_app` (incluida la inicialización de tablas con `CREATE TABLE IF NOT EXISTS`).

## Fichas de funciones y métodos

No aplica: el archivo no define funciones, clases ni métodos; es un script de arranque secuencial.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Rutas absolutas Linux (`/home/oaf/...`) hardcodeadas en las líneas 23, 42–45: el archivo no es portable fuera de PythonAnywhere ni ejecutable en el checkout local de Windows sin adaptación.
- [OBSERVACIÓN TÉCNICA] `REMATAS_DB_PATH` (línea 45) corresponde a un proyecto distinto ("rematas") dentro del mismo proceso: [POTENCIALMENTE NO UTILIZADO] en SafeAlert. Refuerza la idea de un "backend unificado" que agrupa varias aplicaciones en PythonAnywhere.
- [OBSERVACIÓN TÉCNICA] `load_dotenv(..., override=False)` combinado con la pre-fijación de rutas (líneas 40–45) implica que el `.env` nunca puede modificar `SAFEALERT_DB_PATH`/`SAFEALERT_TEL_DB_PATH`/`AUDIO_STORAGE_DIR`: las rutas efectivas quedan fijadas por este archivo. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] El `except ImportError: pass` (líneas 58–59) silencia la ausencia de `python-dotenv`, sin log: un despliegue sin esa dependencia funcionaría pero con las claves vacías.
- [NOTA] La versión declarada (3.1.0, fecha 2026-08-01) sugiere evolución desde un backend anterior; los comentarios mencionan rutas `/api/v1/admin/*` hoy presentes en `flask_app.py`.
- [NIVEL DE CERTEZA: Altamente probable] El archivo se pega en la configuración WSGI de PythonAnywhere (según su propio encabezado) y no se referencia desde ningún otro punto del repositorio.

## Seguridad

- [INFORMATIVO] No se definen secretos con placeholders en el código; se delega al `.env` externo (buena práctica, refuerza que un valor de relleno no pise al real).
- [INFORMATIVO] No se imprimen secretos ni claves a logs (no hay llamadas `print`/`logger` sobre valores de entorno).
- [BAJO] Los paths `/home/oaf/...` y el nombre de usuario `oaf` revelan la estructura interna del servidor de despliegue. Impacto limitado (no son credenciales), pero reducen la opacidad del entorno. [RECOMENDACIÓN] Migrar a variables de entorno provistas por la plataforma de hosting en lugar de rutas embebidas.
- [MEDIO] Ausencia de *fail-fast* ante un `ImportError` de `python-dotenv` (líneas 58–59): el proceso puede arrancar sin las claves de API cargadas (constantes vacías en `flask_app.py`), con el riesgo de endpoints autenticados funcionando de forma inesperada o denegando todo. [RECOMENDACIÓN] Registrar un error y abortar si el `.env` no puede cargarse.
- [INFORMATIVO] El `.env` real vive fuera del repositorio (`/home/oaf/agrupacion_api/.env`). En el checkout local existe `backend/.env`, pero está excluido por `.gitignore` (reglas `.env` y `.env*.local`), por lo que no debería estar versionado. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Divergencia de entorno: los valores de `wsgi.py` (PythonAnywhere, rutas `/home/oaf`) no aplican al despliegue Cloud Run del repositorio, que arranca con `gunicorn flask_app:flask_app`. [RECOMENDACIÓN] Centralizar rutas y secretos en variables de la plataforma y que `wsgi.py` solo lea de `os.environ`, evitando rutas embebidas.
- [RIESGO] Arranque silencioso sin secretos si falla dotenv. [RECOMENDACIÓN] Convertir el `except ImportError` en un log de error explícito con salida del proceso (fail-fast).
- [RIESGO] Un único proceso WSGI sirviendo múltiples proyectos (`rematas` incluido) aumenta la superficie de acoplamiento. [RECOMENDACIÓN] Separar aplicaciones por proceso o por host.
- [RECOMENDACIÓN] Verificar que el archivo `.env` local no esté versionado (revisar `git status`) para evitar fugas de secretos.
