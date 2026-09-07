# Archivo: backend/.env.example

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| backend/.env.example | 35 | Variables de entorno (texto) | 1131 | Plantilla de configuración | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Plantilla de configuración del backend para PythonAnywhere. Documenta los **nombres** y el propósito de las variables de entorno que la aplicación lee al arrancar, agrupadas por dominio: base de datos, seguridad, MercadoPago, geolocalización IP, política de retención, proxy y debug. Sirve de base para crear el `.env` real del despliegue.

Los valores de las claves secretas aparecen **vacíos** en la plantilla (práctica correcta); en producción deben contener los valores reales, que aquí se reportan siempre como [SECRETO OCULTO].

## Clasificación y estado

- Etiqueta: FUNCIONALIDAD EXISTENTE.
- Justificación: las variables documentadas coinciden con las que lee el código real: `flask_app.py` consume `SAFEALERT_DB_PATH`, `SAFEALERT_TEL_DB_PATH`, `SAFEALERT_INTERNAL_KEY`, `MP_WEBHOOK_SECRET`, `AUDIO_ALERT_API_KEY`, `SAFEALERT_ADMIN_API_KEY`, `RETENCION_*_DIAS`, `PROXY_CONFIANZA`, `FLASK_DEBUG`, `IPREGISTRY_API_KEY` (confirmado por grep, líneas 72–89, 180, 247, 1566–1568, 1590). Los valores por defecto de retención de la plantilla (90/365/365/30) coinciden con los defaults de `flask_app.py` (líneas 86–89) y con el script de purga `002_retencion_purga.sql`.

## Dependencias e importaciones

No aplica (archivo de configuración, no código). La única relación es indirecta: `wsgi.py` línea 57 carga este archivo (copiado como `.env`) mediante `python-dotenv`.

## Componentes que dependen de este archivo

- `backend/wsgi.py` (líneas 55–59): carga `.env` desde `project_home` con `load_dotenv(..., override=False)`.
- `backend/flask_app.py`: lee las variables en el arranque del módulo (constantes y defaults, líneas 72–89, 180, 247, 1590).
- `backend/test_admin_endpoints.py` (líneas 22–27): **no** depende de `.env`; define sus propias variables de prueba con claves ficticias antes de importar `flask_app`.

## Variables globales y constantes

| Variable | Valor en ejemplo | Tipo | Finalidad |
| --- | --- | --- | --- |
| `SAFEALERT_DB_PATH` | `/home/oaf/agrupacion_api/usuarios/safealert.db` | ruta (no secreta) | Ruta de la base SQLite principal de usuarios/ubicaciones/consentimientos/accesos |
| `SAFEALERT_TEL_DB_PATH` | `/home/oaf/agrupacion_api/usuarios/safealert_tel.db` | ruta (no secreta) | Ruta de la base SQLite de contactos telefónicos |
| `SAFEALERT_INTERNAL_KEY` | vacío en ejemplo; [SECRETO OCULTO] en producción | secreto | Clave para endpoints internos de servidor a servidor (p. ej. `/api/tickets/create`, `/api/internal/link-preapproval`) |
| `SAFEALERT_ADMIN_API_KEY` | vacío en ejemplo; [SECRETO OCULTO] en producción | secreto | Clave de los endpoints administrativos (`X-Admin-Key`: admin/usuarios, stats, mapa, purga, etc.) |
| `AUDIO_ALERT_API_KEY` | vacío en ejemplo; [SECRETO OCULTO] en producción | secreto | Clave para el upload de grabaciones de audio de alertas (`/api/security/upload-recording` y rutas `/api/tel/*`) |
| `MP_WEBHOOK_SECRET` | vacío en ejemplo; [SECRETO OCULTO] en producción | secreto | Secreto de firma HMAC del webhook de MercadoPago (`/api/payments/webhook`) |
| `IPREGISTRY_API_KEY` | vacío en ejemplo; [SECRETO OCULTO] si se usa | secreto (opcional) | Clave del proveedor de geolocalización por IP (ipregistry) para enriquecer ubicaciones/accesos |
| `RETENCION_ACCESOS_DIAS` | `90` | entero | Días de retención de registros de `accesos_tecnicos` antes de purga |
| `RETENCION_UBICACIONES_DIAS` | `365` | entero | Días de retención de `ubicaciones_usuario` antes de purga |
| `RETENCION_CONSENTIMIENTOS_DIAS` | `365` | entero | Días de retención de `consentimientos_usuario` antes de purga |
| `RETENCION_LOGS_DIAS` | `30` | entero | Días de retención de logs de error (la tabla de logs no está implementada en las migraciones analizadas) |
| `PROXY_CONFIANZA` | `Cloudflare,PythonAnywhere` | lista separada por comas (no secreto) | Proxies de confianza para interpretar cabeceras de cliente real (p. ej. `X-Forwarded-For`) al registrar IPs |
| `FLASK_DEBUG` | `0` | entero | Modo debug de Flask (1 activa, 0 desactiva) |

