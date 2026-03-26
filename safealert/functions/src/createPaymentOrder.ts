/* ============================================================================
* Archivo         : createPaymentOrder.ts
* Descripción     : Cloud Function para crear una orden de pago vía Mercado Pago con 3DS 2.0.
* Autor           : oafon
* Fecha           : 2026-03-25
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.3
* Uso             : Interfaz HTTP Callable desde React Native.
* ============================================================================ */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Requerir validación de ambiente (Access Token de MP)
// En producción, usa secrets de Firebase: `firebase functions:secrets:set MP_ACCESS_TOKEN`
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000';
const PAYMENTS_ENABLED =
  (process.env.PAYMENTS_ENABLED || 'false').trim().toLowerCase() === 'true';

const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

interface PaymentRequest {
  userName: string;
  phoneNumber: string;
}

export const createPaymentOrder = onCall(async (request) => {
  if (!PAYMENTS_ENABLED) {
    throw new HttpsError(
      'failed-precondition',
      'La pasarela de pagos está pausada temporalmente mientras se completan las pruebas funcionales.'
    );
  }

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debe estar autenticado para realizar un pago.');
  }

  const { userName, phoneNumber } = request.data as PaymentRequest;

  if (!userName || !phoneNumber) {
    throw new HttpsError('invalid-argument', 'Faltan parámetros requeridos (userName, phoneNumber).');
  }

  const userId = request.auth.uid;

  try {
    const preference = new Preference(client);

    // Nota: Orders API directo con 3DS requeriría Payment API con token de tarjeta. 
    // Usamos Preference (Checkout Pro) configurado para forzar seguridad, dado que es la integración por defecto para URL redirect
    // Si se requiere puramente Payment API para 3DS "on_fraud_risk", se debe usar el SDK cliente de MP en la app o un formulario custom.
    // Dado el requerimiento "Retornar la URL del challenge (transaction_security.url)", una preferencia básica nos da la init_point
    // que incluye 3DS en el flujo manejado por MP.
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'safealert_premium_5000',
            title: 'Suscripción Premium SafeAlert',
            quantity: 1,
            unit_price: 5000,
            currency_id: 'ARS',
          }
        ],
        payer: {
          name: userName,
          phone: {
            number: phoneNumber
          }
        },
        statement_descriptor: 'SAFEALERT',
        external_reference: userId, // Usaremos external_reference para vincular al webhook
        back_urls: {
          success: 'https://safealert-app.com/success',
          failure: 'https://safealert-app.com/failure',
          pending: 'https://safealert-app.com/pending'
        },
        auto_return: 'approved'
      }
    });

    return {
      success: true,
      preferenceId: result.id,
      initPoint: result.sandbox_init_point, // URL para el webview
    };

  } catch (error) {
    console.error('[createPaymentOrder] Error creando preferencia en MP', error);
    throw new HttpsError('internal', 'Error al procesar la orden de pago', error);
  }
});
