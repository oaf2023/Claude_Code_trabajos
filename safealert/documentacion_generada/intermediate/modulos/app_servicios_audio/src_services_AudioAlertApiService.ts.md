# Archivo: src/services/AudioAlertApiService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/AudioAlertApiService.ts | 193 | TypeScript 5.9 | 7049 | Servicio de red (cliente HTTP de audio) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Cliente HTTP del lado del cliente móvil con dos responsabilidades diferenciadas:

1. **Detección remota de alerta por voz**: envía fragmentos cortos de audio grabados por `AudioRecordingService.recordSnippet()` a una API externa (identificada por `AUDIO_ALERT_API_URL`) que transcribe y compara contra palabras de activación ("ayuda", "socorro", etc.) con coincidencia exacta y difusa. Es el motor del "modo guardia remoto" orquestado por `WakeWordService`.
2. **Subida de grabación de seguridad**: sincroniza la grabación completa de 1 minuto de una alerta (generada por `AudioRecordingService.recordAndUpload()` y ya subida a Firebase Storage) hacia el backend de PythonAnywhere (`PA_API_URL` + endpoint `/api/security/upload-recording`).

En resumen: la subida del mensaje de voz de emergencia se hace a **Firebase Storage** (ver `AudioRecordingService.recordAndUpload`); este servicio NO sube el audio principal a Firebase sino que (a) consulta un backend de análisis de audio y (b) replica la grabación de seguridad a **PythonAnywhere** (backend Flask externo).

## Clasificación y estado

`FUNCIONALIDAD EXISTENTE` — El servicio está importado y conectado en producción por dos consumidores reales:

- `WakeWordService.ts` (líneas 24, 260 y 493): `isConfigured()` y `detectAlertFromFile()` alimentan el bucle de guardia remota por chunks.
- `AlertService.ts` (líneas 24 y 284): `uploadSecurityRecording()` se dispara tras una alerta cuando `settings.audioEnabled` es verdadero.
- `src/services/__tests__/AlertService.test.ts` (líneas 43-44): el servicio se mockea en pruebas unitarias.

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `AUDIO_ALERT_API_KEY` (desde `../config/features`) | interna | Cabecera `X-API-Key` en ambos `fetch` (líneas 110 y 181) | Sí |
| `AUDIO_ALERT_API_URL` (desde `../config/features`) | interna | Endpoint de detección remota (línea 107) | Sí |
| `AUDIO_ALERT_LANGUAGE` (desde `../config/features`) | interna | Campo `language` del FormData de detección (línea 101) | Sí |
| `AUDIO_ALERT_THRESHOLD` (desde `../config/features`) | interna | Campo `threshold` del FormData de detección (línea 102) | Sí |
| `PA_API_URL` (desde `../config/features`) | interna | Endpoint `/api/security/upload-recording` (línea 177) | Sí |
| `REMOTE_AUDIO_GUARD_CONFIGURED` (desde `../config/features`) | interna | `isConfigured()` (línea 73) y guarda de `detectAlertFromFile` (línea 91) | Sí |
| `DeviceService` (desde `./DeviceService`) | interna | `getDeviceUniqueId()` para nombrar la grabación (línea 159) | Sí |

Nota: la API key usada para autenticar contra PythonAnywhere es la misma `AUDIO_ALERT_API_KEY` (clave de la API de audio), no `EXPO_PUBLIC_PA_API_KEY`/`EXPO_PUBLIC_PA_INTERNAL_KEY` definidas también en `features.ts`. [OBSERVACIÓN TÉCNICA]

## Componentes que dependen de este archivo

- `src/services/WakeWordService.ts` — importa el objeto (línea 24) y lo usa en `shouldUseRemoteAudioGuard()` (línea 260) y `runRemoteAudioGuardLoop()` (línea 493).
- `src/services/AlertService.ts` — importa el objeto (línea 24) y lo usa en `send()` (línea 284) para replicar la grabación a PythonAnywhere.
- `src/services/__tests__/AlertService.test.ts` — lo mockea (líneas 43-44) y verifica interacciones (línea 239).

