/* ============================================================================
* Archivo         : mpWebhook.ts
* Descripción     : Webhook para recibir actualizaciones de estado de Mercado Pago.
* Autor           : oafon
* Fecha           : 2026-03-23
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3
* Uso             : Webhook configurado en panel de Mercado Pago.
* ============================================================================ */

import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000';
const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

export const mpWebhook = onRequest(async (req, res) => {
  const { type, 'data.id': dataId } = req.query;

  if (type === 'payment' && dataId) {
    try {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: String(dataId) });

      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference;

        if (userId) {
          const db = admin.firestore();
          // Actualizar o crear suscripción
          const now = Date.now();
          const subData = {
            userId,
            status: 'Activa',
            amount: paymentData.transaction_amount || 5000,
            billingType: 'Mensual',
            paymentType: paymentData.payment_type_id,
            mercadopagoOrderId: String(paymentData.id),
            updatedAt: now,
            initialPaymentDate: now,
          };

          // Buscar si existe
          const snapshot = await db.collection('subscriptions')
            .where('userId', '==', userId)
            .limit(1).get();

          if (snapshot.empty) {
            await db.collection('subscriptions').add({
              ...subData,
              createdAt: now
            });
          } else {
            await snapshot.docs[0].ref.update(subData);
          }
          console.log(`[mpWebhook] Suscripción activada para usuario ${userId}`);
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
});
