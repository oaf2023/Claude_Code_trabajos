# Archivo: functions/src/mpWebhook.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| functions/src/mpWebhook.ts | 83 | TypeScript | 3238 | Cloud Function HTTP onRequest (webhook Mercado Pago) | PARCIALMENTE IMPLEMENTADA (webhook sin verificación de firma y rama preapproval sin lógica) | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define `mpWebhook`, una Cloud Function HTTP pública (`onRequest`) que recibe
las notificaciones (webhooks) de Mercado Pago. Debe actualizar el estado de
suscripciones en Firestore cuando un pago se aprueba. Atiende dos tipos de
evento:

1. Suscripciones/preapprovals (`type=subscription_preapproval` o
   `action=subscription_preapproval.*`): solo registra en log (no actualiza
   estado real).
2. Pagos (`type=payment`): consulta el pago en la API de MP por su id y, si
   `status === 'approved'`, crea o actualiza un documento en la colección
   `subscriptions` marcando la suscripción como 'Activa'.

## Clasificación y estado

Etiqueta: `PARCIALMENTE IMPLEMENTADA`.

Razones: (a) la rama de preapproval (líneas 22–34) no ejecuta ninguna
actualización de estado — el comentario de la línea 27 lo reconoce
explícitamente ("Por ahora simulamos la activación basada en el evento"); (b)
el webhook NO verifica la firma de Mercado Pago (`X-Signature`) antes de
procesar eventos; (c) la interpretación de `external_reference` como `userId`
es incompatible con lo que genera `createPaymentOrder.ts`
(`monthly:<deviceId>` / `annual:<deviceId>`). Ver Observaciones técnicas y
Seguridad.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| onRequest (firebase-functions/v2/https) | externa | Línea 18: definición | Sí |
| firebase-admin | externa | Líneas 45, 60, 65, 70 | Sí |
| MercadoPagoConfig, Payment (mercadopago) | externa | Líneas 15–16, 38–39 | Sí |

## Componentes que dependen de este archivo

| Componente | Relación |
| --- | --- |
| functions/src/index.ts | Reexporta `mpWebhook` (línea 9) |
| Mercado Pago (panel de desarrolladores) | Debe estar configurado para enviar webhooks a la URL de esta función |
| createPaymentOrder.ts | Genera los instrumentos de pago cuyos eventos consume este webhook (productor) |
| Firestore colección `subscriptions` | Destino de las escrituras de activación |
| Cliente móvil SubscriptionService.ts | Lee la colección `subscriptions` (consulta por userId) — ver coherencia |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| MP_ACCESS_TOKEN | process.env.MP_ACCESS_TOKEN o fallback sintético 'TEST-...' | string [SECRETO OCULTO] | Token para consultar pagos en la API de MP | Líneas 15–16 |
| client | new MercadoPagoConfig({ accessToken }) | objeto | Cliente MP compartido | Línea 16 |
| subData.amount fallback | paymentData.transaction_amount \|\| 5000 | number | Importe de la suscripción con fallback 5000 | Línea 51 |
| billingType | 'Mensual' (literal) | string | Tipo de facturación fijo en el webhook | Línea 52 |

[NOTA] El literal `'Mensual'` y el fallback de importe `5000` son valores
mágicos: el webhook asume que todo pago aprobado corresponde a una
suscripción mensual de 5000 ARS por defecto, aunque el plan anual es de
75 000 ARS y el mensual de 7500 ARS (según createPaymentOrder.ts).

## Estructura (funciones / clases / tipos)

| Nombre | Tipo | Líneas |
| --- | --- | --- |
| mpWebhook | Cloud Function onRequest | 18–83 |

## Análisis línea por línea

```ts
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
  const { type, 'data.id': dataId, action } = req.query;

  // Manejo de suscripciones (preapproval)
  if (type === 'subscription_preapproval' || action === 'subscription_preapproval.created' || action === 'subscription_preapproval.updated') {
    const preapprovalId = dataId || req.body?.data?.id;
    if (preapprovalId) {
      try {
        // En un entorno real, usaríamos client.preapproval.get({ id: preapprovalId })
        // Por ahora simulamos la activación basada en el evento
        console.log(`[mpWebhook] Procesando suscripción preapproval: ${preapprovalId}`);
        // Lógica para marcar al usuario como suscrito en Firestore
      } catch (error) {
        console.error('[mpWebhook] Error procesando suscripción:', error);
      }
    }
  }
```

