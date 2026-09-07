# Archivo: functions/src/sendAlertSMS.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| functions/src/sendAlertSMS.ts | 341 | TypeScript | 12403 | Cloud Functions de alertas (triggers Firestore + Twilio + fallback) | FUNCIONALIDAD EXISTENTE (con ramas sin productor detectable) | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Archivo central del envío de alertas SOS por SMS. Define TRES Cloud Functions
con triggers Firestore sobre `users/{userId}/alerts/{alertId}`:

1. `sendAlertSMS` (onDocumentWritten): procesa alertas en estado `pending`
   (creación o reintento) y envía el mensaje SMS a cada contacto vía Twilio,
   con trazabilidad por contacto (status sent/failed, provider, message id,
   intentos, error) y estado global `sent | partial | failed`. Si el SMS
   falla, persiste el mensaje en la colección `pendingNotifications`
   (fallback en Firestore).
2. `sendAudioFollowUp` (onDocumentUpdated): cuando una alerta ya enviada
   adquiere un `audioUrl` (subida posterior del audio de voz), reenvía por SMS
   a los contactos que recibieron el mensaje inicial el enlace del audio.
3. `sendLocationPulseUpdate` (onDocumentUpdated): cuando se actualizan en la
   alerta la ubicación y el pulso de seguimiento (`location.timestamp` y
   `metadata.lastPulseTimestamp`), envía a los contactos un SMS con el enlace
   de Google Maps de la nueva ubicación.

Incluye helpers de idempotencia (`claimEvent` sobre la colección
`_functionEvents`), de creación del cliente Twilio (`createTwilioClient`,
soporta Auth Token o API Key) y de envío con fallback (`sendNotification`).
También define esquemas de validación con zod (`AlertSchema` y subtipos).

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` (con matices).

- `sendAlertSMS`: conectada y funcional. El cliente crea la alerta con
  `status: 'pending'` (`AlertService.ts`, línea 248), lo que dispara el
  trigger; los reintentos del cliente (`AlertQueue`) reescriben `status:
  'pending'` para reprocesar. Coherente.
- `sendAudioFollowUp`: conectada. El cliente actualiza `audioUrl` en el doc de
  la alerta tras grabar y subir el audio (`AlertService.ts`, líneas 279–282),
  lo que dispara el trigger. Coherente.
- `sendLocationPulseUpdate`: el backend está listo, pero NO se detectó en todo
  el repositorio (grep sobre el proyecto, excluyendo functions) ningún
  productor que escriba `metadata.lastPulseTimestamp` ni que actualice
  `location.timestamp` en el documento de alerta tras el envío. Sin esas
  escrituras, la condición de las líneas 313–316 nunca se cumple.
  [POTENCIALMENTE NO UTILIZADO] en el estado actual del cliente.
  [NIVEL DE CERTEZA: Altamente probable]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| onDocumentWritten, onDocumentUpdated (firebase-functions/v2/firestore) | externa | Líneas 199, 271, 305 | Sí |
| firebase-admin | externa | Líneas 77–79, 178, 263–266, 298–301, y tipos de evento | Sí |
| z | externa (zod) | Líneas 15–54 (esquemas) | Sí |
| twilio | externa (require dinámico) | Línea 122 (createTwilioClient) | Sí |

## Componentes que dependen de este archivo

| Componente | Relación |
| --- | --- |
| functions/src/index.ts | Reexporta `sendAlertSMS`, `sendAudioFollowUp`, `sendLocationPulseUpdate` (línea 6) |
| Cliente móvil AlertService.ts | Crea alertas `pending`, actualiza `audioUrl`, reintenta con `status: 'pending'` |
| Cliente móvil _layout.tsx | Comentario (línea 286) sobre el reintento de sendAlertSMS desde AlertQueue |
| Twilio | Proveedor de SMS |
| Colecciones Firestore: users/{uid}/alerts, _functionEvents, pendingNotifications | Datos de alertas, idempotencia y fallback |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| AlertTrackingMetadataSchema | zod object | esquema | Validar metadata de seguimiento (pulsos) | Líneas 15–20 |
| AlertContactSchema | zod object | esquema | Validar contacto con trazabilidad SMS | Líneas 22–30 |
| AlertLocationSchema | zod object | esquema | Validar ubicación | Líneas 32–39 |
| AlertSchema | zod object | esquema | Validar documento completo de alerta | Líneas 41–54 |
| NotificationResult | type | tipo | Resultado de envío por contacto | Líneas 56–62 |
| TWILIO_ACCOUNT_SID | process.env (trim) | string [SECRETO OCULTO] | SID de cuenta Twilio | Línea 103 |
| TWILIO_AUTH_TOKEN | process.env (trim) | string [SECRETO OCULTO] | Token de cuenta Twilio | Línea 104 |
| TWILIO_API_KEY_SID | process.env (trim) | string [SECRETO OCULTO] | SID de API Key Twilio | Línea 105 |
| TWILIO_API_SECRET | process.env (trim) | string [SECRETO OCULTO] | Secreto de API Key Twilio | Línea 106 |
| TWILIO_PHONE_NUMBER | process.env (trim) | string | Remitente de SMS | Línea 107 |
| TWILIO_DEFAULT_SENDER_ID | '+12605440417' | string | Remitente por defecto (fallback) | Línea 108 |

[NOTA] `TWILIO_DEFAULT_SENDER_ID` es un número de teléfono remitente real
visible en el código; no es un secreto (es el remitente público del SMS), pero
su presencia como fallback duro implica que, si no se configura
`TWILIO_PHONE_NUMBER`, todos los SMS salen de ese número.

## Estructura (funciones / clases / tipos)

| Nombre | Tipo | Líneas |
| --- | --- | --- |
| AlertTrackingMetadataSchema | esquema zod | 15–20 |
| AlertContactSchema | esquema zod | 22–30 |
| AlertLocationSchema | esquema zod | 32–39 |
| AlertSchema | esquema zod | 41–54 |
| NotificationResult | tipo | 56–62 |
| claimEvent | función interna async | 75–90 |
| createTwilioClient | función interna | 121–133 |
| sendNotification | función interna async | 146–197 |
| sendAlertSMS | Cloud Function onDocumentWritten | 199–269 |
| sendAudioFollowUp | Cloud Function onDocumentUpdated | 271–303 |
| sendLocationPulseUpdate | Cloud Function onDocumentUpdated | 305–340 |

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : sendAlertSMS.ts
* Descripción     : Envío idempotente de alertas y seguimiento de audio vía Cloud Functions.
* Autor           : oafon
* Fecha           : 2026-03-25
* Versión         : 1.0.1
* Lenguaje        : TypeScript 5.3
* Uso             : Trigger automático sobre users/{userId}/alerts/{alertId}
* ============================================================================ */

import { onDocumentWritten, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { z } from 'zod';
```

