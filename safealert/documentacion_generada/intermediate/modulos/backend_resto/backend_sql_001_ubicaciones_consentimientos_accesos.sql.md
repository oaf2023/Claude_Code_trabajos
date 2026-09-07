# Archivo: backend/sql/001_ubicaciones_consentimientos_accesos.sql

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| backend/sql/001_ubicaciones_consentimientos_accesos.sql | 167 | SQL (SQLite) | 6446 | Migración de esquema de base de datos | FUNCIONALIDAD EXISTENTE (script manual) | Altamente probable |

[NIVEL DE CERTEZA: Confirmado por código] para el contenido del script; el método de ejecución (manual con `sqlite3` según su encabezado) se infiere porque ninguna parte del código del repositorio invoca el archivo.

## Objetivo

Migración SQL que crea el esquema de **tres tablas** de datos personales y telemetría del Prompt Maestro del backend SafeAlert sobre SQLite (`safealert.db`):

1. `ubicaciones_usuario` — registros de ubicación (GPS, navegador, IP o manual) con metadatos amplios del dispositivo y geolocalización por IP.
2. `consentimientos_usuario` — registro de otorgamiento/rechazo/revocación de permisos de la app.
3. `accesos_tecnicos` — registro de accesos técnicos (HTTP) con metadatos del dispositivo y de red.

Incluye índices de soporte y dos consultas finales de verificación. El diseño es **idempotente** (`IF NOT EXISTS`) y se declara para SQLite.

[ADVERTENCIA] El mismo esquema (tablas e índices, con `CREATE TABLE IF NOT EXISTS`) está **duplicado en el arranque de la aplicación** en `backend/flask_app.py` (líneas 382–513, confirmado por grep). Por tanto esta migración manual es redundante en tiempo de ejecución: la app crea sola las tablas si no existen. El script sirve como definición explícita/referencia y para entornos donde se precree la base.

## Clasificación y estado

- Etiqueta: FUNCIONALIDAD EXISTENTE, ejecución manual (encabezado: `sqlite3 safealert.db < 001_...sql`).
- Justificación: no se hallaron referencias al archivo desde el código del proyecto (grep sobre `*.py`, `*.sh`, `Dockerfile`, etc.: solo aparece en su propio encabezado y en `documentacion_generada/`). Las tablas sí se usan intensivamente en `flask_app.py` (INSERT/SELECT/DELETE en líneas 945–1571), pero la creación es responsabilidad de `flask_app.py` en el arranque, no de este script. [NIVEL DE CERTEZA: Altamente probable] El script se ejecuta a mano durante la instalación/configuración inicial o como documentación de referencia del esquema.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| SQLite (sin dependencias de terceros) | Motor de BD | Motor declarado en el encabezado (`safealert.db`) | Sí (backend real sobre SQLite) |

No hay imports SQL ni extensiones (sin `PRAGMA`, sin triggers, sin vistas).

## Componentes que dependen de este archivo

- No hay componentes de código que lo importen o ejecuten: es un artefacto manual. [NIVEL DE CERTEZA: Altamente probable]
- Las tablas que define sí dependen de la app: `backend/flask_app.py` inserta y consulta en `ubicaciones_usuario`, `consentimientos_usuario` y `accesos_tecnicos` en los endpoints `/api/v1/ubicaciones*`, `/api/v1/accesos`, `/api/v1/consentimientos*`, `/api/v1/admin/usuarios`, `/api/v1/admin/stats` y `/api/v1/admin/purga`.
- El script `002_retencion_purga.sql` borra filas de estas tres tablas (dependencia lógica de esquema).

## Variables globales y constantes

No aplica (no hay variables SQL). Constantes de diseño relevantes: los dominios de valores `CHECK` (orígenes, permisos, estados) y los plazos implícitos (la retención se aplica en `002_retencion_purga.sql`, no aquí).

## Estructura (funciones / clases / tipos)

Objetos SQL creados:

