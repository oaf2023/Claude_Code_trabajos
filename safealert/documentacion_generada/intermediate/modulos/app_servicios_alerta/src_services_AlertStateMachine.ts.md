# Archivo: src/services/AlertStateMachine.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/AlertStateMachine.ts | 234 | TypeScript 5.9 | 6990 | Servicio (máquina de estados persistente con Zustand) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Implementa la **máquina de estados del flujo de alerta SOS** del cliente móvil
mediante un store global de Zustand persistido en `AsyncStorage`. Modela los estados
por los que transita una alerta (`idle`, `locating`, `sending`,
`awaiting_confirmation`, `completed`, `failed`) y su contexto asociado (alertId,
usuario, palabra de disparo, contactos con estado de entrega, texto del mensaje,
audio, ubicación, errores y reintentos). El requisito de diseño declarado en su
cabecera es sobrevivir a cierre del proceso, reinicio, pérdida de red y actualización
de la app gracias a la persistencia. Un aspecto central es el **filtro de
privacidad** (`partialize`) que evita persistir datos sensibles (teléfonos de
contactos y coordenadas), coherente con los principios de gobierno de datos
DAMA-DMBOK citados en el propio código.

## Clasificación y estado

- Etiqueta: `FUNCIONALIDAD EXISTENTE` `[NIVEL DE CERTEZA: Confirmado por código]`
- Justificación: el store `useAlertMachineStore` se usa en producción en
  `AlertService.ts` (líneas 143–147, 159, 190, 203, 207, 225, 255, 271, 310–313),
  y las funciones puras auxiliares se exportan y ejercitan en su suite de tests.
  [NIVEL DE CERTEZA: Confirmado por código] `transition`, `updateContext` y `reset`
  son las únicas operaciones del store usadas en producción; `updateContactStatus`,
  `hasPendingDeliveries`, `getCompletedCount` y `canRetry` no tienen referencias
  fuera del propio archivo y de sus tests (ver Observaciones técnicas).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `create` de `zustand` | externa | Creación del store global `useAlertMachineStore` (línea 103) | Sí |
| `persist`, `createJSONStorage` de `zustand/middleware` | externa | Persistencia del store en AsyncStorage (líneas 104, 176–177) | Sí |
| `AsyncStorage` de `@react-native-async-storage/async-storage` | externa | Adaptador de almacenamiento de `createJSONStorage` (línea 177) | Sí |
| `AlertLocation`, `AlertContact` de `../types/Alert` | interna | Tipado del contexto (`location`) y de la proyección de contactos (líneas 16, 43–44) | `AlertLocation` sí; `AlertContact` importado pero no referenciado explícitamente en el cuerpo (ver nota) |

[NOTA] `AlertContact` se importa en la línea 16 pero no aparece en ninguna firma ni
uso del cuerpo del archivo (el contexto usa `ContactDelivery[]`, no `AlertContact[]`).
Marca sugerida: importación aparentemente innecesaria `[POTENCIALMENTE NO UTILIZADO]`
con `[NIVEL DE CERTEZA: Altamente probable]`.

## Componentes que dependen de este archivo

| Componente | Tipo de uso | Evidencia |
| --- | --- | --- |
| `src/services/AlertService.ts` | Consume `useAlertMachineStore`, `buildContactDeliveries`; lee `machine.state` y `machine.context` | Import en líneas 25–28; usos en 143–147, 159, 190–195, 203, 207, 225–228, 255, 271, 310–313 |
| `src/services/__tests__/AlertStateMachine.test.ts` | Suite unitaria completa del store y helpers | Import en líneas 11–17 |
| `src/services/__tests__/AlertService.test.ts` | `reset()` del store en `beforeEach` | Import en línea 19, uso en línea 122 |

