# Archivo: src/services/SubscriptionService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/SubscriptionService.ts | 76 | TypeScript 5.9 | 2314 | Servicio de acceso a datos (Firestore) para suscripciones | [POTENCIALMENTE NO UTILIZADO] | [NIVEL DE CERTEZA: Altamente probable] |

## Objetivo

Servicio que lee y crea documentos de suscripción en la colección Firestore `subscriptions`, trabajando sobre la capa híbrida `firestore()` del proyecto (Android nativo vía `@react-native-firebase/firestore`, Apple/web vía SDK modular). Expone dos operaciones: obtener la suscripción activa de un usuario y crear un registro inicial de suscripción.

## Clasificación y estado

- [POTENCIALMENTE NO UTILIZADO] — no se hallaron referencias de importación del servicio en el código de la app ni en los tests mediante búsqueda real con grep sobre todo el árbol del proyecto (patrón `SubscriptionService|getSubscription|createSubscription`). Las únicas coincidencias están dentro del propio archivo.
- Existe una alternativa/duplicación funcional: la colección `subscriptions` la escribe directamente el webhook de Mercado Pago en `functions/src/mpWebhook.ts` (líneas 48–72) con Firestore Admin, y el estado de suscripción del usuario se consulta principalmente contra el backend de PythonAnywhere vía `PaymentService.checkSubscription`.
- [NIVEL DE CERTEZA: Altamente probable] — la ausencia de referencias se verificó por grep; no se puede descartar uso futuro o dinámico sin compilar.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `firestore` de `../config/firebase` | interna | Colección `subscriptions` en `getSubscription` y `createSubscription` | Sí |

## Componentes que dependen de este archivo

- No se encontraron componentes que lo importen (grep en todo el proyecto: solo aparece en sí mismo). [NIVEL DE CERTEZA: Altamente probable]
- Relación funcional (no de importación): `functions/src/mpWebhook.ts` escribe en la misma colección `subscriptions`, por lo que el modelo de datos es compartido aunque el cliente no consuma este servicio.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `SUBSCRIPTIONS_COLLECTION` | `'subscriptions'` | string (constante) | Nombre de la colección Firestore | Líneas 28, 37, 60 |

Valores mágicos:
- `'Activa'` (líneas 22 y 39): estado de suscripción vigente; coincide con el que escribe `mpWebhook.ts` (`status: 'Activa'`). Significado confirmado por código.
- `'Vencida'` (línea 22): estado alternativo en el union type.
- `'Efectivo' | 'Transferencia' | 'Tarjeta de Crédito'` (línea 20): medios de pago del modelo; el webhook escribe `payment_type_id` de MP que puede no coincidir con esta enumeración. [OBSERVACIÓN TÉCNICA]
- `'Mensual' | 'Anual'` (línea 21): tipo de facturación; `mpWebhook.ts` hardcodea `billingType: 'Mensual'` incluso para pagos anuales. [OBSERVACIÓN TÉCNICA]

## Estructura (funciones / clases / tipos)

- Interfaz exportada: `SubscriptionData` (líneas 13–26).
- Constante: `SUBSCRIPTIONS_COLLECTION` (línea 28).
- Objeto exportado `SubscriptionService` (líneas 30–75):
  - `getSubscription(userId: string): Promise<SubscriptionData | null>` (líneas 34–53).
  - `createSubscription(data): Promise<string>` (líneas 58–75).

## Análisis línea por línea

**Bloque 1 (líneas 1–28): cabecera, importación y tipos.**

```ts
/* ============================================================================
* Archivo         : SubscriptionService.ts
* Descripción     : Servicio para gestionar el estado de suscripciones (Mercado Pago).
* Autor           : oafon
* Fecha           : 2026-03-23
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : SubscriptionService.getSubscription(userId)
* ============================================================================ */

import { firestore } from '../config/firebase';

export interface SubscriptionData {
  id: string;
  userId: string;
  phoneNumber: string;
  userName: string;
  initialPaymentDate: number;
  amount: number;
  paymentType: 'Efectivo' | 'Transferencia' | 'Tarjeta de Crédito';
  billingType: 'Mensual' | 'Anual';
  status: 'Activa' | 'Vencida';
  mercadopagoOrderId?: string;
  createdAt: number;
  updatedAt: number;
}

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
```

