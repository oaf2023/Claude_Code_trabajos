# Archivo: src/services/__tests__/AlertQueue.test.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/__tests__/AlertQueue.test.ts | 184 | TypeScript 5.9 / Jest | 5693 | Test unitario (cola de reintentos) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Suite de tests unitarios de `AlertQueue` (cola local persistente de reintentos de
alertas SOS). Verifica el comportamiento de encolado con deduplicación por
`idempotencyKey`, la eliminación, el incremento de reintentos y la lógica de
`process()` (éxito elimina, fallo incrementa, máximo de reintentos descarta, excepción
del `sendFn` incrementa), además de `count()` y `clear()`. Todo el almacenamiento
(`AsyncStorage`) se sustituye por un mock en memoria para que los tests sean
deterministas y sin dependencias nativas.

## Clasificación y estado

- Etiqueta: `FUNCIONALIDAD EXISTENTE` `[NIVEL DE CERTEZA: Confirmado por código]`
- Justificación: los tests cubren la mayoría de los métodos públicos de la cola y
  están alineados con la implementación real leída en `AlertQueue.ts`. Se ejecutan
  con Jest (`npx jest src/services/__tests__/AlertQueue.test.ts`, según su cabecera).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `AlertQueue`, `QueuedAlert` de `../AlertQueue` | interna | Objeto bajo prueba y tipado de `makeAlert` | Sí |
| `@react-native-async-storage/async-storage` | externa (mockeada) | Se simula con `jest.mock` sobre un `Map` | Sí (como mock) |

No hay otras dependencias: la suite es autocontenida.

## Componentes que dependen de este archivo

| Componente | Relación |
| --- | --- |
| `AlertQueue.ts` (sujeto bajo prueba) | Es el módulo que la suite ejercita |
| Configuración de Jest del proyecto | Ejecuta la suite (patrón `src/services/__tests__/*.test.ts`) |
| `AlertService.test.ts` | Suite hermana que también usa `AlertQueue` real con el mismo patrón de mock de AsyncStorage (separado) |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `mockStorage` | `new Map<string, string>()` | `Map<string, string>` | Sustituto en memoria de `AsyncStorage` | líneas 14–19, 22, 142 |
| `QUEUE_KEY` del sujeto | `'@safealert/alert_queue'` | `string` | Clave usada en la inyección directa de estado (línea 143) | línea 143 |
| Datos fijos del fixture | `'alert-1'`, `'user-1'`, `'+5411111111'`, `{lat: -34.6, lon: -58.4}` | varios | Identificadores y contactos ficticios del fixture | líneas 28–38 |

## Estructura (funciones / clases / tipos)

- Mock de `AsyncStorage` (líneas 14–19) + limpieza en `beforeEach` (21–23).
- `makeAlert(overrides)` (25–41): fábrica de fixtures.
- Suites `describe`/`it`:
  - `AlertQueue > enqueue` (44–88): añade y deduplica.
  - `AlertQueue > remove` (90–99).
  - `AlertQueue > incrementRetry` (101–110).
  - `AlertQueue > process` (112–165): 4 escenarios.
  - `AlertQueue > count` (167–174).
  - `AlertQueue > clear` (176–183).

## Análisis línea por línea

### Bloque 1: cabecera, imports y mock de AsyncStorage (líneas 1–23)

```ts
/* ============================================================================
* Archivo         : AlertQueue.test.ts
* Descripción     : Tests unitarios de la cola de reintentos de alertas.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : npx jest src/services/__tests__/AlertQueue.test.ts
* ============================================================================ */

import { AlertQueue, QueuedAlert } from '../AlertQueue';

// Mock AsyncStorage
const mockStorage = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => { mockStorage.set(key, value); }),
  removeItem: jest.fn(async (key: string) => { mockStorage.delete(key); }),
}));

beforeEach(() => {
  mockStorage.clear();
});
```

**Explicación de las líneas 1–23:**

- **Línea 1–9**: cabecera documental; indica ejecución con Jest.
- **Línea 11**: importa el sujeto bajo prueba y su tipo.
- **Línea 13**: comentario de mock.
- **Línea 14**: `mockStorage`, un `Map` que actúa de almacén en memoria. Se declara en
  el ámbito del módulo (fuera del `jest.mock`) para que la fábrica del mock pueda
  cerrar sobre él.
