# Archivo: backend/sql/002_retencion_purga.sql

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| backend/sql/002_retencion_purga.sql | 51 | SQL (SQLite) | 2238 | Script de retención y purga de datos (DML) | FUNCIONALIDAD EXISTENTE (script manual / cron) | Altamente probable |

[NIVEL DE CERTEZA: Confirmado por código] para el contenido; la ejecución como tarea programada (cron) se declara en el encabezado y no se encontró evidencia de programación real dentro del repositorio.

## Objetivo

Implementa la **política de retención de datos personales** del backend: elimina de forma masiva los registros antiguos de tres tablas (`accesos_tecnicos`, `ubicaciones_usuario`, `consentimientos_usuario`) según plazos configurados por comentario (90/365/365 días) y devuelve un reporte de los registros restantes. Está pensado para ejecutarse de forma periódica (cron) contra `safealert.db`.

[ADVERTENCIA] La misma política de retención está implementada **en tiempo de ejecución** en `flask_app.py`: el endpoint `POST /api/v1/admin/purga` (línea 1577) borra con los mismos plazos leídos de las variables `RETENCION_*_DIAS` (líneas 86–89, 1566–1571, confirmado por grep). Este script es, por tanto, una alternativa/manual redundante o una forma de ejecutar la purga sin pasar por la API. El comentario de retención "Logs de error: 30 días (aplicable si se implementa tabla de logs)" indica que la purga de logs es futura (tabla no creada en las migraciones).

## Clasificación y estado

- Etiqueta: FUNCIONALIDAD EXISTENTE (script DML manual, para cron).
- Justificación: los plazos coinciden con los defaults de `flask_app.py` (90/365/365/30) y con `.env.example` (`RETENCION_*_DIAS`). No se hallaron referencias que programen este script desde el repositorio; su encabezado indica "Ejecutar como tarea programada (cron)". La **purga de datos por antigüedad está implementada y operativa** (vía script y vía endpoint admin), lo que da cumplimiento parcial a los requisitos de borrado por retención.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| SQLite (CLI `sqlite3`) | Motor de BD | Ejecución del script contra `safealert.db` | Sí |

Dependencias lógicas de esquema: requiere las tablas creadas por `001_ubicaciones_consentimientos_accesos.sql` (o por el arranque de `flask_app.py`).

## Componentes que dependen de este archivo

- Ningún código del repositorio lo invoca (grep: solo aparece en su propio encabezado e inventario). Depende lógicamente del esquema de `001` y duplica la funcionalidad del endpoint `/api/v1/admin/purga` de `flask_app.py`.

## Variables globales y constantes

Parámetros de retención expresados como comentarios (líneas 18–21):

| Constante (comentada) | Valor | Tabla afectada | ¿Implementada aquí? |
| --- | --- | --- | --- |
| Accesos técnicos | 90 días | `accesos_tecnicos` | Sí (líneas 27–28) |
| Ubicaciones operativas | 365 días | `ubicaciones_usuario` | Sí (líneas 34–35) |
| Consentimientos | 365 días | `consentimientos_usuario` | Sí (líneas 41–42) |
| Logs de error | 30 días | (tabla de logs no implementada) | No (pendiente) |

[NOTA] El script **no parametriza** los plazos (valores fijos en SQL), a diferencia de `.env.example`/`flask_app.py` donde son configurables vía `RETENCION_*_DIAS`. Riesgo de divergencia si se cambia la política solo en un lugar.

## Estructura (funciones / clases / tipos)

Sentencias del script (lineal, sin funciones):

| Sentencia | Tipo | Líneas |
| --- | --- | --- |
| Comentarios de parámetros de retención | — | 18–21 |
| `DELETE FROM accesos_tecnicos WHERE fecha_hora < datetime('now','-90 days')` | DML (purga) | 27–28 |
| `DELETE FROM ubicaciones_usuario WHERE creado_en < datetime('now','-365 days')` | DML (purga) | 34–35 |
| `DELETE FROM consentimientos_usuario WHERE fecha_hora < datetime('now','-365 days')` | DML (purga) | 41–42 |
| `SELECT` de reporte de restantes | DQL (verificación) | 48–51 |