No se encontraron usos de `useAlertMachineStore` en pantallas (`*.tsx`) ni en otros
servicios: la máquina se orquesta exclusivamente desde `AlertService` `[NIVEL DE
CERTEZA: Altamente probable]`.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `initialContext` | objeto con todos los campos de `MachineContext` en cero/vacío | `MachineContext` | Contexto por defecto tras `reset` o al arrancar | líneas 68–83, 87, 172 |
| `initialState` | `{ state: 'idle', context: {...initialContext} }` | `MachineState` | Estado inicial de la máquina | líneas 85–88, 106, 172 |
| `ALLOWED_TRANSITIONS` | tabla de transiciones válidas por estado (ver bloque 5) | `Record<AlertMachineState, AlertMachineState[]>` | Matriz de transiciones permitidas | líneas 90–97, 100 |
| `name` (opción de persist) | `'alert-machine-storage'` | `string` | Clave de `AsyncStorage` para el estado persistido | línea 176 |
| límite de reintentos en `canRetry` | `3` | `number` | Número máximo de reintentos tras estado `failed` | línea 233 |

## Estructura (funciones / clases / tipos)

- Tipos exportados: `AlertMachineState` (líneas 18–24), `DeliveryStatus` (línea 26),
  `ContactDelivery` (líneas 28–36), `MachineContext` (líneas 38–53).
- Interfaces internas: `MachineState` (55–58), `AlertMachineStore` (60–66).
- Store exportado: `useAlertMachineStore` (líneas 103–205) con acciones `transition`,
  `updateContext`, `updateContactStatus`, `reset`.
- Helpers puros exportados: `buildContactDeliveries` (207–219),
  `hasPendingDeliveries` (221–225), `getCompletedCount` (227–229), `canRetry`
  (231–234).
- Helpers internos: `isValidTransition` (99–101).

## Análisis línea por línea

### Bloque 1: cabecera e importaciones (líneas 1–16)

```ts
/* ============================================================================
* Archivo         : AlertStateMachine.ts
* Descripción     : Máquina de estados persistente para el flujo de alerta SOS.
*                   Sobrevive a cierre del proceso, reinicio, pérdida de red
*                   y actualización de la app. Almacenada en AsyncStorage cifrado.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AlertStateMachine.transition('locating', { alertId: '...' })
* ============================================================================ */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertLocation, AlertContact } from '../types/Alert';
```

**Explicación de las líneas 1–16:**

- **Línea 1–11**: cabecera documental. Dos afirmaciones relevantes: (a) la máquina
  debe sobrevivir a cierres/reinicios/pérdida de red/actualizaciones (se logra con
  `persist`); (b) dice que se almacena en "AsyncStorage cifrado". [OBSERVACIÓN
  TÉCNICA] En el código no se observa cifrado alguno: `AsyncStorage` nativo no cifra
  por defecto; la afirmación del comentario no está respaldada por la implementación
  (ver Seguridad).
- **Línea 13**: `create` de Zustand para construir el store.
- **Línea 14**: middleware `persist` (rehidratación y escritura automática) y
  `createJSONStorage` (adaptador JSON sobre un almacén).
- **Línea 15**: `AsyncStorage` como capa de persistencia real.
- **Línea 16**: importa `AlertLocation` (usado en el contexto) y `AlertContact`
  (aparentemente sin uso posterior; ver Dependencias).

### Bloque 2: tipos de estado, entrega y contexto (líneas 18–53)

```ts
export type AlertMachineState =
  | 'idle'
  | 'locating'
  | 'sending'
  | 'awaiting_confirmation'
  | 'completed'
  | 'failed';

export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'confirmed';

export interface ContactDelivery {
  phone: string;
  name: string;
  status: DeliveryStatus;
  channel: 'sms' | 'push' | 'call';
  attempts: number;
  lastError: string | null;
  confirmedAt: number | null;
}

export interface MachineContext {
  alertId: string | null;
  userId: string | null;
  triggerWord: string;
  isTest: boolean;
  location: AlertLocation | null;
  locationFailed: boolean;
  contacts: ContactDelivery[];
  messageText: string;
  audioUrl: string | null;
  audioPath: string | null;
  createdAt: number;
  updatedAt: number;
  errorMessage: string | null;
  retryCount: number;
}
```

**Explicación de las líneas 18–53:**

- **Línea 18–24**: `AlertMachineState` enumera los seis estados del ciclo de vida de
  una alerta: reposo (`idle`), obteniendo ubicación (`locating`), enviando
  (`sending`), esperando confirmación del backend (`awaiting_confirmation`),
  completada (`completed`) y fallida (`failed`).
