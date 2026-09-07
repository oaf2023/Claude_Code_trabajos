# Archivo: src/services/AlertService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/AlertService.ts | 324 | TypeScript 5.9 | 11810 | Servicio (orquestador del envío de alertas SOS) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Es el **orquestador central del flujo de alerta SOS en el cliente móvil**. Expone
`AlertService.send()` (disparo manual o por wake word, normal o de prueba) que:
1. Valida que existan contactos activos.
2. Aplica la regla de negocio de **pago vencido**: sin suscripción vigente y fuera de
   pruebas, avisa solo al contacto principal y señaliza `showOverdueAlert`.
3. Orquesta la **máquina de estados persistente** (`AlertStateMachine`), la captura
   de **ubicación** (con tolerancia a fallos: nunca bloquea el envío), la
   construcción del mensaje y su persistencia en **Firestore**.
4. Encola la alerta en **`AlertQueue`** (reintentos locales) y arranca un **watcher
   de Firestore** para reflejar el resultado real del backend (Cloud Function de
   SMS) en la UI.
5. Opcionalmente graba y sube **audio** (Storage + backend Flask de PythonAnywhere +
   disparador de IA en Cloud Functions).

También exporta `recoverIncompleteAlerts()` (recuperación de alertas no confirmadas
tras reinicio/offline) y el método `retryFailed()`. Funciona como capa de fachada que
conecta stores locales (guardia, ajustes, contactos), servicios (ubicación, audio,
IA, API de audio) y Firebase.

## Clasificación y estado

- Etiqueta: `FUNCIONALIDAD EXISTENTE` `[NIVEL DE CERTEZA: Confirmado por código]`
- Justificación: `AlertService.send` es invocado desde `src/hooks/useAlert.ts`
  (líneas 35 y 44) y desde `src/services/WakeWordService.ts` (línea 564);
  `recoverIncompleteAlerts` se invoca en `app/_layout.tsx` (línea 293). Existe suite
  de tests propia. [NIVEL DE CERTEZA: Confirmado por código] El método
  `retryFailed()` depende de un estado `failed` de la máquina que ningún código de
  producción dispara hoy (ver Observaciones): permanece como código accesible pero
  sin ruta real de activación.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `Alert`, `AlertContact` de `../types/Alert` | interna | Tipado del watcher (línea 76), `buildAlertContacts` (línea 116), `alertData` (línea 231) | Sí |
| `Contact` de `../types/Contact` | interna | Firma de `getActiveContacts`/`buildAlertContacts` | Sí |
| `LocationService` de `./LocationService` | interna | `getCurrentLocation` (201) y `buildMapsLink` (211) | Sí |
| `AudioRecordingService` de `./AudioRecordingService` | interna | `recordAndUpload` (276) | Sí |
| `alertsCol`, `ensureAuthenticated` de `../config/firebase` | interna | Creación/escucha de documentos (252, 279, 316) y autenticación (158) | Sí |
| `SMS_PREFIX`, `SMS_TEST_PREFIX` de `../config/constants` | interna | Prefijos del mensaje final (221) | Sí |
| `useGuardStore` de `../stores/useGuardStore` | interna | Fase de alerta en UI, última alerta/ubicación, aviso de pago vencido | Sí |
| `useSettingsStore` de `../stores/useSettingsStore` | interna | `userId`, `hasSubscription`, `audioEnabled`, `messageTemplate` | Sí |
| `useContactsStore` de `../stores/useContactsStore` | interna | `activeContacts()` | Sí |
| `MessageFormatter` de `../utils/MessageFormatter` | interna | Formateo del texto con placeholders (215) | Sí |
| `IAProcessingService` de `./IAProcessingService` | interna | Disparo de análisis de IA del audio (292) | Sí |
| `AudioAlertApiService` de `./AudioAlertApiService` | interna | Subida de respaldo de la grabación a backend Flask (284) | Sí |
| `useAlertMachineStore`, `buildContactDeliveries` de `./AlertStateMachine` | interna | Máquina de estados y proyección de entregas | Sí |
| `AlertQueue`, `QueuedAlert` de `./AlertQueue` | interna | Cola de reintentos y tipado de `sendFn` | Sí |

Todas las importaciones tienen uso confirmado en el archivo `[NIVEL DE CERTEZA:
Confirmado por código]`.

## Componentes que dependen de este archivo