## Variables globales y constantes

No define constantes propias; consume las exportadas por `src/config/features.ts`:

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `AUDIO_ALERT_API_URL` | Variable de entorno `EXPO_PUBLIC_AUDIO_ALERT_API_URL` (valor concreto [SECRETO OCULTO]) | string | URL base de la API de análisis de audio | Línea 107 |
| `AUDIO_ALERT_API_KEY` | Variable de entorno `EXPO_PUBLIC_AUDIO_ALERT_API_KEY` ([SECRETO OCULTO]) | string | Clave de API usada como `X-API-Key` en ambos endpoints | Líneas 110, 150, 181 |
| `AUDIO_ALERT_LANGUAGE` | Default `'es'` (env `EXPO_PUBLIC_AUDIO_ALERT_LANGUAGE`) | string | Idioma del transcriptor remoto | Línea 101 |
| `AUDIO_ALERT_THRESHOLD` | Default `82`, acotado 0-100 (env `EXPO_PUBLIC_AUDIO_ALERT_THRESHOLD`) | number | Umbral de confianza para la detección remota | Línea 102 |
| `PA_API_URL` | Default `https://oaf.pythonanywhere.com` (env `EXPO_PUBLIC_PA_API_URL`) | string | Base del backend PythonAnywhere | Líneas 150, 177 |
| `REMOTE_AUDIO_GUARD_CONFIGURED` | `AUDIO_GUARD_ENABLED && !!AUDIO_ALERT_API_URL && !!AUDIO_ALERT_API_KEY` | boolean | Flag que activa el modo guardia remoto | Líneas 73, 91 |

Valores mágicos: `'guard-snippet.m4a'` (nombre fijo del archivo de detección, línea 98), `'audio/m4a'` (MIME fijo, línea 99), `'60'` (duración declarada de la grabación de seguridad, línea 174), `slice(0, 36)` (acotación del id de dispositivo, línea 161).

## Estructura (funciones / clases / tipos)

- Interfaces: `AudioAlertApiDiffMatch` (líneas 21-25), `AudioAlertApiResponse` (líneas 27-36), `AudioAlertDetectionResult` (exportada, líneas 38-44).
- Funciones privadas del módulo: `normalizeMatches` (líneas 46-48), `resolveMatchedKeyword` (líneas 50-58).
- Objeto exportado `AudioAlertApiService` (líneas 60-192) con métodos: `isConfigured` (72-74), `detectAlertFromFile` (87-130), `uploadSecurityRecording` (144-192).

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : AudioAlertApiService.ts
* Descripción     : Cliente HTTP para detección remota de alertas por audio.
* Autor           : oafon
* Fecha           : 2026-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AudioAlertApiService.detectAlertFromFile(uri, keywords)
* ============================================================================ */

import {
  AUDIO_ALERT_API_KEY,
  AUDIO_ALERT_API_URL,
  AUDIO_ALERT_LANGUAGE,
  AUDIO_ALERT_THRESHOLD,
  PA_API_URL,
  REMOTE_AUDIO_GUARD_CONFIGURED,
} from '../config/features';
import { DeviceService } from './DeviceService';
```

**Explicación de las líneas 1–19:**

Cabecera documental obligatoria del proyecto (autor, fecha, versión) y bloque de importaciones. Todos los valores de configuración provienen de `features.ts`, que lee variables `EXPO_PUBLIC_*` incrustadas en el bundle de Expo.

- **Línea 11-18**: importa desde `../config/features` los flags y valores de la API de audio remoto y la URL de PythonAnywhere. `AUDIO_ALERT_API_KEY` y `AUDIO_ALERT_API_URL` son datos de configuración; su valor real procede de variables de entorno (`[SECRETO OCULTO]`).
- **Línea 19**: importa `DeviceService` (react-native-device-info) para obtener un identificador estable del equipo en la subida de grabación de seguridad.

```ts
interface AudioAlertApiDiffMatch {
  token: string;
  keyword: string;
  score: number;
}