- **Línea 26**: `DeliveryStatus` tipa el estado de entrega por contacto: pendiente,
  enviado, fallido o confirmado (este último implica acuse del receptor).
- **Línea 28–36**: `ContactDelivery` describe la entrega a un contacto: `phone`,
  `name`, `status`, `channel` (el canal admitido es `sms`, `push` o `call`), número de
  intentos (`attempts`), último error y `confirmedAt` (marca de confirmación).
- **Línea 38–53**: `MachineContext` es el "estado extendido" que acompaña a la
  máquina: identidad de la alerta y del usuario, palabra de disparo, bandera de
  prueba, ubicación y si falló su captura, entregas por contacto, texto del mensaje,
  URL/ruta de audio, marcas de creación/actualización, mensaje de error y contador de
  reintentos.

### Bloque 3: interfaces internas del store y estado inicial (líneas 55–88)

```ts
interface MachineState {
  state: AlertMachineState;
  context: MachineContext;
}

interface AlertMachineStore {
  machine: MachineState;
  transition: (newState: AlertMachineState, updates?: Partial<MachineContext>) => void;
  updateContext: (updates: Partial<MachineContext>) => void;
  updateContactStatus: (phone: string, status: DeliveryStatus, error?: string | null) => void;
  reset: () => void;
}

const initialContext: MachineContext = {
  alertId: null,
  userId: null,
  triggerWord: '',
  isTest: false,
  location: null,
  locationFailed: false,
  contacts: [],
  messageText: '',
  audioUrl: null,
  audioPath: null,
  createdAt: 0,
  updatedAt: 0,
  errorMessage: null,
  retryCount: 0,
};

const initialState: MachineState = {
  state: 'idle',
  context: { ...initialContext },
};
```

**Explicación de las líneas 55–88:**

- **Línea 55–58**: `MachineState` agrupa el estado discreto y su contexto.
- **Línea 60–66**: `AlertMachineStore` declara la forma del store Zustand: el estado
  `machine` y cuatro acciones (`transition`, `updateContext`, `updateContactStatus`,
  `reset`).
- **Línea 68–83**: `initialContext` con valores neutros; `contacts` vacío, ubicación
  nula, marcas a 0 y `null` donde corresponde.
- **Línea 85–88**: `initialState` arranca en `idle` con una copia fresca del contexto
  (la copia evita que mutaciones compartan la misma referencia de objeto).

### Bloque 4: matriz de transiciones y validador (líneas 90–101)

```ts
const ALLOWED_TRANSITIONS: Record<AlertMachineState, AlertMachineState[]> = {
  idle: ['locating'],
  locating: ['sending', 'failed'],
  sending: ['awaiting_confirmation', 'failed'],
  awaiting_confirmation: ['completed', 'failed', 'sending'],
  completed: [],
  failed: ['locating', 'idle'],
};

function isValidTransition(from: AlertMachineState, to: AlertMachineState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
```

**Explicación de las líneas 90–101:**

- **Línea 90**: declara la tabla de transiciones válidas, tipada como registro de
  estados destino por estado origen.
- **Línea 91**: desde `idle` solo se puede ir a `locating` (inicio de una alerta).
- **Línea 92**: desde `locating` a `sending` (ubicación lista o fallida pero el flujo
  continúa) o `failed`.
- **Línea 93**: desde `sending` a `awaiting_confirmation` o `failed`.
- **Línea 94**: desde `awaiting_confirmation` a `completed`, `failed` o de vuelta a
  `sending` (reintento del envío).
- **Línea 95**: `completed` es terminal (no admite salidas).
- **Línea 96**: desde `failed` se puede reintentar (`locating`) o volver a `idle`
  (abortar).
- **Línea 99–101**: `isValidTransition` comprueba pertenencia en la tabla; si el
  estado origen no está registrado devuelve `false` (operador `??`).

### Bloque 5: creación del store con persistencia (líneas 103–135)

