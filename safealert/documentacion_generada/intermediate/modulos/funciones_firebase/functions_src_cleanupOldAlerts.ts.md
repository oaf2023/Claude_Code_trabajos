# Archivo: functions/src/cleanupOldAlerts.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| functions/src/cleanupOldAlerts.ts | 59 | TypeScript | 2003 | Cloud Function programada (onSchedule) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define `cleanupOldAlerts`, una Cloud Function programada que se ejecuta cada
día a las 03:00 (zona horaria America/Argentina/Buenos_Aires) y elimina las
alertas de emergencia con más de 30 días de antigüedad. Por cada alerta
antigua borra primero su audio asociado de Firebase Storage (si existe) y
después el documento de la alerta en Firestore, usando batches por usuario
para minimizar escrituras. Es una tarea de higiene de datos (retención de 30
días) y de control de costes (evita acumular audios y documentos).

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`.

La función está exportada desde `index.ts` (línea 7). En el cliente móvil
existe una referencia de configuración que la menciona
(`src/config/features.ts`, línea 176) junto a `storage.rules`, lo que sugiere
que la política de retención es conocida por el equipo. El cron es válido y la
lógica de borrado es funcional para el patrón de almacenamiento que usa el
cliente (`users/{userId}/alerts/{alertId}/voice.m4a`).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| onSchedule (firebase-functions/v2/scheduler) | externa | Línea 14: definición del job | Sí |
| firebase-admin | externa | Líneas 18–19 (firestore y storage) | Sí |

## Componentes que dependen de este archivo

| Componente | Relación |
| --- | --- |
| functions/src/index.ts | Reexporta `cleanupOldAlerts` (línea 7) |
| Firebase Scheduler | Ejecuta el cron `0 3 * * *` en la zona indicada |
| Firebase Storage | Borra los audios en `users/{uid}/alerts/{alertId}/voice.m4a` |
| Firestore (colección users + subcolección alerts) | Borra documentos de alertas antiguas |
| src/config/features.ts (cliente) | Menciona `cleanupOldAlerts` en su documentación de configuración (línea 176) |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| schedule | '0 3 * * *' | string (cron) | Ejecución diaria a las 03:00 | Línea 15 |
| timeZone | 'America/Argentina/Buenos_Aires' | string | Zona horaria del cron | Línea 15 |
| cutoff | Date.now() - 30*24*60*60*1000 | number | Marca temporal límite (30 días) | Línea 17 |
| totalDeleted | 0 inicial | number | Contador de alertas eliminadas | Líneas 22, 54, 57 |

[NOTA] Valor mágico de retención: 30 días de antigüedad. No se define como
constante con nombre ni es configurable por variable de entorno; el periodo de
retención es un literal inline. Significado: 30 días = política de retención
de alertas.

## Estructura (funciones / clases / tipos)

| Nombre | Tipo | Líneas |
| --- | --- | --- |
| cleanupOldAlerts | Cloud Function onSchedule | 14–59 |

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : cleanupOldAlerts.ts
* Descripción     : Limpieza programada de alertas antiguas y sus audios asociados.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3
* Uso             : Trigger scheduler diario.
* ============================================================================ */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

export const cleanupOldAlerts = onSchedule(
  { schedule: '0 3 * * *', timeZone: 'America/Argentina/Buenos_Aires' },
  async () => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const db = admin.firestore();
    const bucket = admin.storage().bucket();
```

**Explicación de las líneas 1–19:**

- **Líneas 1–9**: cabecera documental del archivo.
- **Línea 11**: importa `onSchedule` del módulo scheduler de funciones v2.
- **Línea 12**: importa firebase-admin (inicializado en index.ts).
- **Línea 14**: define el job programado.
- **Línea 15**: `schedule: '0 3 * * *'` (minuto 0, hora 3, cada día) y zona
  horaria Argentina. [NOTA] En Firebase, los cron de Cloud Scheduler se
  interpretan en UTC salvo que se especifique timeZone; aquí se fuerza la zona
  deseada correctamente.
- **Línea 17**: `cutoff`: momento actual menos 30 días (30*24*60*60*1000 ms).
  Las alertas con `triggeredAt < cutoff` se consideran antiguas.
- **Línea 18**: referencia a Firestore.
- **Línea 19**: referencia al bucket de Storage por defecto del proyecto.