**Explicación de las líneas 1–28:**
- **Líneas 1–9**: cabecera documental del proyecto (autor oafon, 2026-03-23, v1.0.0). Describe el servicio como gestor del estado de suscripciones de Mercado Pago.
- **Línea 11**: importa el helper `firestore()` de la capa híbrida de Firebase.
- **Líneas 13–26**: interfaz `SubscriptionData`. Representa un documento de suscripción:
  - `id`: identificador del documento (autogenerado por Firestore).
  - `userId`: usuario propietario.
  - `phoneNumber` y `userName`: datos del titular.
  - `initialPaymentDate`: epoch ms del primer pago.
  - `amount`: importe.
  - `paymentType`: medio de pago cerrado a 3 valores.
  - `billingType`: mensual o anual.
  - `status`: `Activa` o `Vencida`.
  - `mercadopagoOrderId?`: id de la orden/identificador de MP para conciliación.
  - `createdAt`/`updatedAt`: marcas de tiempo en ms.
- **Línea 28**: constante del nombre de colección `subscriptions`, compartido con `mpWebhook.ts`.

**Bloque 2 (líneas 30–53): `getSubscription`.**

```ts
export const SubscriptionService = {
  /**
   * Obtiene la suscripción activa de un usuario
   */
  async getSubscription(userId: string): Promise<SubscriptionData | null> {
    try {
      const snapshot = await firestore()
        .collection(SUBSCRIPTIONS_COLLECTION)
        .where('userId', '==', userId)
        .where('status', '==', 'Activa')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as SubscriptionData;
    } catch (error) {
      console.error('[SubscriptionService] Error obteniendo suscripción:', error);
      throw error;
    }
  },
```

**Explicación de las líneas 30–53:**
- **Línea 30**: apertura del objeto exportado `SubscriptionService`.
- **Líneas 31–33**: docstring corto.
- **Línea 34**: firma del método: recibe `userId` y devuelve la suscripción activa o `null`.
- **Líneas 36–41**: consulta a Firestore: colección `subscriptions`, filtro `userId == userId` y `status == 'Activa'`, con `limit(1)` para obtener un único documento. Requiere reglas de seguridad que permitan la lectura al usuario autenticado.
- **Líneas 43–45**: si no hay resultados, retorna `null`.
- **Líneas 47–48**: construye el objeto con el `id` del documento y el resto de datos (spread de `doc.data()`), casteado a `SubscriptionData`.
- **Líneas 49–52**: ante error, registra en consola y re-lanza la excepción (a diferencia de otros servicios que degradan, este propaga el error al llamador).

**Bloque 3 (líneas 55–76): `createSubscription` y cierre.**

```ts
  /**
   * Crea un registro inicial de suscripción (ej. pendiente de pago)
   */
  async createSubscription(data: Omit<SubscriptionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = firestore().collection(SUBSCRIPTIONS_COLLECTION).doc();
      const now = Date.now();

      const payload = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      await docRef.set(payload);
      return docRef.id;
    } catch (error) {
      console.error('[SubscriptionService] Error creando suscripción:', error);
      throw error;
    }
  }
};
```

**Explicación de las líneas 55–76:**
- **Línea 58**: firma: recibe los datos de suscripción sin `id` ni marcas de tiempo (que genera el servicio) y devuelve el id del documento creado.
- **Línea 60**: crea una referencia de documento con id autogenerado por Firestore.
- **Línea 61**: `now = Date.now()` (epoch ms).
- **Líneas 63–67**: compone el payload con `createdAt` y `updatedAt` iguales al momento actual.
- **Línea 69**: persiste el documento con `set`.
- **Línea 70**: retorna el id del documento.
- **Líneas 71–74**: ante error, loguea y re-lanza.

## Fichas de funciones y métodos

### getSubscription (líneas 34–53)
- Firma: `async getSubscription(userId: string): Promise<SubscriptionData | null>`.
- Propósito técnico: consultar Firestore con doble filtro de igualdad; propósito funcional: recuperar la suscripción vigente del usuario.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| userId | string | UID de Firebase del usuario. |

- Retorno: `SubscriptionData | null`.
- Excepciones: relanza errores de Firestore/red.
- Dependencias: `firestore()`, `SUBSCRIPTIONS_COLLECTION`.
- Flujo interno: filtro por `userId` y `status == 'Activa'`, `limit(1)`, mapeo con `id` + datos.
- Desde dónde se llama: sin llamadores encontrados. [POTENCIALMENTE NO UTILIZADO]
- Efectos secundarios: ninguno (solo lectura).
- Riesgos: sin reglas Firestore adecuadas podría devolver datos de otro usuario; el filtrado por `userId` en cliente no es un control de seguridad por sí mismo.

### createSubscription (líneas 58–75)
- Firma: `async createSubscription(data: Omit<SubscriptionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>`.
- Propósito técnico/funcional: crear un documento de suscripción (p. ej. estado pendiente de pago) con marcas de tiempo automáticas.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| data | Omit de SubscriptionData | Campos del documento sin `id`, `createdAt`, `updatedAt`. |

