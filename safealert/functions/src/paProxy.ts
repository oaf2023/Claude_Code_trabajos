/* ============================================================================
* Archivo         : paProxy.ts
* Descripción     : Cloud Functions proxy para llamadas internas a PythonAnywhere.
*                   Reemplaza las llamadas directas del cliente que usaban
*                   EXPO_PUBLIC_PA_INTERNAL_KEY (expuesta en la APK).
*                   [FASE 3] Todas las llamadas a PA con clave interna ahora
*                   pasan por estas Functions para proteger el secreto.
* Autor           : oafon / Equipo SafeAlert
* Fecha           : 2026-09-06
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3
* Uso             : functions().httpsCallable('paProxyCreateTicket')({...})
* ============================================================================ */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

const paInternalKey = defineSecret('PA_INTERNAL_KEY');
const PA_API_URL = process.env.PA_API_URL || 'https://oaf.pythonanywhere.com';

/* ============================================================================
* Función         : paProxyCreateTicket
* Descripción     : Proxy para crear tickets de pago en PythonAnywhere.
*                   La clave interna se inyecta server-side (Secret Manager).
* Fecha           : 2026-09-06
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : PA_API_URL /api/tickets/create
* Ingesta         : { deviceId, userName, planType, amount }
* Devolución      : { success, ticket }
* Uso             : functions().httpsCallable('paProxyCreateTicket')({...})
* ============================================================================ */
export const paProxyCreateTicket = onCall(
  { secrets: [paInternalKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debe estar autenticado.');
    }

    const { deviceId, userName, planType, amount } = request.data as {
      deviceId: string;
      userName: string;
      planType: string;
      amount: number;
    };

    if (!deviceId || !planType) {
      throw new HttpsError('invalid-argument', 'Faltan parámetros requeridos.');
    }

    const internalKey = paInternalKey.value();
    if (!internalKey) {
      throw new HttpsError('failed-precondition', 'PA_INTERNAL_KEY no configurado.');
    }

    try {
      const response = await fetch(`${PA_API_URL}/api/tickets/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Key': internalKey,
        },
        body: JSON.stringify({
          device_id: deviceId,
          user_name: userName,
          plan_type: planType,
          amount,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('[paProxyCreateTicket] HTTP error:', response.status, text);
        throw new HttpsError('internal', `Error del backend: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('[paProxyCreateTicket] Error:', error);
      throw new HttpsError('internal', 'Error al crear ticket.');
    }
  }
);

/* ============================================================================
* Función         : paProxyConfirmPayment
* Descripción     : Proxy para confirmar pagos en PythonAnywhere.
*                   La clave interna se inyecta server-side (Secret Manager).
* Fecha           : 2026-09-06
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3
* Conexiones      : PA_API_URL /api/payments/confirm
* Ingesta         : { deviceId, planType, mpReference }
* Devolución      : { success }
* Uso             : functions().httpsCallable('paProxyConfirmPayment')({...})
* ============================================================================ */
export const paProxyConfirmPayment = onCall(
  { secrets: [paInternalKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debe estar autenticado.');
    }

    const { deviceId, planType, mpReference } = request.data as {
      deviceId: string;
      planType: string;
      mpReference?: string;
    };

    if (!deviceId || !planType) {
      throw new HttpsError('invalid-argument', 'Faltan parámetros requeridos.');
    }

    const internalKey = paInternalKey.value();
    if (!internalKey) {
      throw new HttpsError('failed-precondition', 'PA_INTERNAL_KEY no configurado.');
    }

    try {
      const response = await fetch(`${PA_API_URL}/api/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Key': internalKey,
        },
        body: JSON.stringify({
          device_id: deviceId,
          plan_type: planType,
          mp_reference: mpReference ?? '',
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('[paProxyConfirmPayment] HTTP error:', response.status, text);
        throw new HttpsError('internal', `Error del backend: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('[paProxyConfirmPayment] Error:', error);
      throw new HttpsError('internal', 'Error al confirmar pago.');
    }
  }
);
