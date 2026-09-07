# Archivo: src/services/AlertQueue.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/AlertQueue.ts | 129 | TypeScript 5.9 | 4242 | Servicio (cola persistente de reintentos) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Cola local persistente para el envío de alertas SOS con reintentos. Cada alerta que
`AlertService.send()` no puede confirmar se encola en `AsyncStorage` bajo una clave
única (`QUEUE_KEY`) y, cuando se invoca `process()`, se reintenta el envío con
**exponential backoff con jitter** (hasta `MAX_RETRIES` reintentos) y semántica de
**idempotencia** por `idempotencyKey`. Su propósito técnico es garantizar que una
alerta iniciada en el móvil sobreviva a fallos de red, cierres del proceso y reinicios
del dispositivo, de modo que la confirmación real quede diferida hasta que exista
conectividad. El objeto exportado actúa como un módulo singleton con estado en
`AsyncStorage`; no mantiene estado en memoria entre llamadas.

## Clasificación y estado

- Etiqueta: `FUNCIONALIDAD EXISTENTE` `[NIVEL DE CERTEZA: Confirmado por código]`
- Justificación: el archivo está completo, es importado y usado por
  `src/services/AlertService.ts` (líneas 29, 258 y 314), por
  `recoverIncompleteAlerts` (que a su vez se invoca en `app/_layout.tsx` línea 293) y
  está cubierto por su suite de tests `src/services/__tests__/AlertQueue.test.ts`.
  La Cloud Function `functions/src/sendAlertSMS.ts` solo menciona la cola en un
  comentario (línea 218) como contexto del flujo, no la importa.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `AsyncStorage` de `@react-native-async-storage/async-storage` | externa | Persistencia de la cola (`getItem`, `setItem`, `removeItem` en `getAll`, `enqueue`, `remove`, `incrementRetry`, `clear`) | Sí |

No hay dependencias internas del proyecto ni librerías de terceros adicionales. La
única importación es la de almacenamiento asíncrono nativo de React Native.

## Componentes que dependen de este archivo

| Componente | Tipo de uso | Evidencia |
| --- | --- | --- |
| `src/services/AlertService.ts` | Encola en `send()` (línea 258, fire-and-forget) y procesa en `recoverIncompleteAlerts` (línea 147) y `retryFailed` (línea 314) | Import en línea 29 |
| `src/services/__tests__/AlertQueue.test.ts` | Suite unitaria que ejercita todos los métodos | Import en línea 11 |
| `src/services/__tests__/AlertService.test.ts` | Usa `AlertQueue.clear()` y `getAll()` para verificar encolado | Import en línea 20 |
| `functions/src/sendAlertSMS.ts` | Referencia en comentario de arquitectura únicamente (línea 218) | Comentario, no es dependencia real |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `QUEUE_KEY` | `'@safealert/alert_queue'` | `string` | Clave de `AsyncStorage` donde se persiste el JSON de toda la cola | líneas 53, 58, 70, 80, 122 |
| `MAX_RETRIES` | `5` | `number` | Límite de reintentos por alerta antes de descartarla | líneas 31, 91, 109 |
| `BASE_DELAY_MS` | `2000` | `number` | Retardo base (ms) del backoff exponencial | líneas 32, 36 |
| `MAX_DELAY_MS` | `60000` | `number` | Tope del retardo exponencial (ms) | líneas 33, 36 |

Significado de los valores mágicos: con `BASE_DELAY_MS = 2000` los retardos teóricos
por intento son 2 s, 4 s, 8 s, 16 s y 32 s (intentos 0 a 4), todos por debajo del tope
de 60 s; `Math.random() * 1000` añade jitter aleatorio de hasta 1 s. La clave
`@safealert/...` es una convención de nombres con prefijo del dominio de la app.

## Estructura (funciones / clases / tipos)