## Análisis línea por línea

**Bloque de líneas 1–21 (cabecera y parámetros):**

```sql
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
```

**Explicación de las líneas 1–21:**

- **Línea 5** ("Ejecutar como tarea programada (cron)"): propósito declarado del script.
- **Líneas 18–21** (comentarios con valor técnico): definen la política: accesos 90 días, ubicaciones 365, consentimientos 365, logs 30 (pendiente de tabla). [NOTA] Los plazos coinciden con `RETENCION_*_DIAS` de `.env.example` y `flask_app.py`.

**Bloque de líneas 23–28 (purga de accesos técnicos):**

```sql
-- ==========================================================================
-- Purga de accesos técnicos antiguos
-- ==========================================================================

DELETE FROM accesos_tecnicos
WHERE fecha_hora < datetime('now', '-90 days');
```

**Explicación de las líneas 23–28:**

- **Líneas 27–28**: elimina accesos con `fecha_hora` anterior a 90 días. La fecha de corte se calcula en SQLite con `datetime('now','-90 days')` (UTC). [OBSERVACIÓN TÉCNICA] La comparación es lexicográfica sobre texto ISO UTC, correcta si todas las escrituras usan `datetime('now')` o ISO UTC equivalente (formato consistente en el esquema). La columna de corte es `fecha_hora` (no `creado_en`, que también existe en la tabla) — coherente con el endpoint de purga de `flask_app.py` (línea 1569).

**Bloque de líneas 30–35 (purga de ubicaciones):**

```sql
-- ==========================================================================
-- Purga de ubicaciones antiguas
-- ==========================================================================

DELETE FROM ubicaciones_usuario
WHERE creado_en < datetime('now', '-365 days');
```

**Explicación de las líneas 30–35:**

- **Líneas 34–35**: elimina ubicaciones con `creado_en` anterior a 365 días. [OBSERVACIÓN TÉCNICA] La columna de corte aquí es `creado_en`, mientras que `fecha_hora_servidor` es la marca principal del registro; el script (y `flask_app.py` línea 1570) usa `creado_en`. No existe índice sobre `creado_en` en la migración `001`, por lo que el `DELETE` por rango hará un barrido completo de la tabla en cada ejecución (lento con volumen alto).

**Bloque de líneas 37–42 (purga de consentimientos):**

```sql
-- ==========================================================================
-- Purga de consentimientos antiguos
-- ==========================================================================

DELETE FROM consentimientos_usuario
WHERE fecha_hora < datetime('now', '-365 days');
```

**Explicación de las líneas 37–42:**

- **Líneas 41–42**: elimina consentimientos con `fecha_hora` anterior a 365 días. [ADVERTENCIA] Desde el punto de vista de gobernanza (DAMMA/DAMA-DMBOK), **borrar el consentimiento no equivale a conservar la prueba de que existió**: si la política requiere demostrar que un usuario consintió durante el período de tratamiento, el borrado total del evento de consentimiento elimina esa evidencia. El diseño actual purga los consentimientos como cualquier otro dato, sin conservar un anexo de auditoría mínima (solo el hecho de otorgamiento/revocación).

**Bloque de líneas 44–51 (reporte final):**

```sql
-- ==========================================================================
-- Reporte de registros eliminados
-- ==========================================================================

SELECT 'PURGA COMPLETADA' AS operacion,
       (SELECT COUNT(*) FROM accesos_tecnicos) AS accesos_restantes,
       (SELECT COUNT(*) FROM ubicaciones_usuario) AS ubicaciones_restantes,
       (SELECT COUNT(*) FROM consentimientos_usuario) AS consentimientos_restantes;
```

**Explicación de las líneas 44–51:**

- **Línea 48**: literal `PURGA COMPLETADA` como marcador de éxito.
- **Líneas 49–51**: subconsultas que reportan cuántos registros quedan por tabla tras la purga. [NOTA] No reporta cuántos registros se eliminaron (no se captura `rowcount`), solo los restantes; la verificación de la operación es indirecta.