interface AudioAlertApiResponse {
  ok: boolean;
  alerta_detectada?: boolean;
  texto_normalizado?: string;
  texto_crudo?: string;
  coincidencias_exactas?: string[];
  coincidencias_difusas?: AudioAlertApiDiffMatch[];
  mejor_match?: AudioAlertApiDiffMatch | null;
  detail?: string;
}

export interface AudioAlertDetectionResult {
  alertDetected: boolean;
  transcript: string;
  matchedKeyword: string | null;
  exactMatches: string[];
  fuzzyMatches: AudioAlertApiDiffMatch[];
}
```

**Explicación de las líneas 21–44:**

Contrato de datos con el backend remoto de análisis de audio (nombres de campo en español, lo que indica un backend propio en Flask/IA).

- **Líneas 21-25**: `AudioAlertApiDiffMatch` representa una coincidencia difusa devuelta por el servidor: el token detectado, la keyword a la que se aproxima y una puntuación `score`.
- **Líneas 27-36**: `AudioAlertApiResponse` modela la respuesta JSON del servidor: `ok` global, `alerta_detectada`, textos normalizado/crudo del transcriptor, listas de coincidencias exactas y difusas, mejor match y `detail` para errores.
- **Líneas 38-44**: `AudioAlertDetectionResult` es la respuesta normalizada que el servicio devuelve a `WakeWordService` (interfaz exportada y pública del servicio).

```ts
function normalizeMatches(matches: string[] | undefined): string[] {
  return (matches || []).map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function resolveMatchedKeyword(response: AudioAlertApiResponse): string | null {
  const exactMatches = normalizeMatches(response.coincidencias_exactas);
  if (exactMatches.length > 0) {
    return exactMatches[0];
  }

  const fuzzyKeyword = response.mejor_match?.keyword?.trim().toLowerCase();
  return fuzzyKeyword || null;
}
```

**Explicación de las líneas 46–58:**

Helpers puros de normalización de la respuesta.

- **Línea 47**: `normalizeMatches` recorta espacios, pasa a minúsculas y descarta entradas vacías. Protege contra listas `undefined` y normaliza a minúsculas para comparar con las palabras configuradas (que en `useSettingsStore` están en minúsculas).
- **Línea 51**: normaliza las coincidencias exactas recibidas.
- **Líneas 52-54**: prioriza la primera coincidencia exacta como keyword detectada.
- **Líneas 56-57**: si no hay coincidencia exacta, usa la keyword del `mejor_match` difuso; devuelve `null` si tampoco existe.

```ts
export const AudioAlertApiService = {
  /* ============================================================================
  * Función         : isConfigured
  * Descripción     : Indica si la configuración remota de guardia por audio está disponible.
  * Fecha           : 2026-03-30
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : WakeWordService
  * Ingesta         : Sin argumentos
  * Devolución      : boolean
  * Uso             : AudioAlertApiService.isConfigured()
  * ============================================================================ */
  isConfigured(): boolean {
    return REMOTE_AUDIO_GUARD_CONFIGURED;
  },
```

**Explicación de las líneas 60–74:**

Declaración del objeto singleton exportado y su primer método.

- **Líneas 60-71**: cabecera documental del método según la convención del proyecto.
- **Líneas 72-74**: `isConfigured()` devuelve el flag estático `REMOTE_AUDIO_GUARD_CONFIGURED` (requiere `AUDIO_GUARD_ENABLED`, URL y API key definidas). Determina si `WakeWordService` activa el modo de guardia remota por chunks.

```ts
  /* ============================================================================
  * Función         : detectAlertFromFile
  * Descripción     : Envía un audio local al backend remoto y normaliza la detección.
  * Fecha           : 2026-03-30
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : WakeWordService, API PythonAnywhere
  * Ingesta         : fileUri, keywords
  * Devolución      : Promise<AudioAlertDetectionResult>
  * Uso             : await AudioAlertApiService.detectAlertFromFile(uri, ['ayuda'])
  * ============================================================================ */
  async detectAlertFromFile(
    fileUri: string,
    keywords: string[]
  ): Promise<AudioAlertDetectionResult> {
    if (!this.isConfigured()) {
      throw new Error('La API remota de guardia por audio no está configurada.');
    }

    const payload = new FormData();
    payload.append('archivo', {
      uri: fileUri,
      name: 'guard-snippet.m4a',
      type: 'audio/m4a',
    } as any);
    payload.append('language', AUDIO_ALERT_LANGUAGE);
    payload.append('threshold', String(AUDIO_ALERT_THRESHOLD));
    if (keywords.length > 0) {
      payload.append('keywords', keywords.join(','));
    }
```

**Explicación de las líneas 76–105:**

Inicio de `detectAlertFromFile`, que envía un fragmento de audio local al backend remoto de análisis.

- **Línea 87-90**: firma con `fileUri` (URI del chunk grabado) y `keywords` (palabras de activación configuradas por el usuario).
- **Líneas 91-93**: si el flag de configuración es falso, lanza error explícito (protección para no llamar a una API no configurada).
- **Línea 95**: crea `FormData` multipart para el POST.
- **Líneas 96-100**: adjunta el archivo con nombre fijo `guard-snippet.m4a` y tipo `audio/m4a`. El cast `as any` es necesario porque el objeto `{uri, name, type}` es la convención de archivo de React Native para `FormData` (no tipada en el estándar DOM). [NOTA] El MIME se fuerza a `audio/m4a` aunque el chunk de `recordSnippet` usa el preset `HIGH_QUALITY` de expo-av, que puede generar otra extensión según plataforma.
- **Línea 101**: campo `language` con el idioma configurado (default `es`).
- **Línea 102**: campo `threshold` como string (umbral de confianza 0-100, default 82).
- **Líneas 103-105**: si hay keywords, se envían separadas por coma en un único campo.

```ts
    const response = await fetch(AUDIO_ALERT_API_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': AUDIO_ALERT_API_KEY,
        Accept: 'application/json',
      },
      body: payload,
    });

    const responseText = await response.text();
    const data = JSON.parse(responseText) as AudioAlertApiResponse;

    if (!response.ok || !data.ok) {
      throw new Error(data.detail || 'La API remota rechazó el análisis del audio.');
    }

    return {
      alertDetected: Boolean(data.alerta_detectada),
      transcript: data.texto_normalizado?.trim() || data.texto_crudo?.trim() || '',
      matchedKeyword: resolveMatchedKeyword(data),
      exactMatches: normalizeMatches(data.coincidencias_exactas),
      fuzzyMatches: data.coincidencias_difusas || [],
    };
  },