- `interface QueuedAlert` (líneas 17–29): contrato del elemento encolado.
- `function getBackoffDelay(attempt)` (líneas 35–38, no exportada).
- `const AlertQueue` (líneas 40–129, exportada, patrón objeto-singleton) con métodos:
  - `enqueue(alert)` — añade con deduplicación por `idempotencyKey`.
  - `getAll()` — lee y parsea la cola completa.
  - `remove(idempotencyKey)` — elimina una alerta.
  - `incrementRetry(idempencyKey)` — suma 1 al contador y registra `lastAttemptAt`.
  - `process(sendFn)` — recorre la cola y reintenta según backoff.
  - `clear()` — vacía la cola.
  - `count()` — devuelve el número de elementos.

## Análisis línea por línea

### Bloque 1: cabecera de script y única importación (líneas 1–15)

```ts
/* ============================================================================
* Archivo         : AlertQueue.ts
* Descripción     : Cola local persistente para reintentos de alertas SOS.
*                   Almacena alertas pendientes en AsyncStorage, reintenta
*                   con exponential backoff y garantiza idempotencia.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AlertQueue.enqueue(alertData).then(() => AlertQueue.process())
* ============================================================================ */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@safealert/alert_queue';
```

**Explicación de las líneas 1–15:**

- **Línea 1–11**: cabecera documental obligatoria del proyecto (autor `oafon`, fecha
  2026-06-29, versión 1.0.0, TypeScript 5.9). El comentario de descripción define el
  contrato real del archivo: persistencia, backoff exponencial e idempotencia. No es
  ejecutable.
- **Línea 13**: importa `AsyncStorage`, el almacenamiento clave-valor asíncrono nativo
  de React Native. Es la única dependencia del módulo.
- **Línea 15**: define `QUEUE_KEY`, la clave única bajo la que se guarda la cola
  completa como una sola cadena JSON. Toda la persistencia pasa por esta clave.

### Bloque 2: interfaz `QueuedAlert` (líneas 17–29)

```ts
export interface QueuedAlert {
  id: string;
  userId: string;
  triggerWord: string;
  messageText: string;
  contacts: Array<{ name: string; phone: string }>;
  location: { lat: number; lon: number } | null;
  locationFailed: boolean;
  createdAt: number;
  retryCount: number;
  lastAttemptAt: number | null;
  idempotencyKey: string;
}
```

**Explicación de las líneas 17–29:**

- **Línea 17**: declara y exporta la interfaz `QueuedAlert`, que tipa cada elemento de
  la cola.
- **Línea 18–19**: `id` es el identificador de la alerta (en la práctica, el id del
  documento Firestore generado por `alertsCol().add()`) y `userId` el del usuario.
- **Línea 20–21**: `triggerWord` (palabra que disparó la alerta: `manual`, `test` o la
  wake word) y `messageText` (mensaje final ya formateado con prefijo y enlace de mapa).
- **Línea 22**: `contacts` es un array reducido de contactos destino con nombre y
  teléfono. Nota de privacidad: números de teléfono persistidos en local.
- **Línea 23–24**: `location` con `lat`/`lon` puede ser `null`; `locationFailed`
  indica si la geolocalización falló en el momento de la alerta.
- **Línea 25–27**: `createdAt` (marca temporal de creación), `retryCount` (intentos de
  reintento acumulados) y `lastAttemptAt` (última marca de intento, `null` si aún no
  hubo ninguno).
- **Línea 28**: `idempotencyKey`, cadena que garantiza que la misma alerta no se
  encola dos veces (ver `enqueue`).

### Bloque 3: constantes de reintento y función de backoff (líneas 31–38)

```ts
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 60000;

function getBackoffDelay(attempt: number): number {
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
  return delay + Math.random() * 1000;
}
```

**Explicación de las líneas 31–38:**

- **Línea 31**: `MAX_RETRIES = 5`; una alerta con `retryCount >= 5` se descarta en
  `process` sin volver a intentarse (por tanto se permiten a lo sumo 5 intentos de
  envío: el inicial con `retryCount` 0–4).
- **Línea 32**: retardo base de 2 s para el cálculo exponencial.
- **Línea 33**: tope de 60 s para no saturar con esperas largas.
- **Línea 35**: declara `getBackoffDelay(attempt)`, función pura no exportada.
- **Línea 36**: calcula `2^attempt * 2000` acotado a 60 000 ms (2 s, 4 s, 8 s, 16 s,
  32 s para intentos 0–4).
