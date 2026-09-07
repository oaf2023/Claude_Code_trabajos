# Archivo: src/services/__tests__/AlertStateMachine.test.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/__tests__/AlertStateMachine.test.ts | 231 | TypeScript 5.9 / Jest | 8260 | Test unitario (máquina de estados de alerta) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Suite unitaria de la máquina de estados de alerta (`AlertStateMachine.ts`). Verifica
el **grafo de transiciones válidas e inválidas**, la conservación del contexto a
través de las transiciones, la actualización parcial de contexto, la actualización de
estado de entrega por contacto (incluido el sellado de `confirmedAt`), el `reset`, y
los helpers puros `buildContactDeliveries`, `hasPendingDeliveries`,
`getCompletedCount` y `canRetry`. Usa el store real de Zustand (con su middleware de
persistencia) y lo resetea en cada test para partir siempre de `idle`.

## Clasificación y estado

- Etiqueta: `FUNCIONALIDAD EXISTENTE` `[NIVEL DE CERTEZA: Confirmado por código]`
- Justificación: los escenarios se corresponden exactamente con la matriz
  `ALLOWED_TRANSITIONS` y con las acciones del store leídas en
  `AlertStateMachine.ts`. La suite ejercita tanto el store como los helpers
  exportados.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `useAlertMachineStore`, `buildContactDeliveries`, `hasPendingDeliveries`, `getCompletedCount`, `canRetry` de `../AlertStateMachine` | interna | Sujeto bajo prueba | Sí |

No hay dependencias externas en el archivo (Jest se configura a nivel de proyecto).

## Componentes que dependen de este archivo

| Componente | Relación |
| --- | --- |
| `AlertStateMachine.ts` | Sujeto bajo prueba |
| Configuración de Jest del proyecto | Ejecuta la suite |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| Objetos `machine` literales de `canRetry` | contexto con `retryCount` 2/3/0 y estado `failed`/`completed` | objeto | Construcción manual del estado para probar `canRetry` | líneas 206–230 |
| Datos fijos | `'user-1'`, `'+5411111111'`, coordenadas de Buenos Aires | varios | Identidades y contactos ficticios | múltiples |

## Estructura (funciones / clases / tipos)

- `describe('AlertStateMachine')` (19–151) con `beforeEach` de reset y suites:
  - `transitions` (24–83): 6 escenarios.
  - `updateContext` (85–100): 1 escenario.
  - `updateContactStatus` (102–137): 2 escenarios.
  - `reset` (139–150): 1 escenario.
- `describe('buildContactDeliveries')` (153–167): 1 escenario.
- `describe('hasPendingDeliveries')` (169–188): 2 escenarios.
- `describe('getCompletedCount')` (190–202): 1 escenario.
- `describe('canRetry')` (204–231): 3 escenarios.

## Análisis línea por línea

### Bloque 1: cabecera, imports y apertura con reset (líneas 1–22)

```ts
/* ============================================================================
* Archivo         : AlertStateMachine.test.ts
* Descripción     : Tests unitarios de la máquina de estados de alerta.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : npx jest src/services/__tests__/AlertStateMachine.test.ts
* ============================================================================ */

import {
  useAlertMachineStore,
  buildContactDeliveries,
  hasPendingDeliveries,
  getCompletedCount,
  canRetry,
} from '../AlertStateMachine';

describe('AlertStateMachine', () => {
  beforeEach(() => {
    useAlertMachineStore.getState().reset();
  });
```

**Explicación de las líneas 1–22:**

- **Línea 1–9**: cabecera documental.
- **Línea 11–17**: importa el store y los cuatro helpers puros exportados.
- **Línea 19**: abre el `describe` principal de la máquina.
- **Línea 20–22**: `beforeEach` que invoca `reset()` para que cada test arranque en
  `idle` con contexto vacío. Nota: `reset` no borra explícitamente la persistencia
  previa de Zustand en AsyncStorage; la rehidratación inicial del store en el entorno
  Jest podría interferir (ver Observaciones).

### Bloque 2: suite `transitions` — estado inicial, válidas e inválidas (líneas 24–71)