| Componente | Tipo de uso | Evidencia |
| --- | --- | --- |
| `src/hooks/useAlert.ts` | Llama `AlertService.send('manual')` y `send('test', true)` | Import línea 11; usos líneas 35 y 44 |
| `src/services/WakeWordService.ts` | Llama `AlertService.send(keyword)` al detectar la palabra de activación | Import línea 23; uso línea 564 |
| `app/_layout.tsx` | Invoca `recoverIncompleteAlerts` al arrancar (recuperación de encoladas) | Import línea 31; uso línea 293 |
| `app/(tabs)/index.tsx`, `app/test-alert.tsx` | Consumen la fachada `useAlert` (que envuelve a AlertService) | Import de `useAlert` en ambas pantallas |
| `src/services/__tests__/AlertService.test.ts` | Suite unitaria | Import línea 13 |
| Dependencias colaterales (no importan este archivo) | `MessageFormatter`, `AudioRecordingService`, `AudioAlertApiService`, `IAProcessingService` lo citan en comentarios de "Conexiones" | Referencias documentales |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `alertWatchers` | `new Map<string, () => void>()` | `Map<string, () => void>` | Registro de funciones `unsubscribe` de Firestore por `alertId` | líneas 31, 45–49, 98 |
| Umbral de reintentos en `canRetry` (máquina) | `3` | `number` | Límite para permitir reintento desde `failed` | referencia conceptual (línea 313) |
| Valores mágicos en el fallback de ubicación | `lat: 0`, `lon: 0`, `accuracy: 0`, `isStale: true` | `number`/`boolean` | Coordenadas centinela cuando no hay GPS | líneas 235–242 |

## Estructura (funciones / clases / tipos)

- `alertWatchers` (Map global, línea 31).
- `stopAlertWatcher(alertId)` (44–50): libera la suscripción de un `alertId`.
- `startAlertWatcher(userId, alertId)` (63–99): `onSnapshot` del documento de alerta.
- `getActiveContacts()` (101–103): contactos activos desde el store.
- `buildAlertContacts(contacts)` (116–126): proyección a `AlertContact[]`.
- `recoverIncompleteAlerts(sendFn)` (exportada, 140–148): procesa cola y avisa si la
  máquina está en mitad de flujo.
- `AlertService` (exportado, 150–324) con métodos `send` (151–307) y `retryFailed`
  (309–323).

## Análisis línea por línea

### Bloque 1: cabecera, importaciones y mapa de watchers (líneas 1–31)

```ts
/* ============================================================================
* Archivo         : AlertService.ts
* Descripción     : Orquestación local del envío de alertas SOS con máquina
*                   de estados persistente, cola de reintentos y tolerancia
*                   a fallos de ubicación.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AlertService.send('manual')
* ============================================================================ */

import { Alert as AppAlert, AlertContact } from '../types/Alert';
import { Contact } from '../types/Contact';
import { LocationService } from './LocationService';
import { AudioRecordingService } from './AudioRecordingService';
import { alertsCol, ensureAuthenticated } from '../config/firebase';
import { SMS_PREFIX, SMS_TEST_PREFIX } from '../config/constants';
import { useGuardStore } from '../stores/useGuardStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useContactsStore } from '../stores/useContactsStore';
import { MessageFormatter } from '../utils/MessageFormatter';
import { IAProcessingService } from './IAProcessingService';
import { AudioAlertApiService } from './AudioAlertApiService';
import {
  useAlertMachineStore,
  buildContactDeliveries,
} from './AlertStateMachine';
import { AlertQueue, QueuedAlert } from './AlertQueue';

const alertWatchers = new Map<string, () => void>();
```

**Explicación de las líneas 1–31:**

- **Línea 1–11**: cabecera documental (versión 2.0.0). Resume las tres capacidades
  clave: máquina de estados persistente, cola de reintentos y tolerancia a fallos de
  ubicación.
- **Línea 13**: importa el tipo `Alert` (renombrado a `AppAlert` para evitar
  colisión con la `Alert` de React Native) y `AlertContact`.
- **Línea 14**: tipo `Contact` del dominio de contactos.
- **Línea 15–16**: `LocationService` (GPS) y `AudioRecordingService` (grabación).
- **Línea 17**: helpers de Firebase: `alertsCol(userId)` (colección de alertas del
  usuario) y `ensureAuthenticated()` (garantiza sesión y devuelve uid).
- **Línea 18**: prefijos de mensajes SMS de producción y de prueba.
- **Línea 19–21**: stores de Zustand de guardia, ajustes y contactos.
- **Línea 22**: formateador de mensajes con placeholders.
- **Línea 23–24**: servicios de IA (post-procesado de audio) y de la API de audio
  (respaldo en backend Flask).
- **Línea 25–28**: store de la máquina de alertas y proyección de entregas.
- **Línea 29**: cola local de reintentos y su tipo.
- **Línea 31**: `alertWatchers`, mapa en memoria `alertId → unsubscribe` que
  garantiza una única suscripción por alerta (ver `startAlertWatcher`).

### Bloque 2: `stopAlertWatcher` (líneas 33–50)