- **Línea 37**: suma jitter aleatorio de 0–1000 ms para evitar que varias alertas se
  reintenten sincronizadas (thundering herd).

### Bloque 4: método `enqueue` (líneas 40–55)

```ts
export const AlertQueue = {
  async enqueue(alert: Omit<QueuedAlert, 'retryCount' | 'lastAttemptAt' | 'idempotencyKey'>): Promise<void> {
    const queue = await this.getAll();
    const idempotencyKey = `${alert.userId}_${alert.id}_${alert.createdAt}`;
    const exists = queue.some((q) => q.idempotencyKey === idempotencyKey);
    if (exists) return;

    queue.push({
      ...alert,
      retryCount: 0,
      lastAttemptAt: null,
      idempotencyKey,
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`[AlertQueue] Alerta ${alert.id} encolada. Total: ${queue.length}`);
  },
```

**Explicación de las líneas 40–55:**

- **Línea 40**: abre el objeto literal `AlertQueue` que se exporta como singleton.
- **Línea 41**: `enqueue` recibe una alerta **sin** los campos gestionados por la cola
  (`retryCount`, `lastAttemptAt`, `idempotencyKey`) y devuelve `Promise<void>`.
- **Línea 42**: lee el estado actual de la cola desde `AsyncStorage`.
- **Línea 43**: construye la `idempotencyKey` concatenando `userId`, `id` y
  `createdAt`. La combinación identifica unívocamente un intento lógico de alerta.
- **Línea 44–45**: comprueba si ya existe una alerta con esa clave; si existe, retorna
  sin hacer nada (deduplicación/idempotencia).
- **Línea 47–52**: si no existe, empuja el elemento completo inicializando
  `retryCount` a 0, `lastAttemptAt` a `null` y la clave calculada.
- **Línea 53**: persiste la cola completa serializada en JSON bajo `QUEUE_KEY`.
- **Línea 54**: log informativo con el id de la alerta y el nuevo total. No imprime
  datos personales.

### Bloque 5: método `getAll` (líneas 57–65)

```ts
  async getAll(): Promise<QueuedAlert[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QueuedAlert[];
    } catch {
      return [];
    }
  },
```

**Explicación de las líneas 57–65:**

- **Línea 57**: `getAll` lee toda la cola y la devuelve tipada.
- **Línea 58**: obtiene la cadena JSON cruda.
- **Línea 59**: si no hay nada persistido devuelve array vacío (evita `null`).
- **Línea 60–64**: intenta parsear el JSON; ante cualquier excepción (JSON corrupto o
  esquema antiguo) devuelve `[]` en lugar de romper la app. Es una degradación segura
  que, como efecto lateral, descarta silenciosamente colas corruptas.

### Bloque 6: métodos `remove` e `incrementRetry` (líneas 67–82)

```ts
  async remove(idempotencyKey: string): Promise<void> {
    const queue = await this.getAll();
    const filtered = queue.filter((q) => q.idempotencyKey !== idempotencyKey);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  },

  async incrementRetry(idempotencyKey: string): Promise<QueuedAlert | null> {
    const queue = await this.getAll();
    const index = queue.findIndex((q) => q.idempotencyKey === idempotencyKey);
    if (index === -1) return null;

    queue[index].retryCount += 1;
    queue[index].lastAttemptAt = Date.now();
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return queue[index];
  },
```

**Explicación de las líneas 67–82:**

- **Línea 67–71**: `remove` filtra la cola excluyendo el elemento cuya
  `idempotencyKey` coincide y persiste el resultado. Se usa al enviar con éxito o al
  descartar por agotar reintentos.
- **Línea 73**: `incrementRetry` busca por `idempotencyKey` y devuelve la alerta
  actualizada o `null` si no existe.
- **Línea 74–76**: lee la cola y localiza el índice; si no existe devuelve `null`.
- **Línea 78–79**: incrementa `retryCount` y sella `lastAttemptAt = Date.now()`. Ese
  sello es la base temporal sobre la que `process` aplica el backoff.
- **Línea 80**: persiste la cola mutada.
- **Línea 81**: devuelve el elemento actualizado (referencia del array local).

