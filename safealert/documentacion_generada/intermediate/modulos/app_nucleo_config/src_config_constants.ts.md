# Archivo: src/config/constants.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/config/constants.ts | 55 | TypeScript 5.9 | 1756 | Configuración / Constantes globales | FUNCIONALIDAD EXISTENTE (con subconjuntos legado) | Confirmado por código |

## Objetivo

Concentra constantes de configuración transversales de SafeAlert: nombre de la app,
temporizadores de la alerta, tiempos de GPS/localización, ubicación de respaldo para
desarrollo, sensibilidad del wake word, nombres de colecciones de Firestore, prefijos
de mensajes SMS y una paleta `COLORS` mantenida por compatibilidad hacia atrás.

La cabecera (v2.0.0, 2026-06-29) indica explícitamente que "los colores ahora se
importan desde theme/tokens", y de hecho el archivo importa `color` de
`../theme/tokens` y re-exporta derivados en `COLORS`.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — el grueso de las constantes es consumido por
servicios y pantallas (ver sección de dependientes). No obstante, hay dos elementos en
estado de código legado o sin uso aparente:

- `PORCUPINE_SENSITIVITY` (línea 28): sin referencias en el árbol fuente.
- `COLORS` (líneas 41-55): único consumidor detectado es `app/_layout.tsx.bak`, un
  archivo de respaldo (`.bak`) no activo; el resto del código usa los tokens de
  `src/theme/`.

[NIVEL DE CERTEZA: Confirmado por código] para el uso general; [NIVEL DE CERTEZA:
Altamente probable] para el no uso de `PORCUPINE_SENSITIVITY` y `COLORS` (búsqueda
grep en src/ y app/).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `color` de `../theme/tokens` | interna | Líneas 42-54 (alimenta los valores de COLORS) | Sí |

`color` es el objeto de tokens semánticos del design system (`danger`, `safe`,
`warning`, `neutral500`, `background`, `textPrimary`, `textSecondary`, `border`,
etc.). La relación es de dependencia de constants hacia tokens (no al revés).

## Componentes que dependen de este archivo

Consumidores detectados por grep en `src/` y `app/`:

| Archivo dependiente | Símbolos usados |
| --- | --- |
| src/services/AlertService.ts | SMS_PREFIX, SMS_TEST_PREFIX |
| src/services/AudioRecordingService.ts | AUDIO_RECORDING_SECONDS |
| src/services/LocationService.ts | Constantes de timing/ubicación (línea 23 del import, varias) |
| src/services/WakeWordService.ts | ALERT_COUNTDOWN_SECONDS |
| src/stores/useGuardStore.ts | ALERT_COUNTDOWN_SECONDS |
| app/bienvenida.tsx | COLLECTION_USERS |
| app/_layout.tsx.bak | COLORS (archivo de respaldo `.bak`, no activo) |

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| APP_NAME | 'SafeAlert' | string | Nombre público de la app | Potencialmente usado en UI (sin grep de uso adicional) |
| ALERT_COUNTDOWN_SECONDS | 3 | number | Segundos de cuenta regresiva pre-alerta | useGuardStore, WakeWordService |
| AUDIO_RECORDING_SECONDS | 60 | number | Duración de grabación de audio de alerta | AudioRecordingService |
| GPS_FRESH_FIX_TIMEOUT_MS | 8000 | number | Timeout para considerar un fix GPS fresco (ms) | LocationService |
| LOCATION_UPDATE_INTERVAL_MS | 300000 (5 min) | number | Intervalo de actualización de ubicación (ms) | LocationService |
| DEV_FALLBACK_LOCATION | { lat: -34.6037, lon: -58.3816, accuracy: 5000 } | object | Ubicación de respaldo para desarrollo (Buenos Aires) | LocationService |
| PORCUPINE_SENSITIVITY | 0.7 | number | Sensibilidad del wake word Porcupine (legado) | Ninguna detectada |
| COLLECTION_USERS | 'users' | string | Colección Firestore de usuarios | app/bienvenida.tsx |
| COLLECTION_CONTACTS | 'contacts' | string | Colección Firestore de contactos | Ninguna directa detectada (helpers de firebase.ts usan literales) |
| COLLECTION_ALERTS | 'alerts' | string | Colección Firestore de alertas | Ninguna directa detectada |
| COLLECTION_SETTINGS | 'settings' | string | Colección Firestore de ajustes | Ninguna directa detectada |
| SMS_PREFIX | '🚨 AVISO' | string | Prefijo de SMS de alerta real | AlertService |
| SMS_TEST_PREFIX | '🧪 PRUEBA' | string | Prefijo de SMS de prueba | AlertService |
| COLORS | Derivados de `color` de tokens + '#FFFFFF' | object | Paleta de compatibilidad hacia atrás | app/_layout.tsx.bak (no activo) |