```ts
/* ============================================================================
* Función         : stopAlertWatcher
* Descripción     : Libera la suscripción activa asociada a una alerta concreta.
* Fecha           : 2026-03-25
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : startAlertWatcher
* Ingesta         : alertId: string
* Devolución      : void
* Uso             : stopAlertWatcher(alertId)
* ============================================================================ */
function stopAlertWatcher(alertId: string): void {
  const unsubscribe = alertWatchers.get(alertId);
  if (unsubscribe) {
    unsubscribe();
    alertWatchers.delete(alertId);
  }
}
```

**Explicación de las líneas 33–50:**

- **Línea 33–43**: cabecera documental de función (convención del proyecto).
- **Línea 44**: declara `stopAlertWatcher(alertId)`.
- **Línea 45**: recupera la función `unsubscribe` registrada para ese `alertId`.
- **Línea 46–49**: si existe, la invoca (cancela la escucha en Firestore) y la borra
  del mapa. Es idempotente: si no hay watcher no hace nada.

### Bloque 3: `startAlertWatcher` — escucha del documento real (líneas 52–99)

```ts
/* ============================================================================
* Función         : startAlertWatcher
* Descripción     : Escucha el documento de alerta para reflejar el resultado real del backend en la UI.
* Fecha           : 2026-03-25
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : alertsCol, useGuardStore
* Ingesta         : userId: string, alertId: string
* Devolución      : void
* Uso             : startAlertWatcher(userId, alertId)
* ============================================================================ */
function startAlertWatcher(userId: string, alertId: string): void {
  stopAlertWatcher(alertId);

  const unsubscribe = alertsCol(userId)
    .doc(alertId)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }

        const updatedAlert = {
          id: snapshot.id,
          ...(snapshot.data() as Omit<AppAlert, 'id'>),
        } as AppAlert;

        useGuardStore.getState().setLastAlert(updatedAlert);

        if (updatedAlert.status === 'failed') {
          useGuardStore.getState().setAlertPhase('error');
          stopAlertWatcher(alertId);
          return;
        }

        if (updatedAlert.status === 'sent' || updatedAlert.status === 'partial') {
          useGuardStore.getState().setAlertPhase('sent');
          stopAlertWatcher(alertId);
        }
      },
      (error) => {
        console.warn('[AlertService] No se pudo seguir el estado de la alerta:', error);
        stopAlertWatcher(alertId);
      }
    );

  alertWatchers.set(alertId, unsubscribe);
}
```

**Explicación de las líneas 52–99:**

- **Línea 52–62**: cabecera documental.
- **Línea 63**: declara `startAlertWatcher(userId, alertId)`.
- **Línea 64**: primero detiene cualquier watcher previo de la misma alerta
  (garantiza una sola suscripción activa).
- **Línea 66–68**: suscribe `onSnapshot` al documento `users/{userId}/alerts/{alertId}`.
- **Línea 69–72**: si el snapshot no existe (documento borrado) retorna sin actuar.
- **Línea 74–77**: reconstruye la alerta completa combinando `snapshot.id` con
  `snapshot.data()` (aserciones de tipo sobre datos Firestore).
- **Línea 79**: actualiza `lastAlert` del store de guardia (la UI muestra la última
  alerta real).
- **Línea 81–85**: si el backend marcó `failed`, la UI pasa a fase `'error'` y se
  detiene el watcher.
- **Línea 87–90**: si el estado final es `sent` o `partial` (éxito total o parcial),
  la UI pasa a `'sent'` y se detiene el watcher.
- **Línea 92–95**: ante error de suscripción (red, permisos) registra advertencia y
  libera el watcher.
- **Línea 98**: registra la función `unsubscribe` en el mapa para poder detenerla
  después.

### Bloque 4: `getActiveContacts` y `buildAlertContacts` (líneas 101–126)

```ts
function getActiveContacts(): Contact[] {
  return useContactsStore.getState().activeContacts();
}

/* ============================================================================
* Función         : buildAlertContacts
* Descripción     : Proyecta los contactos activos al contrato persistido de alertas SMS.
* Fecha           : 2026-03-26
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : Contact, AlertContact
* Ingesta         : contacts: Contact[]
* Devolución      : AlertContact[]
* Uso             : const alertContacts = buildAlertContacts(contacts)
* ============================================================================ */
function buildAlertContacts(contacts: Contact[]): AlertContact[] {
  return contacts.map((contact) => ({
    name: contact.name,
    phone: contact.phone,
    smsStatus: 'pending',
    provider: null,
    providerMessageId: null,
    attempts: 0,
    lastError: null,
  }));
}
```

**Explicación de las líneas 101–126:**

- **Línea 101–103**: `getActiveContacts` delega en el store de contactos
  (`activeContacts()`), que filtra los marcados activos.
- **Línea 105–115**: cabecera documental.
- **Línea 116**: `buildAlertContacts(contacts)` mapea contactos del dominio al
  contrato persistido en el documento de alerta (`AlertContact[]`).