### Bloque 7: método `process` (líneas 84–119)

```ts
  async process(
    sendFn: (alert: QueuedAlert) => Promise<boolean>
  ): Promise<void> {
    const queue = await this.getAll();
    const now = Date.now();

    for (const alert of queue) {
      if (alert.retryCount >= MAX_RETRIES) {
        console.warn(`[AlertQueue] Alerta ${alert.id} alcanzó máximo de reintentos. Descartando.`);
        await this.remove(alert.idempotencyKey);
        continue;
      }

      const lastAttempt = alert.lastAttemptAt ?? 0;
      const delay = getBackoffDelay(alert.retryCount);
      if (now - lastAttempt < delay) continue;

      try {
        const success = await sendFn(alert);
        if (success) {
          console.log(`[AlertQueue] Alerta ${alert.id} enviada exitosamente.`);
          await this.remove(alert.idempotencyKey);
        } else {
          await this.incrementRetry(alert.idempotencyKey);
          console.warn(
            `[AlertQueue] Alerta ${alert.id} reintento ${alert.retryCount + 1}/${MAX_RETRIES}`
          );
        }
      } catch (error: any) {
        await this.incrementRetry(alert.idempotencyKey);
        console.error(
          `[AlertQueue] Error procesando alerta ${alert.id}: ${error?.message}`
        );
      }
    }
  },
```

**Explicación de las líneas 84–119:**

- **Línea 84–86**: `process` recibe como inyección `sendFn`, la función que realmente
  "envía" (por ejemplo, marcar el documento Firestore como `pending` para re-disparar
  la Cloud Function). La cola es agnóstica del canal de envío.
- **Línea 87–88**: lee la cola y fija `now` una sola vez para toda la pasada.
- **Línea 90**: itera sobre una copia deserializada de la cola (los cambios se
  persisten dentro de cada rama).
- **Línea 91–95**: si la alerta alcanzó `MAX_RETRIES` se descarta directamente con
  `remove` y `continue`; nunca llega a enviarse de nuevo.
- **Línea 97**: `lastAttempt` es 0 si nunca se intentó (`lastAttemptAt ?? 0`).
- **Línea 98**: calcula el retardo esperado según el número de reintentos acumulados.
- **Línea 99**: si aún no ha transcurrido el retardo desde el último intento, salta la
  alerta en esta pasada (no la reintenta). Una alerta recién encolada
  (`lastAttemptAt = null`) siempre se intenta de inmediato porque `now - 0` supera
  cualquier retardo.
- **Línea 101–117**: bloque de intento con `try/catch`:
  - **Línea 102**: ejecuta `sendFn`; un retorno `true` significa éxito confirmado.
  - **Línea 103–105**: ante éxito registra log y elimina la alerta de la cola.
  - **Línea 106–111**: ante `false` (fallo controlado) incrementa reintentos y avisa
    por consola con el contador `retryCount + 1/5` (usa el valor local previo al
    incremento, de ahí el `+1`).
  - **Línea 112–117**: ante excepción también incrementa reintentos y registra el
    error con su mensaje (acceso a `error?.message` con tipado `any`).
- Nota de diseño: `process` es una **cola pasiva**: no programa ella misma
  reintentos futuros; una alerta fallida solo se vuelve a intentar cuando algún
  llamador externo invoca `process` de nuevo tras el retardo (p. ej.
  `recoverIncompleteAlerts` al arrancar la app, o `retryFailed`).

### Bloque 8: métodos `clear` y `count` (líneas 121–129)

```ts
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },

  async count(): Promise<number> {
    const queue = await this.getAll();
    return queue.length;
  },
};
```

**Explicación de las líneas 121–129:**

- **Línea 121–123**: `clear` elimina la clave completa de `AsyncStorage`, dejando la
  cola vacía. Es la única vía de limpieza masiva (usada en los tests).
- **Línea 125–127**: `count` devuelve la cantidad de alertas encoladas leyendo la
  cola (no mantiene contador en memoria, por lo que es fiel al estado persistido).
- **Línea 129**: cierra el objeto `AlertQueue` exportado.

## Fichas de funciones y métodos

### `getBackoffDelay` (líneas 35–38)