```ts
export const useAlertMachineStore = create<AlertMachineStore>()(
  persist(
    (set) => ({
      machine: { ...initialState },

      transition: (newState, updates) =>
        set((current) => {
          const from = current.machine.state;
          if (!isValidTransition(from, newState)) {
            console.warn(
              `[AlertStateMachine] Transición inválida: ${from} → ${newState}`
            );
            return current;
          }

          const now = Date.now();
          const nextContext: MachineContext = {
            ...current.machine.context,
            ...(updates || {}),
            updatedAt: now,
          };

          if (newState === 'completed' || newState === 'failed') {
            nextContext.retryCount = 0;
          }

          return {
            machine: {
              state: newState,
              context: nextContext,
            },
          };
        }),
```

**Explicación de las líneas 103–135:**

- **Línea 103**: crea y exporta el store `useAlertMachineStore` (curry de dos
  llamadas: `create<AlertMachineStore>()(persist(...))`), patrón recomendado por
  Zustand para TypeScript con middleware.
- **Línea 104**: envuelve el creador con el middleware `persist`.
- **Línea 105–106**: el creador recibe `set` y define el estado inicial `machine:
  {...initialState}` (copia para no mutar la constante).
- **Línea 108**: define `transition(newState, updates?)`.
- **Línea 109**: usa la forma funcional de `set` para leer el estado actual.
- **Línea 110–111**: obtiene el estado origen.
- **Línea 111–116**: si la transición no es válida, registra advertencia con la
  pareja origen → destino y devuelve el estado sin cambios (la transición se
  rechaza silenciosamente para el resto de la app).
- **Línea 118**: fija `now` para el sello de actualización.
- **Línea 119–123**: construye el nuevo contexto fusionando el previo con `updates`
  y sobreescribiendo `updatedAt`.
- **Línea 125–127**: al entrar en `completed` o `failed` reinicia `retryCount` a 0
  (se considera cerrado el ciclo de reintentos de esa alerta).
- **Línea 129–134**: devuelve el nuevo estado de la máquina con `state: newState` y
  el contexto construido.

### Bloque 6: acciones `updateContext`, `updateContactStatus` y `reset` (líneas 137–174)

```ts
      updateContext: (updates) =>
        set((current) => ({
          machine: {
            ...current.machine,
            context: {
              ...current.machine.context,
              ...updates,
              updatedAt: Date.now(),
            },
          },
        })),

      updateContactStatus: (phone, status, error = null) =>
        set((current) => {
          const contacts = current.machine.context.contacts.map((c) =>
            c.phone === phone
              ? {
                  ...c,
                  status,
                  lastError: error,
                  attempts: c.attempts + (status === 'pending' ? 0 : 1),
                  confirmedAt: status === 'confirmed' ? Date.now() : c.confirmedAt,
                }
              : c
          );
          return {
            machine: {
              ...current.machine,
              context: { ...current.machine.context, contacts, updatedAt: Date.now() },
            },
          };
        }),

      reset: () =>
        set({
          machine: { ...initialState, context: { ...initialContext } },
        }),
    }),
```

**Explicación de las líneas 137–174:**

- **Línea 137–147**: `updateContext` fusiona actualizaciones parciales sobre el
  contexto existente y actualiza `updatedAt`; no cambia el estado discreto de la
  máquina (p. ej. guardar la ubicación obtenida o el `alertId` asignado).
- **Línea 149**: `updateContactStatus(phone, status, error?)` actualiza la entrega de
  un contacto concreto.
- **Línea 151–161**: recorre `contacts`; al coincidir el teléfono: fija `status`,
  `lastError` (nulo si no se pasa), incrementa `attempts` salvo que el nuevo estado
  sea `pending` y fija `confirmedAt` cuando el estado es `confirmed`.
- **Línea 162–167**: devuelve la máquina con la lista de contactos sustituida y
  `updatedAt` sellado.
- **Línea 170–173**: `reset` restaura `initialState` con una copia fresca del
  contexto (usado al terminar/abortar y en los tests).

### Bloque 7: configuración de persistencia con filtro de privacidad (líneas 175–205)