**Explicación de las líneas 1–13:**

- **Líneas 1–9**: cabecera documental.
- **Línea 11**: importa los triggers v2 de Firestore (escritura y actualización
  de documentos).
- **Línea 12**: firebase-admin (inicializado en index.ts).
- **Línea 13**: importa zod para validación de esquemas.

```ts
const AlertTrackingMetadataSchema = z.object({
  isTrackingActive: z.boolean(),
  lastPulseTimestamp: z.number().optional(),
  trackingIntervalMs: z.number(),
  provider: z.string().optional(),
});

const AlertContactSchema = z.object({
  name: z.string(),
  phone: z.string(),
  smsStatus: z.enum(['pending', 'sent', 'failed']),
  provider: z.string().nullable().optional(),
  providerMessageId: z.string().nullable().optional(),
  attempts: z.number().optional(),
  lastError: z.string().nullable().optional(),
});

const AlertLocationSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  accuracy: z.number(),
  timestamp: z.number(),
  isStale: z.boolean().optional(),
  staleMinutes: z.number().optional(),
});

const AlertSchema = z.object({
  userId: z.string(),
  triggeredAt: z.number(),
  triggerWord: z.string(),
  location: AlertLocationSchema,
  mapsLink: z.string(),
  audioUrl: z.string().nullable(),
  audioPath: z.string().nullable().optional(),
  messageTemplate: z.string(),
  contacts: z.array(AlertContactSchema),
  status: z.enum(['pending', 'sent', 'partial', 'failed']),
  isTest: z.boolean().optional(),
  metadata: AlertTrackingMetadataSchema.optional(),
});

type NotificationResult = {
  success: boolean;
  provider: string;
  providerMessageId: string | null;
  attempts: number;
  lastError: string | null;
};
```

**Explicación de las líneas 15–62:**

- **Líneas 15–20**: esquema del bloque `metadata` de seguimiento
  (`isTrackingActive` obligatorio, `lastPulseTimestamp` opcional,
  `trackingIntervalMs` obligatorio, `provider` opcional). Es el contrato que
  `sendLocationPulseUpdate` necesita para detectar pulsos.
- **Líneas 22–30**: esquema de contacto de alerta. `smsStatus` es enum
  `pending|sent|failed`. Incluye trazabilidad: `provider`,
  `providerMessageId`, `attempts`, `lastError`.
- **Líneas 32–39**: esquema de ubicación. Coherente con el tipo del cliente
  (`AlertLocation` en src/types/Alert.ts) en los campos base (lat, lon,
  accuracy, timestamp, isStale, staleMinutes), aunque el tipo del cliente
  añade más campos opcionales (source, permissionStatus, etc.) que zod
  PERMITIRÍA por defecto (zod sin `.strict()` no rechaza campos extra).
- **Líneas 41–54**: esquema raíz de la alerta. Coincide con el objeto que crea
  el cliente (`AlertService.send`, líneas 231–250): userId, triggeredAt,
  triggerWord, location, mapsLink, audioUrl (null inicial), audioPath (null
  inicial), messageTemplate, contacts, status 'pending', isTest.
  [NIVEL DE CERTEZA: Confirmado por código]
- **Líneas 56–62**: tipo del resultado de notificación por contacto.

