# Archivo: src/types/Alert.ts

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/types/Alert.ts |
| Líneas totales | 71 |
| Lenguaje | TypeScript 5.9 |
| Tamaño (bytes) | 1934 |
| Categoría | Definición de tipos del dominio de alertas SOS y ubicaciones |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define el modelo de datos central del dominio de alertas SOS de SafeAlert: los estados
posibles de una alerta (`AlertStatus`, `SMSStatus`), la clasificación de origen y
permisos de ubicación (`LocationSource`, `PermissionStatusValue`), la estructura de
una ubicación (`AlertLocation`), el contacto destinatario de una alerta (`AlertContact`)
y el documento raíz de alerta (`Alert`) que se persiste en Firestore. Según su cabecera,
fue "ampliado con clasificación de origen del Prompt Maestro", es decir, los campos
opcionales de trazabilidad (`source`, `permissionStatus`, `altitude`, `speed`,
`direction`, `address`) responden al Prompt Maestro de auditoría de ubicaciones.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Los tipos se importan de forma real en al menos 5 archivos del
proyecto (servicios, store y pantalla), por lo que la definición tipográfica está viva y
conectada.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `IAAnalysis` desde `./IAAnalysis` | interna (tipo) | Campo opcional `iaAnalysis` de la interfaz `Alert` | Sí |

## Componentes que dependen de este archivo

Referencias reales encontradas con búsqueda sobre el código fuente:

- `app/(tabs)/history.tsx` (línea 23): `import { Alert } from '../../src/types/Alert'` — tipado del historial de alertas.
- `src/stores/useGuardStore.ts` (línea 15): `import { Alert as AppAlert, AlertLocation } from '../types/Alert'`.
- `src/services/AlertService.ts` (línea 13): `import { Alert as AppAlert, AlertContact } from '../types/Alert'` — construye `alertData: Omit<AppAlert, 'id'>` para Firestore (líneas 231-250).
- `src/services/AlertStateMachine.ts` (línea 16): `import { AlertLocation, AlertContact } from '../types/Alert'` — contexto de la máquina de estados de la alerta.
- `src/services/LocationService.ts` (línea 16): `import { AlertLocation, LocationSource, PermissionStatusValue } from '../types/Alert'` — produce ubicaciones tipadas (p. ej. `source: 'MANUAL'`, `permissionStatus: 'NO_SOLICITADO'` en la línea 248).

## Variables globales y constantes

Ninguna: el archivo solo exporta tipos (`export type` / `export interface`), que no generan
valores en runtime.

## Estructura (funciones / clases / tipos)

- Tipos unión (`export type`): `AlertStatus`, `SMSStatus`, `LocationSource`, `PermissionStatusValue`.
- Interfaces (`export interface`): `AlertLocation`, `AlertContact`, `Alert`.

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : Alert.ts
* Descripción     : Tipos e interfaces del dominio de alertas SOS y ubicaciones.
*                   Ampliado con clasificación de origen del Prompt Maestro.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* ============================================================================ */
```

**Explicación de las líneas 1–9:**

- **Línea 1**: apertura del comentario de cabecera estándar del proyecto.
- **Líneas 2–8**: identificación del archivo (nombre, descripción, autor `oafon`, fecha
  `2026-07-30`, versión `2.0.0`, lenguaje TypeScript 5.9). La descripción indica que la
  clasificación de origen procede del Prompt Maestro de auditoría.
- **Línea 9**: cierre del bloque de cabecera.

```ts
import { IAAnalysis } from './IAAnalysis';
```

**Explicación de la línea 11:**

- **Línea 11** (`import { IAAnalysis } from './IAAnalysis';`): importa la interfaz de
  análisis por IA definida en `src/types/IAAnalysis.ts`, que se enlaza opcionalmente a la
  alerta. Solo aporta tipos (sin valor en runtime).

```ts
export type AlertStatus = 'pending' | 'sent' | 'partial' | 'failed';
export type SMSStatus = 'pending' | 'sent' | 'failed';

export type LocationSource = 'GPS' | 'NAVEGADOR' | 'IP' | 'MANUAL';

export type PermissionStatusValue =
  | 'GRANTED'
  | 'DENIED'
  | 'PROMPT'
  | 'NO_DISPONIBLE'
  | 'NO_SOLICITADO'
  | 'ERROR';