| Objeto | Tipo | Líneas |
| --- | --- | --- |
| `ubicaciones_usuario` | tabla | 19–73 |
| `idx_ubicaciones_usuario_id`, `idx_ubicaciones_fecha`, `idx_ubicaciones_origen`, `idx_ubicaciones_ip`, `idx_ubicaciones_sesion` | índices | 79–92 |
| `consentimientos_usuario` | tabla | 98–109 |
| `idx_consentimientos_usuario` | índice | 111–112 |
| `accesos_tecnicos` | tabla | 118–154 |
| `idx_accesos_tecnicos_fecha`, `idx_accesos_tecnicos_usuario` | índices | 156–160 |
| consulta de verificación (SELECT) | — | 166–167 |

## Análisis línea por línea

**Bloque de líneas 1–12 (cabecera del script):**

```sql
/*
============================================================================
Script           : 001_ubicaciones_consentimientos_accesos.sql
Descripción      : Migración de tablas para el sistema de ubicaciones,
                   consentimientos y accesos técnicos del Prompt Maestro.
Autor            : oafon
Fecha            : 2026-07-30
Versión          : 1.0.0
Base de datos    : SQLite (safealert.db)
Uso              : sqlite3 safealert.db < 001_ubicaciones_consentimientos_accesos.sql
============================================================================
*/
```

**Explicación de las líneas 1–12:**

- **Línea 9** (`Base de datos: SQLite (safealert.db)`): confirma que la migración es para la base SQLite del backend (coherente con `wsgi.py` y `flask_app.py`).
- **Línea 10**: instrucción de ejecución manual con la CLI `sqlite3`.

**Bloque de líneas 14–73 (tabla `ubicaciones_usuario`):**

```sql
-- ==========================================================================
-- Tabla: ubicaciones_usuario (Prompt Maestro secciones 8-9)
-- Modelo de datos ampliado recomendado
-- ==========================================================================

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
    origen                TEXT NOT NULL CHECK (origen IN ('GPS', 'NAVEGADOR', 'IP', 'MANUAL')),
    permiso_ubicacion     TEXT CHECK (permiso_ubicacion IN ('GRANTED', 'DENIED', 'PROMPT', 'NO_DISPONIBLE', 'NO_SOLICITADO', 'ERROR')),
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
```

**Explicación de las líneas 14–73:**

- **Líneas 15–16** (comentario): referencia al "Prompt Maestro secciones 8-9" como origen del modelo de datos.
- **Línea 19**: `CREATE TABLE IF NOT EXISTS` — creación idempotente; si la tabla ya existe, no falla.
- **Línea 20** (`id INTEGER PRIMARY KEY AUTOINCREMENT`): clave primaria autogenerada (alias `rowid` en SQLite).
- **Línea 21** (`usuario_id TEXT NOT NULL`): identificador del usuario; tipo TEXT porque en la app los usuarios se identifican por `device_id`/UID de Firebase (no hay FK: SQLite no impone referencias; la tabla `users` vive en `flask_app.py`).
- **Línea 24** (`fecha_hora_servidor TEXT NOT NULL DEFAULT (datetime('now'))`): marca de tiempo del servidor en UTC, formato texto ISO; el `NOT NULL` garantiza su presencia.
- **Línea 32** (`origen` con `CHECK ... IN ('GPS','NAVEGADOR','IP','MANUAL')`): validación de dominio del origen del dato de ubicación.
- **Línea 33** (`permiso_ubicacion` con `CHECK ...`): dominio del estado del permiso de ubicación reportado por la app.
- **Líneas 34–42**: bloque de geolocalización por IP (IP observada y campos de país/provincia/ciudad/código postal/coordenadas IP/precisión en km) — datos de contexto de red del cliente.
- **Líneas 43–45**: `proveedor`, `operador_movil_estimado`, `asn` — datos del ISP/operador (enriquecimiento ipregistry).
- **Líneas 46–48**: banderas `posible_vpn`, `posible_proxy`, `posible_hosting` (INTEGER 0/1, default 0) para detección de anonimización.
- **Líneas 49–58**: contexto HTTP del registro (método, ruta, página, referer, código de respuesta, user-agent, navegador/OS aproximado, tipo de dispositivo, idioma e idiomas).
- **Líneas 59–66**: contexto de pantalla/zona horaria del dispositivo (zona horaria, offset UTC, dimensiones, profundidad de color).
- **Líneas 67–69**: `direccion_estimada`, `direccion_confirmada`, `proveedor_geocodificacion` — resultado de geocodificación inversa (dirección legible).
- **Líneas 70–71**: `observaciones` y `metadatos` (campo libre / JSON opcional).
- **Línea 72**: `creado_en` — marca de tiempo de inserción; es la columna que la política de retención usará para purgar (ver `002_retencion_purga.sql`).