```ts
  describe('transitions', () => {
    it('should start in idle state', () => {
      const state = useAlertMachineStore.getState().machine.state;
      expect(state).toBe('idle');
    });

    it('should transition from idle to locating', () => {
      useAlertMachineStore.getState().transition('locating', {
        userId: 'user-1',
        triggerWord: 'manual',
      });

      expect(useAlertMachineStore.getState().machine.state).toBe('locating');
    });

    it('should reject invalid transition from idle to sending', () => {
      useAlertMachineStore.getState().transition('sending');

      expect(useAlertMachineStore.getState().machine.state).toBe('idle');
    });

    it('should transition through valid path: idle → locating → sending → awaiting_confirmation → completed', () => {
      const store = useAlertMachineStore.getState();

      store.transition('locating', { userId: 'user-1', triggerWord: 'ayuda', createdAt: 1000 });
      expect(useAlertMachineStore.getState().machine.state).toBe('locating');

      store.transition('sending', { messageText: 'SOS: ...' });
      expect(useAlertMachineStore.getState().machine.state).toBe('sending');

      store.transition('awaiting_confirmation', { alertId: 'alert-1' });
      expect(useAlertMachineStore.getState().machine.state).toBe('awaiting_confirmation');

      store.transition('completed');
      expect(useAlertMachineStore.getState().machine.state).toBe('completed');
    });

    it('should allow retry from failed to locating', () => {
      const store = useAlertMachineStore.getState();

      store.transition('locating');
      store.transition('failed');

      expect(useAlertMachineStore.getState().machine.state).toBe('failed');

      store.transition('locating');
      expect(useAlertMachineStore.getState().machine.state).toBe('locating');
    });
```

**Explicación de las líneas 24–71:**

- **Línea 25–28**: caso "estado inicial idle": verifica la condición inicial tras el
  `reset`.
- **Línea 30–37**: caso "transición idle → locating": valida la única salida
  permitida desde `idle` y que el contexto recibe `userId` y `triggerWord`.
- **Línea 39–43**: caso "rechaza transición inválida idle → sending": `transition
  ('sending')` desde `idle` debe dejar el estado en `idle` (la matriz solo admite
  `locating`). Cubre la rama de rechazo de `isValidTransition`.
- **Línea 45–59**: caso "ruta completa válida": recorre
  `idle → locating → sending → awaiting_confirmation → completed` comprobando el
  estado tras cada paso. Cubre el camino feliz de principio a fin, incluida la
  transición terminal a `completed`.
- **Línea 61–71**: caso "permite reintento failed → locating": fuerza el camino
  `locating → failed` y luego `failed → locating`, verificando la recuperación desde
  el estado de fallo. Nota: `locating` también permite ir a `failed` (matriz línea 92
  de la implementación).

### Bloque 3: suite `transitions` — conservación de contexto (líneas 73–83)

```ts
    it('should preserve context across transitions', () => {
      const store = useAlertMachineStore.getState();
      store.transition('locating', { userId: 'user-42', triggerWord: 'socorro' });
      store.transition('failed', { errorMessage: 'Red caída' });

      const context = useAlertMachineStore.getState().machine.context;
      expect(context.userId).toBe('user-42');
      expect(context.triggerWord).toBe('socorro');
      expect(context.errorMessage).toBe('Red caída');
    });
  });
```

**Explicación de las líneas 73–83:**

- **Línea 74**: captura el store.
- **Línea 75**: transición a `locating` guardando `userId` y `triggerWord`.
- **Línea 76**: transición a `failed` añadiendo `errorMessage`.
- **Línea 78–82**: verifica que el contexto **fusiona** (no reemplaza): los campos de
  la primera transición sobreviven y el nuevo error se incorpora. Cubre la
  construcción de `nextContext` (líneas 119–123 de la implementación) y el reset de
  `retryCount` al entrar en `failed`.
- **Línea 83**: cierra la suite `transitions`.

### Bloque 4: suites `updateContext` y `updateContactStatus` (líneas 85–137)

