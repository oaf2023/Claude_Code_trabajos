# Archivo: src/services/__tests__/AlertService.test.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/__tests__/AlertService.test.ts | 274 | TypeScript 5.9 / Jest | 9880 | Test unitario (orquestador de alertas SOS) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Suite unitaria de `AlertService` que verifica la orquestación del envío de una alerta
SOS: creación del documento en Firestore con todos los contactos, regla de negocio de
**pago vencido** (envío solo al contacto principal + aviso), marcado de alertas de
prueba, tolerancia a fallos de ubicación, encolado local para reintentos, fases del
store de guardia y grabación/subida de audio opcional. También cubre la recuperación
de alertas encoladas (`recoverIncompleteAlerts`). Para ello mockea todos los servicios
externos y la capa de Firebase, dejando intactos los stores reales de Zustand
(guardia, ajustes, contactos y máquina de estados), que se resetean en cada test.

## Clasificación y estado

- Etiqueta: `FUNCIONALIDAD EXISTENTE` `[NIVEL DE CERTEZA: Confirmado por código]`
- Justificación: la suite se corresponde con el código real de `AlertService.ts` y
  con la regla de pago vencido existente (líneas 168–175). Cubre el flujo principal
  de `send` y `recoverIncompleteAlerts`; no cubre `retryFailed` (ver cobertura).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `AlertService`, `recoverIncompleteAlerts` de `../AlertService` | interna | Sujeto bajo prueba | Sí |
| `LocationService` de `../LocationService` | interna (mockeada) | `getCurrentLocation`, `buildMapsLink`, `getManualLocation`, `start/stopBackgroundUpdates` | Sí (mock) |
| `AudioRecordingService` de `../AudioRecordingService` | interna (mockeada) | `recordAndUpload`, `recordSnippet`, `cancelSnippetRecording`, `configure` | Sí (mock) |
| `AudioAlertApiService` de `../AudioAlertApiService` | interna (mockeada) | `uploadSecurityRecording`, `detectAlertFromFile`, `isConfigured` | Sí (mock) |
| `IAProcessingService` de `../IAProcessingService` | interna (mockeada) | `processAlertAudio` | Sí (mock) |
| `useGuardStore`, `useSettingsStore`, `useContactsStore` | internas | Stores reales reseteados/ajustados por test | Sí |
| `useAlertMachineStore` de `../AlertStateMachine` | interna | `reset()` en `beforeEach` | Sí |
| `AlertQueue` de `../AlertQueue` | interna | Limpieza de cola e inspección de encolado | Sí |
| `../../config/firebase` | interna (mockeada) | `alertsCol`, `contactsCol`, `ensureAuthenticated`, `auth`, `storage`, `functions`, etc. | Sí (mock) |

## Componentes que dependen de este archivo

| Componente | Relación |
| --- | --- |
| `AlertService.ts` | Sujeto bajo prueba |
| Configuración de Jest del proyecto | Ejecuta la suite |
| Store de guardia (`useGuardStore`) y máquina (`AlertStateMachine`) | Se les aplican resets que validan su contrato |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `mockAdd` | `jest.fn()` | `jest.Mock` | Simula `alertsCol().add()`; resuelve `{ id: 'alert-123' }` | líneas 58, 66, 130, 158–166, 175–189, 201–204 |
| `mockDocUpdate` | `jest.fn().mockResolvedValue(undefined)` | `jest.Mock` | Simula `doc().update()` | líneas 59, 61, 126–127, 245–247 |
| `mockDoc` | `jest.fn(() => ({ update, onSnapshot }))` | `jest.Mock` | Simula `doc()` de Firestore | líneas 60–63, 66, 125–129 |
| `CONTACT_1`, `CONTACT_2` | Fixtures con `priority` 0 y 1 | objetos | Contactos activos de prueba | líneas 89–105 |
| Valores fijos | `'uid-test'`, `'alert-123'`, `'+5491111111111'`, coordenadas de Buenos Aires | varios | Identidades y datos ficticios | múltiples |