**Diccionario de datos de `ubicaciones_usuario` (53 columnas):**

| Campo | Tipo | Null | PK/FK | Descripción |
| --- | --- | --- | --- | --- |
| id | INTEGER | No | PK (autoincrement) | Identificador único del registro de ubicación |
| usuario_id | TEXT | No | — | Identificador del usuario (device_id/UID Firebase); sin FK real |
| sesion_id | TEXT | Sí | — | Identificador de sesión de la app |
| device_id_app | TEXT | Sí | — | Identificador del dispositivo reportado por la app |
| fecha_hora_servidor | TEXT | No | — | Marca de tiempo del servidor en UTC, default `datetime('now')` |
| fecha_hora_dispositivo | TEXT | Sí | — | Marca de tiempo local del dispositivo al capturar la ubicación |
| latitud | REAL | Sí | — | Latitud de la ubicación |
| longitud | REAL | Sí | — | Longitud de la ubicación |
| precision_metros | REAL | Sí | — | Precisión declarada en metros |
| altitud_metros | REAL | Sí | — | Altitud en metros |
| velocidad_metros_segundo | REAL | Sí | — | Velocidad en m/s |
| rumbo_grados | REAL | Sí | — | Rumbo en grados |
| origen | TEXT | No | — | Origen del dato; CHECK: GPS, NAVEGADOR, IP, MANUAL |
| permiso_ubicacion | TEXT | Sí | — | Estado del permiso; CHECK: GRANTED, DENIED, PROMPT, NO_DISPONIBLE, NO_SOLICITADO, ERROR |
| ip | TEXT | Sí | — | Dirección IP del cliente observada |
| pais_ip | TEXT | Sí | — | País inferido de la IP |
| codigo_pais_ip | TEXT | Sí | — | Código ISO del país inferido de la IP |
| provincia_ip | TEXT | Sí | — | Provincia/región inferida de la IP |
| ciudad_ip | TEXT | Sí | — | Ciudad inferida de la IP |
| codigo_postal_ip | TEXT | Sí | — | Código postal inferido de la IP |
| latitud_ip | REAL | Sí | — | Latitud de la geolocalización por IP |
| longitud_ip | REAL | Sí | — | Longitud de la geolocalización por IP |
| precision_ip_km | REAL | Sí | — | Precisión de la geolocalización por IP en km |
| proveedor | TEXT | Sí | — | Proveedor de red/ISP reportado |
| operador_movil_estimado | TEXT | Sí | — | Operador móvil estimado |
| asn | TEXT | Sí | — | Número de sistema autónomo (ASN) |
| posible_vpn | INTEGER | Sí | — | Bandera VPN detectada, default 0 |
| posible_proxy | INTEGER | Sí | — | Bandera proxy detectado, default 0 |
| posible_hosting | INTEGER | Sí | — | Bandera hosting/datacenter, default 0 |
| metodo_http | TEXT | Sí | — | Método HTTP de la petición |
| ruta_consultada | TEXT | Sí | — | Ruta consultada |
| pagina_consultada | TEXT | Sí | — | Página/pantalla consultada |
| referer | TEXT | Sí | — | Cabecera referer |
| codigo_respuesta | INTEGER | Sí | — | Código de respuesta HTTP |
| user_agent | TEXT | Sí | — | User-Agent del cliente |
| navegador_aproximado | TEXT | Sí | — | Navegador aproximado detectado |
| sistema_operativo_aproximado | TEXT | Sí | — | SO aproximado detectado |
| tipo_dispositivo | TEXT | Sí | — | Tipo de dispositivo (teléfono, tablet, etc.) |
| idioma | TEXT | Sí | — | Idioma principal del cliente |
| idiomas | TEXT | Sí | — | Lista de idiomas aceptados |
| zona_horaria | TEXT | Sí | — | Zona horaria del cliente |
| offset_utc_minutos | INTEGER | Sí | — | Offset UTC en minutos |
| pantalla_ancho | INTEGER | Sí | — | Ancho de pantalla en px |
| pantalla_alto | INTEGER | Sí | — | Alto de pantalla en px |
| ventana_ancho | INTEGER | Sí | — | Ancho de ventana en px |
| ventana_alto | INTEGER | Sí | — | Alto de ventana en px |
| profundidad_color | INTEGER | Sí | — | Profundidad de color en bits |
| direccion_estimada | TEXT | Sí | — | Dirección estimada por geocodificación inversa |
| direccion_confirmada | TEXT | Sí | — | Dirección confirmada/editada por el usuario |
| proveedor_geocodificacion | TEXT | Sí | — | Proveedor de geocodificación usado |
| observaciones | TEXT | Sí | — | Observaciones del registro |
| metadatos | TEXT | Sí | — | Metadatos adicionales (posible JSON) |
| creado_en | TEXT | No | — | Marca de inserción UTC, default `datetime('now')`; usada por la purga |