## Estructura (funciones / clases / tipos)

No aplica.

## Análisis línea por línea

**Bloque de líneas 1–8 (cabecera):**

```text
# ============================================================================
# Archivo         : .env.example
# Descripción     : Variables de entorno para SafeAlert Backend (PythonAnywhere)
# Autor           : oafon
# Fecha           : 2026-07-30
# Versión         : 3.0.0
# Uso             : Copiar a .env y configurar valores
# ============================================================================
```

**Explicación de las líneas 1–8:**

- Comentarios de identificación (autor, fecha, versión 3.0.0) y la instrucción de uso: copiar a `.env` y completar los valores. [NOTA] La versión del ejemplo (3.0.0) es anterior a la de `wsgi.py` (3.1.0), indicando evolución del backend.

**Bloque de líneas 10–12 (base de datos):**

```text
# --- Base de datos ---
SAFEALERT_DB_PATH=/home/oaf/agrupacion_api/usuarios/safealert.db
SAFEALERT_TEL_DB_PATH=/home/oaf/agrupacion_api/usuarios/safealert_tel.db
```

**Explicación de las líneas 10–12:**

- **Líneas 11–12**: rutas de las dos bases SQLite del backend. No son credenciales, pero revelan el layout del servidor PythonAnywhere (cuenta `oaf`). [NOTA] En `wsgi.py` estas rutas se fijan también directamente en `os.environ` antes de `load_dotenv(override=False)`, por lo que el valor del `.env` no las modifica en ese despliegue.

**Bloque de líneas 14–17 (seguridad):**

```text
# --- Seguridad ---
SAFEALERT_INTERNAL_KEY=  # Cambiar por un valor seguro
SAFEALERT_ADMIN_API_KEY= # Clave para endpoints administrativos
AUDIO_ALERT_API_KEY=     # Clave para upload de audio
```

**Explicación de las líneas 14–17:**

- **Línea 15** (`SAFEALERT_INTERNAL_KEY=`): clave interna, valor vacío en la plantilla y comentario "Cambiar por un valor seguro". En producción: [SECRETO OCULTO].
- **Línea 16** (`SAFEALERT_ADMIN_API_KEY=`): clave administrativa (cabecera `X-Admin-Key`), vacía en la plantilla. En producción: [SECRETO OCULTO].
- **Línea 17** (`AUDIO_ALERT_API_KEY=`): clave de upload de audio, vacía en la plantilla. En producción: [SECRETO OCULTO].
- [ADVERTENCIA] Si un despliegue copia la plantilla sin rellenar estas claves, la app arranca con constantes vacías (`os.environ.get(..., "")` en `flask_app.py`). El comportamiento depende de cómo valide cada endpoint la clave (código fuera del alcance de este módulo), pero es una condición de configuración que debe evitarse.

**Bloque de líneas 19–23 (MercadoPago y geolocalización IP):**

```text
# --- MercadoPago ---
MP_WEBHOOK_SECRET=

# --- Geolocalización IP (opcional) ---
IPREGISTRY_API_KEY=
```

**Explicación de las líneas 19–23:**

- **Línea 20** (`MP_WEBHOOK_SECRET=`): secreto HMAC para validar el webhook de MercadoPago. Vacío en la plantilla; en producción: [SECRETO OCULTO].
- **Línea 23** (`IPREGISTRY_API_KEY=`): clave opcional del proveedor ipregistry para geolocalización por IP. Vacía en la plantilla; si se configura: [SECRETO OCULTO].

**Bloque de líneas 25–29 (política de retención):**