```ts
  describe('updateContext', () => {
    it('should partially update context', () => {
      useAlertMachineStore.getState().transition('locating', {
        userId: 'user-1',
        triggerWord: 'test',
      });
      useAlertMachineStore.getState().updateContext({
        location: { lat: -34.6, lon: -58.4, accuracy: 10, timestamp: Date.now() },
      });

      const ctx = useAlertMachineStore.getState().machine.context;
      expect(ctx.location?.lat).toBe(-34.6);
      expect(ctx.location?.lon).toBe(-58.4);
      expect(ctx.userId).toBe('user-1');
    });
  });

  describe('updateContactStatus', () => {
    it('should update delivery status for a contact', () => {
      const store = useAlertMachineStore.getState();
      store.transition('locating');
      store.updateContext({
        contacts: buildContactDeliveries([
          { name: 'Ana', phone: '+5411111111' },
          { name: 'Pedro', phone: '+5422222222' },
        ]),
      });

      store.updateContactStatus('+5411111111', 'sent');

      const contacts = useAlertMachineStore.getState().machine.context.contacts;
      expect(contacts[0].status).toBe('sent');
      expect(contacts[1].status).toBe('pending');
    });

    it('should set confirmedAt when status is confirmed', () => {
      const store = useAlertMachineStore.getState();
      store.transition('locating');
      store.updateContext({
        contacts: buildContactDeliveries([{ name: 'Ana', phone: '+5411111111' }]),
      });

      const before = Date.now();
      store.updateContactStatus('+5411111111', 'confirmed');
      const after = Date.now();

      const contact = useAlertMachineStore.getState().machine.context.contacts[0];
      expect(contact.status).toBe('confirmed');
      expect(contact.confirmedAt).not.toBeNull();
      expect(contact.confirmedAt!).toBeGreaterThanOrEqual(before);
      expect(contact.confirmedAt!).toBeLessThanOrEqual(after);
    });
  });
```

**Explicación de las líneas 85–137:**

- **Línea 85–100**: suite `updateContext`; el test actualiza solo `location` y
  verifica que el contexto conserva `userId` (fusión parcial) y que las coordenadas
  quedaron almacenadas.
- **Línea 102–118**: suite `updateContactStatus`; primer caso: con dos entregas
  creadas por `buildContactDeliveries`, marcar a Ana como `sent` solo afecta a esa
  entrega (Pedro sigue `pending`). Cubre el mapeo por teléfono (líneas 151–161 de la
  implementación).
- **Línea 120–136**: segundo caso: al marcar `confirmed` se sella `confirmedAt` con
  una marca dentro de la ventana temporal `[before, after]` capturada alrededor de la
  llamada. Verifica el sello condicional de `confirmedAt` (línea 158 de la
  implementación).

### Bloque 5: suite `reset` (líneas 139–150)

```ts
  describe('reset', () => {
    it('should return to initial idle state', () => {
      const store = useAlertMachineStore.getState();
      store.transition('locating', { userId: 'user-1', triggerWord: 'ayuda' });
      store.reset();

      const machine = useAlertMachineStore.getState().machine;
      expect(machine.state).toBe('idle');
      expect(machine.context.userId).toBeNull();
      expect(machine.context.triggerWord).toBe('');
    });
  });
});
```

**Explicación de las líneas 139–150:**

- **Línea 140–149**: lleva la máquina a `locating` con datos y la resetea; verifica
  que vuelve a `idle` con contexto limpio (`userId` nulo, `triggerWord` vacío).
  Cubre la acción `reset` (líneas 170–173 de la implementación).
- **Línea 151**: cierra el `describe('AlertStateMachine')`.

### Bloque 6: helper `buildContactDeliveries` (líneas 153–167)

```ts
describe('buildContactDeliveries', () => {
  it('should create delivery entries from contact array', () => {
    const contacts = [
      { name: 'Ana', phone: '+5411111111' },
      { name: 'Pedro', phone: '+5422222222' },
    ];

    const deliveries = buildContactDeliveries(contacts);

    expect(deliveries).toHaveLength(2);
    expect(deliveries[0].name).toBe('Ana');
    expect(deliveries[0].status).toBe('pending');
    expect(deliveries[0].attempts).toBe(0);
  });
});
```

**Explicación de las líneas 153–167:**

- **Línea 154–166**: verifica que dos contactos producen dos entregas con el nombre
  correcto, estado inicial `pending` e `attempts: 0`. No comprueba `channel ===
  'sms'`, `lastError` ni `confirmedAt` (campos también inicializados por el helper).

### Bloque 7: helper `hasPendingDeliveries` (líneas 169–188)