- **Línea 117–125**: cada contacto inicia con `smsStatus: 'pending'`, sin `provider`,
  sin `providerMessageId`, `attempts: 0` y `lastError: null`. El backend rellenará
  estos campos tras intentar el SMS.

### Bloque 5: `recoverIncompleteAlerts` (líneas 128–148)

```ts
/* ============================================================================
* Función         : recoverIncompleteAlerts
* Descripción     : Recupera alertas incompletas desde la máquina de estados
*                   y la cola local después de un cierre o reinicio.
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : AlertStateMachine, AlertQueue
* Ingesta         : sendFn: (alert: QueuedAlert) => Promise<boolean>
* Devolución      : Promise<void>
* Uso             : recoverIncompleteAlerts(mySendFn)
* ============================================================================ */
export async function recoverIncompleteAlerts(
  sendFn: (alert: QueuedAlert) => Promise<boolean>
): Promise<void> {
  const machine = useAlertMachineStore.getState().machine;
  if (machine.state === 'sending' || machine.state === 'awaiting_confirmation') {
    console.log('[AlertService] Recuperando alerta pendiente:', machine.context.alertId);
  }
  await AlertQueue.process(sendFn);
}
```

**Explicación de las líneas 128–148:**

- **Línea 128–139**: cabecera documental de la función exportada.
- **Línea 140–142**: `recoverIncompleteAlerts(sendFn)` recibe la operación de
  reintento (inyectada por el llamador).
- **Línea 143**: lee el estado persistido de la máquina (rehidratado por Zustand).
- **Línea 144–146**: si la máquina quedó a mitad de flujo (`sending` o
  `awaiting_confirmation`) solo registra un log con el `alertId`; **no** ejecuta
  ninguna transición ni recuperación del estado de la máquina en sí.
- **Línea 147**: procesa la cola local (`AlertQueue.process`), reintentando cada
  alerta encolada mediante `sendFn` según backoff.

### Bloque 6: apertura de `AlertService.send` — precondiciones y suscripción (líneas 150–187)

```ts
export const AlertService = {
  async send(
    triggerWord: string,
    isTest = false
  ): Promise<{ alertId: string; assistedCallPhone: string | null }> {
    const guardStore = useGuardStore.getState();
    const settings = useSettingsStore.getState();
    const allActiveContacts = getActiveContacts();
    const userId = settings.userId || (await ensureAuthenticated());
    const machineStore = useAlertMachineStore.getState();

    if (allActiveContacts.length === 0) {
      throw new Error('No hay contactos activos');
    }

    // Si no tiene suscripción vigente y no es alerta de prueba:
    // enviar ÚNICAMENTE al contacto principal (priority mínimo) y señalizar
    // que se debe mostrar el aviso de pago vencido.
    let contacts: ReturnType<typeof getActiveContacts>;
    if (!settings.hasSubscription && !isTest) {
      const sorted = [...allActiveContacts].sort((a, b) => a.priority - b.priority);
      contacts = [sorted[0]];
      guardStore.setShowOverdueAlert(true);
    } else {
      contacts = allActiveContacts;
    }

    if (!userId) {
      guardStore.setAlertPhase('error');
      throw new Error('La sesión no está lista. Reintenta en unos segundos.');
    }

    if (settings.userId !== userId) {
      useSettingsStore.getState().setUserId(userId);
    }

    guardStore.setDetectedKeyword(isTest ? 'test' : triggerWord);
    guardStore.setAlertPhase('capturing');
```

**Explicación de las líneas 150–187:**

- **Línea 150**: exporta el objeto `AlertService`.
- **Línea 151–154**: `send(triggerWord, isTest = false)` devuelve
  `{ alertId, assistedCallPhone }`. `triggerWord` puede ser `'manual'`, una palabra
  de wake word o `'test'` (con `isTest=true`).
- **Línea 155–159**: captura una foto de los stores (guardia, ajustes, contactos
  activos), resuelve `userId` (ajustes o autenticación asíncrona) y obtiene el store
  de la máquina.
- **Línea 161–163**: sin contactos activos lanza error antes de cualquier efecto
  secundario.
- **Línea 165–167**: comentario de la regla de negocio de pago vencido.
- **Línea 168–175**: si no hay suscripción y no es prueba: ordena por `priority`
  ascendente y conserva solo el primero (el "principal"); además fija
  `showOverdueAlert` para que la UI muestre el aviso de pago vencido. En otro caso
  usa todos los contactos activos.
- **Línea 177–180**: si `userId` quedó vacío (autenticación fallida o anónima no
  lista), marca fase `'error'` y lanza excepción.
- **Línea 182–184**: si la sesión resuelta difiere de la guardada, la persiste en
  ajustes.
- **Línea 186**: registra la palabra detectada en el store de guardia (en pruebas se
  normaliza a `'test'`).
- **Línea 187**: fase de UI `'capturing'`.

