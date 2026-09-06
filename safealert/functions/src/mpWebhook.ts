/* ============================================================================
* Archivo         : mpWebhook.ts
* Descripción     : Webhook para recibir actualizaciones de estado de Mercado Pago.
*                   Fase 1 de reparación (2026-09-06): ahora verifica la firma
*                   x-signature de Mercado Pago antes de procesar cualquier
*                   evento (fail-closed). El algoritmo replica
*                   backend/flask_app.py::verify_mp_signature.
*                   [FASE 2] Parsea external_reference con formato uid:{uid}:deviceId:{deviceId}
*                   para vincular correctamente el pago con el usuario.
* Autor           : oafon / Equipo SafeAlert
* Fecha           : 2026-03-23 (original) · 2026-09-06 (Fase 1 + Fase 2)
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.3
* Uso             : Webhook configurado en panel de Mercado Pago.
* Cambios         :
*   [2026-09-06] Fase 1 (0001): verificación obligatoria de X-Signature y
*   X-Request-Id (HMAC-SHA256 + ventana anti-replay) antes de procesar eventos;
*   401 si la firma no es válida; 503 si MP_WEBHOOK_SECRET no está configurado.
*   [2026-09-06] Fase 2 (0002): external_reference ahora contiene uid:deviceId;
*   se parsea para obtener el uid del usuario y vincularlo a su suscripción.
* ============================================================================ */

import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { verificarFirmaWebhookMercadoPago } from './mpSignature';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000';
const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

// Secreto de firma de webhooks (Secret Manager; también acepta variable de
// entorno local). Debe coincidir con el MP_WEBHOOK_SECRET del backend.
const mpWebhookSecret = defineSecret('MP_WEBHOOK_SECRET');

/* ============================================================================
* Función         : extraerDataId
* Descripción     : Obtiene el identificador del recurso notificado (data.id)
*                   desde la query string o el cuerpo JSON del webhook.
* Fecha           : 2026-09-06
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : mpWebhook
* Ingesta         : req: Request (express)
* Devolución      : string (vacío si no existe)
* Uso             : const dataId = extraerDataId(req);
* ============================================================================ */
function extraerDataId(req: {
  query: Record<string, unknown>;
  body: unknown;
}): string {
  const deQuery = req.query['data.id'];
  if (deQuery !== undefined && deQuery !== null && String(deQuery).trim() !== '') {
    return String(deQuery).trim();
  }
  const cuerpo = req.body as { data?: { id?: unknown } } | null;
  const deBody = cuerpo?.data?.id;
  if (deBody !== undefined && deBody !== null && String(deBody).trim() !== '') {
    return String(deBody).trim();
  }
  return '';
}

/* ============================================================================
* Función         : parsearExternalReference
* Descripción     : Extrae uid y deviceId del external_reference con formato
*                   uid:{uid}:deviceId:{deviceId} (Fase 2) o formatos legacy
*                   (monthly:{deviceId}, annual:{deviceId}).
* Fecha           : 2026-09-06
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : mpWebhook
* Ingesta         : externalRef: string
* Devolución      : { uid: string; deviceId: string }
* Uso             : const { uid, deviceId } = parsearExternalReference(externalRef);
* ============================================================================ */
function parsearExternalReference(externalRef: string): { uid: string; deviceId: string } {
  if (!externalRef) {
    return { uid: '', deviceId: '' };
  }

  // Formato nuevo (Fase 2): uid:{uid}:deviceId:{deviceId}
  const uidMatch = externalRef.match(/^uid:([^:]+):deviceId:(.+)$/);
  if (uidMatch) {
    return { uid: uidMatch[1], deviceId: uidMatch[2] };
  }

  // Formato legacy: monthly:{deviceId} o annual:{deviceId}
  const legacyMatch = externalRef.match(/^(?:monthly|annual):(.+)$/);
  if (legacyMatch) {
    return { uid: '', deviceId: legacyMatch[1] };
  }

  // Si no matchea ningún formato, devolver el valor completo como deviceId
  return { uid: '', deviceId: externalRef };
}

export const mpWebhook = onRequest(
  { secrets: [mpWebhookSecret] },
  async (req, res) => {
    let secretoFirma: string;
    try {
      secretoFirma = mpWebhookSecret.value();
    } catch (error) {
      console.error('[mpWebhook] MP_WEBHOOK_SECRET no configurado:', error);
      res.status(503).json({ error: 'Webhook no configurado correctamente' });
      return;
    }

    const { type, action } = req.query;
    const dataId = extraerDataId(req);
    const xSignature = String(req.headers['x-signature'] ?? '').trim();
    const xRequestId = String(req.headers['x-request-id'] ?? '').trim();

    const verificacion = verificarFirmaWebhookMercadoPago({
      xSignature,
      xRequestId,
      dataId,
      secreto: secretoFirma,
    });

    if (!verificacion.valida) {
      // No se registra el dataId para no ayudar a un atacante a enumerar eventos.
      console.warn(`[mpWebhook] Evento rechazado (firma inválida): ${verificacion.motivo}`);
      res.status(401).json({ error: 'Firma inválida' });
      return;
    }

    // Manejo de suscripciones (preapproval)
    // NOTA Fase 1: este bloque queda inerte (solo trazabilidad). La activación
    // real de suscripciones se revisa en la Fase 2 del plan de reparación
    // (coherencia createPaymentOrder <-> mpWebhook).
    if (type === 'subscription_preapproval' || action === 'subscription_preapproval.created' || action === 'subscription_preapproval.updated') {
      const preapprovalId = dataId || (req.body as { data?: { id?: unknown } })?.data?.id;
      if (preapprovalId) {
        try {
          console.log(`[mpWebhook] Recibido evento de suscripción preapproval: ${String(preapprovalId)} (pendiente de Fase 2)`);
        } catch (error) {
          console.error('[mpWebhook] Error procesando suscripción:', error);
        }
      }
    }

    if (type === 'payment' && dataId) {
      try {
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: dataId });

        if (paymentData.status === 'approved') {
          // [FASE 2] Parsear external_reference para obtener uid y deviceId
          const { uid, deviceId } = parsearExternalReference(
            paymentData.external_reference ?? ''
          );

          // Usar uid como identificador principal; si es legacy, usar deviceId
          const userIdentificador = uid || deviceId;

          if (userIdentificador) {
            const db = admin.firestore();
            // Actualizar o crear suscripción
            const now = Date.now();
            const subData = {
              userId: userIdentificador,
              deviceId: deviceId || undefined,
              status: 'Activa',
              amount: paymentData.transaction_amount || 5000,
              billingType: 'Mensual',
              paymentType: paymentData.payment_type_id,
              mercadopagoOrderId: String(paymentData.id),
              updatedAt: now,
              initialPaymentDate: now,
            };

            // Buscar si existe (por uid o por mercadopagoOrderId para idempotencia)
            const snapshot = uid
              ? await db.collection('subscriptions')
                  .where('userId', '==', uid)
                  .limit(1).get()
              : await db.collection('subscriptions')
                  .where('deviceId', '==', deviceId)
                  .limit(1).get();

            if (snapshot.empty) {
              await db.collection('subscriptions').add({
                ...subData,
                createdAt: now
              });
            } else {
              await snapshot.docs[0].ref.update(subData);
            }
            console.log(`[mpWebhook] Suscripción activada: uid=${uid} deviceId=${deviceId}`);
          }
        }
        res.status(200).send('OK');
      } catch (error) {
        console.error('[mpWebhook] Error procesando pago:', error);
        res.status(500).send('Error');
      }
    } else {
      res.status(200).send('Ignorado');
    }
  }
);