```ts
    {
      name: 'alert-machine-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Privacidad (DAMA-DMBOK): NO se persisten datos sensibles.
      // contacts (teléfonos) y location (coordenadas) ya viven en Firestore y
      // en AlertQueue; aquí solo se persiste lo necesario para recuperar una
      // alerta en curso tras un reinicio del proceso.
      partialize: (state) => ({
        machine: {
          state: state.machine.state,
          context: {
            alertId: state.machine.context.alertId,
            userId: state.machine.context.userId,
            triggerWord: state.machine.context.triggerWord,
            isTest: state.machine.context.isTest,
            locationFailed: state.machine.context.locationFailed,
            messageText: state.machine.context.messageText,
            createdAt: state.machine.context.createdAt,
            updatedAt: state.machine.context.updatedAt,
            errorMessage: state.machine.context.errorMessage,
            retryCount: state.machine.context.retryCount,
            contacts: [],
            location: null,
            audioUrl: null,
            audioPath: null,
          },
        },
      }),
    }
  )
);
```

**Explicación de las líneas 175–205:**

- **Línea 175–177**: configuración del middleware `persist`: nombre de clave
  `'alert-machine-storage'` y adaptador `createJSONStorage(() => AsyncStorage)`.
- **Línea 178–181**: comentario de diseño de privacidad (DAMA-DMBOK): declara que los
  datos sensibles (contactos y ubicación) no se persisten aquí porque ya residen en
  Firestore y en `AlertQueue`; solo se guarda lo mínimo para recuperar una alerta en
  curso tras un reinicio.
- **Línea 182–202**: `partialize` define qué porción del estado se serializa. Se
  persisten el estado discreto y un subconjunto del contexto: `alertId`, `userId`,
  `triggerWord`, `isTest`, `locationFailed`, `messageText`, `createdAt`,
  `updatedAt`, `errorMessage` y `retryCount`.
- **Línea 196–199**: se fuerzan `contacts: []`, `location: null`, `audioUrl: null` y
  `audioPath: null` en lo persistido, garantizando que teléfonos y coordenadas no
  lleguen a disco a través de este store.
- **Línea 203–205**: cierra la configuración, el middleware y la llamada `create`.

[OBSERVACIÓN TÉCNICA] Aunque `location` y `contacts` se filtran, se persiste
`messageText`, que en el flujo real contiene el mensaje de alerta con el enlace de
mapa (`mapsLink`) y, por tanto, coordenadas embebidas en la URL; el texto persistido
puede incluir datos de ubicación de forma indirecta (ver Seguridad).

### Bloque 8: helpers puros exportados (líneas 207–234)

```ts
export function buildContactDeliveries(
  contacts: { name: string; phone: string }[]
): ContactDelivery[] {
  return contacts.map((c) => ({
    phone: c.phone,
    name: c.name,
    status: 'pending' as DeliveryStatus,
    channel: 'sms' as const,
    attempts: 0,
    lastError: null,
    confirmedAt: null,
  }));
}

export function hasPendingDeliveries(
  contacts: ContactDelivery[]
): boolean {
  return contacts.some((c) => c.status === 'pending' || c.status === 'failed');
}

export function getCompletedCount(contacts: ContactDelivery[]): number {
  return contacts.filter((c) => c.status === 'sent' || c.status === 'confirmed').length;
}

export function canRetry(machine: MachineState): boolean {
  if (machine.state !== 'failed') return false;
  return machine.context.retryCount < 3;
}
```

**Explicación de las líneas 207–234:**

- **Línea 207–219**: `buildContactDeliveries` proyecta una lista mínima de contactos
  (`{name, phone}`) al formato `ContactDelivery[]`: todos inician en `pending`, con
  canal `'sms'` (el canal se fija a `sms` aunque el tipo admite `push`/`call`),
  `attempts` 0, sin error y sin confirmación.
- **Línea 221–225**: `hasPendingDeliveries` devuelve `true` si algún contacto sigue
  `pending` o `failed` (es decir, la alerta aún no está totalmente entregada).
- **Línea 227–229**: `getCompletedCount` cuenta contactos en `sent` o `confirmed`
  (útil para derivar estados `partial`/`sent`).
- **Línea 231–234**: `canRetry` indica si se puede reintentar: solo desde estado
  `failed` y con menos de 3 reintentos acumulados en el contexto.

## Fichas de funciones y métodos

### `useAlertMachineStore.transition` (líneas 108–135)