```ts
/* ============================================================================
* Función         : claimEvent
* Descripción     : Evita ejecuciones duplicadas de una misma Cloud Function.
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : Firestore _functionEvents
* Ingesta         : eventKey: string, alertId: string
* Devolución      : Promise<boolean>
* Uso             : await claimEvent(key, alertId)
* ============================================================================ */
async function claimEvent(eventKey: string, alertId: string): Promise<boolean> {
  try {
    await admin.firestore().collection('_functionEvents').doc(eventKey).create({
      alertId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  } catch (error: any) {
    if (error?.code === 6 || error?.code === 'already-exists') {
      console.log(`[sendAlertSMS] Evento duplicado ignorado: ${eventKey}`);
      return false;
    }

    throw error;
  }
}
```

**Explicación de las líneas 64–90:**

- **Líneas 64–74**: cabecera de `claimEvent`.
- **Línea 75**: firma: `eventKey` (clave única del evento) y `alertId`.
- **Líneas 76–81**: intenta crear el documento en `_functionEvents` con
  `.create()` (falla si ya existe). Si se crea → `true` (este invocador es el
  único que procesa).
- **Líneas 82–89**: si el error es de documento existente (código 6 = ALREADY
  EXISTS de Firestore, o el string `'already-exists'`), registra el duplicado y
  devuelve `false`. Cualquier otro error se relanza. Mecanismo correcto de
  idempotencia por evento; la colección está protegida con reglas `if false`
  para clientes (solo Admin puede escribir). [NIVEL DE CERTEZA: Confirmado por
  código]

```ts
/* ============================================================================
* Función         : sendNotification
* Descripción     : Envía una notificación con trazabilidad por contacto.
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : Twilio, Firestore pendingNotifications
* Ingesta         : contact, body, alertId
* Devolución      : Promise<NotificationResult>
* Uso             : await sendNotification(contact, body, alertId)
* ============================================================================ */
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID?.trim();
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN?.trim();
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID?.trim();
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET?.trim();
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER?.trim();
const TWILIO_DEFAULT_SENDER_ID = '+12605440417';

/* ============================================================================
* Función         : createTwilioClient
* Descripción     : Crea el cliente Twilio soportando Auth Token o API Key.
* Fecha           : 2026-03-25
* Versión         : 1.0.1
* Lenguaje        : TypeScript 5.3
* Conexiones      : Twilio SDK, variables de entorno de Cloud Functions
* Ingesta         : Sin argumentos
* Devolución      : any
* Uso             : const client = createTwilioClient()
* ============================================================================ */
function createTwilioClient(): any {
  const twilio = require('twilio');

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  if (TWILIO_ACCOUNT_SID && TWILIO_API_KEY_SID && TWILIO_API_SECRET) {
    return twilio(TWILIO_API_KEY_SID, TWILIO_API_SECRET, { accountSid: TWILIO_ACCOUNT_SID });
  }

  throw new Error('Twilio no tiene credenciales válidas configuradas. Se requiere ACCOUNT_SID + AUTH_TOKEN o ACCOUNT_SID + API_KEY_SID + API_SECRET.');
}
```

**Explicación de las líneas 92–133:**

- **Líneas 92–102**: cabecera DUPLICADA de `sendNotification` (v1.0.0) que NO
  corresponde a ninguna función en esas líneas: la implementación real de
  `sendNotification` está más abajo (líneas 146–197) con su propia cabecera
  (v1.2.0, líneas 135–145). [OBSERVACIÓN TÉCNICA] Bloque de comentario
  duplicado/fantasma: no afecta a la ejecución pero confunde la lectura.
- **Líneas 103–107**: lee y recorta las variables de entorno de Twilio
  (declaradas también como `secrets` del trigger `sendAlertSMS`, ver líneas
  199–209: si están en Secret Manager, Firebase las inyecta en `process.env`
  en runtime).
- **Línea 108**: número remitente por defecto como constante dura.
- **Líneas 110–120**: cabecera de `createTwilioClient`.
- **Línea 121**: firma; devuelve `any` (sin tipar el SDK).
- **Línea 122**: `require('twilio')` dinámico dentro de la función (carga
  perezosa; mezcla de estilos con los imports estáticos).
- **Líneas 124–126**: prefiere el par Account SID + Auth Token.
- **Líneas 128–130**: alternativa con API Key SID + API Secret (mejor práctica
  de Twilio; limita el alcance de la credencial).
- **Línea 132**: si no hay credenciales válidas, lanza error claro.