```ts
describe('hasPendingDeliveries', () => {
  it('should return true when some contacts are pending', () => {
    const deliveries = buildContactDeliveries([
      { name: 'A', phone: '1' },
      { name: 'B', phone: '2' },
    ]);
    deliveries[0].status = 'sent';

    expect(hasPendingDeliveries(deliveries)).toBe(true);
  });

  it('should return false when all contacts are done', () => {
    const deliveries = buildContactDeliveries([
      { name: 'A', phone: '1' },
    ]);
    deliveries[0].status = 'confirmed';

    expect(hasPendingDeliveries(deliveries)).toBe(false);
  });
});
```

**Explicación de las líneas 169–188:**

- **Línea 170–178**: caso "verdadero si hay pendientes": una entrega `sent` y otra
  `pending` ⇒ `true`.
- **Línea 180–187**: caso "falso si todas terminaron": una única entrega `confirmed`
  ⇒ `false`. No se ejercita explícitamente el caso de estado `failed`
  (también considerado pendiente por el helper: `pending || failed`).

### Bloque 8: helper `getCompletedCount` (líneas 190–202)

```ts
describe('getCompletedCount', () => {
  it('should count sent and confirmed contacts', () => {
    const deliveries = buildContactDeliveries([
      { name: 'A', phone: '1' },
      { name: 'B', phone: '2' },
      { name: 'C', phone: '3' },
    ]);
    deliveries[0].status = 'sent';
    deliveries[1].status = 'confirmed';

    expect(getCompletedCount(deliveries)).toBe(2);
  });
});
```

**Explicación de las líneas 190–202:**

- **Línea 191–201**: tres entregas con dos marcadas (`sent` y `confirmed`) ⇒ cuenta
  2. Verifica que ambos estados cuentan como "completadas" y que `pending`/`failed`
  no cuentan.

### Bloque 9: helper `canRetry` (líneas 204–231)

```ts
describe('canRetry', () => {
  it('should return true if failed with fewer than 3 retries', () => {
    const machine = {
      state: 'failed' as const,
      context: { retryCount: 2, contacts: [], createdAt: 0, updatedAt: 0, alertId: null, userId: null, triggerWord: '', isTest: false, location: null, locationFailed: false, messageText: '', audioUrl: null, audioPath: null, errorMessage: null },
    };

    expect(canRetry(machine)).toBe(true);
  });

  it('should return false if failed with 3 or more retries', () => {
    const machine = {
      state: 'failed' as const,
      context: { retryCount: 3, contacts: [], createdAt: 0, updatedAt: 0, alertId: null, userId: null, triggerWord: '', isTest: false, location: null, locationFailed: false, messageText: '', audioUrl: null, audioPath: null, errorMessage: null },
    };

    expect(canRetry(machine)).toBe(false);
  });

  it('should return false if not in failed state', () => {
    const machine = {
      state: 'completed' as const,
      context: { retryCount: 0, contacts: [], createdAt: 0, updatedAt: 0, alertId: null, userId: null, triggerWord: '', isTest: false, location: null, locationFailed: false, messageText: '', audioUrl: null, audioPath: null, errorMessage: null },
    };

    expect(canRetry(machine)).toBe(false);
  });
});
```

**Explicación de las líneas 204–231:**

- **Línea 205–212**: caso "true si `failed` con menos de 3 reintentos": construye un
  estado `MachineState` literal (tipado con `as const`) con `retryCount: 2` y espera
  `true`. Cubre la rama `retryCount < 3`.
- **Línea 214–221**: caso "false con 3 o más": `retryCount: 3` ⇒ `false`. Cubre la
  frontera exacta del umbral.
- **Línea 223–230**: caso "false si no está en `failed`": estado `completed` ⇒
  `false`. Cubre la primera condición del helper.
- **Línea 231**: cierra el `describe` final.

## Fichas de funciones y métodos

### `beforeEach` (líneas 20–22)

- Propósito: partir de `idle` en cada test mediante `reset()`.
- Limitación: no purga la persistencia subyacente de Zustand (AsyncStorage en el
  entorno real); si el store rehidratara estado previo antes del reset, la suite
  podría acoplarse al orden de ejecución.

### Bloques de casos por suite

- `transitions` (24–83): cubre inicio, transiciones válidas (camino feliz completo y
  reintento), transición inválida y conservación de contexto.