**Bloque de líneas 75–92 (índices de `ubicaciones_usuario`):**

```sql
-- ==========================================================================
-- Índices para búsquedas frecuentes
-- ==========================================================================

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
```

**Explicación de las líneas 75–92:**

- **Líneas 79–80** (`idx_ubicaciones_usuario_id`): acelera búsquedas por `usuario_id` (consultas "ubicaciones de un usuario" y el LEFT JOIN del admin).
- **Líneas 82–83** (`idx_ubicaciones_fecha`, descendente): acelera ordenaciones/ventanas por fecha; clave para "última ubicación" y la purga por antigüedad.
- **Líneas 85–86** (`idx_ubicaciones_origen`): soporta agregaciones `GROUP BY origen` (estadísticas).
- **Líneas 88–89** (`idx_ubicaciones_ip`): soporta búsqueda por IP.
- **Líneas 91–92** (`idx_ubicaciones_sesion`): soporta búsqueda por sesión.
- [NOTA] Índices también creados idénticamente en `flask_app.py` (líneas 498–507). [OBSERVACIÓN TÉCNICA] `idx_ubicaciones_ip` y `idx_ubicaciones_sesion` tienen utilidad marginal según los queries reales; no hay índice sobre `creado_en`, columna usada por la purga de retención (DELETE masivo por rango) — la purga recorrerá la tabla si no hay índice de fecha sobre `creado_en` (solo existe índice sobre `fecha_hora_servidor`).

**Bloque de líneas 94–112 (tabla `consentimientos_usuario` y su índice):**

```sql
-- ==========================================================================
-- Tabla: consentimientos_usuario (Prompt Maestro sección 10)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS consentimientos_usuario (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id        TEXT NOT NULL,
    sesion_id         TEXT,
    tipo_permiso      TEXT NOT NULL CHECK (tipo_permiso IN ('UBICACION', 'CAMARA', 'MICROFONO', 'CONTACTOS', 'NOTIFICACIONES')),
    estado            TEXT NOT NULL CHECK (estado IN ('OTORGADO', 'RECHAZADO', 'REVOCADO', 'NO_SOLICITADO')),
    texto_mostrado    TEXT,
    version_politica  TEXT,
    fecha_hora        TEXT NOT NULL DEFAULT (datetime('now')),
    ip                TEXT,
    user_agent        TEXT
);

CREATE INDEX IF NOT EXISTS idx_consentimientos_usuario
    ON consentimientos_usuario(usuario_id);
```

**Explicación de las líneas 94–112:**