```

**Explicación de las líneas 107–130:**

Llamada HTTP y normalización de la respuesta.

- **Líneas 107-114**: `fetch` POST a `AUDIO_ALERT_API_URL`. Autenticación por cabecera estática `X-API-Key` con el valor de `AUDIO_ALERT_API_KEY` ([SECRETO OCULTO]). [RIESGO] No hay `timeout` ni `AbortController`: si el servidor no responde, el bucle de guardia remota de `WakeWordService` quedaría bloqueado en este `await` sin límite.
- **Líneas 116-117**: lee el cuerpo como texto y lo parsea con `JSON.parse`. [RIESGO] Un cuerpo no JSON (proxy HTML, error 502) lanzaría una excepción de parseo no controlada; el `catch` de `runRemoteAudioGuardLoop` lo tratará como error transitorio y reintentará.
- **Líneas 119-121**: considera error si el HTTP no es `ok` o si el payload indica `ok: false`; usa `data.detail` si existe.
- **Líneas 123-129**: construye el resultado tipado. `alertDetected` se obtiene con `Boolean(...)`. El transcripto prioriza `texto_normalizado` sobre `texto_crudo`. `matchedKeyword` resuelve coincidencias exactas/difusas. Devuelve también las listas crudas de coincidencias para la UI.

```ts
  /* ============================================================================
  * Función         : uploadSecurityRecording
  * Descripción     : Sincroniza la grabación de seguridad de 1 minuto con PythonAnywhere.
  *                   Nombre del archivo: {deviceUniqueId}_{timestamp}.m4a
  * Fecha           : 2026-04-09
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : AlertService, PythonAnywhere Backend, DeviceService
  * Ingesta         : fileUri: string, alertId: string, userId: string
  * Devolución      : Promise<boolean>
  * Uso             : await AudioAlertApiService.uploadSecurityRecording(uri, id, user)
  * ============================================================================ */
  async uploadSecurityRecording(
    fileUri: string,
    alertId: string,
    userId: string
  ): Promise<boolean> {
    try {
      if (!PA_API_URL || !AUDIO_ALERT_API_KEY) {
        return false;
      }

      // Detectar extensión real del archivo generado por expo-av
      const ext = fileUri.split('.').pop()?.toLowerCase() ?? 'm4a';
      const allowedExt = ['m4a', 'mp4', 'aac', 'wav', 'caf'].includes(ext) ? ext : 'm4a';

      // Obtener identificador único del equipo con fallback seguro
      const deviceId = (await DeviceService.getDeviceUniqueId().catch(() => 'unknown'))
        .replace(/[^a-zA-Z0-9_\-]/g, '_')
        .slice(0, 36);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename  = `${deviceId}_${timestamp}.${allowedExt}`;

      const payload = new FormData();
      payload.append('archivo', {
        uri: fileUri,
        name: filename,
        type: `audio/${allowedExt}`,
      } as any);
      payload.append('alertId', alertId);
      payload.append('userId', userId);
      payload.append('duration', '60');
      payload.append('filename', filename);
```

**Explicación de las líneas 132–176:**

Inicio de `uploadSecurityRecording`, que replica la grabación de seguridad de 1 minuto hacia el backend PythonAnywhere.

- **Línea 144-148**: firma con `fileUri`, `alertId` y `userId`. Envuelto en `try/catch` para nunca propagar error (fallo silencioso con retorno `false`).
- **Líneas 150-152**: si faltan `PA_API_URL` o la API key, aborta con `false` sin lanzar excepción.
- **Líneas 154-156**: detecta la extensión real del archivo generado por expo-av (p. ej. `m4a`, `caf`) y la restringe a una lista blanca (`m4a`, `mp4`, `aac`, `wav`, `caf`); cualquier otra cae a `m4a`. Evita inyección por nombre de archivo.
- **Líneas 158-161**: obtiene el id único del equipo con `DeviceService.getDeviceUniqueId()`. Si falla usa `'unknown'`. Sanea el id permitiendo solo alfanuméricos, guion y guion bajo, y lo trunca a 36 caracteres (compatibilidad con nombres de archivo).
- **Líneas 163-164**: timestamp ISO con `:` y `.` reemplazados por `-` y truncado a 19 caracteres (formato `YYYY-MM-DDTHH-MM-SS`); construye el nombre `{deviceId}_{timestamp}.{ext}`.
- **Líneas 166-171**: FormData con el archivo usando el nombre y MIME reales detectados.
- **Líneas 172-175**: campos `alertId`, `userId`, `duration` fijo `'60'` (segundos) y `filename`. [OBSERVACIÓN TÉCNICA] Envía `userId` y `alertId` como campos de formulario a un backend externo sin cifrado en tránsito adicional (solo TLS) y sin verificación de que `userId` corresponda a la sesión autenticada en este método (la verificación ocurrió antes, en `AudioRecordingService.recordAndUpload`, no aquí).

```ts
      const endpoint = `${PA_API_URL}/api/security/upload-recording`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-API-Key': AUDIO_ALERT_API_KEY,
          Accept: 'application/json',
        },
        body: payload,
      });

      return response.ok;
    } catch (error) {
      console.warn('[AudioAlertApiService] Fallo al subir grabación a PythonAnywhere:', error);
      return false;
    }
  },
};
```

**Explicación de las líneas 177–193:**

Llamada HTTP final y manejo de errores de `uploadSecurityRecording`.

- **Línea 177**: endpoint `${PA_API_URL}/api/security/upload-recording`. `PA_API_URL` apunta por defecto a PythonAnywhere (`https://oaf.pythonanywhere.com`) aunque `features.ts` documenta que el backend Flask administrativo se despliega en Cloud Run; ambos coexisten. [NIVEL DE CERTEZA: Altamente probable] este endpoint vive en el despliegue PythonAnywhere (existe `src/services/PythonAnywhereSync.ts` en el proyecto).
- **Líneas 178-185**: POST multipart con la misma cabecera `X-API-Key` de la API de audio. [OBSERVACIÓN TÉCNICA] Se reutiliza `AUDIO_ALERT_API_KEY` como credencial del backend PythonAnywhere en lugar de una clave segregada (`features.ts` define `EXPO_PUBLIC_PA_API_KEY` y `EXPO_PUBLIC_PA_INTERNAL_KEY` para ese backend).
- **Línea 187**: el resultado es solo el `response.ok` HTTP (no valida el cuerpo JSON).
- **Líneas 188-191**: ante cualquier error (red, servidor, parseo) registra `console.warn` y devuelve `false`. La subida a PythonAnywhere es best-effort: nunca rompe el flujo de alerta.