### Bloque 7: transición a `locating` y captura tolerante de ubicación (líneas 189–222)

```ts
    // Transición a locating en la máquina de estados
    machineStore.transition('locating', {
      userId,
      triggerWord,
      isTest,
      createdAt: Date.now(),
    });

    // Intentar obtener ubicación — nunca bloquear el envío
    let location: any = null;
    let locationFailed = false;
    try {
      location = await LocationService.getCurrentLocation();
      guardStore.setLastLocation(location);
      machineStore.updateContext({ location, locationFailed: false });
    } catch (e: any) {
      console.warn('[AlertService] Ubicación no disponible, enviando sin coordenadas:', e?.message);
      locationFailed = true;
      machineStore.updateContext({ location: null, locationFailed: true });
    }

    const mapsLink = location
      ? LocationService.buildMapsLink(location)
      : '';
    const alertContacts = buildAlertContacts(contacts);

    const messageText = MessageFormatter.format(settings.messageTemplate, {
      mapsLink: mapsLink || '[Ubicación no disponible]',
      isStale: location?.isStale ?? false,
      staleMinutes: location?.staleMinutes,
    });

    const prefix = isTest ? SMS_TEST_PREFIX : SMS_PREFIX;
    const finalMessage = `${prefix} ${messageText}`;
```

**Explicación de las líneas 189–222:**

- **Línea 190–195**: transición válida `idle → locating` (o `failed → locating` en
  reintento) guardando en el contexto `userId`, `triggerWord`, `isTest` y `createdAt`.
- **Línea 197**: comentario de diseño: la ubicación nunca debe bloquear el envío.
- **Línea 198–199**: inicializa `location = null` y `locationFailed = false`.
- **Línea 200–203**: intenta obtener la ubicación actual (GPS); si hay éxito guarda
  la última ubicación en guardia y actualiza el contexto de la máquina.
- **Línea 204–208**: ante cualquier excepción (`catch (e: any)`) registra
  advertencia, marca `locationFailed = true` y deja la ubicación del contexto en
  `null` (el flujo continúa).
- **Línea 210–212**: si hay ubicación construye el enlace de mapa
  (`buildMapsLink`), si no queda vacío.
- **Línea 213**: proyecta las entregas iniciales de contactos (`pending`/`sms`).
- **Línea 215–219**: formatea el mensaje con la plantilla de ajustes y los datos de
  ubicación (enlace, antigüedad de la fijación). Si no hay enlace, se inserta el
  literal `[Ubicación no disponible]`.
- **Línea 221–222**: antepone el prefijo de prueba o de producción y compone el
  mensaje final (`finalMessage`).

### Bloque 8: transición a `sending`, datos de la alerta y alta en Firestore (líneas 224–255)

```ts
    guardStore.setAlertPhase('sending');
    machineStore.transition('sending', {
      messageText: finalMessage,
      contacts: buildContactDeliveries(contacts),
    });

    // Datos imprescindibles para la alerta
    const alertData: Omit<AppAlert, 'id'> = {
      userId,
      triggeredAt: Date.now(),
      triggerWord,
      location: location || {
        lat: 0,
        lon: 0,
        accuracy: 0,
        timestamp: Date.now(),
        isStale: true,
        staleMinutes: 0,
      },
      mapsLink,
      audioUrl: null,
      audioPath: null,
      messageTemplate: finalMessage,
      contacts: alertContacts,
      status: 'pending',
      isTest,
    };

    const ref = await alertsCol(userId).add(alertData);
    const alertId = ref.id;

    machineStore.updateContext({ alertId });
```

**Explicación de las líneas 224–255:**

- **Línea 224**: fase de UI `'sending'`.
- **Línea 225–228**: transición válida `locating → sending` con el texto final y las
  entregas de contacto en el contexto.
- **Línea 230**: comentario: datos imprescindibles del documento de alerta.
- **Línea 231–250**: construye `alertData` (todo excepto el `id`):
  - **Línea 232–234**: `userId`, `triggeredAt` y `triggerWord`.
  - **Línea 235–242**: si no hay ubicación real usa un **fallback centinela**
    (`lat: 0, lon: 0, accuracy: 0`, `isStale: true`) para que el documento siempre
    tenga estructura de ubicación.
  - **Línea 243**: enlace de mapa (posiblemente vacío).
  - **Línea 244–245**: `audioUrl` y `audioPath` nulos (se completarán si el audio se
    graba).
  - **Línea 246**: `messageTemplate` con el mensaje final ya compuesto.
  - **Línea 247**: contactos en estado `pending` (serán procesados por el backend).
  - **Línea 248**: `status: 'pending'`: disparador para la Cloud Function de SMS.
  - **Línea 249**: `isTest` para marcar alertas de prueba.
- **Línea 252**: crea el documento en `users/{userId}/alerts` con `add` (genera el id
  automáticamente).