## Estructura (funciones / clases / tipos)

- Bloque de mocks (22–85): `LocationService`, `AudioRecordingService`,
  `AudioAlertApiService`, `IAProcessingService` y módulo `firebase`.
- Fixtures `CONTACT_1`/`CONTACT_2` (87–105).
- `describe('AlertService')` (107) con `beforeEach` (108–140) y suites:
  - `send` (142–249): 7 escenarios.
  - `recoverIncompleteAlerts` (251–273): 1 escenario.

## Análisis línea por línea

### Bloque 1: cabecera e imports (líneas 1–20)

```ts
/* ============================================================================
* Archivo         : AlertService.test.ts
* Descripción     : Tests unitarios de AlertService: orquestación del envío SOS,
*                   contacto único por pago vencido, ubicación fallida y
*                   recuperación de alertas pendientes.
* Autor           : oafon
* Fecha           : 2026-08-22
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9 / Jest
* Uso             : npx jest src/services/__tests__/AlertService.test.ts
* ============================================================================ */

import { AlertService, recoverIncompleteAlerts } from '../AlertService';
import { LocationService } from '../LocationService';
import { AudioRecordingService } from '../AudioRecordingService';
import { useGuardStore } from '../../stores/useGuardStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useContactsStore } from '../../stores/useContactsStore';
import { useAlertMachineStore } from '../AlertStateMachine';
import { AlertQueue } from '../AlertQueue';
```

**Explicación de las líneas 1–20:**

- **Línea 1–11**: cabecera (fecha 2026-08-22; la suite es posterior a la v1.0.0 de
  AlertService, alineada con la regla de pago vencido).
- **Línea 13**: importa el servicio y la función de recuperación bajo prueba.
- **Línea 14–15**: `LocationService` y `AudioRecordingService` (para mockearlos).
- **Línea 16–18**: stores reales de Zustand que se manipularán en cada test.
- **Línea 19–20**: máquina de alertas (reset) y `AlertQueue` (limpieza/inspección).

### Bloque 2: mocks de servicios (líneas 22–55)

```ts
// ─── Mocks ────────────────────────────────────────────────────────────────

jest.mock('../LocationService', () => ({
  LocationService: {
    getCurrentLocation: jest.fn(),
    buildMapsLink: jest.fn(() => 'https://maps.google.com/?q=-34.6,-58.38'),
    getManualLocation: jest.fn(),
    startBackgroundUpdates: jest.fn().mockResolvedValue(undefined),
    stopBackgroundUpdates: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../AudioRecordingService', () => ({
  AudioRecordingService: {
    recordAndUpload: jest.fn().mockResolvedValue(null),
    recordSnippet: jest.fn().mockResolvedValue(null),
    cancelSnippetRecording: jest.fn().mockResolvedValue(undefined),
    configure: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../AudioAlertApiService', () => ({
  AudioAlertApiService: {
    uploadSecurityRecording: jest.fn().mockResolvedValue(true),
    detectAlertFromFile: jest.fn(),
    isConfigured: jest.fn().mockReturnValue(false),
  },
}));

jest.mock('../IAProcessingService', () => ({
  IAProcessingService: {
    processAlertAudio: jest.fn().mockResolvedValue({ ok: true }),
  },
}));
```

**Explicación de las líneas 22–55:**

- **Línea 24–32**: mock de `LocationService`: `getCurrentLocation` es un `jest.fn()`
  sin implementación (se configura por test), `buildMapsLink` devuelve un enlace fijo,
  y los métodos de fondo resuelven `undefined`. El mock incluye métodos que el
  servicio real exporta aunque `AlertService` no los use (para evitar errores de
  importación en otros módulos).
- **Línea 34–41**: mock de `AudioRecordingService`: `recordAndUpload` devuelve `null`
  por defecto (audio desactivado o sin grabación) y el resto resuelve valores neutros.
