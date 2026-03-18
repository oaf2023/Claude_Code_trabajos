import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const AlertContactSchema = z.object({
  name: z.string(),
  phone: z.string(),
  smsStatus: z.enum(['pending', 'sent', 'failed']),
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
  messageTemplate: z.string(),
  contacts: z.array(AlertContactSchema),
  status: z.enum(['pending', 'sent', 'partial', 'failed']),
  isTest: z.boolean().optional(),
});

/**
 * Envía la alerta usando el proveedor configurado (Twilio).
 * Cae al método interno de Firestore si Twilio no está configurado.
 */
async function sendNotification(
  contact: { name: string; phone: string },
  body: string,
  alertId: string
): Promise<{ success: boolean; method: string }> {

  // 1. Intentar Twilio si las credenciales existen
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      await client.messages.create({
        body: body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: contact.phone
      });

      return { success: true, method: 'twilio_sms' };
    } catch (error) {
      console.error(`[Twilio Error] Para ${contact.phone}:`, error);
    }
  }

  // 2. Método de respaldo (Fallback): Notificación interna en Firestore
  console.log(`[ALERTA FALLBACK] → ${contact.name} (${contact.phone}): ${body}`);

  await admin.firestore().collection('pendingNotifications').add({
    targetPhone: contact.phone,
    targetName: contact.name,
    alertId,
    message: body,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    delivered: false,
  });

  return { success: true, method: 'internal_notification' };
}

/**
 * Triggered cuando se crea un nuevo documento de alerta en Firestore.
 */
export const sendAlertSMS = onDocumentCreated(
  'users/{userId}/alerts/{alertId}',
  async (event) => {
    const alertId = event.params.alertId;
    const snapshot = event.data;
    if (!snapshot) return;

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

    const results = await Promise.allSettled(
      alert.contacts.map((contact) =>
        sendNotification(contact, messageBody, alertId)
          .then((r) => ({ phone: contact.phone, ...r }))
          .catch((err) => ({
            phone: contact.phone,
            success: false,
            method: 'error',
            error: String(err),
          }))
      )
    );

    const updatedContacts = alert.contacts.map((contact, i) => {
      const result = results[i];
      const success = result.status === 'fulfilled' && result.value.success;
      return { ...contact, smsStatus: success ? 'sent' : 'failed' };
    });

    const sentCount = updatedContacts.filter((c) => c.smsStatus === 'sent').length;
    const totalCount = updatedContacts.length;

    let overallStatus: 'sent' | 'partial' | 'failed';
    if (sentCount === totalCount) overallStatus = 'sent';
    else if (sentCount > 0) overallStatus = 'partial';
    else overallStatus = 'failed';

    await snapshot.ref.update({
      contacts: updatedContacts,
      status: overallStatus,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      `[sendAlertSMS] Alerta ${alertId}: ${sentCount}/${totalCount} notificaciones enviadas`
    );
  }
);

/**
 * Triggered cuando se actualiza la alerta con un audioUrl.
 */
export const sendAudioFollowUp = onDocumentUpdated(
  'users/{userId}/alerts/{alertId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (before.audioUrl || !after.audioUrl) return;
    if (after.isTest) return;

    const alertId = event.params.alertId;
    const contacts: Array<{ name: string; phone: string; smsStatus: string }> =
      after.contacts || [];
    const sentContacts = contacts.filter((c) => c.smsStatus === 'sent');

    const audioBody = `🔊 Mensaje de voz de tu contacto:\n${after.audioUrl}`;

    await Promise.allSettled(
      sentContacts.map((contact) =>
        sendNotification(contact, audioBody, alertId)
      )
    );

    console.log(
      `[sendAudioFollowUp] Audio enviado a ${sentContacts.length} contactos`
    );
  }
);