```ts
/* ============================================================================
* Función         : sendNotification
* Descripción     : Envía una notificación SMS por contacto y registra fallback en Firestore si falla.
* Fecha           : 2026-03-26
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : Twilio, Firestore pendingNotifications
* Ingesta         : contact, body, alertId
* Devolución      : Promise<NotificationResult>
* Uso             : await sendNotification(contact, body, alertId)
* ============================================================================ */
async function sendNotification(
  contact: { name: string; phone: string },
  body: string,
  alertId: string
): Promise<NotificationResult> {
  try {
    const client = createTwilioClient();
    const senderId = TWILIO_PHONE_NUMBER || TWILIO_DEFAULT_SENDER_ID;

    const response = await client.messages.create({
      body: body,
      from: senderId,
      to: contact.phone,
    });

    return {
      success: true,
      provider: 'twilio',
      providerMessageId: response.sid ?? null,
      attempts: 1,
      lastError: null,
    };
  } catch (error: any) {
    console.error('[Twilio Error]', error);
    const errorMessage =
      typeof error?.message === 'string'
        ? error.message
        : 'Twilio rechazó el mensaje sin devolver detalle legible.';
    const errorCode = error?.code != null ? String(error.code) : null;
    const providerError = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;

    // Fallback: Guardar en Firestore si el SMS falla
    const fallbackRef = await admin.firestore().collection('pendingNotifications').add({
      targetPhone: contact.phone,
      targetName: contact.name,
      alertId,
      message: body,
      provider: 'firestore-fallback',
      providerError,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      delivered: false,
    });

    return {
      success: false,
      provider: 'firestore-fallback',
      providerMessageId: fallbackRef.id,
      attempts: 1,
      lastError: providerError,
    };
  }
}
```

**Explicación de las líneas 135–197:**

- **Líneas 135–145**: cabecera REAL de `sendNotification` (v1.2.0).
- **Líneas 146–150**: firma con `contact` (name, phone), `body` y `alertId`.
- **Líneas 151–159**: crea el cliente Twilio y envía el SMS con
  `from: senderId` y `to: contact.phone`.
- **Líneas 161–167**: éxito → resultado con `provider: 'twilio'`, `sid` del
  mensaje e `intentos: 1`.
- **Líneas 168–196**: rama de error.
  - **Línea 169**: registra el error de Twilio. [RIESGO] Los SDK de Twilio
    pueden incluir en `error` detalles de la petición; la práctica recomendada
    es loguear el sid del mensaje o el código y mensaje acotados (aquí se
    loguea el objeto completo del error; no se detectan credenciales en el
    log, pero conviene revisar).
  - **Líneas 170–175**: compone `providerError` con código y mensaje.
  - **Líneas 178–187**: FALLBACK: persiste el mensaje no enviado en
    `pendingNotifications` con `delivered: false`. [OBSERVACIÓN TÉCNICA] Esta
    colección tiene regla `allow read, write: if false` en firestore.rules:
    solo procesos con Admin SDK pueden leerla. El propio `.env.example`
    describe este mecanismo como "fallback interno en Firestore". En el
    repositorio NO se identificó ningún consumidor (Cloud Function, backend o
    job) que procese esos documentos `pendingNotifications` para reenviarlos:
    si no existe tal consumidor externo, los SMS fallidos quedan retenidos sin
    reintento desde el backend (el reintento real lo hace el cliente vía
    AlertQueue reescribiendo `status: 'pending'`). [NIVEL DE CERTEZA: No
    determinado] en cuanto al consumidor final.
  - **Líneas 189–195**: resultado de fallo con `provider:
    'firestore-fallback'` y el id del documento como `providerMessageId`.

```ts
export const sendAlertSMS = onDocumentWritten(
  {
    document: 'users/{userId}/alerts/{alertId}',
    secrets: [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_API_KEY_SID',
      'TWILIO_API_SECRET',
      'TWILIO_PHONE_NUMBER',
    ],
    region: 'us-central1',
  },
  async (event) => {
    const alertId = event.params.alertId;
    const snapshot = event.data?.after;
    if (!snapshot) return;

    const data = snapshot.data();
    // Procesar solo alertas en estado 'pending' (creación o reintento desde
    // AlertQueue). Los estados finales (sent/partial/failed) escritos por
    // esta misma función no se vuelven a procesar.
    if (!data || data.status !== 'pending') return;

    const shouldProcess = await claimEvent(`sendAlertSMS-${event.id}`, alertId);
    if (!shouldProcess) return;

    const parsed = AlertSchema.safeParse(data);
    if (!parsed.success) {
      console.error('[sendAlertSMS] Datos de alerta inválidos:', parsed.error);
      await snapshot.ref.update({ status: 'failed' });
      return;
    }

    const alert = parsed.data;
    let messageBody = alert.messageTemplate;

    if (alert.location.isStale && alert.location.staleMinutes) {
      messageBody += `\n⚠️ Ubicación registrada hace ${alert.location.staleMinutes} minutos`;
    }

    if (alert.isTest) {
      messageBody = `[PRUEBA - No es emergencia real]\n${messageBody}`;
    }
```

**Explicación de las líneas 199–241:**

- **Líneas 199–210**: definición de `sendAlertSMS` como `onDocumentWritten`
  sobre `users/{userId}/alerts/{alertId}` con:
  - `secrets`: nombres de las variables Twilio resueltas como secretos de
    Firebase Secret Manager (deben existir para desplegar).
  - `region: 'us-central1'` explícita.
  [NOTA] El trigger cubre escrituras Y borrados (documentWritten = after/before
  o ambos); la línea 213 protege el caso sin `after`.