```ts
    const usersSnapshot = await db.collection('users').get();
    let totalDeleted = 0;

    for (const userDoc of usersSnapshot.docs) {
      const alertsRef = userDoc.ref.collection('alerts');
      const oldAlerts = await alertsRef
        .where('triggeredAt', '<', cutoff)
        .limit(100)
        .get();

      const batch = db.batch();

      for (const alertDoc of oldAlerts.docs) {
        const alertData = alertDoc.data() as { audioPath?: string | null; audioUrl?: string | null };
        const audioPath =
          alertData.audioPath ??
          (alertData.audioUrl ? `users/${userDoc.id}/alerts/${alertDoc.id}/voice.m4a` : null);

        if (audioPath) {
          await bucket
            .file(audioPath)
            .delete()
            .catch((error: any) => {
              if (error?.code !== 404) {
                console.error(`[cleanupOldAlerts] Error borrando audio ${audioPath}:`, error);
              }
            });
        }

        batch.delete(alertDoc.ref);
      }

      await batch.commit();
      totalDeleted += oldAlerts.size;
    }

    console.log(`[cleanupOldAlerts] Eliminadas ${totalDeleted} alertas antiguas`);
  }
);
```

**Explicación de las líneas 21–59:**

- **Línea 21**: lee TODOS los documentos de la colección `users` en memoria.
  [RIESGO] Con una base de usuarios grande, esta consulta sin paginación puede
  consumir mucha memoria y tiempo (el tamaño máximo de respuesta de una
  consulta Firestore es ~10 MiB / 30 000 docs en una sola lectura). Se
  recomienda paginar. Impacto: MEDIO (escalabilidad).
- **Línea 22**: contador global.
- **Línea 24**: itera usuario por usuario (secuencial, no en paralelo; seguro
  pero lento si hay miles de usuarios).
- **Línea 25**: referencia a la subcolección `alerts` del usuario.
- **Líneas 26–29**: consulta las alertas con `triggeredAt < cutoff`,
  limitadas a 100 por usuario. [NOTA] Si un usuario tiene más de 100 alertas
  antiguas, el resto queda sin limpiar hasta ejecuciones posteriores (no hay
  paginación/bucle interno).
- **Línea 31**: crea un batch de escrituras por usuario (hasta 100 borrados;
  dentro del límite de 500 operaciones por batch).
- **Líneas 33–48**: bucle por alerta antigua.
  - **Línea 34**: tipa los campos `audioPath`/`audioUrl` de la alerta.
  - **Líneas 35–37**: determina la ruta del audio: prioriza `audioPath`; si no
    existe pero sí `audioUrl`, infiere la ruta estándar
    `users/{uid}/alerts/{alertId}/voice.m4a`. Esta ruta coincide con la que
    genera el cliente (`AudioRecordingService` usa
    `buildAlertAudioStoragePath(userId, alertId)` → `users/{userId}/alerts/{alertId}/voice.m4a`,
    src/config/features.ts línea 185). [NIVEL DE CERTEZA: Confirmado por código]
  - **Líneas 39–48**: si hay ruta, borra el objeto de Storage; los errores
    `404` se ignoran (el audio ya no existe); el resto se registra y NO se
    propaga (el borrado de Firestore continúa aunque falle el de Storage,
    dejando posibles audios huérfanos).
  - **Línea 50**: encola el borrado del documento de alerta en el batch.
- **Línea 53**: confirma el batch (borra hasta 100 documentos por usuario).
- **Línea 54**: acumula el total (usa `oldAlerts.size`, 0 si la consulta
  devolvió vacío).
- **Línea 57**: log del total eliminado.
- **Línea 58–59**: cierre del callback y del `onSchedule`.

## Fichas de funciones y métodos

### cleanupOldAlerts (líneas 14–59)

- Firma (código original):
  `export const cleanupOldAlerts = onSchedule({ schedule: '0 3 * * *', timeZone: 'America/Argentina/Buenos_Aires' }, async () => {...})`
- Propósito técnico: job cron que ejecuta borrado masivo en Firestore y
  Storage mediante Admin SDK.
- Propósito funcional: aplicar la política de retención de 30 días de alertas
  de emergencia y sus audios (privacidad y ahorro de costes).