- Firma: `transition: (newState: AlertMachineState, updates?: Partial<MachineContext>) => void`.
- Propósito técnico: cambiar el estado discreto validando contra `ALLOWED_TRANSITIONS`
  y fusionar actualizaciones de contexto. Propósito funcional: hacer avanzar el flujo
  de la alerta (ubicación → envío → espera de confirmación, etc.).
- Parámetros: `newState` (destino) y `updates` (opcional, campos de contexto a
  sobreescribir). Retorno: `void` (set de Zustand). Excepciones: ninguna; las
  transiciones inválidas se registran y se ignoran.
- Dependencias: `isValidTransition`, `ALLOWED_TRANSITIONS`.
- Flujo: validar → calcular contexto → reiniciar `retryCount` si terminal → `set`.
- Llamado desde: `AlertService.send` (locating/sending/awaiting_confirmation),
  `AlertService.retryFailed` (locating) y tests.
- Efectos secundarios: escritura del estado y, por `persist`, escritura en
  `AsyncStorage` del subconjunto filtrado.

### `useAlertMachineStore.updateContext` (líneas 137–147)

- Firma: `updateContext: (updates: Partial<MachineContext>) => void`.
- Propósito: actualización parcial del contexto sin transición de estado (ubicación,
  `alertId`, error, etc.).
- Llamado desde: `AlertService.send` (ubicación y `alertId`) y tests.

### `useAlertMachineStore.updateContactStatus` (líneas 149–168)

- Firma: `updateContactStatus: (phone, status, error = null) => void`.
- Propósito: registrar el resultado de entrega de un contacto (estado, intentos,
  confirmación).
- [POTENCIALMENTE NO UTILIZADO] No se encontraron llamadas en producción (solo en la
  suite de tests) `[NIVEL DE CERTEZA: Altamente probable]`; la actualización de
  contactos de entrega se haría desde el backend o un consumidor aún no conectado.

### `useAlertMachineStore.reset` (líneas 170–173)

- Firma: `reset: () => void`.
- Propósito: volver la máquina a `idle` con contexto vacío (fin/aborto o limpieza).
- Llamado desde: tests (AlertStateMachine y AlertService `beforeEach`) y, en
  producción, potencialmente desde el reinicio del flujo `[NIVEL DE CERTEZA:
  Inferido]`.

### `buildContactDeliveries` (líneas 207–219)

- Firma: `buildContactDeliveries(contacts: { name: string; phone: string }[]): ContactDelivery[]`.
- Propósito: crear las entregas iniciales (`pending`, canal `sms`).
- Llamado desde: `AlertService.send` (línea 227) y tests.

### `hasPendingDeliveries` (221–225), `getCompletedCount` (227–229), `canRetry` (231–234)

- Funciones puras de consulta de la máquina. `[POTENCIALMENTE NO UTILIZADO]` en
  producción: solo las ejercitan los tests `[NIVEL DE CERTEZA: Altamente probable]`.

## Clases / interfaces / tipos

### `ContactDelivery` (líneas 28–36)

- Responsabilidad: modelar el estado de entrega por contacto destino de una alerta.
- Campos: `phone`, `name`, `status` (`DeliveryStatus`), `channel` (`'sms' | 'push' |
  'call'`), `attempts`, `lastError`, `confirmedAt`.
- Relaciones: es el tipo de `MachineContext.contacts`; lo produce
  `buildContactDeliveries`.
- Ciclo de vida: creada como `pending`/`sms`, mutada por `updateContactStatus`, no
  persistida en disco por `partialize`.

### `MachineContext` (líneas 38–53)

- Responsabilidad: estado extendido de la alerta en curso.
- Campos: los 14 descritos en el bloque 2.
- Ciclo de vida: inicia en `initialContext`, crece con `transition`/`updateContext`
  durante el envío y se limpia con `reset`.

### `MachineState` (55–58) y `AlertMachineStore` (60–66)

- `MachineState` agrupa `state` + `context`; `AlertMachineStore` tipa el store
  completo (estado más acciones). No exportadas: son internas, aunque
  `canRetry` recibe `MachineState` (firma interna no exportada, visible en la
  declaración exportada de la función).