- `updateContext` (85–100): fusión parcial.
- `updateContactStatus` (102–137): actualización por teléfono y sellado de
  `confirmedAt`.
- `reset` (139–150): restauración.
- Helpers puros (153–231): comportamiento de las funciones de consulta/proyección.

## Clases / interfaces / tipos

- No se declaran tipos nuevos; se usan literales tipados con `as const` para
  construir `MachineState` en los tests de `canRetry` (requieren el contexto completo
  porque el tipo es estructural).

## Cobertura aparente que aporta la suite

- Cubre: el grafo de transiciones en sus aristas principales (idle → locating;
  locating → sending/failed; sending → awaiting_confirmation; awaiting_confirmation →
  completed; failed → locating) y el rechazo de una arista inválida; preservación de
  contexto; actualización parcial; estado de entregas y sello temporal de
  confirmación; reset; y los cuatro helpers exportados en sus ramas principales.
- No cubre (lagunas observables):
  - La **persistencia real**: no se verifica que el estado sobreviva a una
    "rehidratación" (recarga del módulo o nueva creación del store con el
    `partialize` aplicado); tampoco se comprueba que `contacts`/`location` se filtren
    al persistir (privacidad) ni que `messageText` se conserve.
  - Transiciones específicas no ejercitadas: `awaiting_confirmation → failed`,
    `awaiting_confirmation → sending`, `failed → idle`, `locating → failed` con
    datos, ni `idle → locating` con `isTest: true`.
  - El aviso de consola de transición inválida (solo se verifica que el estado no
    cambie).
  - El reinicio de `retryCount` a 0 al entrar en `completed`/`failed` (se verifica
    indirectamente el estado, no el contador).
  - En `hasPendingDeliveries`, el caso con estado `failed`.
  - En `buildContactDeliveries`, los campos `channel`, `lastError` y `confirmedAt`.
  - `updateContactStatus` con contacto inexistente (no muta nada) y el incremento de
    `attempts`.
- [NIVEL DE CERTEZA: Confirmado por código] Dado que en producción la máquina solo se
  conduce hasta `awaiting_confirmation` (ver análisis de `AlertService.ts`), esta
  suite valida un grafo más amplio que el utilizado actualmente por la app.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] La suite no mockea `AsyncStorage` ni el middleware `persist`:
  depende de que en el entorno Jest la hidratación no contamine el estado entre
  tests (el `reset` del `beforeEach` lo mitiga, pero no borra la clave persistida).
- [OBSERVACIÓN TÉCNICA] Los tests de `canRetry` duplican el contexto completo de
  `MachineContext` de forma manual en tres literales casi idénticos; cualquier campo
  nuevo del contexto obligaría a actualizarlos (acoplamiento estructural al tipo).
- [OBSERVACIÓN TÉCNICA] No hay verificación de las advertencias emitidas por
  `transition` inválida ni del efecto de `updatedAt`, que sí se sella en cada
  operación.
- [INFORMATIVO] Los identificadores, teléfonos y coordenadas de los tests son
  ficticios.

## Seguridad

- [INFORMATIVO] Sin secretos ni datos reales; teléfonos (`+5411111111`,
  `+5422222222`) y coordenadas (Buenos Aires) son de ejemplo.
- [INFORMATIVO] La suite no toca red ni almacenamiento real; no hay riesgo de fuga.
- [BAJO] Ningún hallazgo de seguridad relevante.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Añadir un test que verifique el `partialize` (persistencia sin
  `contacts`/`location` y con los campos mínimos) para blindar el compromiso de
  privacidad declarado en la implementación.
- [RECOMENDACIÓN] Cubrir las aristas no ejercitadas del grafo (especialmente
  `awaiting_confirmation → sending`/`failed` y `failed → idle`) y el reinicio de
  `retryCount` en estados terminales.
- [RECOMENDACIÓN] Extraer una fábrica de `MachineState` compartida para los tests de
  `canRetry` y reducir el acoplamiento al tipo completo.
- [RIESGO] La validación del grafo supera el uso real (la app se detiene en
  `awaiting_confirmation`); si en el futuro se conecta la capa de confirmación por
  contacto, esta suite ya cubriría parte del nuevo comportamiento, pero hoy puede
  dar una falsa sensación de robustez del flujo completo en producción.