```

**Explicación de las líneas 13–24:**

- **Línea 13** (`export type AlertStatus = 'pending' | 'sent' | 'partial' | 'failed';`):
  estado global de una alerta: pendiente de envío, enviada, envío parcial (parte de los
  contactos falló) o fallida. El valor `'pending'` se usa como estado inicial en
  `AlertService.ts` (línea 248: `status: 'pending'`).
- **Línea 14**: `SMSStatus` limita el estado de cada SMS a `'pending' | 'sent' | 'failed'`.
- **Línea 16**: `LocationSource` clasifica el origen de la ubicación: GPS nativo,
  NAVEGADOR (geolocalización web), IP o MANUAL (confirmación por dirección del usuario).
- **Líneas 18–24**: `PermissionStatusValue` modela el estado del permiso de ubicación
  reportable: otorgado, denegado, prompt pendiente, no disponible en la plataforma, no
  solicitado o error. El valor `'NO_SOLICITADO'` se usa en `LocationService.ts` (línea 248).

```ts
export interface AlertLocation {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
  isStale?: boolean;
  staleMinutes?: number;
  /** Prompt Maestro: clasificación de origen obligatoria */
  source?: LocationSource;
  /** Prompt Maestro: estado del permiso de ubicación */
  permissionStatus?: PermissionStatusValue;
  /** Altitud en metros */
  altitude?: number;
  /** Velocidad en m/s */
  speed?: number;
  /** Rumbo en grados */
  direction?: number;
  /** Dirección confirmada (para origen MANUAL) */
  address?: string;
}
```

**Explicación de las líneas 26–45:**

- **Línea 26**: apertura de `AlertLocation`, estructura de la ubicación adjunta a la alerta.
- **Líneas 27–30**: campos obligatorios de coordenadas: `lat`, `lon`, `accuracy`
  (precisión en metros) y `timestamp` (época ms). En `AlertService.ts` el fallback
  (ubicación no disponible) usa `lat: 0, lon: 0, accuracy: 0` (líneas 235-242).
- **Líneas 31–32**: `isStale` y `staleMinutes`, opcionales, permiten indicar que la
  posición es antigua. Son consumidos por `MessageFormatter.format` para anotar el enlace
  de mapas y por `AlertService` (`location?.isStale`, `location?.staleMinutes`, líneas 217-218).
- **Líneas 33–36**: comentarios y campos del Prompt Maestro: `source` (obligatoria según
  el comentario, aunque tipada opcional) y `permissionStatus`.
- **Líneas 37–42**: metadatos del GPS en unidades SI: altitud (m), velocidad (m/s) y
  rumbo en grados.
- **Líneas 43–44**: `address`, dirección confirmada que solo aplica al origen `MANUAL`
  (usada en `LocationService.setManualLocation`, línea 249).

```ts
export interface AlertContact {
  name: string;
  phone: string;
  smsStatus: SMSStatus;
  provider?: string | null;
  providerMessageId?: string | null;
  attempts?: number;
  lastError?: string | null;
}
```

**Explicación de las líneas 47–55:**

- **Línea 47**: apertura de `AlertContact`, destinatario concreto dentro de la alerta.
- **Líneas 48–49**: `name` y `phone` del contacto (teléfono en E.164, ver
  `src/types/Contact.ts` y `src/utils/formatPhone.ts`).
- **Línea 50**: `smsStatus` con tipo `SMSStatus` (obligatorio); se actualiza a medida que
  el envío avanza.
- **Líneas 51–52**: `provider` y `providerMessageId`, opcionales y anulables, guardan el
  proveedor SMS y el id devuelto por este para trazabilidad.
- **Línea 53**: `attempts`, número de reintentos realizados.
- **Línea 54**: `lastError`, último error del envío (opcional, anulable).

```ts
export interface Alert {
  id: string;
  userId: string;
  triggeredAt: number;
  triggerWord: string;
  location: AlertLocation;
  mapsLink: string;
  audioUrl: string | null;
  audioPath?: string | null;
  messageTemplate: string;
  contacts: AlertContact[];
  status: AlertStatus;
  iaAnalysis?: IAAnalysis;
  isTest?: boolean;
}
```

**Explicación de las líneas 57–71:**

- **Línea 57**: apertura de `Alert`, el documento raíz de una alerta SOS.
- **Línea 58**: `id`, identificador (id de documento Firestore asignado en
  `AlertService.ts`, línea 253: `const alertId = ref.id`).
- **Línea 59**: `userId`, propietario de la alerta.
- **Líneas 60–61**: `triggeredAt` (época ms) y `triggerWord` (palabra que disparó la alerta).
- **Líneas 62–63**: `location` (`AlertLocation`) y `mapsLink` (enlace de mapas generado).
- **Líneas 64–65**: `audioUrl` (obligatorio, anulable) y `audioPath` (opcional) del audio grabado.
- **Línea 66**: `messageTemplate`, texto final del mensaje enviado (en la práctica
  `AlertService` guarda el mensaje ya formateado, línea 246: `messageTemplate: finalMessage`).
- **Línea 67**: `contacts`, lista de `AlertContact[]`.
- **Línea 68**: `status` con tipo `AlertStatus`.
- **Línea 69**: `iaAnalysis`, análisis por IA opcional (`IAAnalysis`).
- **Línea 70**: `isTest`, marca de alerta de prueba (usada por el prefijo `SMS_TEST_PREFIX`).

## Fichas de funciones y métodos

El archivo no contiene funciones: es una declaración pura de tipos sin emisión en runtime.

## Clases / interfaces / tipos

### Tipo unión `AlertStatus` (línea 13)

- Responsabilidad: estados globales posibles de una alerta.
- Valores: `'pending' | 'sent' | 'partial' | 'failed'`.

### Tipo unión `SMSStatus` (línea 14)

- Responsabilidad: estados de envío de cada SMS individual.
- Valores: `'pending' | 'sent' | 'failed'`.

### Tipo unión `LocationSource` (línea 16)

- Responsabilidad: clasificar el origen de la ubicación.
- Valores: `'GPS' | 'NAVEGADOR' | 'IP' | 'MANUAL'`.
- Relaciones: usado por `AlertLocation.source` y por `src/types/Location.ts` (payload de telemetría).

### Tipo unión `PermissionStatusValue` (líneas 18–24)

- Responsabilidad: estado reportable del permiso de ubicación.
- Valores: `'GRANTED' | 'DENIED' | 'PROMPT' | 'NO_DISPONIBLE' | 'NO_SOLICITADO' | 'ERROR'`.

### Interfaz `AlertLocation` (líneas 26–45)

| Campo | Tipo | Obligatorio | Uso real encontrado |
| --- | --- | --- | --- |
| lat | number | Sí | Lectura en `LocationService.buildMapsLink` (línea 256); fallback `lat: 0` en `AlertService` (línea 236) |
| lon | number | Sí | Ídem (`lon: 0` en fallback de `AlertService`, línea 237) |
| accuracy | number | Sí | `0` en fallback de `AlertService` (línea 238) y en `setManualLocation` (`LocationService`, línea 244) |
| timestamp | number | Sí | `Date.now()` en creación de ubicaciones (líneas 239 y 245) |
| isStale | boolean | No | `AlertService` línea 217 y `MessageFormatter.format` para anotar "(ubicación de hace N min)" |
| staleMinutes | number | No | `AlertService` línea 218 y `MessageFormatter.format` |
| source | LocationSource | No (el comentario dice obligatoria) | `'MANUAL'` asignado en `LocationService.setManualLocation` (línea 247) |
| permissionStatus | PermissionStatusValue | No | `'NO_SOLICITADO'` en `LocationService.setManualLocation` (línea 248) |
| altitude | number | No | Sin asignación confirmada en el código consultado |
| speed | number | No | Sin asignación confirmada en el código consultado |
| direction | number | No | Sin asignación confirmada en el código consultado |
| address | string | No | `LocationService.setManualLocation` (parámetro `address`, línea 249) |

- Relaciones: embebida en `Alert.location`. Su estructura alimenta el payload de
  `src/types/Location.ts` para la API de telemetría.
- Ciclo de vida: creada por `LocationService`, persistida dentro del documento `Alert`.

### Interfaz `AlertContact` (líneas 47–55)

| Campo | Tipo | Obligatorio | Uso real encontrado |
| --- | --- | --- | --- |
| name | string | Sí | Construcción de `alertContacts` en `AlertService` |
| phone | string | Sí | Ídem; teléfono E.164 normalizado |
| smsStatus | SMSStatus | Sí | Estado de entrega por contacto |
| provider | string \| null | No | Proveedor SMS (trazabilidad) |
| providerMessageId | string \| null | No | Id del mensaje en el proveedor |
| attempts | number | No | Contador de reintentos |
| lastError | string \| null | No | Último error de envío |

- Relaciones: agregada en `Alert.contacts: AlertContact[]`; consumida por
  `AlertStateMachine` y `AlertService`.

### Interfaz `Alert` (líneas 57–71)

| Campo | Tipo | Obligatorio | Uso real encontrado |
| --- | --- | --- | --- |
| id | string | Sí | Asignado con `ref.id` de Firestore en `AlertService` (línea 253) |
| userId | string | Sí | `alertData.userId` en `AlertService` (línea 232) |
| triggeredAt | number | Sí | `Date.now()` (línea 233) |
| triggerWord | string | Sí | `triggerWord` de la transición (línea 234) |
| location | AlertLocation | Sí | Objeto de `LocationService` o fallback sin coordenadas (líneas 235-242) |
| mapsLink | string | Sí | `LocationService.buildMapsLink(location)` (líneas 210-212) |
| audioUrl | string \| null | Sí | `null` inicial en `AlertService` (línea 244) |
| audioPath | string \| null | No | `null` inicial (línea 245) |
| messageTemplate | string | Sí | Guarda el `finalMessage` formateado (línea 246) |
| contacts | AlertContact[] | Sí | `buildAlertContacts(contacts)` (líneas 213, 247) |
| status | AlertStatus | Sí | `'pending'` inicial (línea 248) |
| iaAnalysis | IAAnalysis | No | Vinculado tras el análisis de IA (`IAProcessingService`) |
| isTest | boolean | No | `isTest` de la invocación (línea 249) |

- Relaciones: se importa en `history.tsx`, `useGuardStore.ts`, `AlertService.ts`.
- Ciclo de vida: se crea en `AlertService.triggerAlert`, se persiste en Firestore y se lee
  en el historial.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: el comentario de la línea 33 afirma que `source` es
  "clasificación de origen obligatoria", pero el campo está tipado como opcional
  (`source?: LocationSource`). La contradicción entre comentario y tipo puede permitir
  alertas sin origen clasificado, debilitando la telemetría del Prompt Maestro. Archivo:
  `src/types/Alert.ts`, líneas 33-34.
- [OBSERVACIÓN TÉCNICA]: en `AlertService.ts` el fallback de ubicación (líneas 235-242)
  crea una `AlertLocation` con `lat: 0, lon: 0`; los consumidores que interpreten esas
  coordenadas como posición real podrían enviar mapas apuntando al golfo de Guinea. Es un
  riesgo de dominio que depende de que `mapsLink` quede vacío (línea 210-212: `mapsLink`
  es `''` si no hay ubicación).
- [NIVEL DE CERTEZA: Confirmado por código] para los campos con asignación verificada;
  los marcados "Sin asignación confirmada" tienen [NIVEL DE CERTEZA: No determinado]
  dentro de los archivos analizados en este módulo.

## Seguridad

- INFORMATIVO: el tipo `Alert` incluye `phone` de terceros (contactos) y coordenadas
  precisas; al ser un contrato de datos de Firestore, la política de reglas de seguridad
  del backend debe restringir el acceso por `userId`. No hay secretos en este archivo.
- No se detectan hallazgos CRÍTICOS, ALTOS ni MEDIOS en este archivo de tipos.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: decidir si `source` es obligatorio (alinear el tipo con el comentario)
  o corregir el comentario, para garantizar la trazabilidad exigida por el Prompt Maestro.
- [RECOMENDACIÓN]: documentar formalmente el significado de `lat/lon = 0` como
  "ubicación no disponible" y garantizar que ningún flujo genere un `mapsLink` a partir de
  ese fallback (hoy `AlertService` ya lo evita dejando `mapsLink` vacío).
- [RECOMENDACIÓN]: considerar tipar `location` como `AlertLocation | null` en lugar de
  crear un objeto centinela con coordenadas 0, para que el estado "sin ubicación" sea
  explícito en el modelo.