**Explicación de las líneas 1–34:**

- **Líneas 1–9**: cabecera documental.
- **Línea 11**: importa `onRequest` (webhook HTTP v2).
- **Línea 12**: importa firebase-admin.
- **Línea 13**: importa el SDK de MP (config y recurso Payment).
- **Línea 15**: token de acceso con fallback sintético (mismo marcador que en
  createPaymentOrder.ts). [RIESGO] Si no está configurado en el entorno, toda
  consulta de pago fallará con autenticación inválida (respuesta 500).
- **Línea 16**: cliente MP.
- **Línea 18**: define la función HTTP sin autenticación (pública por
  diseño: la llama Mercado Pago).
- **Línea 19**: extrae `type`, `data.id` y `action` de la QUERY STRING.
  [RIESGO DE DISEÑO] Mercado Pago envía los webhooks como POST con el payload
  en el cuerpo (y en algunas configuraciones los parámetros en query). Leer
  `data.id` de `req.query` es frágil: el id real suele venir en
  `req.body.data.id`. La línea 23 contempla el cuerpo como alternativa SOLO
  para preapproval; la rama de pagos (línea 36) usa exclusivamente
  `dataId` de query.
- **Líneas 22–34**: rama de suscripciones (preapproval).
  - **Línea 22**: condición amplia (type o action de preapproval).
  - **Línea 23**: id del preapproval: query o `req.body?.data?.id`.
  - **Líneas 24–33**: si hay id, solo registra un log; el comentario de la
    línea 27 indica que en un entorno real se consultaría
    `client.preapproval.get` y la línea 29 indica que "la lógica para marcar
    al usuario como suscrito en Firestore" está PENDIENTE (no implementada).
    [PENDIENTE] La rama preapproval está incompleta: los eventos de
    suscripción mensual recurrente (activación/cancelación/fallo de cobro) no
    actualizan Firestore.
  - **Líneas 30–32**: catch que solo registra.

```ts
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
```

**Explicación de las líneas 36–83:**

- **Línea 36**: procesa SOLO eventos `type === 'payment'` con `dataId` en la
  query. [RIESGO] Si MP envía el id solo en el cuerpo (configuración habitual
  con `data.id` en el body JSON), esta rama nunca se ejecuta y el webhook
  responde 'Ignorado'.
- **Líneas 37–39**: instancia el recurso `Payment` y consulta el pago por id en
  la API de MP (`payment.get`).
- **Línea 41**: condición de aprobación.
- **Línea 42**: toma `external_reference` del pago como `userId`.
  [RIESGO DE COHERENCIA — CRÍTICO a nivel de lógica de negocio] En
  `createPaymentOrder.ts` el `external_reference` se genera como
  `monthly:<deviceId>` o `annual:<deviceId>`, no como uid de usuario Firebase.
  Por tanto `subscriptions.userId` se poblará con cadenas tipo
  `monthly:abc123` o `annual:xyz`, que NO coincidirán con el `userId` (uid de
  Auth) que usa `SubscriptionService.getSubscription` en el cliente. Además el
  webhook no distingue plan mensual/anual (asume 'Mensual' siempre). Impacto:
  las suscripciones activadas por webhook no serán visibles para el cliente.
  [NIVEL DE CERTEZA: Confirmado por código en ambas partes]
- **Líneas 45–57**: construye el documento de suscripción:
  - `status: 'Activa'`: activación sin comprobar importe real (un pago
    aprobado de importe arbitrario activa igualmente).
  - `amount`: `transaction_amount` o 5000 por defecto (valor mágico no
    alineado con 7500/75000).
  - `billingType: 'Mensual'` literal (incluso para pagos anuales).
  - `paymentType`: tipo de pago MP (card, bank_transfer, etc.).
  - `mercadopagoOrderId`: id del pago.
  - `updatedAt`/`initialPaymentDate`: timestamp numérico local (`Date.now()`).
- **Líneas 60–63**: consulta si ya existe una suscripción con ese `userId`
  (límite 1). Requiere índice compuesto en Firestore si `userId`+`status`
  no... aquí solo filtra por `userId`, sin índice compuesto; ok.
- **Líneas 64–71**: si no existe la crea (`add` con `createdAt`); si existe la
  actualiza (sin `createdAt`). Upsert básico.