- **Línea 15–19**: `jest.mock` del paquete de AsyncStorage: `getItem` devuelve el
  valor o `null`, `setItem` guarda y `removeItem` borra. Es un mock hoisted por Jest;
  el cierre sobre `mockStorage` funciona porque la referencia se resuelve en tiempo
  de ejecución.
- **Línea 21–23**: `beforeEach` vacía el almacén para aislar cada test.

### Bloque 2: fábrica de fixtures `makeAlert` (líneas 25–41)

```ts
function makeAlert(overrides: Partial<QueuedAlert> = {}): QueuedAlert {
  const createdAt = Date.now();
  return {
    id: 'alert-1',
    userId: 'user-1',
    triggerWord: 'manual',
    messageText: 'SOS test',
    contacts: [{ name: 'Ana', phone: '+5411111111' }],
    location: { lat: -34.6, lon: -58.4 },
    locationFailed: false,
    createdAt,
    retryCount: 0,
    lastAttemptAt: null,
    idempotencyKey: `user-1_alert-1_${createdAt}`,
    ...overrides,
  };
}
```

**Explicación de las líneas 25–41:**

- **Línea 25**: `makeAlert` acepta sobrescrituras parciales para personalizar casos.
- **Línea 26**: marca temporal única por llamada.
- **Línea 27–38**: construye un `QueuedAlert` válido completo: id `alert-1`, usuario
  `user-1`, palabra `manual`, un contacto (`Ana`, teléfono ficticio), ubicación en
  Buenos Aires, `locationFailed: false`, `retryCount: 0`, `lastAttemptAt: null` y la
  `idempotencyKey` derivada de forma coherente con la implementación.
- **Línea 39**: aplica las sobrescrituras (permiten, p. ej., inyectar
  `retryCount: 5`).

### Bloque 3: suite `enqueue` (líneas 43–88)

```ts
describe('AlertQueue', () => {
  describe('enqueue', () => {
    it('should add an alert to the queue', async () => {
      await AlertQueue.enqueue({
        id: 'alert-1',
        userId: 'user-1',
        triggerWord: 'manual',
        messageText: 'SOS',
        contacts: [{ name: 'Ana', phone: '+5411111111' }],
        location: { lat: -34.6, lon: -58.4 },
        locationFailed: false,
        createdAt: 1000,
      });

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('alert-1');
    });

    it('should not add duplicate alerts with same idempotencyKey', async () => {
      await AlertQueue.enqueue({
        id: 'alert-1',
        userId: 'user-1',
        triggerWord: 'manual',
        messageText: 'SOS',
        contacts: [],
        location: null,
        locationFailed: false,
        createdAt: 1000,
      });

      await AlertQueue.enqueue({
        id: 'alert-1',
        userId: 'user-1',
        triggerWord: 'manual',
        messageText: 'SOS',
        contacts: [],
        location: null,
        locationFailed: false,
        createdAt: 1000,
      });

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(1);
    });
  });
```

**Explicación de las líneas 43–88:**

- **Línea 43**: abre el bloque `describe` principal.
- **Línea 44–88**: sub-bloque `enqueue`.
- **Línea 45–60**: caso "añade una alerta": encola un elemento (sin contactos
  duplicados), lee la cola y verifica que hay exactamente 1 elemento con `id`
  `alert-1`. Ejercita `enqueue` + `getAll`.
- **Línea 62–87**: caso "no duplica con la misma `idempotencyKey`": encola dos veces
  el mismo objeto (mismo `id`, `userId` y `createdAt` → misma clave) y verifica que la
  cola conserva un solo elemento. Cubre la rama de deduplicación de `enqueue`
  (línea 44–45 de la implementación).

### Bloque 4: suites `remove` e `incrementRetry` (líneas 90–110)

```ts
  describe('remove', () => {
    it('should remove an alert by idempotencyKey', async () => {
      const alert = makeAlert();
      await AlertQueue.enqueue(alert);
      await AlertQueue.remove(alert.idempotencyKey);

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(0);
    });
  });

  describe('incrementRetry', () => {
    it('should increment retryCount and set lastAttemptAt', async () => {
      const alert = makeAlert();
      await AlertQueue.enqueue(alert);

      const updated = await AlertQueue.incrementRetry(alert.idempotencyKey);
      expect(updated?.retryCount).toBe(1);
      expect(updated?.lastAttemptAt).not.toBeNull();
    });
  });
```