- **Línea 43–49**: mock de `AudioAlertApiService`: la subida de respaldo resuelve
  `true`, `isConfigured` devuelve `false`.
- **Línea 51–55**: mock de `IAProcessingService`: `processAlertAudio` resuelve
  `{ ok: true }`.

### Bloque 3: mock del módulo Firebase (líneas 57–85)

```ts
// Mock de firebase: alertsCol devuelve una colección con add/doc
const mockAdd = jest.fn();
const mockDocUpdate = jest.fn().mockResolvedValue(undefined);
const mockDoc = jest.fn(() => ({
  update: mockDocUpdate,
  onSnapshot: jest.fn(() => jest.fn()),
}));

jest.mock('../../config/firebase', () => ({
  alertsCol: jest.fn(() => ({
    add: mockAdd,
    doc: mockDoc,
    orderBy: jest.fn(),
    limit: jest.fn(),
    onSnapshot: jest.fn(() => jest.fn()),
  })),
  contactsCol: jest.fn(() => ({
    doc: mockDoc,
    get: jest.fn(),
  })),
  ensureAuthenticated: jest.fn().mockResolvedValue('uid-anon-test'),
  firestoreFieldValue: { serverTimestamp: () => ({}) },
  userDoc: jest.fn(),
  settingsDoc: jest.fn(),
  auth: jest.fn(() => ({ currentUser: { uid: 'uid-anon-test', getIdToken: jest.fn().mockResolvedValue('token') } })),
  storage: jest.fn(() => ({ ref: jest.fn(() => ({ putFile: jest.fn(), getDownloadURL: jest.fn() })) })),
  functions: jest.fn(() => ({ httpsCallable: jest.fn(() => jest.fn()) })),
  getIdToken: jest.fn().mockResolvedValue('token'),
}));
```

**Explicación de las líneas 57–85:**

- **Línea 58**: `mockAdd` simula `add()` de la colección; se configura en
  `beforeEach` para resolver `{ id: 'alert-123' }`.
- **Línea 59**: `mockDocUpdate` simula `update()` de un documento.
- **Línea 60–63**: `mockDoc` devuelve un documento con `update` y un `onSnapshot`
  que devuelve una función de cancelación.
- **Línea 65–85**: `jest.mock('../../config/firebase')` reemplaza el módulo completo
  por una fábrica con los símbolos que otros módulos (incluidos los stores
  persistidos) puedan importar: `alertsCol`, `contactsCol`, `ensureAuthenticated`,
  `firestoreFieldValue`, `userDoc`, `settingsDoc`, `auth`, `storage`, `functions` y
  `getIdToken`. `ensureAuthenticated` resuelve `'uid-anon-test'`.
- Nota: el mock expone más símbolos de los que `AlertService` importa porque los
  stores de Zustand (Settings/Guard) importan de `config/firebase` en tiempo de
  carga; sin el mock completo la importación rompería en el entorno Jest.

### Bloque 4: fixtures de contactos (líneas 87–105)

```ts
// ─── Fixtures ─────────────────────────────────────────────────────────────

const CONTACT_1 = {
  id: 'c1',
  name: 'Ana',
  phone: '+5491111111111',
  active: true,
  priority: 0,
  addedAt: 1000,
};

const CONTACT_2 = {
  id: 'c2',
  name: 'Luis',
  phone: '+5492222222222',
  active: true,
  priority: 1,
  addedAt: 2000,
};
```

**Explicación de las líneas 87–105:**

- **Línea 89–96**: `CONTACT_1` (Ana, `priority: 0`): el de menor prioridad → será el
  "contacto principal" en las reglas de pago vencido y el destino de
  `assistedCallPhone`.
- **Línea 98–105**: `CONTACT_2` (Luis, `priority: 1`): segundo contacto activo para
  los casos de envío a todos.

### Bloque 5: `beforeEach` (líneas 107–140)

