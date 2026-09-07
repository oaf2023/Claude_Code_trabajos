# Archivo: src/types/IAAnalysis.ts

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/types/IAAnalysis.ts |
| Líneas totales | 27 |
| Lenguaje | TypeScript 5.9 |
| Tamaño (bytes) | 860 |
| Categoría | Definición de tipos del análisis por IA de alertas |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define los tipos que representan el resultado del análisis por inteligencia artificial de
una alerta SOS (transcripción de audio, emoción detectada, nivel de urgencia, palabras
clave, ruido de fondo y acción recomendada), así como el envoltorio `IAProcessResult` con
el que el servicio de procesamiento informa el desenlace (éxito o fallo) por alerta.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. `IAAnalysis` e `IAProcessResult` se importan de forma real en
`src/services/IAProcessingService.ts` (línea 11), y `IAAnalysis` se enlaza con el campo
`iaAnalysis` de `Alert` (en `src/types/Alert.ts`). `UrgencyLevel` se usa internamente en
el mismo archivo.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna | — | — | — |

El archivo no importa nada; es autónomo y no depende de otros tipos.

## Componentes que dependen de este archivo

Referencias reales encontradas con búsqueda sobre el código fuente:

- `src/types/Alert.ts` (línea 11): importa `IAAnalysis` para el campo `iaAnalysis` de `Alert`.
- `src/services/IAProcessingService.ts` (línea 11): `import { IAAnalysis, IAProcessResult } from '../types/IAAnalysis'` — el método `processAlertAudio` devuelve `Promise<IAProcessResult>` (líneas 22 y 26).

## Variables globales y constantes

Ninguna: el archivo solo exporta tipos.

## Estructura (funciones / clases / tipos)

- Tipo unión (`export type`): `UrgencyLevel`.
- Interfaces (`export interface`): `IAAnalysis`, `IAProcessResult`.

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : IAAnalysis.ts
* Descripción     : Tipos e interfaces para el análisis de IA de alertas.
* Autor           : oafon
* Fecha           : 2026-03-21
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* ============================================================================ */
```

**Explicación de las líneas 1–8:**

- **Línea 1**: apertura del comentario de cabecera estándar del proyecto.
- **Líneas 2–7**: metadatos del archivo (autor `oafon`, fecha `2026-03-21`, versión
  `1.0.0`, TypeScript 5.9) y descripción.
- **Línea 8**: cierre de la cabecera.

```ts
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
```

**Explicación de la línea 10:**

- **Línea 10** (`export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';`):
  nivel de urgencia discreto con cuatro escalones: baja, media, alta y crítica.

```ts
export interface IAAnalysis {
  transcript?: string;
  detectedEmotion?: string;
  urgencyScore: number; // 0 to 1
  urgencyLevel: UrgencyLevel;
  keyKeywords: string[];
  backgroundNoiseContext?: string;
  recommendedAction?: string;
  processedAt: number;
}
```

**Explicación de las líneas 12–21:**

- **Línea 12**: apertura de `IAAnalysis`, resultado del análisis por IA de una alerta.
- **Líneas 13–14**: `transcript` y `detectedEmotion`, opcionales: transcripción del audio
  y emoción inferida.
- **Línea 15**: `urgencyScore`, obligatorio, puntuación continua de urgencia entre 0 y 1
  (el comentario lo aclara).
- **Línea 16**: `urgencyLevel`, obligatorio, nivel discreto derivado de la puntuación.
- **Línea 17**: `keyKeywords`, palabras clave detectadas (obligatorio; array, posiblemente
  vacío).
- **Líneas 18–19**: `backgroundNoiseContext` y `recommendedAction`, opcionales: contexto
  de ruido de fondo y acción recomendada por el modelo.
- **Línea 20**: `processedAt`, timestamp (época ms) del procesamiento.
- **Línea 21**: cierre de la interfaz.

```ts
export interface IAProcessResult {
  alertId: string;
  analysis: IAAnalysis;
  status: 'success' | 'failed';
}
```

**Explicación de las líneas 23–27:**

- **Línea 23**: apertura de `IAProcessResult`, resultado del procesamiento por alerta.
- **Línea 24**: `alertId`, identificador de la alerta procesada.
- **Línea 25**: `analysis`, objeto `IAAnalysis` (en caso de fallo el análisis puede quedar
  con valores por defecto, según la implementación del servicio).
- **Línea 26**: `status`, literal `'success' | 'failed'` que resume el desenlace.
- **Línea 27**: cierre de la interfaz.

## Fichas de funciones y métodos

El archivo no contiene funciones: es una declaración pura de tipos.

## Clases / interfaces / tipos

### Tipo unión `UrgencyLevel` (línea 10)

- Responsabilidad: cuantificar de forma discreta la urgencia de una alerta.
- Valores: `'low' | 'medium' | 'high' | 'critical'`.
- Relaciones: usado por `IAAnalysis.urgencyLevel`.

### Interfaz `IAAnalysis` (líneas 12–21)

| Campo | Tipo | Obligatorio | Uso real encontrado |
| --- | --- | --- | --- |
| transcript | string | No | Resultado de transcripción del audio de la alerta |
| detectedEmotion | string | No | Emoción inferida por el modelo |
| urgencyScore | number | Sí | Puntuación 0-1; consumida por `IAProcessingService` |
| urgencyLevel | UrgencyLevel | Sí | Nivel discreto; consumido por `IAProcessingService` |
| keyKeywords | string[] | Sí | Palabras clave detectadas |
| backgroundNoiseContext | string | No | Contexto sonoro |
| recommendedAction | string | No | Acción sugerida |
| processedAt | number | Sí | Timestamp del análisis |

- Responsabilidad: contrato del análisis por IA asociable a una alerta.
- Relaciones: embebida en `Alert.iaAnalysis` y en `IAProcessResult.analysis`.

### Interfaz `IAProcessResult` (líneas 23–27)

| Campo | Tipo | Obligatorio | Uso real encontrado |
| --- | --- | --- | --- |
| alertId | string | Sí | Devuelto por `IAProcessingService.processAlertAudio` |
| analysis | IAAnalysis | Sí | Ídem |
| status | 'success' \| 'failed' | Sí | Ídem |

- Responsabilidad: envolver el resultado del procesamiento de una alerta concreta.
- Relaciones: es el tipo de retorno de `IAProcessingService.processAlertAudio(userId, alertId, audioUrl)`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: en caso de `status: 'failed'` el campo `analysis` sigue siendo
  obligatorio; la implementación de `IAProcessingService` debe decidir qué devuelve en ese
  caso (p. ej. valores por defecto), porque el tipo no permite `analysis: null`.
- [NIVEL DE CERTEZA: Confirmado por código] para las importaciones verificadas en
  `IAProcessingService.ts`.

## Seguridad

- INFORMATIVO: `transcript` puede contener voz grabada del usuario y de terceros en una
  emergencia; es dato sensible cuya retención debe regirse por la política de privacidad.
  No hay secretos ni credenciales en este archivo.
- No se detectan hallazgos CRÍTICOS, ALTOS ni MEDIOS en este archivo de tipos.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: valorar un tipo discriminado (`IAProcessResult` con `analysis` opcional
  cuando `status` es `'failed'`) para que el fallo sea representable sin inventar un
  análisis.
- [RECOMENDACIÓN]: documentar la procedencia del análisis (Cloud Functions, proveedor
  externo) junto al tipo, para la trazabilidad exigida por la auditoría.