- **Línea 253**: captura el `alertId` generado por Firestore.
- **Línea 255**: guarda el `alertId` en el contexto de la máquina.

### Bloque 9: encolado, estado local y watcher (líneas 257–272)

```ts
    // Encolar para reintentos en segundo plano
    AlertQueue.enqueue({
      id: alertId,
      userId,
      triggerWord,
      messageText: finalMessage,
      contacts: contacts.map((c) => ({ name: c.name, phone: c.phone })),
      location: location ? { lat: location.lat, lon: location.lon } : null,
      locationFailed,
      createdAt: Date.now(),
    });

    guardStore.setLastAlert({ id: alertId, ...alertData });
    guardStore.setAlertPhase('sent');
    machineStore.transition('awaiting_confirmation', { alertId });
    startAlertWatcher(userId, alertId);
```

**Explicación de las líneas 257–272:**

- **Línea 257**: comentario: encolado para reintentos en segundo plano.
- **Línea 258–267**: encola la alerta en `AlertQueue`. Nota crítica: la llamada es
  **fire-and-forget** (sin `await` ni `catch`): el método no espera a que la
  persistencia local termine.
- **Línea 259–266**: el elemento encolado conserva id, usuario, palabra, mensaje
  final, contactos (nombre y teléfono), ubicación reducida a `lat`/`lon` (o `null`) y
  el indicador `locationFailed`.
- **Línea 269**: guarda la última alerta en el store de guardia (para la UI).
- **Línea 270**: la UI pasa localmente a fase `'sent'` de forma optimista (la
  confirmación real llegará por el watcher).
- **Línea 271**: transición `sending → awaiting_confirmation` con el `alertId`.
- **Línea 272**: arranca el watcher del documento para reflejar el resultado real del
  backend.

### Bloque 10: grabación y subida opcional de audio (líneas 274–301)

```ts
    // Audio: opcional, no bloquea
    if (settings.audioEnabled) {
      AudioRecordingService.recordAndUpload(userId, alertId)
        .then(async (audioUpload) => {
          if (audioUpload) {
            await alertsCol(userId).doc(alertId).update({
              audioUrl: audioUpload.audioUrl,
              audioPath: audioUpload.audioPath,
            });

            AudioAlertApiService.uploadSecurityRecording(
              audioUpload.localUri,
              alertId,
              userId
            ).catch((err) =>
              console.warn('[AlertService] Error en subida a PythonAnywhere:', err)
            );

            IAProcessingService.processAlertAudio(userId, alertId, audioUpload.audioUrl).catch(
              (error) =>
                console.warn('[AlertService] Error en disparador IA post-upload:', error)
            );
          }
        })
        .catch((error) => {
          console.warn('[AlertService] Error al grabar/subir audio:', error);
        });
    }

    return {
      alertId,
      assistedCallPhone: isTest ? null : contacts[0]?.phone ?? null,
    };
  },
```

**Explicación de las líneas 274–307:**

- **Línea 274**: comentario: el audio es opcional y no bloquea el envío.
- **Línea 275**: solo si `settings.audioEnabled` está activado.
- **Línea 276–277**: `recordAndUpload(userId, alertId)` graba y sube el audio a
  Firebase Storage; devuelve `{ audioUrl, audioPath, localUri }` o `null`.
- **Línea 278–282**: si hay subida, actualiza el documento de la alerta con `audioUrl`
  y `audioPath`.
- **Línea 284–290**: dispara la subida de respaldo de la grabación al backend Flask
  (PythonAnywhere) mediante `AudioAlertApiService.uploadSecurityRecording`, con
  `catch` propio que solo registra advertencia (no rompe el flujo).
- **Línea 292–295**: dispara el análisis de IA post-subida con
  `IAProcessingService.processAlertAudio`, también con `catch` propio.
- **Línea 298–300**: ante error de grabación/subida principal registra advertencia.
- **Línea 303–306**: retorna el resultado: `alertId` y `assistedCallPhone` (teléfono
  del primer contacto destino, `null` en pruebas).
- **Línea 307**: cierra `send`.

### Bloque 11: método `retryFailed` (líneas 309–324)

```ts
  async retryFailed(): Promise<void> {
    const machineStore = useAlertMachineStore.getState();
    const machine = machineStore.machine;
    if (machine.state === 'failed' && machine.context.alertId) {
      machineStore.transition('locating', { retryCount: machine.context.retryCount + 1 });
      await AlertQueue.process(async (alert) => {
        try {
          await alertsCol(alert.userId).doc(alert.id).update({ status: 'pending' });
          return true;
        } catch {
          return false;
        }
      });
    }
  },
};
```

**Explicación de las líneas 309–324:**

