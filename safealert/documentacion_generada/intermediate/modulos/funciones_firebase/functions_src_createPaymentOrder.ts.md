# Archivo: functions/src/createPaymentOrder.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| functions/src/createPaymentOrder.ts | 193 | TypeScript | 7474 | Cloud Function HTTP callable (pagos Mercado Pago) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define `createPaymentOrder`, una Cloud Function callable HTTPS
(`firebase-functions/v2/https`) que crea la orden de pago en Mercado Pago
según el plan elegido:

- Plan mensual (`monthly`): crea un `PreApproval` (suscripción recurrente de
  ARS 7500/mes) y vincula su id con el `deviceId` del usuario llamando al
  backend de PythonAnywhere (`/api/internal/link-preapproval`).
- Plan anual (`annual`): crea una `Preference` de pago único (ARS 75 000) y la
  devuelve al cliente.

En ambos casos devuelve `{ success, subscriptionId, initPoint }` para que la
app abra la URL de pago. Requiere autenticación Firebase (`request.auth`),
valida mínimamente parámetros y está sujeta al interruptor global
`PAYMENTS_ENABLED`.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` (con observaciones de validación y
coherencia con el webhook).

La función está exportada desde `index.ts` (línea 8) y es consumida por el
cliente móvil (`PaymentModal.tsx`, línea 148:
`functions().httpsCallable('createPaymentOrder')`), que le pasa
`{ userName, phoneNumber, deviceId, planType }` y espera
`{ success, initPoint, subscriptionId }`. El contrato de campos coincide.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| onCall, HttpsError (firebase-functions/v2/https) | externa | Líneas 15, 87, 91, 98, 105, 189 | Sí |
| defineSecret (firebase-functions/params) | externa | Línea 20 | Sí |
| MercadoPagoConfig, PreApproval, Preference (mercadopago) | externa | Líneas 17, 27, 121, 153 | Sí |

## Componentes que dependen de este archivo

| Componente | Relación |
| --- | --- |
| functions/src/index.ts | Reexporta `createPaymentOrder` (línea 8) |
| Cliente móvil src/components/PaymentModal.tsx | Llama la callable (línea 148) y usa la respuesta |
| Backend PythonAnywhere | Endpoint interno `/api/internal/link-preapproval` (plan mensual) |
| Mercado Pago API | Creación de PreApproval/Preference |
| mpWebhook.ts | Consume los pagos/preapprovals creados aquí (ver coherencia en Observaciones) |
| Firestore | Indirectamente, vía mpWebhook al activar suscripciones |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| paInternalKey | defineSecret('PA_INTERNAL_KEY') | SecretParam | Clave interna a PythonAnywhere (Secret Manager) | Líneas 20, 88, 116 |
| MP_ACCESS_TOKEN | process.env.MP_ACCESS_TOKEN o fallback sintético 'TEST-...' | string [SECRETO OCULTO] | Access token de Mercado Pago | Líneas 22–23, 27, 115 |
| PAYMENTS_ENABLED | (process.env.PAYMENTS_ENABLED || 'false') → boolean | boolean | Interruptor de pasarela | Línea 24 |
| PA_API_URL | process.env.PA_API_URL o 'https://oaf.pythonanywhere.com' | string | Base del backend interno | Línea 25 |
| client | new MercadoPagoConfig({ accessToken }) | objeto | Cliente MP compartido | Línea 27 |
| PlanType | 'monthly' \| 'annual' | tipo | Tipo de plan | Línea 29 |
| PaymentRequest | interface | tipo | Contrato de entrada | Líneas 31–37 |

[NOTA] El fallback de `MP_ACCESS_TOKEN` (línea 23) es un literal sintético de
formato TEST con ceros: NO es un secreto real; es un marcador. Su presencia
implica que, si la variable no está configurada en el entorno de la función,
los pagos se crearían contra un token inválido (error de MP) o, según la
configuración del proyecto MP, contra un entorno de pruebas no funcional.

Valores mágicos de negocio (precios):

| Constante inline | Valor | Significado |
| --- | --- | --- |
| transaction_amount mensual | 7500 ARS | Precio del plan mensual (auto_recurring) |
| unit_price anual | 75000 ARS | Precio del plan anual (10 meses + 2 gratis según el título del ítem) |
| back_url(s) | https://oaf.pythonanywhere.com/api/health | URL de retorno tras el pago (endpoint de salud, no página de confirmación) |
| reason | 'Suscripción mensual SafeAlert' | Razón mostrada al pagador |

## Estructura (funciones / clases / tipos)

| Nombre | Tipo | Líneas |
| --- | --- | --- |
| _linkPreapprovalToDevice | función interna async | 51–73 |
| createPaymentOrder | Cloud Function onCall | 87–192 |
| PlanType | tipo exportado | 29 |
| PaymentRequest | interface | 31–37 |

## Análisis línea por línea

```ts
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
```

**Explicación de las líneas 1–37:**

- **Líneas 1–13**: cabecera documental (autor oafon, versión 2.0.0). Describe
  el comportamiento real del archivo (preapproval mensual/preference anual).
- **Línea 15**: importa los helpers de callable HTTPS v2.
- **Línea 16**: importa `defineSecret` para secretos gestionados.
- **Línea 17**: importa el SDK de Mercado Pago (config, preapproval y
  preference).
- **Línea 20**: declara el secreto `PA_INTERNAL_KEY` (debe existir en Secret
  Manager; el deploy de la función fallará si no está definido).
- **Líneas 22–23**: `MP_ACCESS_TOKEN` desde `process.env` con fallback
  sintético. [RIESGO] No se declara como secreto de la función (no aparece en
  `secrets: [...]`), por lo que en producción debe inyectarse como variable de
  entorno del proyecto; si no, se usará el token de prueba inválido. [NIVEL DE
  CERTEZA: No determinado] (no se ha podido verificar la configuración de
  entorno del proyecto desplegado).
- **Línea 24**: `PAYMENTS_ENABLED`: normaliza el valor a booleano
  (`'true'` exacto en minúsculas y sin espacios).
- **Línea 25**: `PA_API_URL` con valor por defecto.
- **Línea 27**: cliente MP compartido a nivel de módulo (se crea en el cold
  start).
- **Línea 29**: exporta el tipo `PlanType`, que coincide con el tipo del
  cliente (`PaymentService.PlanType = 'monthly' | 'annual'`). Coherente.
- **Líneas 31–37**: `PaymentRequest`: contrato de entrada. `email` es
  opcional; `phoneNumber` NO es opcional pero tampoco se valida su formato en
  la función (solo se exige presencia de userName, deviceId y planType; ver
  más abajo).

```ts
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
```

**Explicación de las líneas 39–73:**

- **Líneas 39–50**: cabecera de la función interna.
- **Líneas 51–56**: firma con cuatro parámetros: `deviceId`, `mpId` (id del
  preapproval), `planType` e `internalKey`.
- **Líneas 57–72**: cuerpo.
  - **Línea 58**: POST al endpoint interno de PythonAnywhere
    (`/api/internal/link-preapproval`).
  - **Líneas 60–63**: cabeceras con `X-Internal-Key` (clave secreta de Secret
    Manager) y cuerpo `{ device_id, mp_preapproval_id, plan_type }`.
  - **Líneas 66–68**: si la respuesta no es 2xx solo se registra el status.
  - **Líneas 69–72**: ante excepción de red se registra el error y NO se
    propaga ("el pago ya fue creado exitosamente"). [RIESGO] Fallo silencioso:
    el preapproval queda creado en MP pero sin vínculo con el dispositivo en
    PythonAnywhere, y nadie lo reintenta ni lo audita más allá del log.

```ts
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
```

**Explicación de las líneas 75–109:**

- **Líneas 75–86**: cabecera de la función callable.
- **Línea 87**: define la callable.
- **Línea 88**: inyecta el secreto `PA_INTERNAL_KEY` a la función (su valor
  queda disponible vía `paInternalKey.value()`).
- **Líneas 90–95**: interruptor global de pagos: si `PAYMENTS_ENABLED` es
  falso, lanza `failed-precondition` con mensaje de pausa por pruebas
  funcionales. El mensaje es informativo y no filtra secretos.
- **Líneas 97–99**: exige autenticación Firebase (`request.auth`); sin ella
  lanza `unauthenticated`. Correcto para una operación de pago.
- **Líneas 101–102**: desestructura `request.data` como `PaymentRequest`.
  [NOTA] `request.data` NO se valida con esquema (zod no se usa aquí): si el
  cliente envía campos con tipos incorrectos, el cast de TypeScript no protege
  en runtime.
- **Líneas 104–109**: valida solo la presencia de `userName`, `deviceId` y
  `planType`. NO valida: formato de teléfono, longitud de `deviceId`, ni que
  `planType` pertenezca al enum `'monthly' | 'annual'`. [RIESGO] Cualquier
  valor distinto de `'monthly'` (p. ej. `'mensual'`, `'x'`) entra en la rama
  `else` y crea un pago ANUAL de ARS 75 000 sin error. Impacto: MEDIO
  (validación de entrada débil).

```ts
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
```

**Explicación de las líneas 111–149:**

- **Líneas 112–113**: calcula el email del pagador: usa el email provisto (en
  minúsculas y sin espacios) o genera uno de sistema derivado de los últimos 8
  caracteres del `deviceId` con dominio `@safealert.com`. [NOTA] Si el usuario
  no posee una cuenta Mercado Pago asociada a ese email sintético, MP enviará
  una invitación para completar el pago; es un diseño que externaliza la
  gestión de la cuenta.
- **Línea 115**: `isSandbox` detecta el entorno por el prefijo `TEST-`.
- **Línea 116**: resuelve el valor del secreto `PA_INTERNAL_KEY` desde Secret
  Manager.
- **Línea 118**: inicia el bloque try/catch general.
- **Líneas 119–149**: rama del plan mensual.
  - **Línea 121**: instancia `PreApproval` con el cliente compartido.
  - **Líneas 122–136**: crea la suscripción recurrente:
    - `reason`: 'Suscripción mensual SafeAlert'.
    - `external_reference`: `monthly:${deviceId}`. [RIESGO DE COHERENCIA] Este
      valor NO es un uid de usuario Firebase ni un userId: es una cadena con
      prefijo del plan + id de dispositivo. El webhook `mpWebhook.ts` lo
      interpreta como `userId` al activar la suscripción (ver ficha de
      mpWebhook: `paymentData.external_reference` → campo `userId`), lo que
      genera un `userId` con formato `monthly:<deviceId>` en la colección
      `subscriptions`. [NIVEL DE CERTEZA: Confirmado por código]
    - `payer_email`: email calculado.
    - `auto_recurring`: frecuencia 1 mes, importe 7500 ARS.
    - `back_url`: apunta al endpoint de salud de PythonAnywhere (no a una
      página de resultado propia).
    - `status: 'pending'`.
  - **Líneas 138–143**: vincula el preapproval al dispositivo (función con
    fallo silencioso, ver líneas 66–72).
  - **Líneas 145–149**: respuesta con `subscriptionId` y `initPoint`. En esta
    rama SIEMPRE prefiere `sandbox_init_point` si existe
    (`(result as any).sandbox_init_point ?? result.init_point`), con
    independencia de `isSandbox`. Inconsistencia con la rama anual (que sí usa
    `isSandbox`): si MP devuelve ambos puntos y el token es de producción, se
    podría devolver una URL de sandbox. Impacto: BAJO.

```ts
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
```

**Explicación de las líneas 151–192:**

- **Líneas 151–185**: rama del plan anual (`else` de la línea 119).
  - **Línea 153**: instancia `Preference`.
  - **Líneas 154–178**: crea la preferencia de pago:
    - `items`: un ítem `annual-${deviceId}` titulado 'Suscripción anual
      SafeAlert (10 meses + 2 gratis)', unit_price 75 000 ARS.
    - `payer`: nombre, teléfono (sin validación de formato E.164) y email del
      pagador.
    - `external_reference`: `annual:${deviceId}`. [RIESGO DE COHERENCIA]
      Mismo problema que la rama mensual: el webhook lo tratará como `userId`.
    - `back_urls`: las tres (success/failure/pending) apuntan al endpoint de
      salud de PythonAnywhere.
    - `auto_return: 'approved'`: MP redirige automáticamente al pagador cuando
      el pago se aprueba.
  - **Líneas 180–184**: respuesta con `subscriptionId` y `initPoint`
    seleccionado según `isSandbox` (aquí sí se condiciona al entorno).
  - [NOTA] En la rama anual NO se llama a `_linkPreapprovalToDevice`; el
    vínculo del pago anual con el dispositivo solo queda en
    `external_reference`. La activación de la suscripción anual dependerá del
    webhook.
- **Líneas 187–190**: captura cualquier error de creación en MP, lo registra y
  lanza `HttpsError('internal', ...)` con mensaje genérico al cliente y el
  error original como detalle (el SDK callable oculta detalles al cliente a
  menos que se configure `enforceAppCheck`/deprecación; el mensaje visible es
  el texto genérico). No filtra secretos.
- **Línea 191–192**: cierre del callback y de la definición de la función.

## Fichas de funciones y métodos

### createPaymentOrder (líneas 87–192)

- Firma (código original):
  `export const createPaymentOrder = onCall({ secrets: [paInternalKey] }, async (request) => {...})`
- Propósito técnico: callable HTTPS autenticada que orquesta la creación de
  instrumentos de pago de Mercado Pago (PreApproval o Preference) y una
  llamada interna al backend PythonAnywhere.
- Propósito funcional: generar la orden de pago (mensual recurrente o anual
  única) y devolver la URL (`initPoint`) para que la app la abra en el
  navegador.
- Parámetros de entrada (datos del callable): `userName: string`,
  `phoneNumber: string`, `email?: string`, `deviceId: string`,
  `planType: 'monthly' | 'annual'`.
- Retorno: `{ success: boolean, subscriptionId?: string,
  initPoint?: string }` o lanza `HttpsError`.
- Excepciones lanzadas: `failed-precondition` (pasarela pausada),
  `unauthenticated` (sin sesión), `invalid-argument` (faltan parámetros),
  `internal` (error de Mercado Pago).
- Dependencias: mercadopago SDK, fetch (backend PA), Secret Manager
  (`PA_INTERNAL_KEY`), env `MP_ACCESS_TOKEN`/`PAYMENTS_ENABLED`/`PA_API_URL`.
- Flujo interno: 1) comprobar PAYMENTS_ENABLED; 2) comprobar auth; 3) validar
  presencia de parámetros; 4) derivar email; 5) crear instrumento MP según
  plan; 6) (mensual) vincular preapproval en PA; 7) devolver initPoint.
- Desde dónde se llama: SDK de cliente
  `functions().httpsCallable('createPaymentOrder')` (PaymentModal.tsx:148).
- Efectos secundarios: creación de instrumentos de cobro en Mercado Pago,
  llamada al backend PA, posible acumulación de preapprovals si el cliente no
  completa el pago.
- Riesgos: validación débil (planType arbitrario → rama anual), fallo
  silencioso del vínculo PA, external_reference incompatible con lo que espera
  el webhook, dependencia de env sin Secret Manager para el token de MP.

### _linkPreapprovalToDevice (líneas 51–73)

- Firma (código original):
  `async function _linkPreapprovalToDevice(deviceId: string, mpId: string, planType: PlanType, internalKey: string): Promise<void>`
- Propósito técnico: notificar al backend central el vínculo
  dispositivo-preapproval.
- Propósito funcional: permitir que PythonAnywhere asocie la suscripción
  mensual de MP al dispositivo del usuario.
- Parámetros: tabla en líneas 51–56.
- Retorno: `Promise<void>`; no propaga errores.
- Dependencias: fetch, `PA_API_URL`, `internalKey`.
- Efectos secundarios: escritura en la BD central de PA; si falla, solo log.
- Riesgos: silencio de fallos sin mecanismo de reintento ni auditoría externa.

## Clases / interfaces / tipos

| Nombre | Tipo | Responsabilidad | Campos |
| --- | --- | --- | --- |
| PlanType | tipo unión exportado | Tipar el plan elegido | 'monthly' \| 'annual' |
| PaymentRequest | interface | Contrato de entrada de la callable | userName, phoneNumber, email?, deviceId, planType |

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Coherencia con el cliente confirmada: `PaymentModal.tsx`
  envía `{ userName, phoneNumber, deviceId, planType }` y el tipo `PlanType`
  del cliente coincide ('monthly' | 'annual'). Los montos coinciden con los
  mostrados en la UI (7500/75000 ARS). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] Desalineación productor-consumidor con `mpWebhook.ts`:
  `external_reference` se genera como `monthly:${deviceId}` / `annual:${deviceId}`,
  mientras el webhook trata ese valor como `userId` de usuario y lo escribe en
  `subscriptions.userId`. Si `deviceId` no es el uid de Firebase, las
  suscripciones activadas tendrán un `userId` que el cliente
  (`SubscriptionService.getSubscription(userId)`, consulta por uid de Auth) no
  podrá encontrar. Además el prefijo `monthly:`/`annual:` contamina el campo.
  [NIVEL DE CERTEZA: Confirmado por código] (por el contenido literal de ambos
  archivos; el impacto depende de la semántica real de deviceId en el backend
  PA, que no se audita aquí).
- [OBSERVACIÓN TÉCNICA] `deviceId` es un identificador de dispositivo que el
  cliente registra en PythonAnywhere (`PaymentService.registerDevice`); la
  callable no verifica que `deviceId` pertenezca al usuario autenticado
  (`request.auth.uid`). Un usuario autenticado podría crear órdenes con el
  `deviceId` de otro dispositivo. Impacto: MEDIO (vinculación cruzada de
  pagos).
- [OBSERVACIÓN TÉCNICA] `PAYMENTS_ENABLED` puede estar a `true` mientras
  `MP_ACCESS_TOKEN` no esté configurado (fallback sintético) → errores
  `internal` al cliente. Verificación de despliegue pendiente. [NIVEL DE
  CERTEZA: No determinado]
- [OBSERVACIÓN TÉCNICA] En la rama mensual el `initPoint` prefiere siempre
  `sandbox_init_point`, y en la anual depende de `isSandbox`: comportamiento
  asimétrico. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `phoneNumber` se exige en el tipo pero su ausencia NO
  dispara `invalid-argument` (la validación de presencia no lo incluye); MP
  rechazaría la preferencia si el número es inválido. Impacto: BAJO.
- [NOTA] `email` opcional con generación sintética `usuario-xxxx@safealert.com`
  puede causar fricción con cuentas MP inexistentes; comportamiento de negocio
  a validar.

## Seguridad

- [ALTO] Validación de entrada insuficiente sobre `planType`: cualquier valor
  distinto de `'monthly'` crea silenciosamente un cargo anual de ARS 75 000.
  Combinado con autenticación solo de presencia (no se verifica propietario del
  `deviceId`), un usuario autenticado puede forzar ramas de cobro no deseadas o
  vincular pagos a dispositivos ajenos. (No hay riesgo de cobro directo sin
  consentimiento del pagador, ya que MP exige el flujo del pagador, pero sí de
  manipulación del estado y del vínculo.)
- [MEDIO] Token de Mercado Pago gestionado por `process.env` (no por Secret
  Manager en esta función): riesgo de configuración errónea y de quedar fuera
  del ciclo de rotación de secretos. `PA_INTERNAL_KEY` sí se gestiona bien vía
  `defineSecret`.
- [BAJO] Fallo silencioso de `_linkPreapprovalToDevice`: el error de
  vinculación no se propaga ni se reintenta; puede dejar suscripciones pagadas
  sin asociar a dispositivo (afecta a la integridad del negocio, no expone
  datos).
- [BAJO] Mensajes de error al cliente genéricos y sin secretos (correcto).
  El error original se pasa como `details` del `HttpsError`; el SDK de cliente
  lo expone en `e.message`/`details` según versión: no contiene secretos (solo
  errores de MP), riesgo de fuga BAJO.
- [INFORMATIVO] Autenticación exigida (`request.auth`), pero sin
  `enforceAppCheck` ni rate limiting: un usuario autenticado puede invocar la
  callable repetidamente (creación masiva de preapprovals/preferences →
  coste/ruido en MP). Impacto: BAJO/MEDIO operativo.
- [INFORMATIVO] No se registran secretos en logs (solo status de HTTP y
  errores de MP).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Validar `request.data` con zod (ya disponible en el
  proyecto): `planType` en el enum exacto, `phoneNumber` con formato E.164,
  `deviceId` acotado, y devolver `invalid-argument` ante cualquier desvío.
- [RECOMENDACIÓN] Verificar que `deviceId` pertenece al usuario autenticado
  (p. ej. consultando el doc del usuario o el registro de dispositivos en
  Firestore) antes de crear la orden.
- [RECOMENDACIÓN] Unificar el identificador de referencia externa: usar un id
  de usuario/orden estable y que el webhook pueda resolver, no `monthly:deviceId`.
- [RECOMENDACIÓN] Gestionar `MP_ACCESS_TOKEN` con Firebase Secret Manager
  (`defineSecret`) como se hace con `PA_INTERNAL_KEY`.
- [RECOMENDACIÓN] Hacer que `_linkPreapprovalToDevice` reintente o registre en
  Firestore el vínculo pendiente para reproceso, en lugar de fallar en silencio.
- [RECOMENDACIÓN] Unificar la selección de `initPoint` entre ramas (mensual y
  anual) usando `isSandbox` en ambas.