- Firma: `function getBackoffDelay(attempt: number): number`.
- Propósito técnico: calcular el retardo de espera con crecimiento exponencial acotado
  y jitter aleatorio. Propósito funcional: espaciar reintentos para no saturar la red
  ni el backend.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `attempt` | `number` | Número de reintentos ya acumulados |

- Retorno: `number` con milisegundos de espera.
- Excepciones: ninguna (función pura).
- Dependencias: constantes `BASE_DELAY_MS` y `MAX_DELAY_MS`.
- Flujo: calcula `min(2000 * 2^attempt, 60000)` y suma `random() * 1000`.
- Efectos secundarios: ninguno.

### `AlertQueue.enqueue` (líneas 41–55)

- Firma: `async enqueue(alert: Omit<QueuedAlert, 'retryCount' | 'lastAttemptAt' | 'idempotencyKey'>): Promise<void>`.
- Propósito funcional: persistir una alerta pendiente con garantía de no duplicado.
- Parámetros: `alert` (datos de la alerta sin los campos gestionados por la cola).
- Retorno: `Promise<void>`; excepciones: puede propagar errores de `AsyncStorage`.
- Flujo: leer cola → calcular `idempotencyKey` → si existe, salir → empujar →
  persistir → log.
- Llamado desde: `AlertService.send` (línea 258, sin `await`).
- Efectos secundarios/riesgos: escritura en `AsyncStorage`; si falla, la alerta se
  pierde (el llamador no espera el resultado).

### `AlertQueue.getAll` (líneas 57–65)

- Firma: `async getAll(): Promise<QueuedAlert[]>`.
- Propósito: estado actual de la cola como base de todas las demás operaciones.
- Retorno: `QueuedAlert[]`; degradación a `[]` ante ausencia o JSON corrupto.
- Llamado desde: `enqueue`, `remove`, `incrementRetry`, `process`, `count` y los
  tests.

### `AlertQueue.remove` (líneas 67–71)

- Firma: `async remove(idempotencyKey: string): Promise<void>`.
- Propósito: eliminar la alerta identificada por su clave de idempotencia.
- Llamado desde: `process` (éxito y descarte por máximo de reintentos) y tests.

### `AlertQueue.incrementRetry` (líneas 73–82)

- Firma: `async incrementRetry(idempotencyKey: string): Promise<QueuedAlert | null>`.
- Propósito: registrar un intento fallido (contador + marca temporal).
- Retorno: alerta actualizada o `null` si no existe.
- Llamado desde: `process` (fallo controlado y excepción) y tests.

### `AlertQueue.process` (líneas 84–119)

- Firma: `async process(sendFn: (alert: QueuedAlert) => Promise<boolean>): Promise<void>`.
- Propósito funcional: recorrer la cola e intentar enviar las alertas cuyo retardo ya
  venció, descartando las agotadas.
- Parámetros: `sendFn`, inyección de la operación de envío real.
- Retorno: `Promise<void>`; excepciones: internamente capturadas por alerta (nunca
  abortan la pasada completa).
- Llamado desde: `recoverIncompleteAlerts` (línea 147 de AlertService), `retryFailed`
  (línea 314) y tests.
- Efectos secundarios: lecturas/escrituras de `AsyncStorage`, logs, eliminación de
  elementos, incremento de contadores.

### `AlertQueue.clear` (líneas 121–123) y `AlertQueue.count` (líneas 125–127)

- `clear`: vacía la cola eliminando `QUEUE_KEY` (usado en tests y en la limpieza de
  estados de los tests de `AlertService`).
- `count`: devuelve `queue.length` (usado en tests y para inspección).

## Clases / interfaces / tipos

### `QueuedAlert` (líneas 17–29)

- Responsabilidad: tipar el elemento persistido; contiene la información mínima para
  reintentar una alerta sin depender de Firestore (id, usuario, mensaje final,
  contactos con teléfono, ubicación opcional y metadatos de reintento).
- Campos: `id`, `userId`, `triggerWord`, `messageText`, `contacts`, `location`,
  `locationFailed`, `createdAt`, `retryCount`, `lastAttemptAt`, `idempotencyKey`
  (descritos en el bloque 2).