- **Línea 309**: método `retryFailed` (reintento manual tras un fallo).
- **Línea 310–311**: lee la máquina.
- **Línea 312**: la condición exige estado `failed` y un `alertId` en el contexto.
- **Línea 313**: transición `failed → locating` incrementando `retryCount`.
- **Línea 314–321**: procesa la cola con un `sendFn` que vuelve a marcar el documento
  Firestore de cada alerta como `status: 'pending'` (lo que re-dispara la Cloud
  Function de SMS); devuelve `true`/`false` según éxito.
- **Línea 323**: cierra el objeto `AlertService`.
- [OBSERVACIÓN TÉCNICA] El estado `failed` solo se alcanza vía
  `transition('failed')`, y **ningún código de producción** invoca esa transición
  (la máquina se detiene en `awaiting_confirmation`; el watcher solo cambia la fase
  de la UI a `'error'`). Por tanto `retryFailed` no tiene ruta real de activación en
  el cableado actual (ver Observaciones técnicas).

## Fichas de funciones y métodos

### `startAlertWatcher` (líneas 63–99)

- Firma: `function startAlertWatcher(userId: string, alertId: string): void`.
- Propósito técnico: suscripción en tiempo real (`onSnapshot`) al documento de la
  alerta para traducir el estado final escrito por el backend a la fase de la UI.
- Parámetros: `userId`, `alertId`. Retorno: `void`. Excepciones: el callback de error
  de `onSnapshot` las absorbe con log.
- Dependencias: `alertsCol`, `useGuardStore`, `alertWatchers`, `stopAlertWatcher`.
- Flujo: detener watcher previo → suscribirse → en cada snapshot actualizar
  `lastAlert`; si `failed` → fase `'error'` y parar; si `sent`/`partial` → fase
  `'sent'` y parar.
- Efectos secundarios/riesgos: consumo de recursos mientras el watcher está activo
  (se libera en estados terminales o errores de suscripción). Si el documento queda
  en `pending` indefinidamente (Cloud Function caída), el watcher permanece activo.

### `recoverIncompleteAlerts` (líneas 140–148)

- Firma: `export async function recoverIncompleteAlerts(sendFn: (alert: QueuedAlert) => Promise<boolean>): Promise<void>`.
- Propósito: recuperar tras arranque las alertas encoladas que no se confirmaron
  (offline, cierre abrupto, reinicio).
- Llamado desde: `app/_layout.tsx` línea 293 (pasando un `sendFn` que re-marca el
  documento como `pending` para re-disparar la Cloud Function `sendAlertSMS`).
- Nota: sobre la máquina de estados solo informa con un log; no restaura su estado.

### `AlertService.send` (líneas 151–307)

- Firma: `async send(triggerWord: string, isTest = false): Promise<{ alertId: string; assistedCallPhone: string | null }>`.
- Propósito funcional: disparar y orquestar el flujo completo de una alerta SOS
  (descripción detallada en bloques 6–10).
- Parámetros: `triggerWord` (motivo/disparador) e `isTest` (modo prueba).
- Retorno: `{ alertId, assistedCallPhone }`. Excepciones: lanza `Error` si no hay
  contactos activos o si la sesión no está lista; puede propagar errores de
  Firestore (`add`) o de autenticación.
- Llamado desde: `useAlert.triggerManual`, `useAlert.triggerTest` y
  `WakeWordService` (línea 564).
- Efectos secundarios: transiciones de la máquina persistida, escrituras en
  Firestore, encolado local, watcher de Firestore, actualizaciones de stores y, si
  está activado, grabación/subida de audio.
- Riesgos: ver Observaciones (encolado sin `await`, máquina puede quedar en
  `sending` si `add` falla, retorno `assistedCallPhone` sin consumidores).

### `AlertService.retryFailed` (líneas 309–323)

- Firma: `async retryFailed(): Promise<void>`.
- Propósito: reintentar una alerta que quedó en estado `failed` de la máquina.
- [POTENCIALMENTE NO UTILIZADO] No se encontraron llamadas a `retryFailed` en
  producción `[NIVEL DE CERTEZA: Altamente probable]`; además, su condición de
  entrada (`machine.state === 'failed'`) no se alcanza con el cableado actual.

### Funciones internas auxiliares

- `stopAlertWatcher(alertId)` (44–50): cancela la suscripción registrada.
- `getActiveContacts()` (101–103): contactos activos.
- `buildAlertContacts(contacts)` (116–126): proyección al contrato de alerta.

## Clases / interfaces / tipos

- No se declaran clases ni interfaces nuevas en este archivo; usa tipos importados
  (`AppAlert`, `AlertContact`, `Contact`, `QueuedAlert`) y los tipos de la máquina.
- `alertWatchers` (línea 31): variable de módulo `Map<string, () => void>` cuyo ciclo
  de vida es el del proceso de la app (se crea al importar y se limpia por alerta).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] **Encolado fire-and-forget** (línea 258): `AlertQueue.enqueue`
  no se espera ni se captura; si `AsyncStorage` falla se produce una promesa
  rechazada no manejada y la alerta quedaría sin respaldo local. `[NIVEL DE CERTEZA:
  Confirmado por código]`.