```ts
describe('AlertService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AlertQueue.clear();
    useGuardStore.getState().resetAlertState();
    useGuardStore.setState({ isArmed: false, lastAlert: null, lastLocation: null });
    useSettingsStore.setState({
      userId: 'uid-test',
      hasSubscription: true,
      paymentOverdue: false,
      audioEnabled: false,
      messageTemplate: '{name} necesita ayuda! {location}',
      triggerWords: ['ayuda', 'socorro'],
    });
    useContactsStore.setState({ contacts: [], loading: false });
    useAlertMachineStore.getState().reset();
    mockAdd.mockReset();
    mockDocUpdate.mockReset();
    mockDoc.mockReset();
    mockDoc.mockImplementation(() => ({
      update: mockDocUpdate,
      onSnapshot: jest.fn(() => jest.fn()),
    }));
    mockAdd.mockResolvedValue({ id: 'alert-123' });
    (LocationService.getCurrentLocation as jest.Mock).mockResolvedValue({
      lat: -34.6037,
      lon: -58.3816,
      accuracy: 5,
      timestamp: Date.now(),
      isStale: false,
      source: 'GPS',
      permissionStatus: 'GRANTED',
    });
  });
```

**Explicación de las líneas 107–140:**

- **Línea 107**: abre el `describe('AlertService')`.
- **Línea 108**: `beforeEach` asíncrono que prepara un entorno limpio y conocido.
- **Línea 109**: limpia todos los mocks (llamadas e implementaciones no default).
- **Línea 110**: vacía la cola real de `AlertQueue` (persistida en el mock de
  AsyncStorage del entorno Jest si existe; si no, no-op).
- **Línea 111**: resetea el store de guardia (método real del store).
- **Línea 112**: fuerza estado base de guardia (`isArmed` false, sin última alerta ni
  ubicación).
- **Línea 113–120**: estado de ajustes determinista: usuario `uid-test`, suscripción
  vigente, sin pago vencido, audio desactivado, plantilla de mensaje y palabras de
  disparo de ejemplo.
- **Línea 121**: contactos vacíos por defecto (cada test los puebla).
- **Línea 122**: resetea la máquina de estados.
- **Línea 123–129**: reconfigura los mocks de Firestore: `mockAdd` resuelve el id
  `alert-123`, `mockDoc` devuelve documento con `update`/`onSnapshot`.
- **Línea 131–139**: `LocationService.getCurrentLocation` por defecto resuelve una
  ubicación GPS válida de Buenos Aires (`isStale: false`, `source: 'GPS'`).

### Bloque 6: `send` — sin contactos y alta con todos los contactos (líneas 142–166)

```ts
  describe('send', () => {
    it('should throw when there are no active contacts', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1, CONTACT_2] });
      useContactsStore.setState((s) => ({ contacts: [] }));

      await expect(AlertService.send('manual')).rejects.toThrow(
        'No hay contactos activos'
      );
    });

    it('should create an alert document with all contacts', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1, CONTACT_2] });

      const result = await AlertService.send('manual');

      expect(result.alertId).toBe('alert-123');
      expect(mockAdd).toHaveBeenCalledTimes(1);

      const alertData = mockAdd.mock.calls[0][0];
      expect(alertData.triggerWord).toBe('manual');
      expect(alertData.contacts).toHaveLength(2);
      expect(alertData.status).toBe('pending');
      expect(alertData.location.source).toBe('GPS');
      expect(alertData.isTest).toBe(false);
    });
```

**Explicación de las líneas 142–166:**

- **Línea 142**: suite `send`.
- **Línea 143–150**: caso "lanza error sin contactos activos": puebla el store y lo
  vacía de nuevo (doblemente redundante para asegurar `activeContacts() = []`); espera
  que `send` rechace con el mensaje exacto `'No hay contactos activos'`. Cubre la
  precondición de la línea 161–163 de la implementación.