- **Línea 98**: tabla de consentimientos (sección 10 del Prompt Maestro). Es la evidencia de consentimiento para el tratamiento de permisos sensibles (ubicación, cámara, micrófono, contactos, notificaciones).
- **Línea 102**: `tipo_permiso NOT NULL` con `CHECK` sobre los cinco permisos sensibles.
- **Línea 103**: `estado NOT NULL` con `CHECK` (`OTORGADO`, `RECHAZADO`, `REVOCADO`, `NO_SOLICITADO`) — modelo de ciclo de vida del consentimiento.
- **Línea 104** (`texto_mostrado`): guarda el texto exacto mostrado al usuario (trazabilidad del consentimiento).
- **Línea 105** (`version_politica`): versión de la política de privacidad vigente al otorgar.
- **Línea 106**: `fecha_hora` UTC (default `datetime('now')`); columna usada por la purga de retención.
- **Líneas 107–108**: IP y user-agent del acto de consentimiento (evidencia de contexto).
- **Líneas 111–112**: índice por `usuario_id` para consultar el historial de consentimientos de un usuario.

**Diccionario de datos de `consentimientos_usuario` (10 columnas):**

| Campo | Tipo | Null | PK/FK | Descripción |
| --- | --- | --- | --- | --- |
| id | INTEGER | No | PK (autoincrement) | Identificador único del evento de consentimiento |
| usuario_id | TEXT | No | — | Usuario que otorga/rechaza; sin FK real |
| sesion_id | TEXT | Sí | — | Sesión donde se solicitó el permiso |
| tipo_permiso | TEXT | No | — | Permiso afectado; CHECK: UBICACION, CAMARA, MICROFONO, CONTACTOS, NOTIFICACIONES |
| estado | TEXT | No | — | Resultado; CHECK: OTORGADO, RECHAZADO, REVOCADO, NO_SOLICITADO |
| texto_mostrado | TEXT | Sí | — | Texto del aviso mostrado al usuario |
| version_politica | TEXT | Sí | — | Versión de la política de privacidad aplicada |
| fecha_hora | TEXT | No | — | Marca UTC del evento, default `datetime('now')`; usada por la purga |
| ip | TEXT | Sí | — | IP desde la que se registró el consentimiento |
| user_agent | TEXT | Sí | — | User-Agent del cliente |

**Bloque de líneas 114–160 (tabla `accesos_tecnicos` y sus índices):**

```sql
-- ==========================================================================
-- Tabla: accesos_tecnicos (Prompt Maestro sección 11)
-- ==========================================================================

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

CREATE INDEX IF NOT EXISTS idx_accesos_tecnicos_fecha
    ON accesos_tecnicos(fecha_hora DESC);

CREATE INDEX IF NOT EXISTS idx_accesos_tecnicos_usuario
    ON accesos_tecnicos(usuario_id);
```

**Explicación de las líneas 114–160:**

- **Línea 118**: tabla de accesos técnicos (sección 11 del Prompt Maestro): cada petición HTTP con contexto de red/dispositivo.
- **Línea 120** (`usuario_id TEXT`): a diferencia de las otras tablas, es **nullable** (puede haber accesos anónimos/no autenticados).
- **Líneas 123–129**: contexto de la petición (fecha UTC, IP, método, ruta, página, endpoint, código de respuesta).
- **Líneas 130–143**: huella del cliente (user-agent, navegador/SO/tipo aproximados, idiomas, zona horaria, pantalla).
- **Líneas 144–151**: geolocalización y red por IP (país, provincia, ciudad, proveedor, ASN, banderas VPN/proxy/hosting).
- **Línea 152** (`metodo_autenticacion`): cómo se autenticó el acceso (p. ej. `firebase_anonimo` según el ejemplo de `API.md`).
- **Línea 153**: `creado_en` — aunque la tabla define `creado_en`, la **purga del script 002 y del endpoint de purga usa `fecha_hora`** para `accesos_tecnicos` (ver detalle en `002`).
- **Líneas 156–160**: índices por `fecha_hora DESC` (orden cronológico/estadísticas) y por `usuario_id`.

**Diccionario de datos de `accesos_tecnicos` (35 columnas):**