**Explicación de las líneas 90–110:**

- **Línea 90–99**: suite `remove`: encola un fixture y lo elimina por su clave; al
  releer la cola debe quedar vacía. Cubre `remove` en su rama feliz.
- **Línea 101–110**: suite `incrementRetry`: encola un fixture, incrementa el
  reintento y verifica que el retorno tiene `retryCount = 1` y `lastAttemptAt`
  sellado (no nulo). Cubre la actualización de contador y marca temporal. No se
  prueba el caso de clave inexistente (retorno `null`).

### Bloque 5: suite `process` — éxito, fallo, máximo y excepción (líneas 112–165)

```ts
  describe('process', () => {
    it('should remove alert on successful send', async () => {
      const alert = makeAlert();
      await AlertQueue.enqueue(alert);

      const sendFn = jest.fn().mockResolvedValue(true);
      await AlertQueue.process(sendFn);

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(0);
      expect(sendFn).toHaveBeenCalledTimes(1);
      expect(sendFn).toHaveBeenCalledWith(expect.objectContaining({ id: 'alert-1' }));
    });

    it('should increment retry on failed send', async () => {
      const alert = makeAlert();
      await AlertQueue.enqueue(alert);

      const sendFn = jest.fn().mockResolvedValue(false);
      await AlertQueue.process(sendFn);

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(1);
      expect(queue[0].retryCount).toBe(1);
    });

    it('should discard alert after max retries', async () => {
      const alert = makeAlert();
      const withMaxRetries: QueuedAlert = { ...alert, retryCount: 5 };
      const raw = JSON.stringify([withMaxRetries]);
      (await import('@react-native-async-storage/async-storage')).default.setItem(
        '@safealert/alert_queue', raw
      );

      const sendFn = jest.fn().mockResolvedValue(false);
      await AlertQueue.process(sendFn);

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(0);
      expect(sendFn).not.toHaveBeenCalled();
    });

    it('should handle errors thrown by sendFn', async () => {
      const alert = makeAlert();
      await AlertQueue.enqueue(alert);

      const sendFn = jest.fn().mockRejectedValue(new Error('Red caída'));
      await AlertQueue.process(sendFn);

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(1);
      expect(queue[0].retryCount).toBe(1);
    });
  });
```

**Explicación de las líneas 112–165:**

- **Línea 112**: suite `process`.
- **Línea 113–124**: caso "elimina la alerta si el envío tiene éxito": `sendFn` es un
  mock que resuelve `true`; tras `process` la cola queda vacía, `sendFn` se llamó una
  vez con un objeto que contiene `id: 'alert-1'`. Cubre la rama de éxito (líneas
  103–105 de la implementación).
- **Línea 126–136**: caso "incrementa reintento si el envío falla": `sendFn` resuelve
  `false`; la alerta permanece y su `retryCount` pasa a 1. Cubre la rama de fallo
  controlado (líneas 106–111).
- **Línea 138–152**: caso "descarta tras el máximo de reintentos": construye una
  alerta con `retryCount: 5` y la **inyecta directamente** en el almacén con
  `setItem('@safealert/alert_queue', raw)` (atajo que evita que `enqueue` la rechace
  por duplicado o la normalice). `process` debe descartarla sin invocar `sendFn`.
  Cubre la rama `retryCount >= MAX_RETRIES` (líneas 91–95).
- **Línea 154–164**: caso "gestiona excepciones lanzadas por `sendFn`": el mock
  rechaza con un `Error('Red caída')`; la alerta permanece y su `retryCount` pasa a
  1. Cubre la rama `catch` (líneas 112–117).

### Bloque 6: suites `count` y `clear` (líneas 167–184)

```ts
  describe('count', () => {
    it('should return the number of queued alerts', async () => {
      expect(await AlertQueue.count()).toBe(0);

      await AlertQueue.enqueue(makeAlert());
      expect(await AlertQueue.count()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all alerts from the queue', async () => {
      await AlertQueue.enqueue(makeAlert());
      await AlertQueue.clear();

      expect(await AlertQueue.count()).toBe(0);
    });
  });
});
```