- **Líneas 211–214**: extrae `alertId` y el snapshot posterior; si no existe
  (borrado) retorna.
- **Líneas 216–220**: procesa solo `status === 'pending'`; los estados finales
  escritos por la propia función (sent/partial/failed) o por el cliente no
  vuelven a procesarse. Comentario técnico correcto.
- **Líneas 222–223**: idempotencia por evento (`claimEvent` con clave
  `sendAlertSMS-${event.id}`). Evita dobles envíos cuando Firebase reintenta
  el mismo evento.
- **Líneas 225–230**: valida la alerta contra `AlertSchema`. Si no es válida,
  marca la alerta como `failed` (aunque los SMS no se enviaron, el estado
  refleja que el proceso no pudo continuar; nótese que NO se registra el error
  de validación en el documento, solo en consola).
- **Línea 232**: alerta tipada y validada.
- **Líneas 233–237**: compone el cuerpo del mensaje; si la ubicación es
  antigua (`isStale` y `staleMinutes`), añade un aviso con los minutos.
- **Líneas 239–241**: si es alerta de prueba, antepone el prefijo '[PRUEBA -
  No es emergencia real]' (el emoji del código fuente se conserva en el
  mensaje real).

```ts
    const results = await Promise.all(
      alert.contacts.map(async (contact) => {
        const result = await sendNotification(contact, messageBody, alertId);
        return {
          ...contact,
          smsStatus: result.success ? 'sent' : 'failed',
          provider: result.provider,
          providerMessageId: result.providerMessageId,
          attempts: result.attempts,
          lastError: result.lastError,
        };
      })
    );

    const sentCount = results.filter((contact) => contact.smsStatus === 'sent').length;
    const totalCount = results.length;

    const overallStatus =
      sentCount === totalCount ? 'sent' : sentCount > 0 ? 'partial' : 'failed';

    await snapshot.ref.update({
      contacts: results,
      status: overallStatus,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);
```

**Explicación de las líneas 243–269:**

- **Líneas 243–255**: envía en PARALELO un SMS por contacto
  (`Promise.all` con `sendNotification`) y construye el nuevo array de
  contactos con `smsStatus`, `provider`, `providerMessageId`, `attempts` y
  `lastError` según el resultado. [NOTA] Los SMS a todos los contactos se
  lanzan a la vez: con muchos contactos puede agotar el tiempo de la función o
  las cuotas de Twilio simultáneas.
- **Líneas 257–258**: cuenta enviados y totales.
- **Líneas 260–261**: estado global: `sent` si todos, `partial` si algunos,
  `failed` si ninguno.
- **Líneas 263–267**: actualiza el documento de la alerta con los contactos
  resultantes, el estado global y `sentAt` (timestamp de servidor). Esta
  escritura dispara de nuevo `onDocumentWritten`, pero el filtro
  `status !== 'pending'` la ignora (correcto).
- **Líneas 268–269**: cierre.

```ts
export const sendAudioFollowUp = onDocumentUpdated(
  'users/{userId}/alerts/{alertId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (before.audioUrl || !after.audioUrl || after.isTest) return;

    const alertId = event.params.alertId;
    const shouldProcess = await claimEvent(`sendAudioFollowUp-${event.id}`, alertId);
    if (!shouldProcess) return;

    const contacts = Array.isArray(after.contacts) ? after.contacts : [];
    const sentContacts = contacts.filter(
      (contact: { smsStatus?: string }) => contact.smsStatus === 'sent'
    );

    if (sentContacts.length === 0) return;

    const audioBody = `🔊 Mensaje de voz de tu contacto:\n${after.audioUrl}`;
    await Promise.all(
      sentContacts.map((contact: { name: string; phone: string }) =>
        sendNotification(contact, audioBody, alertId)
      )
    );

    await event.data?.after.ref.update({
      audioFollowUpSentAt: admin.firestore.FieldValue.serverTimestamp(),
      audioFollowUpCount: sentContacts.length,
    });
  }
);
```

**Explicación de las líneas 271–303:**

- **Línea 271**: trigger `onDocumentUpdated` sobre la misma ruta de alertas
  (solo actualizaciones).
- **Líneas 274–276**: obtiene datos antes y después; si falta alguno, retorna.
- **Línea 278**: condición de disparo: solo si ANTES no había `audioUrl` y
  DESPUÉS sí (transición de null → URL) y la alerta no es de prueba
  (`after.isTest`). Es decir, el follow-up solo se envía cuando el audio de
  voz se sube DESPUÉS del SMS inicial (flujo real del cliente: la alerta se
  crea sin audio y `AudioRecordingService.recordAndUpload` actualiza
  `audioUrl`/`audioPath` después, AlertService.ts líneas 279–282). Coherente.
- **Líneas 280–282**: idempotencia con clave `sendAudioFollowUp-${event.id}`.
- **Líneas 284–289**: filtra los contactos cuyo SMS inicial fue `'sent'`; si
  ninguno, no envía nada.