## Fichas de funciones y métodos

No aplica (script SQL DML, sin funciones).

## Clases / interfaces / tipos

No aplica.

## Cumplimiento con el borrado de datos personales

- La purga **automática por antigüedad (retención limitada) está implementada**: 90 días accesos, 365 días ubicaciones, 365 días consentimientos; además existe el endpoint `/api/v1/admin/purga` en la API con la misma política configurable por `RETENCION_*_DIAS`. [NIVEL DE CERTEZA: Confirmado por código]
- La purga es **global por fecha**, sin distinción por usuario ni por solicitud individual.
- **No cubre** el *derecho al borrado puntual* (borrado a petición del usuario, "derecho al olvido"): no se halló en estas migraciones ningún mecanismo de borrado por `usuario_id` completo y verificable (las tablas no tienen FK y un DELETE por usuario tendría que recorrer varias tablas).
- La purga de logs (30 días) figura como **PENDIENTE** ("aplicable si se implementa tabla de logs"); no hay tabla de logs en las migraciones.
- Los `DELETE` no se ejecutan en una transacción explícita; en la CLI `sqlite3` cada sentencia es autocommit (si una falla, las anteriores ya se habrán aplicado).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Duplicación de política: script SQL manual + endpoint `/api/v1/admin/purga` en `flask_app.py` con plazos configurables. Riesgo de divergencia si se cambian los plazos solo en un lado (el script fija 90/365/365 en SQL, sin leer `RETENCION_*_DIAS`).
- [OBSERVACIÓN TÉCNICA] La columna de corte difiere entre tablas: `fecha_hora` en `accesos_tecnicos` y `consentimientos_usuario`, `creado_en` en `ubicaciones_usuario` (la propia tabla `accesos_tecnicos` también define `creado_en`, sin usarse para purgar). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] Sin índices sobre las columnas de corte (`creado_en` de ubicaciones; `fecha_hora` de consentimientos) en `001`: los `DELETE` por rango degradan con el volumen.
- [NOTA] El reporte no muestra cuántas filas se borraron; para auditoría conviene capturar `changes()`/`rowcount`.

## Seguridad

- [MEDIO] Los `DELETE` masivos no requieren autenticación porque son SQL directo: cualquier persona con acceso al archivo de base o a la CLI puede purgar datos sin dejar auditoría de quién lo hizo ni cuándo (no hay tabla de log de la operación de purga).
- [INFORMATIVO] No hay SQL dinámico ni concatenación: sin riesgo de inyección.
- [INFORMATIVO] El script no contiene secretos.
- [BAJO] Ejecución sin transacción ni comprobación previa de volumen: un borrado masivo es irreversible (no hay backup automático previo sugerido en el script). [RECOMENDACIÓN] Ejecutar tras un backup y con conteo previo de filas afectadas.
- [MEDIO] Privacidad: al purgar consentimientos sin conservar anexo de auditoría, puede perderse la evidencia de base legal del tratamiento de los períodos ya purgados (ver bloque 37–42). [RECOMENDACIÓN] Mantener un registro mínimo e inmutable del hecho de consentimiento (otorgado/revocado, versión, fecha) separado del ciclo de purga de 365 días.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Divergencia de plazos entre el script (fijos) y la configuración `RETENCION_*_DIAS`. [RECOMENDACIÓN] Parametrizar el script desde variables o eliminar la duplicación usando únicamente el endpoint `/api/v1/admin/purga` con la política configurada.
- [RIESGO] Borrado irreversible sin respaldo previo. [RECOMENDACIÓN] Integrar backup antes de la purga y registrar el número de filas eliminadas por tabla en un log de auditoría.
- [RIESGO] No se contempla el borrado a petición del usuario (derecho de supresión). [RECOMENDACIÓN] Implementar una rutina de borrado íntegro por `usuario_id` (ubicaciones, consentimientos, accesos, users y bases relacionadas) invocable bajo autenticación, con verificación.
- [RECOMENDACIÓN] Añadir índices sobre las columnas de corte y considerar VACUUM periódico en SQLite tras purgas grandes.