**Explicación de las líneas 167–184:**

- **Línea 167–174**: suite `count`: verifica 0 elementos al inicio (estado limpio por
  el `beforeEach`) y 1 tras encolar un fixture.
- **Línea 176–183**: suite `clear`: encola y luego limpia; `count` debe devolver 0.
- **Línea 184**: cierra el `describe` principal.

## Fichas de funciones y métodos

### `makeAlert` (líneas 25–41)

- Firma: `function makeAlert(overrides: Partial<QueuedAlert> = {}): QueuedAlert`.
- Propósito: producir fixtures válidos y coherentes con la `idempotencyKey`.
- Parámetros: `overrides` parciales. Retorno: `QueuedAlert`.
- Uso: en casi todos los tests de la suite.

### Mocks de soporte

- `getItem`/`setItem`/`removeItem` simulados (líneas 15–19): emulan el contrato de
  AsyncStorage sobre `mockStorage`.
- `beforeEach` (21–23): aislamiento entre tests.

## Clases / interfaces / tipos

- No se declaran tipos nuevos; se reutiliza `QueuedAlert` importado del sujeto.

## Cobertura aparente que aporta la suite

- Cubre: encolado básico, deduplicación por `idempotencyKey`, `remove`, incremento de
  reintentos, éxito/fallo/excepción en `process`, descarte por máximo de reintentos
  (con inyección directa de estado), `count` y `clear`. Es una cobertura funcional
  alta de los métodos públicos.
- No cubre (lagunas observables):
  - `getAll` ante JSON corrupto (la rama `catch` que devuelve `[]`).
  - La rama de retardo no vencido de `process` (`if (now - lastAttempt < delay)
    continue`): todos los fixtures tienen `lastAttemptAt: null`, por lo que el
    backoff temporal nunca se ejercita; `getBackoffDelay` no es exportada y tampoco
    se prueba en aislamiento.
  - `incrementRetry` con clave inexistente (retorno `null`).
  - Fronteras de reintentos (retryCount 4 → 5 vs. 5) y llamadas sucesivas a
    `process` para verificar la espera.
  - [NIVEL DE CERTEZA: Confirmado por código] Estas lagunas implican que la política
    de reintentos temporal (2/4/8/16/32 s + jitter) no tiene verificación
    automatizada.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El caso "máximo de reintentos" usa una clave de almacén
  literal (`'@safealert/alert_queue'`, línea 143) en lugar de importar `QUEUE_KEY`
  (no exportada); si la constante del sujeto cambiara, el test fallaría en silencio
  por escribir en una clave distinta.
- [OBSERVACIÓN TÉCNICA] El mock de AsyncStorage comparte el `Map` a nivel de módulo;
  al ser una suite única sin otros imports que usen AsyncStorage, el aislamiento es
  correcto dentro de este archivo.
- [OBSERVACIÓN TÉCNICA] `makeAlert` recalcula `Date.now()` en cada llamada, por lo que
  dos fixtures creados con `makeAlert()` nunca comparten `idempotencyKey` (los tests
  de deduplicación construyen el objeto a mano con `createdAt` fijo).

## Seguridad

- [INFORMATIVO] Los fixtures contienen un teléfono ficticio (`+5411111111`) y
  coordenadas ficticias (Buenos Aires); no hay datos reales ni secretos.
- [INFORMATIVO] El mock no persiste nada fuera del proceso de test; no hay riesgo de
  fuga.
- [BAJO] Ningún hallazgo de seguridad: la suite no toca red, almacenamiento real ni
  credenciales.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Añadir tests para la rama de JSON corrupto de `getAll`, la espera
  por backoff (simulando `lastAttemptAt` recientes) y `incrementRetry` con clave
  inexistente.
- [RECOMENDACIÓN] Exportar `QUEUE_KEY` y `getBackoffDelay` (o inyectarlos) para
  evitar literales duplicados y poder probar el cálculo de retardos.
- [RIESGO] La suite no detecta regresiones en la política temporal de reintentos; si
  esa política es crítica para el producto, su verificación debería priorizarse.
