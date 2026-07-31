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

-- ==========================================================================
-- Verificación de las tablas creadas
-- ==========================================================================

SELECT 'Migracion completada exitosamente' AS resultado;
SELECT name AS tabla_creada FROM sqlite_master WHERE type='table' ORDER BY name;