- **Línea 152–166**: caso "crea el documento con todos los contactos": con dos
  contactos activos, `send('manual')` debe llamar una vez a `add` con datos que
  contienen `triggerWord: 'manual'`, 2 contactos, `status: 'pending'`, la ubicación
  real (`source: 'GPS'`) y `isTest: false`. Verifica además que el resultado expone
  `alertId`. Cubre el núcleo del alta en Firestore (líneas 231–253).

### Bloque 7: `send` — pago vencido, modo test y ubicación fallida (líneas 168–204)

```ts
    it('should send only to main contact when subscription overdue', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1, CONTACT_2] });
      useSettingsStore.setState({ hasSubscription: false, paymentOverdue: true });

      const result = await AlertService.send('manual');

      expect(useGuardStore.getState().showOverdueAlert).toBe(true);
      const alertData = mockAdd.mock.calls[0][0];
      expect(alertData.contacts).toHaveLength(1);
      expect(alertData.contacts[0].phone).toBe('+5491111111111');
      // El contacto principal es el de menor prioridad (priority 0)
      expect(result.assistedCallPhone).toBe('+5491111111111');
    });

    it('should mark test alerts with isTest flag', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1] });

      await AlertService.send('test', true);

      const alertData = mockAdd.mock.calls[0][0];
      expect(alertData.isTest).toBe(true);
      expect(alertData.triggerWord).toBe('test');
    });

    it('should continue when location fails (locationFailed)', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1] });
      (LocationService.getCurrentLocation as jest.Mock).mockRejectedValue(
        new Error('GPS unavailable')
      );

      const result = await AlertService.send('manual');

      expect(result.alertId).toBe('alert-123');
      const alertData = mockAdd.mock.calls[0][0];
      expect(alertData.location.isStale).toBe(true);
      expect(alertData.mapsLink).toBe('');
    });
```

**Explicación de las líneas 168–204:**

- **Línea 168–180**: caso "pago vencido envía solo al contacto principal": sin
  suscripción y con `paymentOverdue`, `send` debe: activar `showOverdueAlert` en
  guardia, escribir un documento con **1 solo contacto** (el de `priority` 0 = Ana,
  `+5491111111111`) y devolver ese teléfono como `assistedCallPhone`. Cubre la regla
  de negocio de las líneas 168–175 y 305 de la implementación.
- **Línea 182–190**: caso "marca alertas de prueba": `send('test', true)` produce un
  documento con `isTest: true` y `triggerWord: 'test'`. Cubre la normalización del
  disparador (línea 186).
- **Línea 192–204**: caso "continúa si la ubicación falla": `getCurrentLocation`
  rechaza; aun así `send` resuelve con `alertId`, y el documento lleva el fallback de
  ubicación centinela (`isStale: true`) y `mapsLink` vacío. Cubre la tolerancia a
  fallos de GPS (líneas 200–208 y 235–243).

### Bloque 8: `send` — encolado, fases del store y audio (líneas 206–249)

```ts
    it('should enqueue the alert for retry', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1] });

      await AlertService.send('manual');
      // AlertQueue.enqueue es fire-and-forget; esperar el microtask
      await new Promise((r) => setTimeout(r, 10));

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('alert-123');
      await AlertQueue.clear();
    });

    it('should set phase to sent and store lastAlert', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1] });

      await AlertService.send('manual');

      expect(useGuardStore.getState().alertPhase).toBe('sent');
      expect(useGuardStore.getState().lastAlert?.id).toBe('alert-123');
    });

    it('should record and upload audio when enabled', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1] });
      useSettingsStore.setState({ audioEnabled: true });
      (AudioRecordingService.recordAndUpload as jest.Mock).mockResolvedValue({
        audioUrl: 'https://storage/audio.m4a',
        audioPath: 'users/u/alerts/a/voice.m4a',
        localUri: 'file:///tmp/audio.m4a',
      });

      await AlertService.send('manual');

      expect(AudioRecordingService.recordAndUpload).toHaveBeenCalledWith(
        'uid-test',
        'alert-123'
      );
      // Esperar microtask de post-upload
      await new Promise((r) => setTimeout(r, 10));
      expect(mockDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ audioUrl: 'https://storage/audio.m4a' })
      );
    });
  });
```