- Retorno: `Promise<string>` con el id del documento creado.
- Excepciones: relanza errores.
- Dependencias: `firestore()`, `SUBSCRIPTIONS_COLLECTION`.
- Flujo interno: `doc()` sin id → `set(payload)` → retorno de `docRef.id`.
- Desde dónde se llama: sin llamadores encontrados. [POTENCIALMENTE NO UTILIZADO]
- Efectos secundarios: escritura en Firestore.
- Riesgos: permite crear suscripciones desde el cliente si las reglas lo habilitan; no hay transacción ni validación de pagos reales en este método.

## Clases / interfaces / tipos

### `SubscriptionData` (líneas 13–26)
- Responsabilidad: modelar un documento de la colección `subscriptions`.
- Campos:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | string | Id del documento Firestore. |
| userId | string | UID del usuario. |
| phoneNumber | string | Teléfono del titular. |
| userName | string | Nombre del titular. |
| initialPaymentDate | number | Epoch ms del primer pago. |
| amount | number | Importe. |
| paymentType | union de 3 | Medio de pago (Efectivo/Transferencia/Tarjeta de Crédito). |
| billingType | 'Mensual' \| 'Anual' | Frecuencia de facturación. |
| status | 'Activa' \| 'Vencida' | Estado de la suscripción. |
| mercadopagoOrderId | string (opcional) | Id de la orden MP. |
| createdAt / updatedAt | number | Marcas de tiempo en ms. |

- Relaciones: se corresponde con la escritura de `functions/src/mpWebhook.ts` (que crea/actualiza documentos con `userId`, `status: 'Activa'`, `amount`, `billingType`, `paymentType`, `mercadopagoOrderId`, `initialPaymentDate`, `createdAt`, `updatedAt`). [NIVEL DE CERTEZA: Confirmado por código]
- Ciclo de vida: en producción los documentos los crea/actualiza el webhook; este servicio cliente no participa del ciclo actual.

## Observaciones técnicas

- [POTENCIALMENTE NO UTILIZADO] No hay referencias de importación en todo el repositorio (grep). [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] Discrepancia de modelo con el webhook: `mpWebhook.ts` fija `billingType: 'Mensual'` de forma fija (línea 52 del webhook) y escribe `paymentType` con el `payment_type_id` de MP (p. ej. `credit_card`, `bank_transfer`), valores que no pertenecen a la enumeración `'Efectivo' | 'Transferencia' | 'Tarjeta de Crédito'` de `SubscriptionData`. Un cliente que leyera estos documentos con este tipo podría recibir valores inesperados en runtime. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] El webhook usa `external_reference` de MP como `userId`, mientras que `createPaymentOrder.ts` establece `external_reference: monthly:${deviceId}` / `annual:${deviceId}` (líneas 125 y 170 de la Cloud Function). Si el pago anual/mensual llega con esa referencia, el documento `subscriptions` quedaría con `userId` tipo `monthly:sa-xxx`, incoherente con el UID de Firebase que consulta este servicio. [NIVEL DE CERTEZA: Inferido]
- [OBSERVACIÓN TÉCNICA] `getSubscription` lanza errores en lugar de degradar a `null`, comportamiento distinto al patrón de otros servicios del módulo (p. ej. `PaymentService`). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] La cabecera menciona "Mercado Pago", pero el servicio no importa nada de MP: solo accede a Firestore. [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [MEDIO] La consulta filtra por `userId` en el cliente; la verdadera autorización depende de las reglas de seguridad de Firestore (no revisables aquí). Si las reglas permiten lectura amplia de `subscriptions`, cualquier usuario podría enumerar suscripciones ajenas. [NIVEL DE CERTEZA: No determinado]
- [MEDIO] `createSubscription` podría permitir que un cliente cree documentos con `status: 'Activa'` si las reglas lo permiten (escalada de privilegios local). El alta real debe originarse en el backend/webhook, no en el cliente. [NIVEL DE CERTEZA: Inferido]
- [INFORMATIVO] No maneja datos secretos ni imprime credenciales; solo loguea errores genéricos. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Si el servicio no se utiliza, conviene confirmar su eliminación o su integración, evitando código muerto que dé falsa sensación de gestión de suscripciones en el cliente. [RECOMENDACIÓN]
- [RIESGO] Unificar el esquema de `subscriptions` entre cliente y webhook (nombres de `billingType`, valores de `paymentType`, y el uso de `external_reference` vs `deviceId`/`userId`) para evitar corrupción silenciosa de datos. [RECOMENDACIÓN]
- [INFORMATIVO] La gestión del estado de pago ya está cubierta por el par backend PA + Cloud Functions (webhook) + `PaymentService`; cualquier nueva funcionalidad cliente debería decidir si lee Firestore o consulta PA para no duplicar fuentes de verdad. [RECOMENDACIÓN]