- Relaciones: `Omit` de esta interfaz es el parámetro de `enqueue`; es el argumento de
  `sendFn` de `process`.
- Ciclo de vida: se crea en `enqueue` con contadores en cero, madura en `process`/
  `incrementRetry` y se elimina con `remove`/`clear`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `AlertQueue` no exporta ni mantiene estado en memoria; todas
  las operaciones releen y reescriben el JSON completo bajo `QUEUE_KEY`. En
  operaciones concurrentes (p. ej. `enqueue` sin `await` desde `AlertService` y un
  `process` simultáneo) el patrón lectura-modificación-escritura sin bloqueo puede
  producir pérdida de escrituras (last-write-wins). Impacto potencial: bajo, por la
  baja concurrencia esperada; pero no hay garantía atómica.
- [OBSERVACIÓN TÉCNICA] `process` es una cola pasiva: no programa reintentos propios.
  Un elemento fallido solo se reintenta cuando se invoca `process` de nuevo (p. ej.
  al reiniciar la app o en `retryFailed`). Si la app permanece abierta tras un fallo
  de red, la alerta no se reintentará sola hasta la siguiente invocación.
- [OBSERVACIÓN TÉCNICA] El log de la línea 109 muestra `alert.retryCount + 1` usando
  el objeto local (previo al incremento persistido), por lo que el número mostrado es
  correcto, pero la lectura es confusa porque el estado persistido ya se incrementó.
- [OBSERVACIÓN TÉCNICA] `getAll` devuelve `[]` ante JSON corrupto, descartando
  silenciosamente la cola; no hay intento de migración ni log de advertencia.
- [OBSERVACIÓN TÉCNICA] La interfaz `QueuedAlert.location` es un subtipo estructural
  con solo `lat`/`lon`, mientras que en `AlertService` se origina desde
  `AlertLocation` (que incluye `accuracy`, `timestamp`, etc.); la información
  geográfica persistida en la cola es reducida.
- [NIVEL DE CERTEZA: Confirmado por código] Los reintentos permitidos son 5 intentos
  como máximo (retryCount 0–4), con retardos teóricos de 2/4/8/16/32 s más jitter.

## Seguridad

- [INFORMATIVO] La cola persiste en claro (sin cifrado) nombres y números de teléfono
  de contactos (`contacts`) y, cuando existen, coordenadas de ubicación
  (`location`). `AsyncStorage` de React Native no cifra por defecto; los datos quedan
  accesibles a quien tenga acceso físico al almacenamiento de la app o a un backup
  sin cifrar. Se trata de datos personales (DAMA-DMBOK) cuyo tratamiento debería
  considerarse en el modelo de privacidad.
- [BAJO] Los logs (`console.log`/`warn`/`error`) solo imprimen `alert.id` y mensajes
  genéricos; no se detecta fuga de teléfonos, coordenadas ni textos de alerta a
  consola.
- [INFORMATIVO] No hay autenticación, autorización ni validación de entrada en este
  módulo: es una cola local; la seguridad del envío real recae en el backend (Cloud
  Functions) y en Firestore.
- [INFORMATIVO] No se detectan secretos, claves ni tokens en este archivo.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Persistencia en claro de PII (teléfonos y coordenadas) en `AsyncStorage`:
  valorar cifrado del payload (p. ej. `react-native-keychain`/encrypted storage) o
  reducir el contenido persistido.
- [RIESGO] Pérdida de escritura por concurrencia lectura-modificación-escritura sin
  bloqueo; recomendable serializar las operaciones de la cola o usar una única
  instancia gestora.
- [RECOMENDACIÓN] Considerar un mecanismo de auto-programación de reintentos (timer o
  listener de conectividad) para no depender exclusivamente de invocaciones externas
  de `process`.
- [RECOMENDACIÓN] Añadir log/advertencia cuando `getAll` encuentre JSON corrupto para
  diagnosticar estados inconsistentes.
- [RECOMENDACIÓN] Ampliar la cobertura de tests: parseo corrupto de `getAll`,
  rama de retardo no vencido (línea 99) y fronteras de `MAX_RETRIES`.
