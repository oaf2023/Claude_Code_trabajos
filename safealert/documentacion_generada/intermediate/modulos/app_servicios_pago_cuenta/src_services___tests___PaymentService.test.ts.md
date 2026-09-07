# Archivo: src/services/__tests__/PaymentService.test.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/__tests__/PaymentService.test.ts | 241 | TypeScript 5.9 / Jest | 7703 | Test unitario (suite Jest con fetch mockeado) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Suite de pruebas unitarias del servicio `PaymentService`. Cubre los cuatro métodos exportados (`checkSubscription`, `registerDevice`, `confirmPayment`, `createTicket`) usando un `fetch` global mockeado y mocks de `DeviceService` y de `useSettingsStore`. Su objetivo es validar: el comportamiento de degradación sin `deviceId`, la actualización del store `hasSubscription` según el estado devuelto, el cuerpo y los headers enviados en cada POST, y la gestión de errores HTTP y de red.

## Clasificación y estado

- `FUNCIONALIDAD EXISTENTE` — suite ejecutable con Jest, sin dependencias externas reales (todo mockeado).
- [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `{ PaymentService, SubscriptionStatus }` de `../PaymentService` | interna | Sujeto bajo prueba | Sí |
| `useSettingsStore` de `../../stores/useSettingsStore` | interna | Reset de estado en `beforeEach` y aserciones de `hasSubscription` | Sí |
| `jest.mock('../DeviceService', ...)` | interna (mock) | Sustituye `DeviceService` por versiones fijas | Sí |
| `global.fetch = mockFetch` | estándar (mock) | Sustituye el fetch global | Sí |

## Componentes que dependen de este archivo

- Ninguno en ejecución; es un archivo de test que importa el código bajo prueba. Se ejecuta con `npx jest src/services/__tests__/PaymentService.test.ts` (según cabecera).

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `mockFetch` | `jest.fn()` | Jest mock | Reemplaza `global.fetch` | Líneas 27–28 y todas las llamadas |
| `mockResponse(body, ok, status)` | función helper | Respuesta simulada | Devuelve objeto con `ok`, `status` y `json()` | Líneas 30–36 |
| `process.env.EXPO_PUBLIC_PA_INTERNAL_KEY` | `'clave-interna-test'` (valor de prueba, no secreto real) | string | Prueba del header `X-Internal-Key` | Línea 185 |

Nota: los valores de MAC/device únicos mockeados (`AA:BB:CC:DD:EE:FF`, `unique-device-001`) son ficticios de prueba, no datos reales de dispositivo. [NIVEL DE CERTEZA: Confirmado por código]

## Estructura (funciones / clases / tipos)

- Mock de `DeviceService` (líneas 18–25).
- Helper `mockResponse` (líneas 30–36).
- `describe('PaymentService')` (línea 38) con `beforeEach` (líneas 39–47) y sub-suites:
  - `describe('checkSubscription')` (líneas 49–98): 4 tests.
  - `describe('registerDevice')` (líneas 100–151): 3 tests.
  - `describe('confirmPayment')` (líneas 153–181): 2 tests.
  - `describe('createTicket')` (líneas 183–227): 2 tests.
  - `describe('type safety (SubscriptionStatus)')` (líneas 229–240): 1 test.
- Total: 12 casos de prueba.

## Análisis línea por línea

**Bloque 1 (líneas 1–36): cabecera, importaciones y mocks.**

```ts
/* ============================================================================
* Archivo         : PaymentService.test.ts
* Descripción     : Tests unitarios de PaymentService: registro de dispositivo,
*                   consulta de suscripción, confirmación de pago y creación
*                   de ticket correlativo (fetch mockeado).
* Autor           : oafon
* Fecha           : 2026-08-22
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9 / Jest
* Uso             : npx jest src/services/__tests__/PaymentService.test.ts
* ============================================================================ */

import { PaymentService, SubscriptionStatus } from '../PaymentService';
import { useSettingsStore } from '../../stores/useSettingsStore';

// ─── Mocks ────────────────────────────────────────────────────────────────

jest.mock('../DeviceService', () => ({
  DeviceService: {
    getMacAddress: jest.fn().mockResolvedValue('AA:BB:CC:DD:EE:FF'),
    getDeviceUniqueId: jest.fn().mockResolvedValue('unique-device-001'),
    getDeviceId: jest.fn().mockResolvedValue('sa-test-device'),
    isEmulator: jest.fn().mockResolvedValue(false),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function mockResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}
```

**Explicación de las líneas 1–36:**
- **Líneas 1–11**: cabecera documental estándar. Indica la fecha 2026-08-22 y que el fetch se mockea.
- **Línea 13**: importa el servicio bajo prueba y el tipo `SubscriptionStatus` (usado en el test de type safety).
- **Línea 14**: importa el store Zustand real (no mockeado) para poder inspeccionar y resetear `hasSubscription`.
- **Líneas 16–17**: marcador de sección de mocks.
- **Líneas 18–25**: `jest.mock` de `DeviceService` sustituyendo `getMacAddress`, `getDeviceUniqueId`, `getDeviceId` e `isEmulator` por funciones que resuelven valores fijos. Así `registerDevice` no depende del hardware real.
- **Líneas 27–28**: define `mockFetch` como `jest.fn()` y lo asigna a `global.fetch`, de modo que todas las llamadas de red de `PaymentService` caen en el mock.
- **Líneas 30–36**: helper `mockResponse` que fabrica una `Response` simulada con `ok`, `status` y un `json()` que resuelve el cuerpo indicado. Con `ok=true, status=200` por defecto.

**Bloque 2 (líneas 38–98): describe principal, beforeEach y suite `checkSubscription`.**

```ts
describe('PaymentService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    useSettingsStore.setState({
      hasSubscription: false,
      userId: 'uid-test',
      userPhone: '+5491100000000',
      userName: 'Test User',
    });
  });

  describe('checkSubscription', () => {
    it('should return not_registered fallback without deviceId', async () => {
      const result = await PaymentService.checkSubscription('');
      expect(result.status).toBe('not_registered');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should set hasSubscription=true when status is active', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          device_id: 'sa-1',
          status: 'active',
          plan_type: 'monthly',
          expires_at: '2026-09-01T00:00:00',
        })
      );

      const result = await PaymentService.checkSubscription('sa-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/status/sa-1')
      );
      expect(result.status).toBe('active');
      expect(useSettingsStore.getState().hasSubscription).toBe(true);
    });

    it('should keep hasSubscription=false when status is not active', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          device_id: 'sa-1',
          status: 'expired',
          plan_type: 'monthly',
          expires_at: null,
        })
      );

      await PaymentService.checkSubscription('sa-1');

      expect(useSettingsStore.getState().hasSubscription).toBe(false);
    });

    it('should return fallback on network error', async () => {
      mockFetch.mockRejectedValue(new Error('network down'));

      const result = await PaymentService.checkSubscription('sa-1');

      expect(result.status).toBe('not_registered');
      expect(useSettingsStore.getState().hasSubscription).toBe(false);
    });
  });
```

**Explicación de las líneas 38–98:**
- **Líneas 38–47**: describe raíz y `beforeEach`: resetea el mock de fetch y restaura el estado del store con `hasSubscription: false` y datos de usuario de prueba.
- **Línea 49**: sub-suite para `checkSubscription`.
- **Líneas 50–54**: test 1 — sin `deviceId`, el servicio debe retornar `not_registered` sin invocar `fetch`.
- **Líneas 56–73**: test 2 — si el backend responde `status: 'active'` con plan `monthly` y `expires_at`, el fetch debe llamarse contra una URL que contenga `/api/users/status/sa-1`, retornar `active` y poner `hasSubscription = true` en el store.
- **Líneas 75–88**: test 3 — con estado `expired` el store debe quedar en `false` (no activo).
- **Líneas 90–97**: test 4 — ante rechazo de red (`mockRejectedValue`), retorna el fallback `not_registered` y el store queda en `false`.

**Bloque 3 (líneas 100–151): suite `registerDevice`.**

```ts
  describe('registerDevice', () => {
    it('should POST device data and set subscription when active', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ success: true, status: 'active' })
      );

      const status = await PaymentService.registerDevice(
        'sa-1',
        'Test User',
        '+5491100000000'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/register'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.device_id).toBe('sa-1');
      expect(body.mac_address).toBe('AA:BB:CC:DD:EE:FF');
      expect(body.device_unique_id).toBe('unique-device-001');
      expect(status).toBe('active');
      expect(useSettingsStore.getState().hasSubscription).toBe(true);
    });

    it('should return not_registered on HTTP failure', async () => {
      mockFetch.mockResolvedValue(mockResponse({ error: 'boom' }, false, 500));

      const status = await PaymentService.registerDevice(
        'sa-1',
        'Test User',
        '+5491100000000'
      );

      expect(status).toBe('not_registered');
    });

    it('should return not_registered on network error', async () => {
      mockFetch.mockRejectedValue(new Error('timeout'));

      const status = await PaymentService.registerDevice(
        'sa-1',
        'Test User',
        '+5491100000000'
      );

      expect(status).toBe('not_registered');
    });
  });
```

**Explicación de las líneas 100–151:**
- **Línea 100**: sub-suite de `registerDevice`.
- **Líneas 101–126**: test 1 — verifica el POST a una URL con `/api/users/register`, con `method: 'POST'` y el header JSON. Inspecciona el cuerpo real enviado (primer argumento de la llamada al mock) para comprobar `device_id`, `mac_address` (del mock de DeviceService) y `device_unique_id`. Verifica que retorne `active` y actualice el store.
- **Líneas 128–138**: test 2 — ante una respuesta HTTP 500 con `ok: false`, retorna `not_registered`. [OBSERVACIÓN TÉCNICA] El servicio no comprueba `response.ok` en `registerDevice`; aquí el mock devuelve un cuerpo JSON `{ error: 'boom' }` que se parsea y, al no tener `status`, el retorno cae en `'not_registered'`. El test valida el resultado, no el mecanismo.
- **Líneas 140–150**: test 3 — ante error de red (`timeout`), retorna `not_registered`.

**Bloque 4 (líneas 153–181): suite `confirmPayment`.**

```ts
  describe('confirmPayment', () => {
    it('should POST confirmation and return success', async () => {
      mockFetch.mockResolvedValue(mockResponse({ success: true }));

      const ok = await PaymentService.confirmPayment(
        'sa-1',
        'monthly',
        'mp-ref-123'
      );

      expect(ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/payments/confirm'),
        expect.objectContaining({ method: 'POST' })
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.device_id).toBe('sa-1');
      expect(body.plan_type).toBe('monthly');
      expect(body.mp_reference).toBe('mp-ref-123');
    });

    it('should return false when backend rejects', async () => {
      mockFetch.mockResolvedValue(mockResponse({ error: 'no' }, false, 400));

      const ok = await PaymentService.confirmPayment('sa-1', 'annual');

      expect(ok).toBe(false);
    });
  });
```

**Explicación de las líneas 153–181:**
- **Línea 153**: sub-suite de `confirmPayment`.
- **Líneas 154–172**: test 1 — con respuesta `{ success: true }`, verifica que retorne `true`, que llame a una URL con `/api/payments/confirm` en POST y que el cuerpo contenga `device_id`, `plan_type` y `mp_reference` con los valores pasados.
- **Líneas 174–180**: test 2 — ante HTTP 400 con `ok: false`, retorna `false` (en este caso el cuerpo no tiene `success`, de modo que `json.success === true` es falso).

**Bloque 5 (líneas 183–241): suite `createTicket` y type safety.**

```ts
  describe('createTicket', () => {
    it('should POST with internal key and return ticket data', async () => {
      process.env.EXPO_PUBLIC_PA_INTERNAL_KEY = 'clave-interna-test';
      mockFetch.mockResolvedValue(
        mockResponse({
          success: true,
          ticket: {
            ticket_number: 42,
            date: '22/08/2026',
            time: '12:00',
            plan_type: 'monthly',
            amount: 7500,
            contact_email: 'safealert_contacto@manejadatos.com',
          },
        })
      );

      const ticket = await PaymentService.createTicket(
        'sa-1',
        'Test User',
        'monthly',
        7500
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickets/create'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Internal-Key': 'clave-interna-test',
          }),
        })
      );
      expect(ticket.ticket_number).toBe(42);
      expect(ticket.amount).toBe(7500);
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValue(mockResponse({ error: 'denied' }, false, 401));

      await expect(
        PaymentService.createTicket('sa-1', 'Test User', 'monthly', 7500)
      ).rejects.toThrow(/401/);
    });
  });

  describe('type safety (SubscriptionStatus)', () => {
    it('should accept all valid subscription statuses', () => {
      const statuses: SubscriptionStatus[] = [
        'active',
        'pending',
        'pending_verification',
        'expired',
        'not_registered',
      ];
      expect(statuses).toHaveLength(5);
    });
  });
});
```

**Explicación de las líneas 183–241:**
- **Línea 183**: sub-suite de `createTicket`.
- **Línea 185**: fija la variable de entorno `EXPO_PUBLIC_PA_INTERNAL_KEY` con un valor de prueba (no un secreto real).
- **Líneas 186–198**: mock de la respuesta del backend con el formato real `{ success, ticket: {...} }`, incluyendo un ticket con `ticket_number`, `date`, `time`, `plan_type`, `amount` y `contact_email`.
- **Líneas 200–205**: invoca `createTicket` con datos de prueba.
- **Líneas 207–215**: verifica URL `/api/tickets/create`, método POST y el header `X-Internal-Key` con el valor de prueba.
- **Líneas 216–217**: verifica la normalización (`data.ticket ?? data`): el ticket se accede directamente con `ticket.ticket_number` y `ticket.amount`.
- **Líneas 220–226**: test 2 — ante HTTP 401, la promesa debe rechazar con un error cuyo mensaje incluya `401`.
- **Líneas 229–240**: test de "type safety" — comprueba que los 5 estados del union type `SubscriptionStatus` son asignables y que el arreglo tiene longitud 5. Es una verificación de tipos/constantes, no de comportamiento.

## Fichas de funciones y métodos

### mockResponse (líneas 30–36)
- Firma: `function mockResponse(body: unknown, ok = true, status = 200)`.
- Propósito técnico: construir una respuesta `fetch` simulada con un `json()` que resuelve el cuerpo dado.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| body | unknown | Cuerpo JSON que devolverá `json()`. |
| ok | boolean | Valor de `response.ok` (por defecto true). |
| status | number | Código HTTP (por defecto 200). |

- Retorno: objeto tipado como `Response`.
- Excepciones: ninguna.
- Dependencias: ninguna.
- Efectos secundarios: ninguno.

### beforeEach (líneas 39–47)
- Firma: `beforeEach(() => { ... })` de Jest.
- Propósito: aislar cada test reseteando el mock de fetch y restaurando un estado conocido en `useSettingsStore`.
- Riesgos: si `PaymentService` llegara a depender de otras claves del store, el reset parcial podría dejar estado residual.

## Clases / interfaces / tipos

- No define clases ni interfaces propias; importa `SubscriptionStatus` desde `PaymentService` solo para el test de type safety.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El test de HTTP failure de `registerDevice` (líneas 128–138) devuelve `not_registered` porque el cuerpo mockeado no contiene `status`; el servicio en realidad no evalúa `response.ok` en ese método. Si en el futuro el backend devolviera un `status` en cuerpos de error, este test fallaría, lo que lo hace sensible a cambios del contrato. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] No se testean: el fallback de `checkSubscription` cuando el servidor devuelve HTML/JSON inválido, ni el caso de `mpReference` vacío en `confirmPayment`, ni el orden/estado de `pending_verification`. Cobertura de escenarios buena pero no exhaustiva. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `useSettingsStore` se usa real (no mockeado), lo que exige que el store pueda hidratarse sin AsyncStorage en el entorno Jest; al usar `createJSONStorage(() => AsyncStorage)` el persist podría requerir mock de AsyncStorage según configuración de Jest del proyecto (no presente en este archivo). [NIVEL DE CERTEZA: Inferido]
- [OBSERVACIÓN TÉCNICA] El mock de `DeviceService` también define `getDeviceId` e `isEmulator`, que no usa `PaymentService`; son utilitarios para otros posibles tests. [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [INFORMATIVO] El valor `'clave-interna-test'` de la línea 185 es un valor de prueba ficticio; no hay secretos reales en el archivo. [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] El email de contacto del ticket mockeado (`safealert_contacto@manejadatos.com`) es un dato de prueba corporativo, no un secreto.
- [BAJO] Los tests fijan `process.env.EXPO_PUBLIC_PA_INTERNAL_KEY` sin restaurarlo tras la suite; si otros tests posteriores leyeran esa variable podrían verse afectados por el valor residual. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Restaurar `process.env` en `afterAll`/`afterEach` cuando un test lo modifica, para evitar contaminación entre suites. [RECOMENDACIÓN]
- [RIESGO] Añadir casos para: cuerpo de error no JSON, `response.ok` falso con cuerpo JSON en `registerDevice`/`checkSubscription`, y `mpReference` ausente (cuerpo con `mp_reference: ''`). [RECOMENDACIÓN]
- [INFORMATIVO] Mantener los valores mockeados claramente ficticios (como hasta ahora) para que nunca se confundan con credenciales reales. [RECOMENDACIÓN]