```text
# --- Política de retención (días) ---
RETENCION_ACCESOS_DIAS=90
RETENCION_UBICACIONES_DIAS=365
RETENCION_CONSENTIMIENTOS_DIAS=365
RETENCION_LOGS_DIAS=30
```

**Explicación de las líneas 25–29:**

- **Líneas 26–29**: plazos de retención en días para `accesos_tecnicos` (90), `ubicaciones_usuario` (365), `consentimientos_usuario` (365) y logs (30). Coinciden con los defaults de `flask_app.py` (líneas 86–89), con el script `002_retencion_purga.sql` (90/365/365) y con el endpoint `/api/v1/admin/purga`. Son la expresión configurable de la política de retención de datos personales. [NOTA] `RETENCION_LOGS_DIAS` aplica "si se implementa tabla de logs" (comentario del script 002); la tabla no existe en las migraciones analizadas.

**Bloque de líneas 31–35 (proxy y debug):**

```text
# --- Proxy confiable ---
PROXY_CONFIANZA=Cloudflare,PythonAnywhere

# --- Debug ---
FLASK_DEBUG=0
```

**Explicación de las líneas 31–35:**

- **Línea 32** (`PROXY_CONFIANZA=Cloudflare,PythonAnywhere`): lista separada por comas de proxies de confianza; `flask_app.py` línea 180 la convierte en lista (`split(",")`) para decidir de qué cabeceras de proxy fiarse al obtener la IP real del cliente. No es un secreto.
- **Línea 35** (`FLASK_DEBUG=0`): debug desactivado por defecto (correcto para producción; evita el debugger interactivo y la recarga automática en entornos expuestos).

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Existe `backend/.env` en el checkout local (listado en el directorio `backend/`). No fue leído (contiene secretos y está fuera del alcance del módulo). Está excluido del versionado por `.gitignore` (reglas `.env` y `.env*.local`), lo que mitiga el riesgo de fuga, pero conviene verificar con `git status` que nunca se haya commiteado una versión previa.
- [NOTA] La plantilla documenta el despliegue PythonAnywhere; Cloud Run del repositorio necesitará las mismas variables (provistas como secretos del entorno, fuera de este archivo).
- [NIVEL DE CERTEZA: Confirmado por código] Todas las variables de la plantilla se leen efectivamente en `flask_app.py` y/o `wsgi.py` (grep de referencias realizado).

## Seguridad

- [INFORMATIVO] La plantilla **no contiene valores de secretos** (todas las claves están vacías y marcadas para completar): práctica correcta para un archivo versionable.
- [INFORMATIVO] No se incluyen en el ejemplo credenciales de bases, URLs de conexión con usuario/contraseña ni claves privadas.
- [MEDIO] Riesgo operativo si el `.env` de producción se crea copiando la plantilla sin completar las claves: la app arrancaría con `SAFEALERT_INTERNAL_KEY`, `SAFEALERT_ADMIN_API_KEY`, `AUDIO_ALERT_API_KEY` y `MP_WEBHOOK_SECRET` vacías. [RECOMENDACIÓN] Validar al arranque que las claves requeridas no estén vacías y abortar con un error claro (fail-fast).
- [BAJO] Los paths `/home/oaf/...` en el ejemplo revelan estructura interna del servidor (mismo hallazgo que en `wsgi.py`).
- [BAJO] `FLASK_DEBUG=0` por defecto es adecuado; si se activara a 1 en producción expondría el debugger de Werkzeug.
- [INFORMATIVO] La lista `PROXY_CONFIANZA` es config de red, no un secreto; su manipulación afectaría a la fiabilidad de la IP registrada (privacidad/forense), no a la autenticación.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Claves vacías por copia literal de la plantilla (ver hallazgo MEDIO). [RECOMENDACIÓN] Añadir una verificación de presencia de secretos en el arranque del backend.
- [RIESGO] Divergencia plantilla vs. código: si se añaden nuevas variables en `flask_app.py` y no se reflejan en `.env.example`, la configuración queda indocumentada. [RECOMENDACIÓN] Mantener `.env.example` sincronizado con las lecturas reales de `os.environ`.
- [RECOMENDACIÓN] Revisar el historial git para confirmar que `backend/.env` nunca fue versionado.
- [RECOMENDACIÓN] Considerar gestor de secretos de la plataforma (Cloud Run Secret Manager) en lugar de `.env` para los despliegues en la nube.