## Fichas de funciones y métodos

### isConfigured (líneas 72–74)

- Firma (código original): `isConfigured(): boolean { return REMOTE_AUDIO_GUARD_CONFIGURED; }`
- Propósito técnico: exponer el flag estático de configuración de guardia remota.
- Propósito funcional: permitir a `WakeWordService` decidir entre motor nativo y guardia remota por chunks.
- Parámetros: ninguno. Retorno: `boolean`. Excepciones: ninguna.
- Dependencias: `REMOTE_AUDIO_GUARD_CONFIGURED` de `features.ts`.
- Desde dónde se llama: `WakeWordService.shouldUseRemoteAudioGuard()` (línea 260) e indirectamente en `WakeWordService.start()` y `startDetection()`.
- Efectos secundarios y riesgos: ninguno. Depende de variables de entorno incrustadas en el bundle en tiempo de compilación.

### detectAlertFromFile (líneas 87–130)

- Firma (código original): `async detectAlertFromFile(fileUri: string, keywords: string[]): Promise<AudioAlertDetectionResult>`
- Propósito técnico: enviar un fragmento de audio local a la API remota y normalizar la respuesta a un contrato tipado.
- Propósito funcional: detectar si el usuario pronunció una palabra de activación en el chunk grabado (transcripción + coincidencia exacta/difusa en el servidor).
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `fileUri` | string | URI local del chunk de audio (de `recordSnippet`) |
| `keywords` | string[] | Palabras de activación configuradas por el usuario |

