# Archivo: src/services/PaymentService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/PaymentService.ts | 193 | TypeScript 5.9 | 7726 | Servicio HTTP de cliente (integración con backend PythonAnywhere para suscripciones y tickets) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Servicio del cliente móvil que abstrae la comunicación con el backend de PythonAnywhere (PA) para el ciclo comercial de SafeAlert: registro del dispositivo, consulta del estado de la suscripción, confirmación manual del pago (flujo "Ya completé el pago") y creación del ticket/comprobante correlativo. Además actualiza el estado global `hasSubscription` del store Zustand `useSettingsStore` en función de lo que devuelve el backend.

Es importante distinguir su alcance real: **este archivo no habla con Mercado Pago directamente**. La creación de la orden/pago se delega en la Cloud Function `createPaymentOrder` de Firebase (invocada desde `PaymentModal.tsx` vía `functions().httpsCallable('createPaymentOrder')`), mientras que este servicio consulta al backend propio de PythonAnywhere, que es quien persiste el estado de suscripción por `device_id`. El webhook de Mercado Pago (`functions/src/mpWebhook.ts`) es quien actualiza Firestore cuando MP notifica el pago aprobado.

## Clasificación y estado

- `FUNCIONALIDAD EXISTENTE` — implementada y conectada.
- Referencias reales encontradas: `app/(tabs)/index.tsx` (línea 29 import; línea 118 `PaymentService.checkSubscription(id)` al montar la pantalla principal), `src/components/PaymentModal.tsx` (línea 33 import; líneas 98/102/146/218/228 usos de `registerDevice`, `createTicket` y `confirmPayment`) y `src/services/__tests__/PaymentService.test.ts` (suite de tests). [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `PA_API_URL` de `../config/features` | interna | En todas las URLs de fetch | Sí |
| `useSettingsStore` de `../stores/useSettingsStore` | interna | `setHasSubscription(...)` en `registerDevice` y `checkSubscription` | Sí |
| `DeviceService` de `./DeviceService` | interna | `getMacAddress()` y `getDeviceUniqueId()` en `registerDevice` | Sí |
| `type { TicketData }` de `../components/PaymentTicket` | interna (solo tipo) | Tipado del retorno de `createTicket` | Sí (solo tipo, se elimina en compilación) |

Notas: no importa Firebase Functions ni Mercado Pago directamente; toda la lógica de MP queda en `functions/` y en el componente `PaymentModal.tsx`. [NIVEL DE CERTEZA: Confirmado por código]

## Componentes que dependen de este archivo

- `app/(tabs)/index.tsx`: verifica la suscripción al montar la pantalla.
- `src/components/PaymentModal.tsx`: flujo de pago (registro, ticket, confirmación).
- `src/services/__tests__/PaymentService.test.ts`: suite unitaria.
- `src/services/DeviceService.ts`: solo menciona a PaymentService en comentarios de cabecera (líneas 109 y 133); no importa el servicio.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `PA_API_URL` | Importado desde features.ts (fallback `https://oaf.pythonanywhere.com`; origen env `EXPO_PUBLIC_PA_API_URL`) | string | Base URL del backend de PythonAnywhere | Líneas 62, 107, 138, 174 |
| `useSettingsStore` | Módulo Zustand | objeto store | Estado global de suscripción | Líneas 75, 112 |
| `process.env.EXPO_PUBLIC_PA_INTERNAL_KEY` | [SECRETO OCULTO] | string | Clave interna enviada como header `X-Internal-Key` para crear tickets | Línea 178 |

Tipos/constantes mágicas relevantes:
- Estados posibles `SubscriptionStatus`: `active`, `pending`, `pending_verification`, `expired`, `not_registered` (líneas 20–25). `pending_verification` aparece en cabeceras (confirmación manual) aunque no se usa explícitamente en este archivo para escribir ese estado; el backend PA lo gestiona.
- `PlanType`: `'monthly' | 'annual'` (línea 27). [NIVEL DE CERTEZA: Confirmado por código]

## Estructura (funciones / clases / tipos)

- Tipos exportados: `SubscriptionStatus` (línea 20), `PlanType` (línea 27), `UserStatusResponse` (líneas 29–34).
- Funciones privadas del módulo:
  - `registerDevice(deviceId, name, phone): Promise<SubscriptionStatus>` (líneas 50–82).
  - `checkSubscription(deviceId): Promise<UserStatusResponse>` (líneas 96–118).
  - `confirmPayment(deviceId, planType, mpReference?): Promise<boolean>` (líneas 132–153).
  - `createTicket(deviceId, userName, planType, amount): Promise<TicketData>` (líneas 168–191).
- Exportación final (línea 193): `export const PaymentService = { registerDevice, checkSubscription, confirmPayment, createTicket };`

## Análisis línea por línea

**Bloque 1 (líneas 1–18): cabecera documental e importaciones.**

```ts
/* ============================================================================
* Archivo         : PaymentService.ts
* Descripción     : Servicio de integración con el backend de PythonAnywhere
*                   para registro de dispositivos y consulta/confirmación de
*                   suscripciones SafeAlert. Incluye envío de MAC address
*                   y device_unique_id para trazabilidad del dispositivo.
* Autor           : oafon
* Fecha           : 2026-04-07
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { PaymentService } from '../services/PaymentService';
*                   await PaymentService.checkSubscription(deviceId);
* ============================================================================ */

import { PA_API_URL } from '../config/features';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DeviceService } from './DeviceService';
import type { TicketData } from '../components/PaymentTicket';
```

**Explicación de las líneas 1–18:**
- **Líneas 1–13**: cabecera estándar del proyecto. Documenta propósito (integración con backend PythonAnywhere para registro de dispositivo y suscripciones) y avisa de que envía MAC address y `device_unique_id` con fines de trazabilidad. Fecha 2026-04-07, versión 1.1.0.
- **Línea 15**: importa la URL base del backend PA desde el módulo de feature flags/configuración.
- **Línea 16**: importa el store global de ajustes para persistir el estado `hasSubscription`.
- **Línea 17**: importa el servicio de dispositivo para obtener identificadores de trazabilidad.
- **Línea 18**: importa solo el tipo `TicketData` (import `type`), proveniente del componente visual `PaymentTicket`.

**Bloque 2 (líneas 20–49): tipos del dominio y cabecera de `registerDevice`.**

```ts
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
```

**Explicación de las líneas 20–49:**
- **Líneas 20–25**: union type de estados de suscripción. El estado operativo lo define el backend; el cliente los replica para tipar la respuesta. `pending_verification` documenta el flujo "pago confirmado a la espera de verificación".
- **Línea 27**: tipo de plan soportado (mensual/anual), coherente con los precios del backend PA (7500 ARS/mes, 75000 ARS/año) y con `PaymentModal`.
- **Líneas 29–34**: interfaz de respuesta del endpoint `/api/users/status`. Incluye `expires_at` (fecha de expiración) que el backend usa para marcar `expired`.
- **Líneas 36–49**: cabecera documental de la función `registerDevice`. Refleja el comportamiento: registro o actualización (nombre, teléfono, MAC, unique ID) y obtención automática de identificadores vía `DeviceService`.

**Bloque 3 (líneas 50–95): implementación de `registerDevice` y cabecera de `checkSubscription`.**

```ts
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
```

**Explicación de las líneas 50–95:**
- **Líneas 50–54**: firma de la función. Recibe `deviceId`, `name` y `phone` y devuelve el estado de suscripción reportado por el backend.
- **Líneas 57–60**: ejecuta en paralelo `getMacAddress()` y `getDeviceUniqueId()` (trazabilidad hardware). Si alguna falla, el `Promise.all` rechaza y cae en el `catch` (línea 78), degradando a `not_registered`.
- **Líneas 62–72**: POST a `${PA_API_URL}/api/users/register` con `Content-Type: application/json` y el cuerpo con `device_id`, `name`, `phone`, `mac_address` y `device_unique_id`. Sin header de autenticación adicional; el backend identifica al usuario por `device_id`.
- **Línea 73**: parsea la respuesta JSON.
- **Líneas 74–76**: si el backend responde `status === 'active'`, actualiza el store global `hasSubscription = true`.
- **Línea 77**: devuelve el status o `not_registered` como fallback si el backend no lo incluye.
- **Líneas 78–81**: ante cualquier error de red/parseo registra en consola y devuelve `not_registered` (degradación controlada, no bloqueante).
- **Líneas 84–95**: cabecera documental de `checkSubscription`, que consulta `/api/users/status` y sincroniza el store.

**Bloque 4 (líneas 96–131): implementación de `checkSubscription` y cabecera de `confirmPayment`.**

```ts
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
* Descripción     : Notifica al backend que el usuario completó el pago manualmente
*                   (flujo "Ya completé el pago"). Pone estado pending_verification.
* Fecha           : 2026-04-01
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : PA_API_URL /api/payments/confirm, useSettingsStore
* Ingesta         : deviceId: string, planType: PlanType, mpReference?: string
* Devolución      : Promise<boolean>
* Uso             : await PaymentService.confirmPayment(id, 'monthly')
* ============================================================================ */
```

**Explicación de las líneas 96–131:**
- **Líneas 97–102**: define el objeto `fallback` (`not_registered` sin plan ni expiración) que se devuelve si no hay `deviceId` o si falla la red.
- **Línea 104**: guard clause: sin `deviceId` no se realiza llamada de red y se retorna el fallback.
- **Líneas 106–113**: GET a `${PA_API_URL}/api/users/status/${encodeURIComponent(deviceId)}`; parsea la respuesta; si el estado es `active`, actualiza `hasSubscription` a `true`, en caso contrario a `false`. Devuelve el JSON tipado como `UserStatusResponse`.
- **Líneas 114–117**: ante error, loguea y retorna el fallback (la app continúa funcionando como "no registrado").
- **Líneas 120–131**: cabecera de `confirmPayment`. Su cabecera menciona que pone el estado `pending_verification`, aunque el estado se persiste en el backend; el cliente solo recibe `success` booleano.

**Bloque 5 (líneas 132–167): implementación de `confirmPayment` y cabecera de `createTicket`.**

```ts
async function confirmPayment(
  deviceId: string,
  planType: PlanType,
  mpReference?: string
): Promise<boolean> {
  try {
    const response = await fetch(`${PA_API_URL}/api/payments/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId,
        plan_type: planType,
        mp_reference: mpReference ?? '',
      }),
    });
    const json = await response.json();
    return json.success === true;
  } catch (error) {
    console.error('[PaymentService] confirmPayment error:', error);
    return false;
  }
}

