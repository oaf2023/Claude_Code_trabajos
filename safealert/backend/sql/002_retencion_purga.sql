/*
============================================================================
Script           : 002_retencion_purga.sql
Descripción      : Política de retención de datos - purga de registros antiguos
                   según configuración. Ejecutar como tarea programada (cron).
Autor            : oafon
Fecha            : 2026-07-30
Versión          : 1.0.0
Base de datos    : SQLite (safealert.db)
Uso              : sqlite3 safealert.db < 002_retencion_purga.sql
============================================================================
*/

-- ==========================================================================
-- Parámetros de retención (modificar según política empresarial)
-- ==========================================================================

-- Accesos técnicos: 90 días
-- Ubicaciones operativas: 365 días
-- Consentimientos: 365 días
-- Logs de error: 30 días (aplicable si se implementa tabla de logs)

-- ==========================================================================
-- Purga de accesos técnicos antiguos
-- ==========================================================================

DELETE FROM accesos_tecnicos
WHERE fecha_hora < datetime('now', '-90 days');

-- ==========================================================================
-- Purga de ubicaciones antiguas
-- ==========================================================================

DELETE FROM ubicaciones_usuario
WHERE creado_en < datetime('now', '-365 days');

-- ==========================================================================
-- Purga de consentimientos antiguos
-- ==========================================================================

DELETE FROM consentimientos_usuario
WHERE fecha_hora < datetime('now', '-365 days');

-- ==========================================================================
-- Reporte de registros eliminados
-- ==========================================================================

SELECT 'PURGA COMPLETADA' AS operacion,
       (SELECT COUNT(*) FROM accesos_tecnicos) AS accesos_restantes,
       (SELECT COUNT(*) FROM ubicaciones_usuario) AS ubicaciones_restantes,
       (SELECT COUNT(*) FROM consentimientos_usuario) AS consentimientos_restantes;