[NOTA] Los literales `SMS_PREFIX` y `SMS_TEST_PREFIX` contienen emojis (sirena y
probeta) en el código original; aquí se conservan por fidelidad al valor exacto.

[OBSERVACIÓN TÉCNICA] `COLLECTION_*` y `PORCUPINE_SENSITIVITY` existen como
constantes, pero las operaciones Firestore reales de `src/config/firebase.ts`
(líneas 517-523) y de `AlertService`/`ContactsService` usan cadenas literales
('users', 'contacts', 'alerts', 'settings') en lugar de estas constantes; y la
sensibilidad operativa del wake word se lee de `features.ts`/`useSettingsStore`. Es
una duplicación de "fuente de verdad" de nombres de colección que puede derivar en
inconsistencias si se renombra una colección.

## Estructura (funciones / clases / tipos)

No exporta funciones, clases ni tipos. Solo constantes exportadas (ver tabla
anterior). Lógica presente: un único `import` y composición del objeto `COLORS`.

## Análisis línea por línea

**Bloque líneas 1-14 (cabecera e import + APP_NAME):**

```ts
/* ============================================================================
* Archivo         : constants.ts
* Descripción     : Constantes de configuración de SafeAlert.
*                   Los colores ahora se importan desde theme/tokens.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { APP_NAME, COLORS, ALERT_COUNTDOWN_SECONDS } from './constants'
* ============================================================================ */

import { color } from '../theme/tokens';

export const APP_NAME = 'SafeAlert';
```

**Explicación de las líneas 1-14:**
- **Líneas 1-10**: cabecera estándar del proyecto. Informa de que la v2.0.0 movió los
  colores a `theme/tokens`, clave para entender que `COLORS` es ahora un envoltorio de
  compatibilidad.
- **Línea 12** (`import { color } from '../theme/tokens';`): importa el objeto de
  tokens semánticos. Crea un acoplamiento config -> theme; el sentido habitual sería
  el inverso, pero aquí es intencional para alimentar `COLORS`.
- **Línea 14**: `APP_NAME = 'SafeAlert'`; nombre canónico de la aplicación.

**Bloque líneas 16-25 (temporizadores y ubicación):**

```ts
// Alert timing
export const ALERT_COUNTDOWN_SECONDS = 3;
export const AUDIO_RECORDING_SECONDS = 60;
export const GPS_FRESH_FIX_TIMEOUT_MS = 8000;
export const LOCATION_UPDATE_INTERVAL_MS = 5 * 60 * 1000;
export const DEV_FALLBACK_LOCATION = {
  lat: -34.6037,
  lon: -58.3816,
  accuracy: 5000,
};
```

**Explicación de las líneas 16-25:**
- **Línea 17**: cuenta regresiva de 3 segundos que da al usuario margen para cancelar
  una alerta accidental. Es un parámetro de seguridad operativa crítico; lo consumen
  `useGuardStore` (estado inicial) y `WakeWordService`/`AlertService` (lógica de
  cancelación).
- **Línea 18**: grabación de audio de la alerta de 60 segundos.
- **Línea 19**: 8 s como límite para considerar fresco un fix de GPS.
- **Línea 20**: actualización de ubicación cada 5 minutos (5 * 60 * 1000 ms).
- **Líneas 21-25**: `DEV_FALLBACK_LOCATION`, coordenadas de Buenos Aires
  (lat -34.6037, lon -58.3816) con precisión declarada de 5000 m, usada en desarrollo
  (p. ej. simulaciones de `LocationService`). No es dato sensible: es una ubicación
  pública y de respaldo para pruebas.

**Bloque líneas 27-38 (Porcupine y colecciones + SMS):**

```ts
// Porcupine
export const PORCUPINE_SENSITIVITY = 0.7;

// Firestore collections
export const COLLECTION_USERS = 'users';
export const COLLECTION_CONTACTS = 'contacts';
export const COLLECTION_ALERTS = 'alerts';
export const COLLECTION_SETTINGS = 'settings';

// SMS message format
export const SMS_PREFIX = '🚨 AVISO';
export const SMS_TEST_PREFIX = '🧪 PRUEBA';
```

**Explicación de las líneas 27-38:**
- **Línea 28**: sensibilidad 0.7 del wake word de Porcupine, librería que el proyecto
  ya no usa (ver análisis de `porcupine.ts`): constante huérfana.