- Retorno: `Promise<AudioAlertDetectionResult>` (resuelve siempre si el servidor responde OK; lanza `Error` si no configurado o rechazado). Excepciones: error de configuración, error HTTP, `detail` del servidor, error de parseo JSON.
- Dependencias: `AUDIO_ALERT_API_URL`, `AUDIO_ALERT_API_KEY`, `AUDIO_ALERT_LANGUAGE`, `AUDIO_ALERT_THRESHOLD`, helpers `normalizeMatches`/`resolveMatchedKeyword`.
- Flujo interno: validar configuración → construir FormData → `fetch` POST con `X-API-Key` → leer y parsear texto → validar `ok` → normalizar resultado.
- Desde dónde se llama: `WakeWordService.runRemoteAudioGuardLoop()` (línea 493) en cada iteración del bucle de guardia remota.
- Efectos secundarios y riesgos: consume datos del plan de datos del usuario en cada chunk (2 s de audio ≈ una llamada por iteración); sin timeout la promesa puede quedar colgada. El audio del usuario (voz, posiblemente conversaciones de fondo) se transmite a un servidor externo: riesgo de privacidad si no hay consentimiento explícito informado. [RIESGO]

### uploadSecurityRecording (líneas 144–192)

- Firma (código original): `async uploadSecurityRecording(fileUri: string, alertId: string, userId: string): Promise<boolean>`
- Propósito técnico: subir la grabación de seguridad de 1 minuto al backend PythonAnywhere con nombre estable por dispositivo y timestamp.
- Propósito funcional: copia de respaldo externa de la grabación de voz de una alerta, además de la copia en Firebase Storage.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `fileUri` | string | URI local de la grabación (la misma subida a Firebase por `recordAndUpload`) |
| `alertId` | string | Identificador Firestore de la alerta |
| `userId` | string | Identificador Firebase del usuario |

