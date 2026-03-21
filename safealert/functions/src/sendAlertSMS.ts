/* ============================================================================
* Archivo         : sendAlertSMS.ts
* Descripción     : Envío idempotente de alertas y seguimiento de audio vía Cloud Functions.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3
* Uso             : Trigger automático sobre users/{userId}/alerts/{alertId}
* ============================================================================ */

import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { z } from 'zod';

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
});

type NotificationResult = {
  success: boolean;
  provider: string;
  providerMessageId: string | null;
  attempts: number;
  lastError: string | null;
};

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
async function sendNotification(
  contact: { name: string; phone: string },
  body: string,
  alertId: string
): Promise<NotificationResult> {
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    try {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const response = await client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
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
      return {
        success: false,
        provider: 'twilio',
        providerMessageId: null,
        attempts: 1,
        lastError: error?.message ?? String(error),
      };
    }
  }

  const fallbackRef = await admin.firestore().collection('pendingNotifications').add({
    targetPhone: contact.phone,
    targetName: contact.name,
    alertId,
    message: body,
    provider: 'firestore-fallback',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    delivered: false,
  });

  return {
    success: true,
    provider: 'firestore-fallback',
    providerMessageId: fallbackRef.id,
    attempts: 1,
    lastError: null,
  };
}

export const sendAlertSMS = onDocumentCreated(
  'users/{userId}/alerts/{alertId}',
  async (event) => {
    const alertId = event.params.alertId;
    const snapshot = event.data;
    if (!snapshot) return;

    const shouldProcess = await claimEvent(`sendAlertSMS-${event.id}`, alertId);
    if (!shouldProcess) return;

    const data = snapshot.data();
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