- **Líneas 31-34**: nombres de las cuatro colecciones Firestore. La nomenclatura real
  de acceso usa subcolecciones por usuario (`users/{uid}/contacts`, etc., en
  `firebase.ts`); estas constantes solo se usan en `bienvenida.tsx`
  (`COLLECTION_USERS`). Las demás no tienen referencias directas.
- **Líneas 37-38**: prefijos de SMS. `AlertService` los antepone al cuerpo del SMS
  para distinguir alerta real de prueba. Contienen emojis (sirena/probeta) para
  llamar la atención del receptor.

**Bloque líneas 40-55 (COLORS):**

```ts
// Colores (backward compatibility — usar color tokens directamente)
export const COLORS = {
  danger: color.danger,
  dangerDark: color.dangerDark,
  dangerLight: color.dangerLight,
  safe: color.safe,
  safeLight: color.safeLight,
  warning: color.warning,
  warningLight: color.warningLight,
  neutral: color.neutral500,
  background: color.background,
  white: '#FFFFFF',
  text: color.textPrimary,
  textMuted: color.textSecondary,
  border: color.border,
};
```

**Explicación de las líneas 40-55:**
- **Línea 40**: el comentario declara la intención: compatibilidad hacia atrás y
  recomendación de usar los tokens directamente.
- **Líneas 41-55**: `COLORS` re-mapea tokens semánticos a nombres más cortos/antiguos
  (p. ej. `danger` -> `color.danger`, `neutral` -> `color.neutral500`, `text` ->
  `color.textPrimary`). Añade `white: '#FFFFFF'` como único literal propio. Su único
  consumidor detectado es `app/_layout.tsx.bak`, por lo que hoy es código de
  compatibilidad casi sin uso.

## Fichas de funciones y métodos

No aplica (no hay funciones).

## Clases / interfaces / tipos

No define clases ni interfaces. El tipo de `COLORS` y `DEV_FALLBACK_LOCATION` es
inferido. `DEV_FALLBACK_LOCATION` tiene forma `{ lat: number; lon: number;
accuracy: number }`, compatible con el tipo `AlertLocation` usado en stores.

## Observaciones técnicas

- `[POTENCIALMENTE NO UTILIZADO]` `PORCUPINE_SENSITIVITY`: sin referencias en
  src/app/iphone. Legado de la época Porcupine. [NIVEL DE CERTEZA: Altamente
  probable]
- `[POTENCIALMENTE NO UTILIZADO]` `COLORS`: solo lo consume `app/_layout.tsx.bak`
  (backup). [NIVEL DE CERTEZA: Altamente probable]
- `[OBSERVACIÓN TÉCNICA]` Duplicidad de nombres de colecciones: constantes
  `COLLECTION_*` coexisten con cadenas literales en `firebase.ts` y servicios.
- `[OBSERVACIÓN TÉCNICA]` `APP_NAME` sin consumidor verificado en las búsquedas
  realizadas (puede usarse vía import indirecto no cubierto o reservarse para uso
  futuro).
- `[NOTA]` Los prefijos SMS incluyen emojis; si el canal SMS destino no soporta
  Unicode (GSM-7), podrían degradarse a interrogaciones, afectando la claridad del
  mensaje.

## Seguridad

- `[INFORMATIVO]` `DEV_FALLBACK_LOCATION` no es un secreto; es una ubicación de
  pruebas. Riesgo operativo bajo: si un fallback de ubicación falsa se enviara en
  producción dentro de una alerta real, los contactos recibirían coordenadas erróneas.
  El grep de `LocationService` sugiere que se usa solo en modos de simulación/test.
- `[INFORMATIVO]` `SMS_PREFIX`/`SMS_TEST_PREFIX` son contenido de mensaje, no secretos.
- No se detectan credenciales, tokens, paths internos ni logging de secretos en este
  archivo.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo-medio: la duplicidad de nombres de colecciones (constantes vs
  literales) puede provocar escrituras en colecciones equivocadas si se renombra una
  constante sin actualizar los literales. Se recomienda unificar el acceso en
  `firebase.ts` usando las constantes.
- `[RECOMENDACIÓN]` Retirar `PORCUPINE_SENSITIVITY` y valorar el retiro de `COLORS`
  una vez que `app/_layout.tsx.bak` deje de existir, migrando cualquier consumo
  restante a `theme/tokens`.
- `[RECOMENDACIÓN]` Centralizar `APP_NAME` para su uso consistente en UI y notificaciones.