/* ============================================================================
* Función         : createTicket
* Descripción     : Solicita al backend de PythonAnywhere la creación de un
*                   ticket de pago correlativo. Retorna los datos del comprobante
*                   para mostrarlo en PaymentTicket.
* Fecha           : 2026-04-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : PA_API_URL /api/tickets/create
* Ingesta         : deviceId: string, userName: string, planType: PlanType, amount: number
* Devolución      : Promise<TicketData>
* Uso             : await PaymentService.createTicket(id, name, 'monthly', 7500)
* ============================================================================ */
```

**Explicación de las líneas 132–167:**
- **Líneas 132–136**: firma. `mpReference` es opcional (referencia/ID de la orden de MP, por ejemplo el `subscriptionId` devuelto por la Cloud Function).
- **Líneas 138–146**: POST a `/api/payments/confirm` con `device_id`, `plan_type` y `mp_reference` (vacío si no se provee). Devuelve `true` solo si `json.success === true`.
- **Líneas 149–152**: ante error de red/parseo retorna `false`.
- **Líneas 155–167**: cabecera de `createTicket`. Documenta el endpoint `/api/tickets/create` del backend PA y su uso para mostrar el comprobante en `PaymentTicket`.

**Bloque 6 (líneas 168–193): implementación de `createTicket` y exportación del servicio.**

```ts
async function createTicket(
  deviceId: string,
  userName: string,
  planType: PlanType,
  amount: number
): Promise<TicketData> {
  const response = await fetch(`${PA_API_URL}/api/tickets/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': process.env.EXPO_PUBLIC_PA_INTERNAL_KEY || '',
    },
    body: JSON.stringify({ device_id: deviceId, user_name: userName, plan_type: planType, amount }),
  });

  if (!response.ok) {
    throw new Error(`[PaymentService] createTicket HTTP ${response.status}`);
  }

  const data = await response.json();
  // El backend responde { success, ticket: {...} }; el cliente espera TicketData
  // directamente. Normalizar para cubrir ambos formatos.
  return (data.ticket ?? data) as TicketData;
}

export const PaymentService = { registerDevice, checkSubscription, confirmPayment, createTicket };
```

**Explicación de las líneas 168–193:**
- **Líneas 168–173**: firma. `amount` es el importe del ticket (7500 mensual o 75000 anual en los flujos actuales).
- **Líneas 174–181**: POST a `/api/tickets/create` con header `X-Internal-Key` cuyo valor se toma de la variable de entorno `EXPO_PUBLIC_PA_INTERNAL_KEY` (se incrusta en el bundle de la app; ver sección Seguridad). El cuerpo incluye `device_id`, `user_name`, `plan_type` y `amount`.
- **Líneas 183–185**: si el backend responde con HTTP de error, lanza excepción con el código de estado (quien la invoca, p. ej. `PaymentModal`, la captura).
- **Líneas 187–190**: normaliza la respuesta: el backend puede responder `{ success, ticket: {...} }` o directamente el objeto ticket; se usa `data.ticket ?? data`.
- **Línea 193**: exporta el objeto `PaymentService` con los cuatro métodos.

## Fichas de funciones y métodos

### registerDevice (líneas 50–82)
- Firma: `async function registerDevice(deviceId: string, name: string, phone: string): Promise<SubscriptionStatus>`.
- Propósito técnico: registrar (o actualizar) el dispositivo en el backend PA con trazabilidad hardware; propósito funcional: dejar el dispositivo reconocido por el backend para el alta de suscripción/prueba.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| deviceId | string | Identificador persistente del dispositivo (generado por DeviceService). |
| name | string | Nombre del usuario. |
| phone | string | Teléfono del usuario (formato E.164 esperado por el backend). |

- Retorno: `SubscriptionStatus` (normalmente `'active'` o `'not_registered'`).
- Excepciones: no lanza; captura todo y devuelve `'not_registered'`.
- Dependencias: `DeviceService.getMacAddress`, `DeviceService.getDeviceUniqueId`, `useSettingsStore.getState().setHasSubscription`, `PA_API_URL`.
- Flujo interno: obtener MAC y unique ID en paralelo, POST a `/api/users/register`, parsear JSON, actualizar store si `active`, retornar status.
- Desde dónde se llama: `PaymentModal.tsx` (líneas 98 y 146) en los flujos bypass y producción.
- Efectos secundarios: muta el store global `hasSubscription`; emite tráfico con datos de trazabilidad del dispositivo.
- Riesgos: si falla `getMacAddress`/`getDeviceUniqueId`, `Promise.all` rechaza y el alta se degrada a `not_registered` aunque el backend hubiera podido aceptar el registro.

### checkSubscription (líneas 96–118)
- Firma: `async function checkSubscription(deviceId: string): Promise<UserStatusResponse>`.
- Propósito técnico/funcional: consultar el estado de la suscripción del dispositivo y reflejarlo en el store para activar/desactivar funcionalidades.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| deviceId | string | Identificador del dispositivo. Si es vacío, no se hace red. |

- Retorno: `UserStatusResponse` o el objeto `fallback` (`not_registered`).
- Excepciones: no lanza; captura y retorna fallback.
- Dependencias: `fetch` GET a `/api/users/status/{id}` (con `encodeURIComponent`), `useSettingsStore`.
- Flujo interno: guard clause por deviceId vacío; GET; parseo; `isActive = status === 'active'`; `setHasSubscription(isActive)`; retorno del JSON.
- Desde dónde se llama: `app/(tabs)/index.tsx` línea 118 y en los tests.
- Efectos secundarios: muta `hasSubscription` del store en cada arranque de la pantalla principal.
- Riesgos: no valida `response.ok`; si el servidor devuelve HTML de error 5xx, `response.json()` falla y cae en el catch (comportamiento degradado correcto pero opaco).

### confirmPayment (líneas 132–153)
- Firma: `async function confirmPayment(deviceId: string, planType: PlanType, mpReference?: string): Promise<boolean>`.
- Propósito técnico/funcional: notificar al backend PA que el usuario completó el pago manualmente (botón "Ya completé el pago" tras volver del navegador MP), pasando a `pending_verification`.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| deviceId | string | Identificador del dispositivo. |
| planType | PlanType | `monthly` o `annual`. |
| mpReference | string (opcional) | Referencia/id de la orden de MP (`subscriptionId` del flujo de producción). |

- Retorno: booleano (`json.success === true`).
- Excepciones: no lanza; retorna `false` en error.
- Dependencias: `fetch` POST a `/api/payments/confirm`, `PA_API_URL`.
- Flujo interno: POST con cuerpo JSON; retorno según `success`.
- Desde dónde se llama: `PaymentModal.tsx` línea 218 (`handleConfirmPayment`).
- Efectos secundarios: ninguno en el cliente (el estado se persiste en el backend).
- Riesgos: si el backend no responde JSON válido, `response.json()` puede lanzar y degradar a `false`.

### createTicket (líneas 168–191)
- Firma: `async function createTicket(deviceId: string, userName: string, planType: PlanType, amount: number): Promise<TicketData>`.
- Propósito técnico/funcional: solicitar al backend PA un ticket/comprobante correlativo de pago para mostrarlo en `PaymentTicket`.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| deviceId | string | Identificador del dispositivo. |
| userName | string | Nombre a figurar en el ticket. |
| planType | PlanType | Plan contratado. |
| amount | number | Importe en ARS. |

- Retorno: `TicketData` (objeto del ticket normalizado).
- Excepciones: lanza `Error` con el código HTTP si `!response.ok`; puede lanzar si `response.json()` falla.
- Dependencias: `fetch` POST a `/api/tickets/create` con header `X-Internal-Key`, `PA_API_URL`, tipo `TicketData`.
- Flujo interno: POST autenticado por header; validación de `ok`; parseo; normalización `data.ticket ?? data`.
- Desde dónde se llama: `PaymentModal.tsx` líneas 102 (bypass) y 228 (confirmación).
- Efectos secundarios: crea un ticket correlativo real en el backend (número consumido incluso en bypass de desarrollo).
- Riesgos: la clave interna viaja en el bundle de la app (ver Seguridad); en bypass de desarrollo se consume numeración real de tickets.

## Clases / interfaces / tipos

### `SubscriptionStatus` (líneas 20–25)
- Responsabilidad: modelar los estados posibles de la suscripción según el backend.
- Valores: `active`, `pending`, `pending_verification`, `expired`, `not_registered`.
- Relaciones: usado por `UserStatusResponse.status` y como retorno de `registerDevice`.

### `PlanType` (línea 27)
- Responsabilidad: tipar el plan contratado.
- Valores: `monthly`, `annual`.

### `UserStatusResponse` (líneas 29–34)
- Responsabilidad: tipar la respuesta del endpoint `/api/users/status`.
- Campos:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| device_id | string | Id del dispositivo consultado. |
| status | SubscriptionStatus | Estado de la suscripción. |
| plan_type | PlanType \| null | Plan activo o null. |
| expires_at | string \| null | Fecha de expiración (ISO) o null. |

- Relaciones: retorno de `checkSubscription`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El ciclo de pago completo no reside en este archivo: la creación de la orden la hace la Cloud Function `createPaymentOrder` (`functions/src/createPaymentOrder.ts`, exportada en `functions/src/index.ts` línea 8) invocada desde `PaymentModal.tsx` (línea 148) con `{ userName, phoneNumber, deviceId, planType }`; el estado llega por el webhook `mpWebhook` (`functions/src/mpWebhook.ts`, exportado en línea 9 de index.ts). Este servicio actúa como cliente del backend PA (register/status/confirm/ticket). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `createPaymentOrder` en funciones crea para `monthly` un `PreApproval` (recurrente, 7500 ARS/mes) y para `annual` una `Preference` (pago único 75000 ARS), devolviendo `{ success, initPoint, subscriptionId }`. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `mpWebhook` al recibir un pago aprobado crea/actualiza en Firestore la colección `subscriptions` (estado `Activa`, `mercadopagoOrderId`, etc.); el cliente `SubscriptionService` lee esa misma colección (ver archivo `src_services_SubscriptionService.ts.md`). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] La expiración se gobierna en backend: `checkSubscription` interpreta el `status` devuelto por PA; la pantalla `_layout.tsx` usa `paymentOverdue` y `hasSubscription` del store para mostrar avisos. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] Límites: sin `hasSubscription` la app bloquea el envío de alertas (`AlertService.ts` línea 169) y muestra el modal de pago desde `index.tsx` (líneas 172/187); el alta de segundo contacto está restringido en `app/contacts/[id].tsx` (línea 129). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] Prueba gratuita: la gestión del período de 10 días vive en el backend PA (safealert_tel.db) y se consulta mediante `TrialService.checkPrueba` (ver archivo `src_services_TrialService.ts.md`); no aparece lógica de prueba en este archivo. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] No hay validación de `response.ok` en `registerDevice`, `checkSubscription` ni `confirmPayment` antes de `response.json()`; un error HTTP no-2xx con cuerpo no JSON degrada silenciosamente. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] El monto por plan no está centralizado aquí: el cliente lo hardcodea en `PaymentModal.tsx` (7500/75000) y el backend en `createPaymentOrder` (7500/75000); `createTicket` recibe `amount` como parámetro, por lo que un desajuste entre capas produciría tickets con importe incorrecto. [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [ALTO] La clave `X-Internal-Key` (`process.env.EXPO_PUBLIC_PA_INTERNAL_KEY`) se envía desde el cliente móvil y, por el prefijo `EXPO_PUBLIC_`, queda incrustada en el bundle/APK (features.ts ya advierte: "Las variables EXPO_PUBLIC_* se incrustan en el APK"). Cualquier atacante puede leerla y falsificar peticiones a `/api/tickets/create`. [NIVEL DE CERTEZA: Confirmado por código]
- [MEDIO] Autenticación débil por `device_id`: los endpoints de registro/estado/confirmación identifican al usuario únicamente por el `device_id` (un UUID de instalación); quien lo conozca puede consultar o manipular el estado de suscripción de ese dispositivo. No se envían tokens de Firebase en estas llamadas. [NIVEL DE CERTEZA: Confirmado por código]
- [MEDIO] Trazabilidad de privacidad: se envía la dirección MAC y un `device_unique_id` al backend de terceros (PythonAnywhere); aunque sirve a fines de trazabilidad, la MAC es un identificador persistente de hardware que debe tratarse como dato sensible (RGPD/DAMMA) y minimizarse. [NIVEL DE CERTEZA: Confirmado por código]
- [BAJO] `console.error` en fallos de red (líneas 79, 115, 150) no imprime secretos, pero sí errores del fetch que pueden incluir URLs; no se detectó volcado de tokens/claves a logs. [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] No hay validación local de formato de `phone` ni de `planType` antes del envío; se confía en el backend para validar. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Claves con prefijo `EXPO_PUBLIC_` en el cliente: migrar la creación de tickets y la confirmación a una Cloud Function intermedia que conserve la clave interna en Secret Manager (patrón ya usado por `createPaymentOrder` con `PA_INTERNAL_KEY`). [RECOMENDACIÓN]
- [RIESGO] Estados y montos duplicados entre cliente y backend: centralizar catálogo de planes/precios (p. ej. en una Cloud Function o colección remota) para evitar divergencias de importe. [RECOMENDACIÓN]
- [RIESGO] Depender de una URL de backend no versionada para operaciones de pago: mantener la versión de API en la URL (p. ej. `/api/v1/...`) como hacen otros servicios del proyecto y validar `response.ok` antes de parsear. [RECOMENDACIÓN]
- [RIESGO] `Promise.all` de identificadores hardware: si la trazabilidad no es crítica para el alta, tolerar fallos parciales (capturar cada llamada por separado) para no degradar el registro del dispositivo. [RECOMENDACIÓN]
- [INFORMATIVO] El archivo cumple la cabecera documental del proyecto; se recomienda documentar explícitamente qué endpoints requieren el header `X-Internal-Key` y cuáles no, para evitar regresiones de seguridad. [RECOMENDACIÓN]