### Tipos `AlertMachineState` (18–24) y `DeliveryStatus` (26)

- Union types exportados que acotan los valores posibles del estado y de la entrega.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] **Discrepancia de cabecera**: el comentario (línea 6) afirma
  "Almacenada en AsyncStorage cifrado", pero no hay cifrado implementado en este
  archivo; `AsyncStorage` no cifra por defecto. `[NIVEL DE CERTEZA: Confirmado por
  código]`. Ver Seguridad.
- [POTENCIALMENTE NO UTILIZADO] `updateContactStatus`, `hasPendingDeliveries`,
  `getCompletedCount` y `canRetry` no tienen llamadas en producción (solo tests).
  Sugiere que la capa de confirmación por contacto (estados `confirmed`, avance a
  `completed`) no está cableada todavía al flujo real, que se detiene en
  `awaiting_confirmation` (ver Observaciones de `AlertService.ts`).
- [OBSERVACIÓN TÉCNICA] La rehidratación de Zustand (`persist`) mezcla el estado
  persistido con el contexto actual en memoria al arrancar: si la versión persistida
  es antigua, faltarían campos nuevos del contexto; no hay versión de esquema ni
  migración definida.
- [OBSERVACIÓN TÉCNICA] `transition` rechaza transiciones inválidas sin exponer el
  motivo al llamador (solo `console.warn`); un error de orquestación podría quedar
  silencioso para el resto de la app.
- [INFORMATIVO] La importación de `AlertContact` (línea 16) no se utiliza en el
  cuerpo del archivo `[NIVEL DE CERTEZA: Altamente probable]`.
- [OBSERVACIÓN TÉCNICA] `partialize` persiste `messageText`, que en el flujo real
  contiene el mensaje de alerta con el enlace de mapa; esto reintroduce indirectamente
  datos de ubicación en el almacenamiento local pese al filtrado explícito de
  `location`.
- [NIVEL DE CERTEZA: Confirmado por código] El canal de entrega creado por
  `buildContactDeliveries` siempre es `'sms'`; los canales `push`/`call` existen en
  el tipo pero no se generan desde este código.

## Seguridad

- [MEDIO] La persistencia en `AsyncStorage` se describe como "cifrada" en la cabecera,
  pero la implementación no cifra el estado (solo filtra campos sensibles). Un
  respaldo o acceso al almacenamiento de la app podría exponer `alertId`, `userId`,
  `triggerWord`, `messageText` (con enlace de mapa), marcas temporales y `retryCount`.
  Clasificación MEDIO por tratarse de metadatos de alertas de emergencia; el
  filtrado `partialize` mitiga la exposición de teléfonos/coordenadas directas.
- [INFORMATIVO] Diseño de privacidad correcto en `partialize`: contactos y ubicación
  explícita no se persisten (comentario alineado con DAMA-DMBOK).
- [BAJO] Los logs solo emiten la pareja de estados de una transición inválida; no
  imprimen datos personales.
- [INFORMATIVO] No hay secretos, tokens ni credenciales en este archivo; no se
  realizan llamadas de red.
- [INFORMATIVO] No hay autenticación/autorización local: el store es de solo cliente;
  los datos derivados (contactos/ubicación) se gobiernan en Firestore y en
  `AlertQueue`.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Confianza en un cifrado inexistente del almacenamiento: si la privacidad
  de las alertas es un requisito, evaluar cifrado real del contenedor de
  `AsyncStorage` (o mover todo dato sensible fuera de él).
- [RIESGO] Flujo detenido en `awaiting_confirmation`: al no haber consumidor de
  `updateContactStatus`/`transition('completed'|'failed')` en producción, la máquina
  no cierra el ciclo por sí misma; la UI depende del watcher de `AlertService`
  (ver su análisis).
- [RECOMENDACIÓN] Añadir versión de esquema y migración al `persist` de Zustand
  (opción `version` + `migrate`) para robustez ante cambios del contexto.
- [RECOMENDACIÓN] Exponer el motivo de una transición rechazada (retorno booleano o
  evento) para facilitar diagnóstico.
- [RECOMENDACIÓN] Retirar la importación sin uso de `AlertContact` o documentar su
  propósito futuro.