- Retorno: `Promise<boolean>` (nunca lanza; `false` ante cualquier fallo). Excepciones: todas capturadas.
- Dependencias: `PA_API_URL`, `AUDIO_ALERT_API_KEY`, `DeviceService`.
- Flujo interno: validar configuración → detectar/sanear extensión → obtener y sanear device id → construir timestamp y nombre → FormData → POST → `response.ok`.
- Desde dónde se llama: `AlertService.send()` (línea 284), dentro de la promesa de `recordAndUpload` cuando `settings.audioEnabled` es verdadero y el audio se subió a Firebase.
- Efectos secundarios y riesgos: envía `userId`, `alertId` y el id del dispositivo (huella del equipo) a un tercero; no valida respuesta JSON; falla en silencio (solo log).

## Clases / interfaces / tipos

- `AudioAlertApiDiffMatch` (líneas 21-25): no exportada. Describe una coincidencia difusa: `token` (texto detectado), `keyword` (palabra de referencia) y `score` (confianza). Solo lectura de respuesta.
- `AudioAlertApiResponse` (líneas 27-36): no exportada. Contrato de respuesta JSON del backend de análisis de audio. Campos opcionales para tolerar variantes del servidor.
- `AudioAlertDetectionResult` (líneas 38-44): exportada. Contrato público consumido por `WakeWordService` y potencialmente por la UI para mostrar el transcripto oído.
- Objeto `AudioAlertApiService` (líneas 60-192): singleton de métodos; no hay estado interno (sin campos), por lo que no hay ciclo de vida.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Línea 150/181: se reutiliza `AUDIO_ALERT_API_KEY` (clave de la API de análisis de audio) como `X-API-Key` del backend PythonAnywhere en `uploadSecurityRecording`, pese a que `features.ts` define claves PA específicas (`EXPO_PUBLIC_PA_API_KEY`, `EXPO_PUBLIC_PA_INTERNAL_KEY`). Impacto: acoplamiento de credenciales entre dos backends distintos; rotar una afecta al otro.
- [OBSERVACIÓN TÉCNICA] Líneas 107 y 178: los `fetch` no tienen timeout. Impacto: en el bucle de guardia remota (`runRemoteAudioGuardLoop`) una respuesta lenta o colgada deja la guardia "escuchando" sin avanzar; no hay `AbortController`.
- [OBSERVACIÓN TÉCNICA] Línea 117: `JSON.parse` directo sobre el texto de respuesta; respuestas no JSON del servidor (errores de proxy/CDN) lanzan excepción no controlada, tratada aguas arriba como error transitorio.
- [OBSERVACIÓN TÉCNICA] Línea 187: `uploadSecurityRecording` devuelve solo `response.ok` sin inspeccionar el cuerpo; un 200 con error de negocio (p. ej. cuota llena) se considera éxito.
- [OBSERVACIÓN TÉCNICA] Líneas 96-100/166-171: cast `as any` sobre el objeto de archivo de FormData (convención React Native no tipada). El MIME de detección está fijado a `audio/m4a` aunque el archivo real podría ser `.caf` en iOS si el preset de expo-av cambiase.
- [POTENCIALMENTE NO UTILIZADO] No aplica: los tres métodos tienen consumidores reales confirmados por grep.
- [NIVEL DE CERTEZA: Confirmado por código] El backend de subida de grabación es PythonAnywhere (`PA_API_URL` + `/api/security/upload-recording`), no Firebase ni el backend de Cloud Run.

