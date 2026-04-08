/* ============================================================================
* Archivo         : createPaymentOrder.ts
* Descripción     : Cloud Function para crear órdenes de pago en MercadoPago.
*                   Plan mensual: PreApproval (suscripción recurrente $7.500 ARS).
*                   Plan anual: Preference (pago único $75.000 ARS).
*                   Luego vincula el ID del preapproval con el device_id del usuario
*                   llamando al backend de PythonAnywhere.
* Autor           : oafon
* Fecha           : 2026-04-01
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.3
* Uso             : Interfaz HTTP Callable desde React Native.
* ============================================================================ */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { MercadoPagoConfig, PreApproval, Preference } from 'mercadopago';

// Secretos gestionados por Firebase Secret Manager
const paInternalKey = defineSecret('PA_INTERNAL_KEY');

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
  || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000';
const PAYMENTS_ENABLED = (process.env.PAYMENTS_ENABLED || 'false').trim().toLowerCase() === 'true';
const PA_API_URL = process.env.PA_API_URL || 'https://oaf.pythonanywhere.com';

const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

export type PlanType = 'monthly' | 'annual';

interface PaymentRequest {
  userName: string;
  phoneNumber: string;
  email?: string;       // opcional — se genera internamente si no se provee
  deviceId: string;
  planType: PlanType;
}

/* ============================================================================
* Función         : _linkPreapprovalToDevice
* Descripción     : Llama al backend de PythonAnywhere para vincular el ID de
*                   preapproval de MP con el device_id del usuario.
* Fecha           : 2026-04-01
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : PA_API_URL /api/internal/link-preapproval
* Ingesta         : deviceId, mpId, planType, internalKey
* Devolución      : Promise<void>
* Uso             : await _linkPreapprovalToDevice(deviceId, result.id, planType, key)
* ============================================================================ */
async function _linkPreapprovalToDevice(
  deviceId: string,
  mpId: string,
  planType: PlanType,
  internalKey: string
): Promise<void> {
  try {
    const response = await fetch(`${PA_API_URL}/api/internal/link-preapproval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': internalKey,
      },
      body: JSON.stringify({ device_id: deviceId, mp_preapproval_id: mpId, plan_type: planType }),
    });
    if (!response.ok) {
      console.error('[createPaymentOrder] link-preapproval HTTP error:', response.status);
    }
  } catch (err) {
    console.error('[createPaymentOrder] Error llamando link-preapproval:', err);
    // No propagamos el error — el pago ya fue creado exitosamente
  }
}

/* ============================================================================
* Función         : createPaymentOrder
* Descripción     : Firebase Function callable. Crea la orden de pago en MP según
*                   el plan elegido por el usuario y vincula el ID en PythonAnywhere.
* Fecha           : 2026-04-01
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : MercadoPago SDK, _linkPreapprovalToDevice, PA_API_URL
* Ingesta         : { userName, phoneNumber, email, deviceId, planType }
* Devolución      : { success, initPoint, subscriptionId }
* Uso             : functions().httpsCallable('createPaymentOrder')({...})
* ============================================================================ */
export const createPaymentOrder = onCall(
  { secrets: [paInternalKey] },
  async (request) => {
    if (!PAYMENTS_ENABLED) {
      throw new HttpsError(
        'failed-precondition',
        'La pasarela de pagos está pausada temporalmente mientras se completan las pruebas funcionales.'
      );
    }

    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debe estar autenticado para realizar un pago.');
    }

    const { userName, phoneNumber, email, deviceId, planType } =
      request.data as PaymentRequest;

    if (!userName || !deviceId || !planType) {
      throw new HttpsError(
        'invalid-argument',
        'Faltan parámetros requeridos (userName, deviceId, planType).'
      );
    }

    // Email del pagador: usar el provisto por el usuario o generar uno de sistema
    const payerEmail = (email ?? '').trim().toLowerCase()
      || `usuario-${deviceId.slice(-8).toLowerCase()}@safealert.com`;

    const isSandbox = MP_ACCESS_TOKEN.startsWith('TEST-');
    const internalKey = paInternalKey.value();

    try {
      if (planType === 'monthly') {
        // Suscripción recurrente mensual
        const preApproval = new PreApproval(client);
        const result = await preApproval.create({
          body: {
            reason: 'Suscripción mensual SafeAlert',
            external_reference: `monthly:${deviceId}`,
            payer_email: payerEmail,
            auto_recurring: {
              frequency: 1,
              frequency_type: 'months',
              transaction_amount: 7500,
              currency_id: 'ARS',
            },
            back_url: 'https://oaf.pythonanywhere.com/api/health',
            status: 'pending',
          },
        });

        await _linkPreapprovalToDevice(
          deviceId,
          result.id ?? '',
          'monthly',
          internalKey
        );

        return {
          success: true,
          subscriptionId: result.id,
          initPoint: (result as any).sandbox_init_point ?? result.init_point,
        };

      } else {
        // Pago único anual (Preference)
        const preference = new Preference(client);
        const result = await preference.create({
          body: {
            items: [
              {
                id: `annual-${deviceId}`,
                title: 'Suscripción anual SafeAlert (10 meses + 2 gratis)',
                quantity: 1,
                unit_price: 75000,
                currency_id: 'ARS',
              },
            ],
            payer: {
              name: userName,
              phone: { number: phoneNumber },
              email: payerEmail,
            },
            external_reference: `annual:${deviceId}`,
            back_urls: {
              success: 'https://oaf.pythonanywhere.com/api/health',
              failure: 'https://oaf.pythonanywhere.com/api/health',
              pending: 'https://oaf.pythonanywhere.com/api/health',
            },
            auto_return: 'approved',
          },
        });

        return {
          success: true,
          subscriptionId: result.id,
          initPoint: isSandbox ? result.sandbox_init_point : result.init_point,
        };
      }

    } catch (error) {
      console.error('[createPaymentOrder] Error creando orden en MP:', error);
      throw new HttpsError('internal', 'Error al procesar el pago en Mercado Pago.', error);
    }
  }
);