**Explicación de las líneas 206–249:**

- **Línea 206–217**: caso "encola la alerta para reintento": tras `send`, espera
  10 ms (el `enqueue` es fire-and-forget y necesita un microtask/timer para
  completarse) y verifica que la cola contiene la alerta `alert-123`; al final limpia
  la cola para no contaminar otros tests.
- **Línea 219–226**: caso "fase sent y última alerta guardada": verifica el
  comportamiento optimista de la UI: `alertPhase === 'sent'` y
  `lastAlert.id === 'alert-123'`.
- **Línea 228–248**: caso "graba y sube audio si está activado": con `audioEnabled:
  true` y un `recordAndUpload` que resuelve datos de subida, verifica que se llamó
  con `('uid-test', 'alert-123')` y que tras el microtask el documento se actualizó
  con el `audioUrl`. Cubre la rama de audio de las líneas 275–301.
- **Línea 249**: cierra la suite `send`.

### Bloque 9: `recoverIncompleteAlerts` (líneas 251–273)

```ts
  describe('recoverIncompleteAlerts', () => {
    it('should process queued alerts', async () => {
      // Encolar una alerta pendiente
      await AlertQueue.enqueue({
        id: 'old-alert',
        userId: 'uid-test',
        triggerWord: 'manual',
        messageText: 'msg',
        contacts: [{ name: 'Ana', phone: '+5491111111111' }],
        location: { lat: -34.6, lon: -58.38 },
        locationFailed: false,
        createdAt: Date.now(),
      });

      const sendFn = jest.fn().mockResolvedValue(true);
      await recoverIncompleteAlerts(sendFn);

      expect(sendFn).toHaveBeenCalledTimes(1);
      expect(sendFn.mock.calls[0][0].id).toBe('old-alert');
      // Tras éxito, la cola queda vacía
      expect(await AlertQueue.getAll()).toHaveLength(0);
    });
  });
});
```

**Explicación de las líneas 251–273:**

- **Línea 251**: suite `recoverIncompleteAlerts`.
- **Línea 252–263**: encola manualmente una alerta pendiente (`old-alert`) en la cola
  real.
- **Línea 265–266**: `sendFn` mock que resuelve `true`.
- **Línea 267–272**: invoca `recoverIncompleteAlerts(sendFn)` y verifica que `sendFn`
  se llamó una vez con la alerta `old-alert` y que, tras el éxito, la cola quedó
  vacía (porque `process` la elimina). Cubre el flujo completo de recuperación
  (líneas 140–148 de la implementación).
- **Línea 274**: cierra el `describe` principal.

## Fichas de funciones y métodos

### `beforeEach` (líneas 108–140)

- Propósito: entorno limpio y determinista (stores, cola, mocks y ubicación por
  defecto) antes de cada test.
- Efectos secundarios: resetea estado global real de Zustand; por eso los tests no
  pueden ejecutarse en paralelo entre sí dentro de este archivo sin riesgo de
  interferencia.

### Mocks de módulo (líneas 24–85)

- Propósito: aislar `AlertService` de GPS real, audio, IA, backend Flask y Firebase.
- Detalle: `LocationService`, `AudioRecordingService`, `AudioAlertApiService`,
  `IAProcessingService` y `../../config/firebase` se sustituyen íntegros; el mock de
  Firebase incluye API auxiliar para no romper importaciones transitivas de los
  stores.

### Fixtures `CONTACT_1`/`CONTACT_2` (líneas 89–105)

- Contactos activos con `priority` 0/1 para ejercitar la selección del contacto
  principal.