- [OBSERVACIÓN TÉCNICA] Si `alertsCol(userId).add()` lanza tras la transición a
  `sending` (línea 225), la máquina persistida queda en `sending` sin recuperación;
  `recoverIncompleteAlerts` solo registra un log en ese caso y no restaura el estado.
- [OBSERVACIÓN TÉCNICA] La máquina de estados nunca llega a `completed`/`failed` en
  producción: `send` se detiene en `awaiting_confirmation` y el watcher solo cambia
  la fase de la UI (`useGuardStore.alertPhase`). `updateContactStatus`,
  `hasPendingDeliveries`, `getCompletedCount`, `canRetry` y `retryFailed` quedan sin
  consumidor real (ver análisis de `AlertStateMachine.ts`). `[NIVEL DE CERTEZA:
  Altamente probable]`.
- [POTENCIALMENTE NO UTILIZADO] `assistedCallPhone` se devuelve en el resultado de
  `send` pero ningún llamador (useAlert, WakeWordService) consume el valor de retorno;
  solo los tests lo inspeccionan. No se halló lógica que realice la "llamada
  asistida" (p. ej. apertura `tel:`). `[NIVEL DE CERTEZA: Altamente probable]`.
- [OBSERVACIÓN TÉCNICA] El mensaje final incluye el prefijo y el enlace de mapa con
  coordenadas; se persiste tal cual en Firestore (`messageTemplate`) y en
  `AlertQueue`, además del `messageText` persistido por la máquina (ver privacidad en
  Seguridad).
- [OBSERVACIÓN TÉCNICA] Fallback de ubicación con `lat: 0, lon: 0` (golfo de Guinea):
  si no se distingue de una lectura real de esa zona, un consumidor del documento
  podría interpretar coordenadas falsas; mitigado por `isStale: true`.
- [OBSERVACIÓN TÉCNICA] En el watcher no se contempla el caso de documento borrado ni
  estados intermedios adicionales del backend (p. ej. `pending` persistente), ni se
  actualiza la máquina de estados con el resultado (solo el store de guardia).
- [INFORMATIVO] `guardStore.setAlertPhase('sent')` es optimista (línea 270) y puede
  contradecirse después con `'error'` si el backend marca `failed`; la UI debe
  gestionar esa transición de fase.

## Seguridad

- [INFORMATIVO] No hay secretos ni credenciales en este archivo; las claves de Twilio
  y credenciales viven en las Cloud Functions (entorno backend), no en el cliente.
- [BAJO] Los logs de `AlertService` no imprimen números de teléfono ni coordenadas;
  solo `alertId`, mensajes de advertencia y `error?.message` (podría contener
  detalles de la pila del servicio).
- [INFORMATIVO] El documento de alerta contiene datos personales (nombre y teléfono
  de contactos, coordenadas, mensaje con enlace de mapa) y se escribe en Firestore
  bajo `users/{userId}/alerts/{alertId}`; su seguridad depende de las reglas de
  Firestore y del backend, fuera del alcance de este archivo.
- [INFORMATIVO] `ensureAuthenticated` se usa solo si `settings.userId` no existe;
  cuando existe se confía en el uid persistido sin revalidación en este método.
- [INFORMATIVO] No se detecta inyección SQL/XSS/CORS aplicable (cliente React
  Native); la subida de audio se delega a servicios externos con sus propias
  validaciones.
- [BAJO] Riesgo de exponer el estado interno vía logs verbosos en producción
  (`console.log` en `recoverIncompleteAlerts` y watcher), aunque sin datos sensibles.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Encolado sin `await`: añadir manejo de errores (`.catch`) o esperar la
  persistencia local para garantizar el respaldo de la alerta.
- [RIESGO] Estados de la máquina y del documento pueden divergir (fallo de `add`,
  watcher solo sobre la UI): valorar transicionar la máquina a `failed`/`completed`
  cuando el watcher confirme el resultado y exponer `retryFailed`/`canRetry` desde la
  UI.
- [RIESGO] `assistedCallPhone` sin uso: decidir si se implementa la llamada asistida
  (apertura `tel:` al contacto principal) o se elimina del contrato.
- [RECOMENDACIÓN] Enviar la alerta a Firestore solo después de encolar con éxito, o
  bien reintentar la escritura desde la cola, para no perder alertas en fallos de red.
- [RECOMENDACIÓN] Documentar/decidir el manejo del caso "documento pendiente sin
  backend": el watcher podría expirar tras un tiempo límite.
- [RECOMENDACIÓN] Evitar coordenadas centinela `(0,0)` en documentos: usar un campo
  `locationFailed: true` explícito para que los consumidores no traten datos falsos.