- **Línea 72**: log de éxito.
- **Línea 75**: responde 200 'OK' tras procesar un pago.
- **Líneas 76–79**: ante error, responde 500 'Error' (Mercado Pago reintentará
  el webhook con backoff).
- **Líneas 80–82**: cualquier otro evento responde 200 'Ignorado' (incluidos
  los preapproval de las líneas 22–34, que nunca llegan a actualizar nada).
  [NOTA] Responder 200 a eventos de preapproval no procesados evita reintentos
  de MP, pero deja sin efecto la gestión de ciclos de suscripción.

## Fichas de funciones y métodos

### mpWebhook (líneas 18–83)

- Firma (código original):
  `export const mpWebhook = onRequest(async (req, res) => {...})`
- Propósito técnico: endpoint HTTP público que consume notificaciones de
  Mercado Pago y escribe en Firestore mediante Admin SDK.
- Propósito funcional: activar la suscripción del usuario cuando un pago se
  aprueba.
- Parámetros: `req` (Express Request), `res` (Express Response). Entrada
  esperada: query `type`, `data.id`, `action`; cuerpo JSON con `data.id`.
- Retorno: respuestas HTTP (200 OK / 500 Error / 200 Ignorado). Sin cuerpo
  JSON estructurado.
- Excepciones: capturadas internamente (log + 500).
- Dependencias: mercadopago SDK (Payment), firebase-admin (Firestore), env
  `MP_ACCESS_TOKEN`.
- Flujo interno: extraer parámetros → si preapproval, loguear → si payment
  aprobado, consultar pago → upsert en `subscriptions` → responder.
- Desde dónde se llama: servidores de Mercado Pago (webhook configurado en el
  panel del vendedor).
- Efectos secundarios: creación/actualización de documentos en la colección
  `subscriptions`; posible activación fraudulenta (ver Seguridad).
- Riesgos: sin verificación de firma; interpretación errónea de
  external_reference; rama preapproval inerte; dependencia de query string.

## Clases / interfaces / tipos

Ninguna (objetos implícitos).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Coherencia con `createPaymentOrder.ts`: el formato de
  `external_reference` (`monthly:<deviceId>` / `annual:<deviceId>`) no encaja
  con el uso que el webhook hace de él (`userId`). [NIVEL DE CERTEZA:
  Confirmado por código]
- [OBSERVACIÓN TÉCNICA] El webhook asume que todo pago aprobado es una
  suscripción mensual (`billingType: 'Mensual'`) y usa un importe por defecto
  de 5000 que no coincide con ningún plan vigente (7500 mensual / 75 000
  anual). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] La consulta del id del evento depende de la query
  string; Mercado Pago documenta el envío del payload en el cuerpo del POST.
  La rama payment (la única con efecto) NO lee `req.body.data.id` como
  alternativa, a diferencia de la rama preapproval. Riesgo de no procesar
  pagos según la configuración real del webhook. [NIVEL DE CERTEZA: Inferido]
- [OBSERVACIÓN TÉCNICA] La rama preapproval es código muerto funcionalmente:
  registra y no hace nada (línea 29 con lógica comentada). Las cancelaciones
  o fallos de cobro de suscripciones recurrentes no se reflejan en Firestore.
  [PENDIENTE]
- [OBSERVACIÓN TÉCNICA] La colección `subscriptions` NO tiene regla explícita
  en `firestore.rules` (solo `users/{userId}/**`, `pendingNotifications` y
  `_functionEvents`); las reglas de Firestore deniegan por defecto lo no
  cubierto, por lo que el cliente NO puede leer `subscriptions` directamente
  con el SDK. El servicio del cliente `SubscriptionService.ts` consulta esa
  colección, lo que sugiere una incoherencia con las reglas vigentes (o que el
  estado de suscripción real se obtiene por otra vía, p. ej. el backend de
  PythonAnywhere vía `PaymentService`). [NIVEL DE CERTEZA: Altamente probable]

## Seguridad

- [CRÍTICO] Webhook SIN verificación de firma: no se valida `X-Signature` ni
  se comprueba que la petición provenga de Mercado Pago. Cualquier actor que
  conozca la URL pública de la función puede enviar un POST con
  `type=payment` y un `data.id` de un pago aprobado (o de un pago ajeno de la
  misma cuenta) para activar suscripciones; peor aún, si `external_reference`
  fuera controlable (hoy es `monthly:<deviceId>`, predecible), un atacante
  podría activar el estado 'Activa' de suscripciones arbitrarias sin pagar.
  La API de MP proporciona firma HMAC (`X-Signature`) que debe validarse.
  [NIVEL DE CERTEZA: Confirmado por código]