## Clases / interfaces / tipos

- No se declaran tipos nuevos. El tipado de mocks usa aserciones `as jest.Mock`
  sobre los métodos mockeados.

## Cobertura aparente que aporta la suite

- Cubre: precondición sin contactos; alta en Firestore con todos los contactos y
  datos correctos; regla de pago vencido (1 contacto + `showOverdueAlert` +
  `assistedCallPhone`); modo test; fallo de ubicación (fallback centinela y enlace
  vacío); encolado local; fases optimistas (`sent`) y `lastAlert`; audio opcional
  (grabación y actualización del documento); y `recoverIncompleteAlerts` con éxito.
- No cubre (lagunas observables):
  - `AlertService.retryFailed` (no se referencia en la suite).
  - El comportamiento del watcher de Firestore (el mock de `onSnapshot` nunca se
    invoca; no se prueban las transiciones de fase `'error'` por `status: 'failed'`
    ni `'sent'` por `status: 'partial'`).
  - La rama de sesión no lista (`!userId` → error) ni la de sincronización de
    `settings.userId`.
  - Fallos de `alertsCol().add()` (excepción propagada y estado de la máquina).
  - Fallos de encolado (promesa rechazada de `AlertQueue.enqueue`).
  - Fallos en la subida de respaldo a PythonAnywhere y en el disparador de IA
    (sus `catch` internos).
  - `hasSubscription` vigente vs. alerta de prueba con pago vencido (la prueba
    ignora el aviso).
- [NIVEL DE CERTEZA: Confirmado por código] El uso de `setTimeout(r, 10)` para
  esperar microtasks (encolado y post-upload de audio) introduce esperas reales que
  pueden volverse frágiles con máquinas lentas, aunque la ventana es amplia.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Los tests ejercitan los stores de Zustand **reales** (no
  mockeados). Si algún store persistido rehidrata estado desde AsyncStorage en el
  entorno Jest, los `setState` explícitos del `beforeEach` lo sobrescriben; el orden
  de los resets importa y no se documenta dependencia cruzada.
- [OBSERVACIÓN TÉCNICA] El mock de `LocationService` incluye métodos no usados por
  `AlertService` (`getManualLocation`, `startBackgroundUpdates`,
  `stopBackgroundUpdates`), probablemente para satisfacer importaciones de otros
  módulos cargados por Jest.
- [OBSERVACIÓN TÉCNICA] En "sin contactos activos" se llama dos veces a `setState`
  (poblar y vaciar); la segunda basta, la primera es ruido.
- [OBSERVACIÓN TÉCNICA] La verificación de `assistedCallPhone` en pago vencido
  confirma el contrato de retorno de `send` (aunque en producción ningún llamador
  consume ese valor; ver análisis de `AlertService.ts`).
- [INFORMATIVO] Los fixtures y mensajes contienen datos ficticios; la URL de mapa del
  mock usa coordenadas de Buenos Aires de ejemplo.

## Seguridad

- [INFORMATIVO] La suite no usa secretos reales: `'token'` y `'uid-anon-test'` son
  valores ficticios de mock; el teléfono `+549...` y las coordenadas son ficticios.
- [INFORMATIVO] No se toca red, ni almacenamiento real, ni credenciales; los mocks
  evitan cualquier fuga.
- [BAJO] Ningún hallazgo de seguridad relevante en el archivo de test.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Añadir tests para `retryFailed`, para el watcher (invocando el
  callback de `onSnapshot` con snapshots `sent`/`partial`/`failed`) y para la rama de
  sesión no lista.
- [RECOMENDACIÓN] Sustituir las esperas por timers falsos de Jest
  (`jest.useFakeTimers`) o por promesas controladas para eliminar fragilidad.
- [RIESGO] La dependencia del estado global real de los stores puede producir
  acoplamientos si otros tests del mismo proceso comparten módulos; mantener el
  `beforeEach` completo es crítico para la fiabilidad.
