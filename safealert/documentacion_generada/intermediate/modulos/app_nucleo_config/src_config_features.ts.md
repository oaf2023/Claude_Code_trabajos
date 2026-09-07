# Archivo: src/config/features.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/config/features.ts | 186 | TypeScript 5.9 | 7470 | Configuración / Feature flags y configuración operativa | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Centraliza los feature flags y la configuración operativa del MVP de SafeAlert.
Lee variables de entorno públicas de Expo (`EXPO_PUBLIC_*`) de forma estática (para
que Metro las incruste en tiempo de compilación) y exporta constantes derivadas con
valores por defecto, saneamiento y clamps defensivos. También expone un helper para
construir la ruta canónica de Firebase Storage de los audios de alerta.

La propia cabecera advierte de un punto crítico: las variables `EXPO_PUBLIC_*` se
incrustan en el APK, por lo que "ningún secreto debe residir aquí" y las claves
sensibles deben ir detrás de un backend proxy (Firebase Function).

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — consumido por servicios, componentes y pantallas
(ver dependientes). El flag `WAKE_WORD_ENABLED`, los tiempos, las URLs y los umbrales
derivados son la fuente operativa real del wake word, la guardia de audio, los pagos y
la ubicación en segundo plano.

Nota de estado de subelementos:
- `PAYMENTS_DISABLED_REASON` documenta una pausa temporal de pagos ("hasta terminar
  las pruebas funcionales"): estado declarado `DESHABILITADA` por configuración.
- El wake word está restringido a Android por `WAKE_WORD_FOREGROUND_ONLY` y por la
  lógica de `wakeWordBaseReason`.

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `Platform` de `react-native` | externa | Líneas 158 (comprobación `Platform.OS !== 'android'`) | Sí |

Se usa `Platform` únicamente para calcular `wakeWordBaseReason` (motivo por el que el
wake word queda deshabilitado en no-Android).

## Componentes que dependen de este archivo

Consumidores detectados por grep en `src/` y `app/`:

| Archivo dependiente | Símbolos usados |
| --- | --- |
| src/services/AudioAlertApiService.ts | Flags/URLs de guardia de audio remota |
| src/services/AudioRecordingService.ts | buildAlertAudioStoragePath |
| src/services/WakeWordService.ts | Flags del wake word y de guardia de audio |
| src/services/LocationService.ts | BACKGROUND_LOCATION_ENABLED |
| src/services/LocationApiClient.ts | PA_API_URL |
| src/services/PythonAnywhereSync.ts | PA_API_URL |
| src/services/PaymentService.ts | PA_API_URL |
| src/services/TrialService.ts | PA_API_URL, AUDIO_ALERT_API_KEY |
| src/services/PermissionsService.ts | BACKGROUND_LOCATION_ENABLED |
| src/components/PaymentModal.tsx | PAYMENTS_DEMO_ENABLED, PAYMENTS_ENABLED |
| app/contacts/[id].tsx | Flags (import parcial de líneas 30-40) |
| app/(tabs)/settings.tsx | WAKE_WORD_FOREGROUND_ONLY |
| app/permissions.tsx | BACKGROUND_LOCATION_ENABLED |
| app/_layout.tsx | AUTHENTICATION_TIMEOUT_MS |
| app/(tabs)/index.tsx | Flags del wake word |
| src/services/__tests__/LocationService.test.ts | BACKGROUND_LOCATION_ENABLED (con jest.mock del módulo) |

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| ENABLED_VALUES | Set de '1','true','yes','on' | Set<string> | Valores que se interpretan como boolean true en env | Interno (readBooleanEnv) |
| EXPO_PUBLIC_ENV | Objeto con 17 claves EXPO_PUBLIC_* | const object | Snapshot estático de process.env para Metro | Interno |
| AUTHENTICATION_TIMEOUT_MS | 8000 | number | Timeout de autenticación (ms) | app/_layout.tsx |
| WAKE_WORD_ENABLED | Flag booleano | boolean | Habilita la activación por voz | WakeWordService y pantallas |
| AUDIO_GUARD_ENABLED | Flag booleano | boolean | Habilita la guardia de audio | WakeWordService/AudioAlertApiService |
| PAYMENTS_ENABLED | Flag booleano | boolean | Habilita pagos | PaymentModal |
| PAYMENTS_DEMO_ENABLED | Flag booleano | boolean | Habilita el modo demo de pagos | PaymentModal |
| BACKGROUND_LOCATION_ENABLED | Flag booleano | boolean | Habilita ubicación en segundo plano | LocationService, PermissionsService, permissions.tsx |
| WAKE_WORD_LICENSE_KEY | [SECRETO OCULTO] | string | Licencia del motor de wake word | WakeWordService (indirecto) |
| AUDIO_ALERT_API_URL | URL o cadena vacía | string | Endpoint de la API de alerta por audio | AudioAlertApiService |
| AUDIO_ALERT_API_KEY | [SECRETO OCULTO] | string | Clave de la API de audio | TrialService/AudioAlertApiService |
| AUDIO_ALERT_LANGUAGE | 'es' | string | Idioma por defecto del audio | AudioAlertApiService |
| AUDIO_ALERT_THRESHOLD | Clamp 0-100; default 82 | number | Umbral de detección de audio | AudioAlertApiService |
| AUDIO_GUARD_CHUNK_MS | Min 1000; default 2000 | number | Tamaño de chunk de la guardia de audio (ms) | AudioRecordingService |
| WAKE_WORD_MODEL_NAME | 'wakeword_es.onnx' | string | Nombre del modelo ONNX del wake word | WakeWordService |
| WAKE_WORD_FOREGROUND_ONLY | true | boolean | El wake word solo opera en primer plano | app/(tabs)/settings.tsx |
| REMOTE_AUDIO_GUARD_CONFIGURED | Booleano derivado | boolean | true si AUDIO_GUARD_ENABLED y hay URL y API key | WakeWordService |
| WAKE_WORD_DISABLED_REASON | Cadena o '' | string | Motivo por el que el wake word está deshabilitado | WakeWordService, porcupine.ts (legado) |
| PAYMENTS_DISABLED_REASON | Cadena explicativa | string | Motivo de pausa de la pasarela de pagos | UI de pagos |
| PA_API_URL | Default 'https://oaf.pythonanywhere.com' | string | URL base del backend PythonAnywhere | PythonAnywhereSync, PaymentService, LocationApiClient, TrialService |

[SECRETO OCULTO] No se documentan los valores reales de `EXPO_PUBLIC_WAKE_WORD_LICENSE`,
`EXPO_PUBLIC_AUDIO_ALERT_API_KEY`, `EXPO_PUBLIC_PA_INTERNAL_KEY` ni
`EXPO_PUBLIC_PA_API_KEY`; solo su nombre y propósito. Estos valores viven en
variables de entorno de compilación (`.env`) y se incrustan en el bundle.

## Estructura (funciones / clases / tipos)

- `readBooleanEnv(name, fallback): boolean` — privada (líneas 47-57).
- `readStringEnv(name, fallback): string` — privada (líneas 70-80).
- `readNumberEnv(name, fallback): number` — privada (líneas 93-104).
- `buildAlertAudioStoragePath(userId, alertId): string` — exportada (líneas 181-185).
- Constantes exportadas derivadas (líneas 106-168).

## Análisis línea por línea

**Bloque líneas 1-16 (cabecera, import y Set de valores):**

```ts
/* ============================================================================
* Archivo         : features.ts
* Descripción     : Feature flags y utilidades de configuración operativa del MVP.
*                   ⚠️  Las variables EXPO_PUBLIC_* se incrustan en el APK.
*                   Ningún secreto debe residir aquí. Para claves sensibles,
*                   usar un backend proxy (Firebase Function) como intermediario.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : Importar flags y utilidades desde los servicios y pantallas.
* ============================================================================ */

import { Platform } from 'react-native';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
```

**Explicación de las líneas 1-16:**
- **Líneas 2-6**: advertencia de seguridad en el propio código: las `EXPO_PUBLIC_*`
  quedan incrustadas en el APK; las claves sensibles deben resolverse vía backend.
- **Línea 14**: import de `Platform` para condicionar el wake word por SO.
- **Línea 16**: conjunto de valores textuales aceptados como booleano verdadero al
  leer variables de entorno ('1', 'true', 'yes', 'on').

**Bloque líneas 18-34 (EXPO_PUBLIC_ENV):**

```ts
const EXPO_PUBLIC_ENV = {
  EXPO_PUBLIC_ENABLE_WAKE_WORD: process.env.EXPO_PUBLIC_ENABLE_WAKE_WORD,
  EXPO_PUBLIC_ENABLE_AUDIO_GUARD: process.env.EXPO_PUBLIC_ENABLE_AUDIO_GUARD,
  EXPO_PUBLIC_ENABLE_PAYMENTS: process.env.EXPO_PUBLIC_ENABLE_PAYMENTS,
  EXPO_PUBLIC_ENABLE_PAYMENTS_DEMO: process.env.EXPO_PUBLIC_ENABLE_PAYMENTS_DEMO,
  EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION:
    process.env.EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION,
  EXPO_PUBLIC_WAKE_WORD_LICENSE: process.env.EXPO_PUBLIC_WAKE_WORD_LICENSE,
  EXPO_PUBLIC_AUDIO_ALERT_API_URL: process.env.EXPO_PUBLIC_AUDIO_ALERT_API_URL,
  EXPO_PUBLIC_AUDIO_ALERT_API_KEY: process.env.EXPO_PUBLIC_AUDIO_ALERT_API_KEY,
  EXPO_PUBLIC_AUDIO_ALERT_LANGUAGE: process.env.EXPO_PUBLIC_AUDIO_ALERT_LANGUAGE,
  EXPO_PUBLIC_AUDIO_ALERT_THRESHOLD: process.env.EXPO_PUBLIC_AUDIO_ALERT_THRESHOLD,
  EXPO_PUBLIC_AUDIO_GUARD_CHUNK_MS: process.env.EXPO_PUBLIC_AUDIO_GUARD_CHUNK_MS,
  EXPO_PUBLIC_PA_API_URL: process.env.EXPO_PUBLIC_PA_API_URL,
  EXPO_PUBLIC_PA_INTERNAL_KEY: process.env.EXPO_PUBLIC_PA_INTERNAL_KEY,
  EXPO_PUBLIC_PA_API_KEY: process.env.EXPO_PUBLIC_PA_API_KEY,
} as const;
```

**Explicación de las líneas 18-34:**
- **Línea 18**: declara el objeto snapshot del entorno. Usar `as const` fija las
  claves como tipo literal, permitiendo a las funciones tipar el parámetro `name`
  como `keyof typeof EXPO_PUBLIC_ENV`.
- **Líneas 19-33**: cada propiedad lee una variable `process.env.EXPO_PUBLIC_*` en
  tiempo de módulo. Esta lectura "estática a nivel de top-level" es lo que permite a
  Metro sustituir los valores en el bundle (inyección de `EXPO_PUBLIC_*`).
  Propósito de cada una:
  - `ENABLE_WAKE_WORD`, `ENABLE_AUDIO_GUARD`, `ENABLE_PAYMENTS`,
    `ENABLE_PAYMENTS_DEMO`, `ENABLE_BACKGROUND_LOCATION`: flags booleanos de
    funcionalidad.
  - `WAKE_WORD_LICENSE`: clave de licencia del motor de voz.
  - `AUDIO_ALERT_API_URL` / `AUDIO_ALERT_API_KEY` / `AUDIO_ALERT_LANGUAGE` /
    `AUDIO_ALERT_THRESHOLD` / `AUDIO_GUARD_CHUNK_MS`: configuración del servicio
    remoto de guardia de audio.
  - `PA_API_URL` / `PA_INTERNAL_KEY` / `PA_API_KEY`: configuración del backend
    PythonAnywhere (pagos/telemetría).

**Bloque líneas 36-57 (readBooleanEnv):**

```ts
/* ============================================================================
* Función         : readBooleanEnv
* Descripción     : Lee flags públicos de Expo de forma estática para que Metro los incruste correctamente.
* Fecha           : 2026-03-28
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : WAKE_WORD_ENABLED, PAYMENTS_ENABLED, BACKGROUND_LOCATION_ENABLED
* Ingesta         : name: keyof typeof EXPO_PUBLIC_ENV, fallback: boolean
* Devolución      : boolean
* Uso             : readBooleanEnv('EXPO_PUBLIC_ENABLE_WAKE_WORD', false)
* ============================================================================ */
function readBooleanEnv(
  name: keyof typeof EXPO_PUBLIC_ENV,
  fallback: boolean
): boolean {
  const rawValue = EXPO_PUBLIC_ENV[name];
  if (!rawValue) {
    return fallback;
  }

  return ENABLED_VALUES.has(rawValue.trim().toLowerCase());
}
```

**Explicación de las líneas 36-57:**
- **Líneas 36-46**: docstring con conexiones, ingesta y devolución.
- **Línea 47-50**: firma tipada con `keyof typeof EXPO_PUBLIC_ENV`, que impide pasar
  nombres inexistentes.
- **Línea 51**: lectura del valor crudo desde el snapshot.
- **Líneas 52-54**: si no hay valor (undefined o cadena vacía) devuelve el fallback.
- **Línea 56**: normaliza (trim + minúsculas) y comprueba pertenencia al conjunto
  `ENABLED_VALUES`. Cualquier valor distinto ('0', 'false', 'off', texto raro)
  devuelve false.

**Bloque líneas 59-104 (readStringEnv y readNumberEnv):**

```ts
/* ============================================================================
* Función         : readStringEnv
* Descripción     : Lee valores string públicos de Expo con fallback seguro.
* Fecha           : 2026-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : AUDIO_ALERT_API_URL, AUDIO_ALERT_API_KEY, AUDIO_ALERT_LANGUAGE
* Ingesta         : name, fallback
* Devolución      : string
* Uso             : readStringEnv('EXPO_PUBLIC_AUDIO_ALERT_API_URL', '')
* ============================================================================ */
function readStringEnv(
  name: keyof typeof EXPO_PUBLIC_ENV,
  fallback: string
): string {
  const rawValue = EXPO_PUBLIC_ENV[name];
  if (!rawValue) {
    return fallback;
  }

  return rawValue.trim() || fallback;
}

/* ============================================================================
* Función         : readNumberEnv
* Descripción     : Lee valores numéricos públicos de Expo con límites defensivos.
* Fecha           : 2026-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : AUDIO_ALERT_THRESHOLD, AUDIO_GUARD_CHUNK_MS
* Ingesta         : name, fallback
* Devolución      : number
* Uso             : readNumberEnv('EXPO_PUBLIC_AUDIO_GUARD_CHUNK_MS', 2000)
* ============================================================================ */
function readNumberEnv(
  name: keyof typeof EXPO_PUBLIC_ENV,
  fallback: number
): number {
  const rawValue = EXPO_PUBLIC_ENV[name];
  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}
```

**Explicación de las líneas 59-104:**
- **Líneas 70-80** (`readStringEnv`): devuelve el valor recortado o el fallback si
  queda vacío. Evita cadenas con espacios accidentales.
- **Líneas 93-104** (`readNumberEnv`): convierte con `Number()`; si el resultado no
  es finito (NaN, Infinity) devuelve el fallback. La protección de rango (clamps) se
  aplica en los consumidores exportados, no aquí.

**Bloque líneas 106-152 (flags derivados):**

```ts
export const AUTHENTICATION_TIMEOUT_MS = 8000;
export const WAKE_WORD_ENABLED = readBooleanEnv(
  'EXPO_PUBLIC_ENABLE_WAKE_WORD',
  false
);
export const AUDIO_GUARD_ENABLED = readBooleanEnv(
  'EXPO_PUBLIC_ENABLE_AUDIO_GUARD',
  false
);
export const PAYMENTS_ENABLED = readBooleanEnv(
  'EXPO_PUBLIC_ENABLE_PAYMENTS',
  false
);
export const PAYMENTS_DEMO_ENABLED = readBooleanEnv(
  'EXPO_PUBLIC_ENABLE_PAYMENTS_DEMO',
  false
);
export const BACKGROUND_LOCATION_ENABLED = readBooleanEnv(
  'EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION',
  false
);
export const WAKE_WORD_LICENSE_KEY =
  EXPO_PUBLIC_ENV.EXPO_PUBLIC_WAKE_WORD_LICENSE?.trim() || '';
export const AUDIO_ALERT_API_URL = readStringEnv(
  'EXPO_PUBLIC_AUDIO_ALERT_API_URL',
  ''
);
export const AUDIO_ALERT_API_KEY = readStringEnv(
  'EXPO_PUBLIC_AUDIO_ALERT_API_KEY',
  ''
);
export const AUDIO_ALERT_LANGUAGE = readStringEnv(
  'EXPO_PUBLIC_AUDIO_ALERT_LANGUAGE',
  'es'
);
export const AUDIO_ALERT_THRESHOLD = Math.min(
  100,
  Math.max(0, readNumberEnv('EXPO_PUBLIC_AUDIO_ALERT_THRESHOLD', 82))
);
export const AUDIO_GUARD_CHUNK_MS = Math.max(
  1000,
  readNumberEnv('EXPO_PUBLIC_AUDIO_GUARD_CHUNK_MS', 2000)
);
export const WAKE_WORD_MODEL_NAME = 'wakeword_es.onnx';
export const WAKE_WORD_FOREGROUND_ONLY = true;
export const REMOTE_AUDIO_GUARD_CONFIGURED =
  AUDIO_GUARD_ENABLED && !!AUDIO_ALERT_API_URL && !!AUDIO_ALERT_API_KEY;
```

**Explicación de las líneas 106-152:**
- **Línea 106**: timeout de autenticación de 8 s (usado por `app/_layout.tsx`).
- **Líneas 107-126**: los cinco flags booleanos, todos con fallback `false` (opt-in
  por configuración). El valor real depende de las variables de entorno de build.
- **Línea 127-128**: `WAKE_WORD_LICENSE_KEY`; valor [SECRETO OCULTO]. Se recorta y
  cae a cadena vacía si no está definida.
- **Líneas 129-136**: URL y API key del servicio de audio; valor de la API key
  [SECRETO OCULTO]. Defecto '' (vacío).
- **Líneas 137-140**: idioma de audio por defecto 'es'.
- **Líneas 141-144**: umbral de audio recortado al rango [0, 100] con `Math.min/max`,
  default 82. El clamp garantiza que un valor de entorno corrupto no produzca un
  umbral imposible.
- **Líneas 145-148**: chunk de guardia de audio con mínimo defensivo de 1000 ms,
  default 2000 ms (evita chunks absurdamente cortos).
- **Línea 149**: nombre del modelo ONNX del wake word en español.
- **Línea 150**: el wake word solo se usa en foreground (flag fijo true).
- **Líneas 151-152**: flag derivado: la guardia de audio remota se considera
  configurada solo si el flag está activo y existen URL y API key no vacías.

**Bloque líneas 154-168 (razones de deshabilitación y PA_API_URL):**

```ts
const wakeWordBaseReason = REMOTE_AUDIO_GUARD_CONFIGURED
  ? null
  : !WAKE_WORD_ENABLED
    ? 'La activación por voz está desactivada por configuración.'
    : Platform.OS !== 'android'
      ? 'La activación por voz quedó habilitada solo para Android en esta etapa.'
      : null;

export const WAKE_WORD_DISABLED_REASON = wakeWordBaseReason || '';
export const PAYMENTS_DISABLED_REASON =
  'La pasarela de pagos está pausada temporalmente hasta terminar las pruebas funcionales.';
export const PA_API_URL = readStringEnv(
  'EXPO_PUBLIC_PA_API_URL',
  'https://oaf.pythonanywhere.com'
);
```

**Explicación de las líneas 154-168:**
- **Líneas 154-160**: lógica anidada para calcular el motivo de indisponibilidad del
  wake word. Prioridad: si la guardia de audio remota está configurada, el wake word
  local no aplica (null); si el flag está apagado, motivo de configuración; si la
  plataforma no es Android, motivo de plataforma. En caso contrario null (disponible).
- **Línea 162**: exporta la razón, con '' si no hay motivo (wake word operativo).
- **Líneas 163-164**: razón fija de pago pausado: la pasarela está detenida hasta
  finalizar pruebas funcionales. Texto visible al usuario.
- **Líneas 165-168**: URL base del backend PythonAnywhere con fallback
  'https://oaf.pythonanywhere.com' (URL pública de despliegue, no un secreto).

**Bloque líneas 170-186 (buildAlertAudioStoragePath):**

```ts
/* ============================================================================
* Función         : buildAlertAudioStoragePath
* Descripción     : Construye la ruta canónica de Storage para audios de alerta.
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : AudioRecordingService, cleanupOldAlerts, storage.rules
* Ingesta         : userId: string, alertId: string
* Devolución      : string
* Uso             : buildAlertAudioStoragePath(userId, alertId)
* ============================================================================ */
export function buildAlertAudioStoragePath(
  userId: string,
  alertId: string
): string {
  return `users/${userId}/alerts/${alertId}/voice.m4a`;
}
```

**Explicación de las líneas 170-186:**
- **Líneas 181-185**: construye la ruta canónica de Firebase Storage:
  `users/{userId}/alerts/{alertId}/voice.m4a`. La ruta debe estar alineada con las
  reglas de `storage.rules` del proyecto (el docstring menciona la conexión con
  `cleanupOldAlerts` y `storage.rules`). La usa `AudioRecordingService` al subir el
  audio de la alerta. Formato m4a consistente con la grabación del dispositivo.

## Fichas de funciones y métodos

### readBooleanEnv (líneas 47-57)

- Firma: `function readBooleanEnv(name: keyof typeof EXPO_PUBLIC_ENV, fallback: boolean): boolean`
- Propósito técnico: saneamiento de booleanos de entorno. Propósito funcional: decidir
  si un feature flag está activo.
- Parámetros: `name` (clave del snapshot de entorno), `fallback` (valor si ausente).
- Retorno: boolean. Excepciones: ninguna (siempre devuelve un valor).
- Dependencias: `EXPO_PUBLIC_ENV`, `ENABLED_VALUES`. La llaman las exportaciones de
  flags. Efectos secundarios: ninguno. Riesgos: bajo.

### readStringEnv (líneas 70-80)

- Firma: `function readStringEnv(name: keyof typeof EXPO_PUBLIC_ENV, fallback: string): string`
- Propósito: lectura segura de cadenas de entorno recortando espacios.
- Retorno: string. Excepciones: ninguna. Riesgo: bajo.

### readNumberEnv (líneas 93-104)

- Firma: `function readNumberEnv(name: keyof typeof EXPO_PUBLIC_ENV, fallback: number): number`
- Propósito: lectura numérica con validación de finitud.
- Retorno: number. Excepciones: ninguna.
- Riesgo: sin rango acotado aquí; los clamps se aplican en el exportador (umbral y
  chunk), lo que es correcto pero debe recordarse al añadir nuevos números.

### buildAlertAudioStoragePath (líneas 181-185)

- Firma: `export function buildAlertAudioStoragePath(userId: string, alertId: string): string`
- Propósito técnico: ruta canónica de Storage. Funcional: ubicación del audio de voz
  de cada alerta.
- Parámetros: `userId` (uid de Firebase), `alertId` (id de la alerta).
- Retorno: `users/{userId}/alerts/{alertId}/voice.m4a`.
- Dependencias: ninguna externa. La llama `AudioRecordingService`. Debe mantenerse en
  sincronía con las reglas de `storage.rules` (permisos por path).
- Efectos secundarios: ninguno. Riesgo: si cambia la estructura de reglas de Storage,
  los audios podrían quedar ilegibles o no subibles.

## Clases / interfaces / tipos

- Tipo implícito del objeto `EXPO_PUBLIC_ENV` (as const) usado como clave tipada en
  las tres funciones de lectura. No hay interfaces ni clases.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` Los flags derivados se evalúan una sola vez al cargar el
  módulo (constantes top-level): cambiar una variable de entorno en caliente no
  surte efecto; es un comportamiento esperado con Expo.
- `[OBSERVACIÓN TÉCNICA]` `PAYMENTS_ENABLED` coexiste con `PAYMENTS_DISABLED_REASON`:
  si el flag estuviera activo y la razón mostrándose a la vez, habría mensajes
  contradictorios en UI. Hoy la razón es fija, asumiendo pagos pausados.
- `[OBSERVACIÓN TÉCNICA]` `TrialService` importa `AUDIO_ALERT_API_KEY` (clave
  [SECRETO OCULTO] incrustada en el cliente) para llamadas de prueba; ver sección de
  seguridad.
- `[OBSERVACIÓN TÉCNICA]` `WAKE_WORD_MODEL_NAME` ('wakeword_es.onnx') es un nombre de
  modelo embebido que debe existir como recurso del paquete react-native-wakeword;
  si el recurso no está presente, la activación fallará en runtime (verificación no
  realizada en este análisis).

## Seguridad

- `[ALTO]` Claves embebidas en el cliente: `WAKE_WORD_LICENSE_KEY`,
  `AUDIO_ALERT_API_KEY` y las claves del backend PythonAnywhere
  (`PA_INTERNAL_KEY`, `PA_API_KEY`, definidas como `EXPO_PUBLIC_*`) quedan
  incrustadas en el APK/bundle web. Cualquier atacante puede extraerlas del binario.
  El propio archivo lo advierte y recomienda un backend proxy.
- `[MEDIO]` El uso de una `PA_INTERNAL_KEY` (nombre que sugiere clave interna de
  servidor a servidor) como variable `EXPO_PUBLIC_` es especialmente delicado: una
  clave interna expuesta en cliente permitiría llamadas privilegiadas al backend.
- `[INFORMATIVO]` No se imprimen secretos a logs en este archivo. Los valores
  sensibles no se registran.
- `[BAJO]` El flag por defecto `false` para funcionalidades sensibles (wake word,
  audio, pagos, ubicación en segundo plano) es una postura segura por defecto.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Alto: exposición de claves en el APK. [RECOMENDACIÓN] Mover las claves
  de backend (PA_INTERNAL_KEY, PA_API_KEY) fuera de `EXPO_PUBLIC_*` y resolverlas
  exclusivamente desde Cloud Functions/backend; si es imprescindible mantener una
  clave en cliente, rotarla y limitar su alcance.
- `[RIESGO]` Medio: `PA_API_URL` apunta a PythonAnywhere (dominio externo no
  controlado por Firebase). Si ese servicio se compromete o cambia de dominio, la app
  depende de un tercero. [RECOMENDACIÓN] Revisar la política de seguridad del backend
  y considerar mover la funcionalidad a Cloud Run/Firebase.
- `[RECOMENDACIÓN]` Mantener la sincronía entre `buildAlertAudioStoragePath` y
  `storage.rules`; añadir un test que valide la ruta generada.