| Campo | Tipo | Null | PK/FK | Descripción |
| --- | --- | --- | --- | --- |
| id | INTEGER | No | PK (autoincrement) | Identificador único del acceso |
| usuario_id | TEXT | Sí | — | Usuario del acceso (nullable: accesos anónimos); sin FK real |
| sesion_id | TEXT | Sí | — | Sesión de la app |
| device_id_app | TEXT | Sí | — | Identificador del dispositivo |
| fecha_hora | TEXT | No | — | Marca UTC del acceso, default `datetime('now')`; usada por la purga |
| ip | TEXT | Sí | — | IP del cliente |
| metodo_http | TEXT | Sí | — | Método HTTP |
| ruta_consultada | TEXT | Sí | — | Ruta consultada |
| pagina_consultada | TEXT | Sí | — | Página/pantalla consultada |
| endpoint | TEXT | Sí | — | Endpoint de la API consultado |
| codigo_respuesta | INTEGER | Sí | — | Código de respuesta HTTP |
| user_agent | TEXT | Sí | — | User-Agent del cliente |
| referer | TEXT | Sí | — | Cabecera referer |
| navegador_aproximado | TEXT | Sí | — | Navegador aproximado detectado |
| sistema_operativo_aproximado | TEXT | Sí | — | SO aproximado detectado |
| tipo_dispositivo | TEXT | Sí | — | Tipo de dispositivo |
| idioma | TEXT | Sí | — | Idioma principal |
| idiomas | TEXT | Sí | — | Idiomas aceptados |
| zona_horaria | TEXT | Sí | — | Zona horaria del cliente |
| offset_utc_minutos | INTEGER | Sí | — | Offset UTC en minutos |
| pantalla_ancho | INTEGER | Sí | — | Ancho de pantalla en px |
| pantalla_alto | INTEGER | Sí | — | Alto de pantalla en px |
| ventana_ancho | INTEGER | Sí | — | Ancho de ventana en px |
| ventana_alto | INTEGER | Sí | — | Alto de ventana en px |
| profundidad_color | INTEGER | Sí | — | Profundidad de color en bits |
| pais_ip | TEXT | Sí | — | País inferido de la IP |
| provincia_ip | TEXT | Sí | — | Provincia/región inferida de la IP |
| ciudad_ip | TEXT | Sí | — | Ciudad inferida de la IP |
| proveedor | TEXT | Sí | — | Proveedor de red/ISP |
| asn | TEXT | Sí | — | Número de sistema autónomo |
| posible_vpn | INTEGER | Sí | — | Bandera VPN, default 0 |
| posible_proxy | INTEGER | Sí | — | Bandera proxy, default 0 |
| posible_hosting | INTEGER | Sí | — | Bandera hosting/datacenter, default 0 |
| metodo_autenticacion | TEXT | Sí | — | Método de autenticación usado en el acceso |
| creado_en | TEXT | No | — | Marca de inserción UTC, default `datetime('now')` |

**Bloque de líneas 162–167 (verificación):**

```sql
-- ==========================================================================
-- Verificación de las tablas creadas
-- ==========================================================================

SELECT 'Migracion completada exitosamente' AS resultado;
SELECT name AS tabla_creada FROM sqlite_master WHERE type='table' ORDER BY name;
```

**Explicación de las líneas 162–167:**

- **Línea 166**: devuelve un literal de confirmación de la migración.
- **Línea 167**: lista las tablas existentes en la base desde `sqlite_master` (verificación visual del resultado). [NOTA] Listará también la tabla `users` u otras creadas previamente por la app (la migración no las crea).

## Fichas de funciones y métodos

No aplica (script SQL DDL, sin funciones).

## Clases / interfaces / tipos

No aplica.

## Relaciones entre tablas