- **Línea 291**: cuerpo del SMS con el enlace público del audio
  (`after.audioUrl`). [RIESGO] La URL de descarga de Firebase Storage incluye
  un token de descarga; se propaga por SMS a todos los contactos. Es el diseño
  previsto (que los contactos escuchen el audio), pero conviene tener presente
  la privacidad: el enlace permite acceder al audio a quien lo reciba, y queda
  almacenado en los hilos SMS de los contactos.
- **Líneas 292–296**: reenvía a los contactos en paralelo con
  `sendNotification` (sin estado de fallo de estos follow-ups en la alerta:
  los resultados NO se persisten por contacto, solo el conteo).
- **Líneas 298–301**: marca en la alerta `audioFollowUpSentAt` y
  `audioFollowUpCount`.

```ts
export const sendLocationPulseUpdate = onDocumentUpdated(
  'users/{userId}/alerts/{alertId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Detectar si la ubicación ha cambiado y si el pulso fue actualizado
    const locationChanged = before.location?.timestamp !== after.location?.timestamp;
    const pulseUpdated = before.metadata?.lastPulseTimestamp !== after.metadata?.lastPulseTimestamp;

    if (!locationChanged || !pulseUpdated || after.isTest) return;

    const alertId = event.params.alertId;
    const shouldProcess = await claimEvent(`sendPulseUpdate-${event.id}-${after.location.timestamp}`, alertId);
    if (!shouldProcess) return;

    const contacts = Array.isArray(after.contacts) ? after.contacts : [];
    const sentContacts = contacts.filter(
      (contact: { smsStatus?: string }) => contact.smsStatus === 'sent'
    );

    if (sentContacts.length === 0) return;

    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${after.location.lat},${after.location.lon}`;
    const pulseBody = `📍 Actualización de ubicación en tiempo real:\n${mapsLink}`;

    await Promise.all(
      sentContacts.map((contact: { name: string; phone: string }) =>
        sendNotification(contact, pulseBody, alertId)
      )
    );

    console.log(`[PulseUpdate] Ubicación enviada para alerta ${alertId}`);
  }
);
```

**Explicación de las líneas 305–341:**

- **Línea 305**: trigger `onDocumentUpdated` sobre la misma ruta.
- **Líneas 308–310**: datos antes y después.
- **Líneas 313–314**: detecta si cambió la ubicación (`location.timestamp`) y
  si cambió el pulso (`metadata.lastPulseTimestamp`).
- **Línea 316**: solo procesa si AMBOS cambiaron y la alerta no es de prueba.
- **Líneas 318–320**: idempotencia con clave que incluye el timestamp de
  ubicación (`sendPulseUpdate-${event.id}-${after.location.timestamp}`), de
  modo que cada nueva posición genera un evento único.
- **Líneas 322–327**: contactos con SMS inicial `'sent'`.
- **Líneas 329–330**: construye el enlace de Google Maps con lat/lon y el
  cuerpo del mensaje.
- **Líneas 332–336**: envía el SMS de actualización en paralelo.
- **Línea 338**: log de confirmación. [OBSERVACIÓN TÉCNICA] No se persiste
  ningún marcador en la alerta tras el envío del pulso (a diferencia del
  follow-up de audio que sí escribe `audioFollowUpSentAt`): no hay
  trazabilidad persistente del envío de pulsos.
- [OBSERVACIÓN TÉCNICA GLOBAL] Como se indicó en Clasificación, no se halló en
  el cliente ningún productor que actualice `metadata.lastPulseTimestamp` ni
  `location.timestamp` en el documento de alerta tras el envío: sin ello, la
  condición de la línea 316 no se cumple y esta función no se ejecutaría en la
  práctica. [POTENCIALMENTE NO UTILIZADO] [NIVEL DE CERTEZA: Altamente probable]

## Fichas de funciones y métodos

### sendAlertSMS (líneas 199–269)

- Firma (código original):
  `export const sendAlertSMS = onDocumentWritten({ document: 'users/{userId}/alerts/{alertId}', secrets: [...], region: 'us-central1' }, async (event) => {...})`
- Propósito técnico: trigger Firestore que consume alertas `pending` y emite
  SMS por contacto con trazabilidad.
- Propósito funcional: notificar por SMS a los contactos de emergencia cuando
  se crea una alerta SOS (o se reintenta).
- Parámetros: `event` con `params.alertId`, `data.after`.
- Retorno: `Promise<void>`; escribe en la alerta contactos/estado/sentAt.
- Excepciones: no capturadas globalmente; un error propagado (p. ej. en el
  update final) provocaría reintento de Firebase del mismo evento (mitigado por
  `claimEvent`).
- Dependencias: zod, Twilio (vía sendNotification), Firestore.
- Desde dónde se llama: escritura del cliente en `users/{uid}/alerts/{id}`
  (creación con status pending o reintento).
- Efectos secundarios: envío de SMS (coste Twilio), escrituras en la alerta,
  documentos en `_functionEvents` y `pendingNotifications` en caso de fallo.
- Riesgos: spam por contactos arbitrarios (ver Seguridad), coste de SMS,
  fallos parciales.

### sendAudioFollowUp (líneas 271–303)

- Firma (código original):
  `export const sendAudioFollowUp = onDocumentUpdated('users/{userId}/alerts/{alertId}', async (event) => {...})`
- Propósito técnico: trigger Firestore que reenvía por SMS el enlace del audio
  de voz cuando este se añade tras el SMS inicial.
- Propósito funcional: que los contactos reciban y escuchen el mensaje de voz.
- Parámetros: `event` (before/after).
- Retorno: `Promise<void>`; escribe `audioFollowUpSentAt`/`audioFollowUpCount`.
- Excepciones: sin manejo explícito; errores de `sendNotification` se capturan
  internamente (fallback).
- Dependencias: Twilio (vía sendNotification), Firestore.
- Efectos secundarios: envío de SMS con enlace público de audio.
- Riesgos: propagación del enlace del audio por SMS; ausencia de trazabilidad
  de fallo por contacto en esta rama.

### sendLocationPulseUpdate (líneas 305–340)

- Firma (código original):
  `export const sendLocationPulseUpdate = onDocumentUpdated('users/{userId}/alerts/{alertId}', async (event) => {...})`
- Propósito técnico: trigger Firestore que envía a los contactos la ubicación
  actualizada durante el seguimiento activo de una alerta.
- Propósito funcional: informar en tiempo real de la evolución de la
  ubicación del usuario en emergencia.
- Parámetros: `event` (before/after).
- Retorno: `Promise<void>`; sin escrituras de trazabilidad en la alerta.
- Dependencias: Twilio (vía sendNotification), Firestore.
- Efectos secundarios: envío de SMS con enlace de Google Maps.
- Riesgos: sin productor detectable en el cliente (ver Observaciones);
  ausencia de registro de envío.

### claimEvent (líneas 75–90)

- Firma: `async function claimEvent(eventKey: string, alertId: string): Promise<boolean>`
- Propósito: garantizar idempotencia entre reintentos de Firebase.
- Flujo: crear doc en `_functionEvents`; si ya existe, devolver false.
- Riesgos: acumulación de documentos en `_functionEvents` (crecimiento sin
  política de expiración/limpieza en este módulo).

### createTwilioClient (líneas 121–133)

- Firma: `function createTwilioClient(): any`
- Propósito: instanciar el cliente Twilio con Auth Token o API Key.
- Retorno: cliente Twilio o lanza Error si no hay credenciales.
- Riesgos: devolver `any` sin tipado; dependencia de entorno bien configurado.

### sendNotification (líneas 146–197)

- Firma:
  `async function sendNotification(contact: { name: string; phone: string }, body: string, alertId: string): Promise<NotificationResult>`
- Propósito: enviar un SMS con Twilio y, si falla, persistir el fallback en
  `pendingNotifications`.
- Retorno: `NotificationResult` (success/provider/messageId/attempts/lastError).
- Riesgos: ver Seguridad y Observaciones (consumidor del fallback no
  identificado; log del objeto de error de Twilio).

## Clases / interfaces / tipos

| Nombre | Tipo | Responsabilidad | Campos |
| --- | --- | --- | --- |
| AlertSchema | esquema zod | Validar el documento completo de alerta | userId, triggeredAt, triggerWord, location, mapsLink, audioUrl, audioPath?, messageTemplate, contacts[], status, isTest?, metadata? |
| AlertContactSchema | esquema zod | Validar contacto con trazabilidad | name, phone, smsStatus, provider?, providerMessageId?, attempts?, lastError? |
| AlertLocationSchema | esquema zod | Validar ubicación | lat, lon, accuracy, timestamp, isStale?, staleMinutes? |
| AlertTrackingMetadataSchema | esquema zod | Validar metadata de seguimiento | isTrackingActive, lastPulseTimestamp?, trackingIntervalMs, provider? |
| NotificationResult | tipo | Resultado de envío | success, provider, providerMessageId, attempts, lastError |

[NOTA] Los esquemas zod validan la ESTRUCTURA de la alerta pero no son
`.strict()`: los campos extra (p. ej. los añadidos por el tipo del cliente
`Alert.ts`, como `source`, `permissionStatus`, `iaAnalysis`) se ignoran, no se
rechazan. Esto da flexibilidad pero reduce el rigor del contrato.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Cabecera de comentario duplicada de `sendNotification`
  (líneas 92–102, versión 1.0.0) antes de las constantes Twilio, que no
  corresponde a la implementación real (líneas 146–197, versión 1.2.0).
  Bloque documental fantasma. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `sendLocationPulseUpdate` no tiene productor detectable
  en el cliente (grep de `metadata`, `lastPulseTimestamp`, `isTrackingActive`
  en todo el proyecto no arroja escrituras fuera de este archivo). La función
  quedaría inactiva salvo que exista un emisor no auditable aquí.
  [POTENCIALMENTE NO UTILIZADO] [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] El fallback `pendingNotifications` se describe en el
  propio `.env.example` como mecanismo interno; la colección está bloqueada
  para clientes (rules `if false`) y no se halló consumidor interno que la
  procese. Si no existe un procesador externo (backend/admin con Admin SDK),
  los SMS fallidos no se reintentan desde el backend; el reintento real lo hace
  el cliente (AlertQueue → reescribe `status: 'pending'`).
  [NIVEL DE CERTEZA: No determinado]
- [OBSERVACIÓN TÉCNICA] Coherencia con el esquema del cliente confirmada: la
  alerta que crea `AlertService.send` (líneas 231–250) satisface `AlertSchema`
  (status 'pending', audioUrl/audioPath null, contacts con smsStatus
  'pending'). El `AppAlert` del cliente (src/types/Alert.ts) incluye campos
  extra opcionales (iaAnalysis, source, etc.) que zod ignora.
  [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `sendAudioFollowUp` y `sendLocationPulseUpdate` no
  actualizan el estado de los contactos con el resultado del reenvío (a
  diferencia de `sendAlertSMS`); la trazabilidad de estas ramas es limitada.
- [OBSERVACIÓN TÉCNICA] La colección `_functionEvents` crece con cada evento
  procesado y no se observa política de expiración/limpieza en el módulo
  (cleanupOldAlerts no la cubre). Crecimiento indefinido potencial.
- [OBSERVACIÓN TÉCNICA] `sendAlertSMS` no distingue si el evento procede de una
  creación o de una actualización a `pending`; el uso de `claimEvent` con el
  `event.id` (único por evento) hace seguro el reintento, pero cada
  reescritura de `pending` por el cliente (intento de reintento manual)
  genera un evento nuevo con id distinto y dispara de nuevo el envío: es el
  mecanismo de reintento previsto. [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] Los emojis del código (aviso de ubicación antigua, audio, pin de Maps)
  se conservan en los mensajes SMS reales; no afectan a la lógica.

## Seguridad

- [MEDIO] Validación de destinatarios insuficiente: la función envía SMS a
  cualquier `contacts[].phone` presente en el documento de la alerta validado
  por zod, SIN comprobar que esos contactos pertenezcan a la colección de
  contactos aprobados del usuario (`users/{uid}/contacts`). Como las reglas de
  Firestore permiten al usuario autenticado escribir en `users/{uid}/**`
  (incluida su subcolección `alerts`), un atacante autenticado podría crear
  una alerta con `status: 'pending'` y contactos con números arbitrarios y un
  `messageTemplate` a su elección; la función enviaría SMS a terceros
  (spam/phishing con coste a cargo de la cuenta Twilio). El propio `AlertSchema`
  valida estructura, no legitimidad de destinatarios.
- [BAJO] Envío de URL con token de descarga de audio (`audioUrl`) por SMS en
  `sendAudioFollowUp`: el enlace permite reproducir el audio a quien lo posea y
  queda persistido en los hilos SMS de los contactos. Riesgo de privacidad
  inherente al diseño; mitigado parcialmente porque cleanupOldAlerts borra el
  objeto a los 30 días (la URL deja de funcionar).
- [BAJO] Registro del objeto de error de Twilio completo en consola
  (línea 169): los errores del SDK pueden incluir detalles de la transacción;
  no se observan credenciales en esos objetos, pero se recomienda loguear solo
  código/mensaje.
- [INFORMATIVO] Los secretos de Twilio se gestionan como secretos de la
  función (`secrets: [...]`), práctica correcta; el código los lee de
  `process.env` tras la inyección.
- [INFORMATIVO] Las colecciones internas `_functionEvents` y
  `pendingNotifications` están bloqueadas para clientes por reglas (`if
  false`); solo el Admin SDK escribe. Correcto.
- [INFORMATIVO] No se aplica App Check ni límites de tasa; el abuso pasa por
  las reglas de Firestore (ver hallazgo MEDIO).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Validar que los destinatarios de SMS correspondan a
  contactos aprobados del usuario (consultar `users/{uid}/contacts` o exigir
  que el documento de alerta lo genere exclusivamente la lógica de negocio),
  para evitar abuso del servicio SMS.
- [RECOMENDACIÓN] Identificar/implementar el consumidor de
  `pendingNotifications` (procesador con reintentos y expiración) o eliminar
  el fallback si el reintento se gestiona solo desde el cliente.
- [RECOMENDACIÓN] Implementar o confirmar el productor del pulso de ubicación
  en el cliente (metadata + location.timestamp) o marcar
  `sendLocationPulseUpdate` como deshabilitada hasta que exista.
- [RECOMENDACIÓN] Añadir trazabilidad persistente (estado por contacto y
  marcas de tiempo) también en `sendAudioFollowUp` y
  `sendLocationPulseUpdate`.
- [RECOMENDACIÓN] Establecer una política de expiración/limpieza para
  `_functionEvents` (p. ej. borrado por antigüedad en cleanupOldAlerts o TTL).
- [RECOMENDACIÓN] Limitar el paralelismo de envíos (p. ej. procesar contactos
  en tandas) para no exceder límites de tiempo/cuota con muchas alertas.
- [RECOMENDACIÓN] Eliminar la cabecera documental duplicada (líneas 92–102) y
  loguear los errores de Twilio de forma acotada.