- [ALTO] Autorización de activación basada en datos no verificados: no se
  valida que el pago corresponda a un plan/importe esperado (7500/75000), ni
  que `external_reference` pertenezca al pagador. Un pago aprobado de bajo
  importe activa una suscripción 'Mensual'.
- [MEDIO] Posible no procesamiento de pagos reales por lectura de `data.id`
  solo en query string (configuración de webhook de MP), con respuesta 'OK'
  que impide reintentos → pagos aprobados que nunca activan la suscripción
  (afecta a la integridad del servicio, no fuga de datos).
- [BAJO] Token `MP_ACCESS_TOKEN` por `process.env` con fallback sintético; si
  el entorno no lo inyecta, consultas fallidas (500) y reintentos de MP.
- [INFORMATIVO] No se registran secretos en logs; los logs incluyen ids de
  pago/preapproval y userId (información esperable).
- [BAJO] El webhook es público y sin límite de tasa: puede ser usado para
  forzar consultas a la API de MP (coste/cuota) con ids arbitrarios.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Implementar verificación de firma HMAC de Mercado Pago
  (`X-Signature` con el secret del webhook) y rechazar peticiones no válidas
  con 401/403 antes de procesar.
- [RECOMENDACIÓN] Leer el id del evento de `req.body.data.id` (y de la query
  como compatibilidad) en la rama payment, igual que en preapproval.
- [RECOMENDACIÓN] Alinear `external_reference` con un identificador de usuario
  real (o guardar el mapping deviceId→uid en Firestore) y usarlo en el webhook
  para poblar correctamente `subscriptions.userId`.
- [RECOMENDACIÓN] Implementar la rama de preapproval (activación, cancelación,
  fallo de cobro) consultando la API de MP, y validar importes/planes antes de
  marcar 'Activa'.
- [RECOMENDACIÓN] Añadir regla de lectura a `subscriptions` para el cliente (o
  mover la gestión de estado de suscripción exclusivamente al backend), de
  modo que el estado escrito por el webhook sea consumible por la app.
- [RECOMENDACIÓN] Gestionar `MP_ACCESS_TOKEN` con Secret Manager y configurar
  correctamente la URL del webhook en el panel de MP.

---

## Actualización 2026-09-06 — Fase 1 de reparación (commit 0001)

Estado real tras la Fase 1 del plan de reparación (`documentacion_generada/
PLAN_REPARACION_SAFEALERT.md`):

- Nuevo módulo `functions/src/mpSignature.ts` (pure): `parsearCabeceraFirma`,
  `firmaDentroDeVentana` (5 min, anti-replay), `firmasIgualesEnTiempoConstante`
  (hex válido + longitud par + `timingSafeEqual`) y
  `verificarFirmaWebhookMercadoPago`. Replica el algoritmo de
  `backend/flask_app.py::verify_mp_signature` (HMAC-SHA256 sobre
  `id:<dataId>;request-id:<xRequestId>;ts:<ts>` con `MP_WEBHOOK_SECRET`).
- `mpWebhook` ahora declara el secreto con `defineSecret('MP_WEBHOOK_SECRET')`
  (`onRequest({secrets:[...]})`) y **falla cerrado**: 401 si la firma falta o no
  es válida (cabecera incompleta, firma distinta, ts fuera de ventana o datos
  incompletos) y 503 si el secreto no está configurado. Solo procesa eventos
  firmados válidamente.
- `data.id` se lee de la query (`data.id`) con respaldo en `req.body.data.id`
  (helper `extraerDataId`).
- Tests unitarios añadidos en `functions/src/__tests__/mpSignature.test.ts`
  (node:test, 10 casos; `npm test` en `functions/`).
- Pendiente para Fase 2: coherencia `external_reference` ↔ `userId`, rama
  `subscription_preapproval` real e idempotencia por `mercadopagoOrderId`.
- Despliegue: antes de `firebase deploy`, crear el secreto con
  `firebase functions:secrets:set MP_WEBHOOK_SECRET` (mismo valor que el
  `MP_WEBHOOK_SECRET`/`safealert-mp-secret` ya usado por el backend) y validar
  la firma con un evento real de sandbox.