- No existen **claves foráneas declaradas** (ninguna `FOREIGN KEY`). Las relaciones son lógicas por `usuario_id` (TEXT) y `sesion_id` entre las tres tablas y con la tabla `users` (gestionada por `flask_app.py`, fuera de esta migración). En SQLite las FK no se imponen salvo que se habilite `PRAGMA foreign_keys`.
- `usuario_id` de `ubicaciones_usuario`, `consentimientos_usuario` y `accesos_tecnicos` se asocia lógicamente con `users.device_id` (la app usa el `device_id` como identificador, según `test_admin_endpoints.py`: registro con `device_id` "dev-test-001" y posterior consulta de ubicaciones con `usuario_id` "dev-test-001").
- Jerarquía de uso: un usuario puede tener muchos registros en las tres tablas (relaciones 1:N lógicas).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Esquema duplicado: las mismas tres tablas e índices se crean en el arranque de `flask_app.py` (líneas 382–513, confirmado por grep). Riesgo de **deriva de esquema** si se modifica uno sin el otro. [RECOMENDACIÓN] Elegir una única fuente de verdad (script de migración o inicialización de la app) y derivar la otra.
- [OBSERVACIÓN TÉCNICA] No hay índice sobre `creado_en` en `ubicaciones_usuario` ni sobre `fecha_hora` en `consentimientos_usuario`, columnas que la purga recorre en `002_retencion_purga.sql` (DELETE por rango): en tablas grandes el barrido será lento. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] `accesos_tecnicos` define `creado_en` pero la purga filtra por `fecha_hora` (inconsistencia de columna de referencia entre tabla y política de retención; el endpoint de purga de `flask_app.py` usa `fecha_hora` para accesos, línea 1569).
- [OBSERVACIÓN TÉCNICA] `usuario_id` como TEXT sin FK permite huérfanos y duplicidad de identificadores; la unicidad lógica depende de la capa de aplicación.
- [NOTA] Comentario "Modelo de datos ampliado recomendado" (línea 16) sugiere que el esquema es más amplio que un modelo mínimo inicial.
- [NIVEL DE CERTEZA: Altamente probable] El script no se ejecuta automáticamente en el despliegue (no referenciado por código, Dockerfile ni wsgi).

## Seguridad

- [ALTO] La tabla `ubicaciones_usuario` almacena **datos personales y de geolocalización precisa** (coordenadas, IP, direcciones estimadas/confirmadas, huella de dispositivo) y `accesos_tecnicos` almacena IPs y huellas completas: son datos sensibles bajo regímenes como RGPD y DAMMA. La seguridad recae en el control de acceso de la API (Firebase Auth + claves de admin), no en el esquema: la lectura masiva (`/api/v1/admin/usuarios`, `/api/v1/admin/stats`) queda protegida por `X-Admin-Key` (clave única compartida, sin roles).
- [MEDIO] `consentimientos_usuario` registra texto mostrado, IP y user-agent del consentimiento: correcto para trazabilidad, pero estos datos también deben protegerse y retenerse conforme a la política (365 días).
- [INFORMATIVO] No hay funciones SQL, triggers, vistas ni SQL dinámico: sin riesgo de inyección en este script.
- [INFORMATIVO] El uso de `CHECK` (orígenes, permisos, estados) valida dominios a nivel de base: buena defensa en profundidad.
- [MEDIO] Almacenar coordenadas/IP/direcciones **en texto plano** en SQLite: si el archivo de base cae en manos equivocadas (backup, copia, servidor), la información queda expuesta sin cifrado. [RECOMENDACIÓN] Cifrado en reposo o minimización (seudonimización de IP/direcciones).

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Deriva entre este script y el esquema embebido en `flask_app.py`. [RECOMENDACIÓN] Unificar la gestión de esquema (migraciones versionadas ejecutadas al arrancar o por herramienta de migración).
- [RIESGO] Tablas de telemetría de crecimiento alto (una fila por ubicación/acceso) sin particionado ni índice de purga eficiente. [RECOMENDACIÓN] Añadir índices sobre las columnas de corte de purga y evaluar agregación/compactación periódica (VACUUM) en SQLite.
- [RIESGO] Minimización de datos: el modelo recoge una huella muy amplia del dispositivo y de red en cada evento. [RECOMENDACIÓN] Revisar contra el principio de minimización (DAMA-DMBOK / DAMMA) qué campos son realmente necesarios y su finalidad documentada.
- [RECOMENDACIÓN] Documentar el mapa de datos personales y sus plazos de retención (ya soportado por `002_retencion_purga.sql` y el endpoint `/api/v1/admin/purga`).