## Seguridad

- [ALTO] Clave de API incrustada en el cliente: `AUDIO_ALERT_API_KEY` se lee de `EXPO_PUBLIC_AUDIO_ALERT_API_KEY` y se incrusta en el bundle/APK (ver aviso en `features.ts`). Cualquiera con el APK puede extraerla y llamar a los endpoints con la misma cabecera `X-API-Key`. [RECOMENDACIÓN] Migrar a autenticación por token efímero emitido por una Cloud Function con reglas de autorización por usuario.
- [MEDIO] No hay verificación de autorización por usuario en `detectAlertFromFile`/`uploadSecurityRecording`: el servidor solo ve una API key compartida; cualquier usuario con el APK puede subir audio y metadatos.
- [MEDIO] Privacidad del audio: los chunks de voz (hasta 2 s) y la grabación de seguridad (60 s) se transmiten a servidores externos (API de análisis + PythonAnywhere) con `userId`, `alertId` y `deviceId` como metadatos. El audio de voz es dato biométrico/sensible: debe cubrirse en la política de privacidad y, según el marco DAMMA/DAMA-DMBOK, clasificarse y tratarse como dato sensible con consentimiento, minimización y retención limitada.
- [BAJO] `DeviceService.getDeviceUniqueId()` expone un identificador persistente del equipo en el nombre del archivo y en metadatos del backend; es una huella de dispositivo (device fingerprinting) que puede requerir consentimiento según normativa.
- [INFORMATIVO] No se registran secretos en logs: los `console.warn` (líneas 189) no imprimen la API key ni el contenido del payload; solo el error y el contexto del objeto.
- [INFORMATIVO] Validación de entrada: la extensión del archivo se restringe con lista blanca y el deviceId se sanea, lo que mitiga manipulación de nombres de archivo.
- [INFORMATIVO] No hay logging de datos personales en este archivo (a diferencia del warn de `AudioRecordingService`, aquí no se imprimen `userId`/`alertId`).

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Latencia y coste del modo guardia remoto: una petición HTTP por cada chunk de 2 s consume datos móviles y depende de conectividad. [RECOMENDACIÓN] Evaluar detección local (motor nativo) como vía principal y usar la remota solo como refuerzo, con backoff exponencial y control de batería/datos.
- [RIESGO] Sin timeout en los `fetch`, el bucle de guardia puede quedar suspendido indefinidamente en una iteración. [RECOMENDACIÓN] Añadir `AbortController`/timeout y reintentar con backoff.
- [RIESGO] Respuesta con acoplamiento de claves entre la API de audio y PythonAnywhere. [RECOMENDACIÓN] Separar credenciales por backend y rotarlas; validar en el servidor que `userId` coincide con la sesión autenticada (token firmado, no campo de formulario confiable).
- [RIESGO] Subida best-effort sin reintentos propios: si PythonAnywhere falla, la grabación de seguridad no se replica (aunque Firebase Storage ya la conserva). [RECOMENDACIÓN] Reintentar con cola local (existe `AlertQueue` para mensajes) o considerar la copia en PythonAnywhere como no crítica.
- [RECOMENDACIÓN] Documentar en la política de privacidad el procesamiento de voz por terceros (transcripción remota) y ofrecer desactivación del modo guardia remoto (`settings.audioEnabled` ya existe en `useSettingsStore`).
