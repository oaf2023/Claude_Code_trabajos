/* ============================================================================
* Archivo         : PaymentService.ts
* Descripción     : Servicio de integración con el backend de PythonAnywhere
*                   para registro de dispositivos y consulta/confirmación de
*                   suscripciones SafeAlert. Incluye envío de MAC address
*                   y device_unique_id para trazabilidad del dispositivo.
*                   [FASE 3] createTicket y confirmPayment ahora usan Cloud
*                   Functions proxy (paProxyCreateTicket, paProxyConfirmPayment)
*                   para proteger PA_INTERNAL_KEY.
* Autor           : oafon
* Fecha           : 2026-04-07 · 2026-09-06 (Fase 3)
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { PaymentService } from '../services/PaymentService';
*                   await PaymentService.checkSubscription(deviceId);
* ============================================================================ */

import { PA_API_URL } from '../config/features';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DeviceService } from './DeviceService';
import type { TicketData } from '../components/PaymentTicket';
import { functions } from '../config/firebase';

export type SubscriptionStatus =
  | 'active'
  | 'pending'
  | 'pending_verification'
  | 'expired'
  | 'not_registered';

export type PlanType = 'monthly' | 'annual';

export interface UserStatusResponse {
  device_id: string;
  status: SubscriptionStatus;
  plan_type: PlanType | null;
  expires_at: string | null;
}

/* ============================================================================
* Función         : registerDevice
* Descripción     : Registra el dispositivo en el backend de PythonAnywhere.
*                   Si ya existe, actualiza nombre, teléfono, MAC y unique ID.
*                   Obtiene mac_address y device_unique_id automáticamente
*                   via DeviceService para trazabilidad en la BD.
* Fecha           : 2026-04-07
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : PA_API_URL /api/users/register, DeviceService
* Ingesta         : deviceId: string, name: string, phone: string
* Devolución      : Promise<SubscriptionStatus>
* Uso             : await PaymentService.registerDevice(id, 'Juan', '+54911...')
* ============================================================================ */
async function registerDevice(
  deviceId: string,
  name: string,
  phone: string
): Promise<SubscriptionStatus> {
  try {
    // Obtener identificadores del dispositivo para trazabilidad en BD
    const [macAddress, deviceUniqueId] = await Promise.all([
      DeviceService.getMacAddress(),
      DeviceService.getDeviceUniqueId(),
    ]);

    const response = await fetch(`${PA_API_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId,
        name,
        phone,
        mac_address: macAddress,
        device_unique_id: deviceUniqueId,
      }),
    });
    const json = await response.json();
    if (json.status === 'active') {
      useSettingsStore.getState().setHasSubscription(true);
    }
    return (json.status as SubscriptionStatus) || 'not_registered';
  } catch (error) {
    console.error('[PaymentService] registerDevice error:', error);
    return 'not_registered';
  }
}

/* ============================================================================
* Función         : checkSubscription
* Descripción     : Consulta el estado de suscripción del dispositivo y actualiza
*                   el store de Zustand (hasSubscription).
* Fecha           : 2026-04-01
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : PA_API_URL /api/users/status, useSettingsStore
* Ingesta         : deviceId: string
* Devolución      : Promise<UserStatusResponse>
* Uso             : const { status } = await PaymentService.checkSubscription(id)
* ============================================================================ */
async function checkSubscription(deviceId: string): Promise<UserStatusResponse> {
  const fallback: UserStatusResponse = {
    device_id: deviceId,
    status: 'not_registered',
    plan_type: null,
    expires_at: null,
  };

  if (!deviceId) return fallback;

  try {
    const response = await fetch(
      `${PA_API_URL}/api/users/status/${encodeURIComponent(deviceId)}`
    );
    const json: UserStatusResponse = await response.json();
    const isActive = json.status === 'active';
    useSettingsStore.getState().setHasSubscription(isActive);
    return json;
  } catch (error) {
    console.error('[PaymentService] checkSubscription error:', error);
    return fallback;
  }
}

/* ============================================================================
* Función         : confirmPayment
* Descripción     : [FASE 3] Notifica al backend que el usuario completó el pago
*                   mediante Cloud Function proxy (paProxyConfirmPayment).
*                   La clave interna se inyecta server-side.
* Fecha           : 2026-04-01 · 2026-09-06 (Fase 3)
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : paProxyConfirmPayment (Cloud Function)
* Ingesta         : deviceId: string, planType: PlanType, mpReference?: string
* Devolución      : Promise<boolean>
* Uso             : await PaymentService.confirmPayment(id, 'monthly')
* ============================================================================ */
async function confirmPayment(
  deviceId: string,
  planType: PlanType,
  mpReference?: string
): Promise<boolean> {
  try {
    const confirmPaymentFn = functions().httpsCallable('paProxyConfirmPayment');
    const response = await confirmPaymentFn({
      deviceId,
      planType,
      mpReference: mpReference ?? '',
    });

    const data = response.data as { success: boolean };
    return data.success === true;
  } catch (error) {
    console.error('[PaymentService] confirmPayment error:', error);
    return false;
  }
}

/* ============================================================================
* Función         : createTicket
* Descripción     : [FASE 3] Solicita la creación de un ticket de pago mediante
*                   Cloud Function proxy (paProxyCreateTicket). La clave interna
*                   se inyecta server-side, nunca se expone en la APK.
* Fecha           : 2026-04-07 · 2026-09-06 (Fase 3)
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : paProxyCreateTicket (Cloud Function)
* Ingesta         : deviceId: string, userName: string, planType: PlanType, amount: number
* Devolución      : Promise<TicketData>
* Uso             : await PaymentService.createTicket(id, name, 'monthly', 7500)
* ============================================================================ */
async function createTicket(
  deviceId: string,
  userName: string,
  planType: PlanType,
  amount: number
): Promise<TicketData> {
  const createTicketFn = functions().httpsCallable('paProxyCreateTicket');
  const response = await createTicketFn({
    deviceId,
    userName,
    planType,
    amount,
  });

  const data = response.data as { success: boolean; ticket?: TicketData };
  if (!data.success || !data.ticket) {
    throw new Error('[PaymentService] createTicket: respuesta inválida del proxy');
  }

  return data.ticket;
}

export const PaymentService = { registerDevice, checkSubscription, confirmPayment, createTicket };