- Parámetros: ninguno (evento de scheduler implícito).
- Retorno: `Promise<void>`.
- Excepciones: no se capturan errores de Firestore a nivel global; un fallo de
  lectura de usuarios o de commit propagaría y Firebase reintentaría el job
  según política (los jobs onSchedule reintentan según configuración de Cloud
  Scheduler; por defecto la v2 aplica reintentos del scheduler).
- Dependencias: firebase-admin (Firestore + Storage), Firebase Scheduler.
- Flujo interno: calcular cutoff → listar usuarios → por usuario consultar
  alertas antiguas (max 100) → borrar audios (ignorando 404) → batch-delete de
  documentos → sumar total.
- Desde dónde se llama: automático, vía Cloud Scheduler.
- Efectos secundarios: eliminación irreversible de alertas y audios con más de
  30 días; consumo de cuota de Firestore (lectura de toda la colección users) y
  Storage.
- Riesgos: escalabilidad (usuarios sin paginar), alertas huérfanas si falla el
  borrado de Storage y no se registra para reproceso, infraselección con más de
  100 alertas por usuario, posible timeout en bases grandes (el límite de
  ejecución de v2 por defecto es 540 s).

## Clases / interfaces / tipos

Ninguna declarada; se usa un tipo inline para el cast de datos de alerta
(línea 34).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] La política de retención (30 días) está inline en la
  línea 17; no es configurable (ni por env ni por Firestore), lo que obliga a
  redeployar para cambiarla. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] El campo de comparación `triggeredAt` es un timestamp
  numérico escrito por el cliente (`AlertService.send` usa `triggeredAt: Date.now()`),
  coherente con el tipo number del esquema del backend (sendAlertSMS.ts). La
  comparación `< cutoff` es correcta. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] Si una alerta tuviera un `audioUrl` con firma u otra
  estructura de Storage distinta (p. ej. copias de seguridad), la inferencia de
  ruta (líneas 35–37) borraría un objeto que no corresponde o fallaría con 404
  (ignorado). Riesgo residual BAJO.
- [OBSERVACIÓN TÉCNICA] La consulta a `users` no distingue entre documentos de
  perfil (id = teléfono E.164, según app/bienvenida.tsx) y documentos raíz con
  subcolecciones de alertas; ambas familias se procesan. [NIVEL DE CERTEZA:
  Altamente probable]
- [NOTA] No existe un límite superior de duración ni particionado: para una
  base grande convendría migrar a un fan-out con colas (p. ej. Cloud Tasks o
  subcolecciones por día). [NIVEL DE CERTEZA: Inferido]

## Seguridad

- [INFORMATIVO] La función usa Admin SDK, por lo que ignora las reglas de
  seguridad de Firestore/Storage; es un comportamiento esperado en tareas de
  mantenimiento con privilegios elevados. El riesgo es que un error de lógica
  borre datos de más; hoy la condición (`triggeredAt < cutoff`, rutas
  derivadas del propio doc) acota razonablemente el alcance.
- [BAJO] Si el borrado de Storage falla por causas distintas a 404, se ignora
  tras el log y se borra igualmente el documento Firestore: el audio queda
  huérfano en Storage (coste y posible resto de datos personales). No hay
  registro de auditoría persistente del audio no borrado.
- [INFORMATIVO] No se registran datos personales en logs: solo rutas de audio y
  contadores.
- [BAJO] La consulta masiva a `users` puede activar cuotas y costes elevados
  (lecturas completas de documentos cada día), y con reglas de red no
  configuradas podría exceder límites de tiempo; no es un fallo de seguridad
  sino operacional.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Paginar la consulta de `users` (y la de alertas por usuario,
  actualmente limitada a 100) para garantizar la limpieza completa y evitar
  timeouts con volúmenes grandes.
- [RECOMENDACIÓN] Extraer la retención (30 días) y el cron a configuración
  (env o documento de configuración en Firestore) para ajustarla sin redeploy.
- [RECOMENDACIÓN] Registrar en un log estructurado (o documento de auditoría)
  los audios que no pudieron borrarse, para reproceso manual.
- [RECOMENDACIÓN] Considerar borrado por lotes paralelos controlados (p. ej.
  procesar N usuarios por ejecución con un estado de checkpoint) en lugar del
  barrido secuencial completo.
