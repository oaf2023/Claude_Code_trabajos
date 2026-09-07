# Archivo: src/services/WakeWordService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/WakeWordService.ts | 622 | TypeScript 5.9 | 23013 | Servicio de orquestación del modo guardia por voz | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Orquestador central del "modo guardia" de SafeAlert: la vigilancia por voz que detecta una palabra de activación ("ayuda", "socorro", etc.) y dispara automáticamente una alerta SOS. El servicio abstrae **tres motores de detección** bajo una misma API pública:

1. **Motor nativo react-native-wakeword** (solo Android): carga un modelo ONNX (`assets/models/wakeword_es.onnx`) mediante una instancia `KeyWordRNBridgeInstance`, activa la escucha continua y recibe eventos por suscripción cuando se pronuncia la palabra.
2. **Modo guardia remoto por chunks de audio** (si `REMOTE_AUDIO_GUARD_CONFIGURED`): no usa wake word local; graba fragmentos de 2 s con `AudioRecordingService.recordSnippet` y los envía a `AudioAlertApiService.detectAlertFromFile` (backend de transcripción/detección remota).
3. **Fallback simulado**: si el motor nativo no puede cargar por errores nativos "recuperables", el servicio arma el estado de guardia (isArmed) pero **sin detección real** — únicamente informa al usuario.

También gestiona: permisos de micrófono, ciclo de vida según el estado de la app (primer plano/segundo plano con `WAKE_WORD_FOREGROUND_ONLY = true`), rearme tras la detección, restauración tras arranque en frío (`restoreAfterBoot`, usado por `app/_layout.tsx`) y cancelación de la alerta.

## Clasificación y estado

`FUNCIONALIDAD EXISTENTE` — Instancia única exportada (`export const WakeWordService = new WakeWordServiceClass()`) y usada en:

- `app/_layout.tsx` (import línea 30; `restoreAfterBoot()` en líneas 269-282, cuando la app arranca y `useGuardStore.isArmed` persiste verdadero).
- `app/(tabs)/index.tsx` (import línea 27; `isAvailable()` línea 102, `getUnavailableReason()` líneas 158 y 319, `stop()` línea 169, `start()` línea 173).
- `app/(tabs)/settings.tsx` (import línea 27; `isAvailable()` y `getUnavailableReason()` en líneas 253-339).
- `src/hooks/useAlert.ts` (import línea 12; `cancelAlert()` línea 52).

Dentro del archivo, la detección nativa por ONNX es real, pero la activación efectiva depende de flags de compilación (`EXPO_PUBLIC_ENABLE_WAKE_WORD`/`EXPO_PUBLIC_ENABLE_AUDIO_GUARD`, ambos con fallback `false`): sin ellos, `WAKE_WORD_DISABLED_REASON` no es vacío y `start()` lanza "La activación por voz está desactivada por configuración". La ruta por defecto en entornos sin flags es el **fallback deshabilitado**. [NIVEL DE CERTEZA: Altamente probable]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `AppState`, `AppStateStatus`, `Platform` (react-native) | estándar | Guardas de plataforma y ciclo de vida (líneas 47, 136, 481, 586-619) | Sí |
| `ALERT_COUNTDOWN_SECONDS` (de `../config/constants`) | interna | Default del countdown en `startCountdown` (línea 544) | Sí (aunque `startCountdown` no se invoca, ver observaciones) |
| `AUDIO_GUARD_CHUNK_MS` (de `../config/features`) | interna | Duración del chunk remoto (líneas 455, 485) | Sí |
| `REMOTE_AUDIO_GUARD_CONFIGURED` (de `../config/features`) | interna | Selección de modo (líneas 260, 329, 388) | Sí |
| `WAKE_WORD_DISABLED_REASON` (de `../config/features`) | interna | Razón de no disponibilidad (línea 225) | Sí |
| `WAKE_WORD_FOREGROUND_ONLY` (de `../config/features`) | interna | Solo primer plano (líneas 136, 612) | Sí |
| `WAKE_WORD_LICENSE_KEY` (de `../config/features`) | interna | Licencia del motor (líneas 282-287) | Sí ([SECRETO OCULTO] si se define) |
| `WAKE_WORD_MODEL_NAME` (de `../config/features`) | interna | Nombre del modelo ONNX (línea 280) | Sí |
| `useGuardStore` (de `../stores/useGuardStore`) | interna | Estado de guardia armada/fases (múltiples) | Sí |
| `useSettingsStore` (de `../stores/useSettingsStore`) | interna | Palabras, sensibilidad, countdown (líneas 70, 236, 491, 543) | Sí |
| `AlertService` (de `./AlertService`) | interna | Envío de la alerta (`send`) (línea 564) | Sí |
| `AudioAlertApiService` (de `./AudioAlertApiService`) | interna | Guardia remota (líneas 260, 493) | Sí |
| `AudioRecordingService` (de `./AudioRecordingService`) | interna | Chunks remotos y cancelación (líneas 391, 485) | Sí |
| `PermissionsService` (de `./PermissionsService`) | interna | Permiso de micrófono (línea 142) | Sí |
| `react-native-wakeword` (import dinámico) | externa | Motor nativo (solo Android) (línea 52) | Sí en Android; resuelto a shim vacío en web (`metro.config.js` + `src/shims/web-empty.js`) |

## Componentes que dependen de este archivo

- `app/_layout.tsx` — `restoreAfterBoot()` al arrancar si el modo guardia estaba armado (líneas 269-282).
- `app/(tabs)/index.tsx` — pantalla principal: botón de guardia llama `start()`/`stop()`; muestra disponibilidad y motivo (líneas 102, 158, 169, 173, 319).
- `app/(tabs)/settings.tsx` — pantalla de ajustes consulta disponibilidad y motivo (líneas 253-339).
- `src/hooks/useAlert.ts` — cancela la alerta en curso vía `cancelAlert()` (línea 52) (el botón "cancelar" del countdown de la UI).
- Dependencias circulares controladas: `WakeWordService` importa `AlertService`, que importa `AudioRecordingService` y `AudioAlertApiService`, que a su vez son importados por `WakeWordService`. No se detectó referencia circular directa problemática en tiempo de carga porque el objeto se instancia al final del módulo.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `wakeWordModulePromise` | `null` inicial | `Promise<WakeWordModule> \| null` | Cache del import dinámico del módulo nativo (singleton de carga) | Líneas 33, 51-55 |
| `WAKE_WORD_FOREGROUND_ONLY` (importada) | `true` (hardcodeado en features.ts) | boolean | Restringe la guardia a primer plano | Líneas 136, 612 |
| `WAKE_WORD_MODEL_NAME` (importada) | `'wakeword_es.onnx'` | string | Modelo de detección empaquetado como asset | Línea 280 |
| `WAKE_WORD_LICENSE_KEY` (importada) | env `EXPO_PUBLIC_WAKE_WORD_LICENSE` ([SECRETO OCULTO]) | string | Clave de licencia del motor | Líneas 282-287 |
| `WAKE_WORD_DISABLED_REASON` (importada) | texto o `''` | string | Razón de indisponibilidad por configuración | Líneas 225, 229 |
| `ALERT_COUNTDOWN_SECONDS` (importada) | `3` | number | Segundos de gracia por defecto | Línea 544 |
| `AUDIO_GUARD_CHUNK_MS` (importada) | Default `2000`, mínimo `1000` | number | Milisegundos por chunk remoto | Líneas 455, 485 |
| `REMOTE_AUDIO_GUARD_CONFIGURED` (importada) | `AUDIO_GUARD_ENABLED && URL && KEY` | boolean | Activa la vía remota | Líneas 260, 329, 388 |

Valores mágicos relevantes: `'safealert_guard'` (instanceId del bridge, línea 275), `3` (bufferCnt de `createInstance`, línea 280), intervalo de sensibilidad `[0.3, 0.95]` (línea 237), `250`/`500` ms de reintento (líneas 487, 530), `1000` ms del tick del countdown (línea 559), y los patrones de error nativo en `isRecoverableNativeWakeWordError` (líneas 94-103).

## Estructura (funciones / clases / tipos)

- Tipos: `WakeWordModule` (línea 28), `KeyWordRNBridgeInstance` (líneas 29-31).
- Funciones de módulo: `loadWakeWordModule` (46-56), `normalizeDetectedKeyword` (69-78), `isRecoverableNativeWakeWordError` (91-104).
- Clase interna `WakeWordServiceClass` (106-620), instanciada como singleton exportado en la línea 622.
- Campos privados de la clase (107-116): `bridgeInstance`, `bridgeSubscription`, `countdownTimer`, `appStateSubscription`, `initializationPromise`, `fallbackToSimulation`, `isRunning`, `remoteLoopPromise`, `remoteLoopSession`, `runtimeUnavailableReason`.
- Métodos públicos: `start` (133), `stop` (169), `restoreAfterBoot` (187), `cancelAlert` (211), `isAvailable` (220), `getUnavailableReason` (224).
- Métodos privados: `ensureBaseAvailability` (228), `getThreshold` (235), `setGuardFeedback` (240), `shouldUseRemoteAudioGuard` (259), `initializeNativeBridge` (263), `startDetection` (326), `suspendDetection` (387), `stopDetection` (408), `handleKeywordDetected` (414), `startRemoteAudioGuard` (440), `runRemoteAudioGuardLoop` (477), `startCountdown` (540), `dispatchDetectedAlert` (562), `clearCountdown` (578), `attachAppStateListener` (585), `handleAppStateChange` (594).

## Análisis línea por línea

```ts
import { AppState, AppStateStatus, Platform } from 'react-native';
import { ALERT_COUNTDOWN_SECONDS } from '../config/constants';
import {
  AUDIO_GUARD_CHUNK_MS,
  REMOTE_AUDIO_GUARD_CONFIGURED,
  WAKE_WORD_DISABLED_REASON,
  WAKE_WORD_FOREGROUND_ONLY,
  WAKE_WORD_LICENSE_KEY,
  WAKE_WORD_MODEL_NAME,
} from '../config/features';
import { useGuardStore } from '../stores/useGuardStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { AlertService } from './AlertService';
import { AudioAlertApiService } from './AudioAlertApiService';
import { AudioRecordingService } from './AudioRecordingService';
import { PermissionsService } from './PermissionsService';

type WakeWordModule = typeof import('react-native-wakeword');
type KeyWordRNBridgeInstance = Awaited<
  ReturnType<WakeWordModule['createKeyWordRNBridgeInstance']>
>;

let wakeWordModulePromise: Promise<WakeWordModule> | null = null;

async function loadWakeWordModule(): Promise<WakeWordModule> {
  if (Platform.OS !== 'android') {
    throw new Error('El módulo nativo de wake word solo está disponible en Android.');
  }

  if (!wakeWordModulePromise) {
    wakeWordModulePromise = import('react-native-wakeword');
  }

  return wakeWordModulePromise;
}
```

**Explicación de las líneas 11–56:** (la cabecera documental del archivo, líneas 1-9, y la de la función, líneas 35-45, no aportan lógica; se omiten aquí)

- **Línea 11**: importa `AppState`/`AppStateStatus` para el ciclo de vida y `Platform` para restringir el motor a Android.
- **Líneas 12-20**: importa flags y constantes de configuración (ver tabla de variables).
- **Líneas 21-26**: importa los dos stores globales (Zustand) y los tres servicios del módulo de audio. `useSettingsStore.getState()` se usa fuera de React (patrón válido de Zustand).
- **Línea 28**: `WakeWordModule` = tipo del módulo `react-native-wakeword` mediante `typeof import(...)` (import de tipo).
- **Líneas 29-31**: `KeyWordRNBridgeInstance` deduce el tipo de retorno de `createKeyWordRNBridgeInstance` (evita depender de los tipos del paquete, cuyo shim local está en `src/types/react-native-wakeword.d.ts`).
- **Línea 33**: caché del módulo (import dinámico único).
- **Líneas 46-56**: `loadWakeWordModule()` lanza error explícito fuera de Android (líneas 47-49) — el motor es exclusivo de Android; en iOS/Web nunca carga. Si no hay caché, ejecuta el `import()` dinámico (líneas 51-53). Devuelve la promesa cacheada (línea 55). En web, `metro.config.js` resuelve `react-native-wakeword` al shim vacío `src/shims/web-empty.js`, por lo que el import "funciona" pero no crea instancias útiles; sin embargo la guarda de plataforma evita llegar ahí en web.

```ts
function normalizeDetectedKeyword(rawKeyword: string): string {
  const configuredWords = useSettingsStore.getState().triggerWords;
  const normalizedRaw = rawKeyword.trim().toLowerCase();

  if (configuredWords.includes(normalizedRaw)) {
    return normalizedRaw;
  }

  return configuredWords[0] || normalizedRaw || 'ayuda';
}

function isRecoverableNativeWakeWordError(message: string): boolean {
  const normalizedMessage = message.toLowerCase();

  return [
    'libonnxruntime4j_jni.so',
    'dlopen failed',
    'exceptionininitializererror',
    'libcalculator.so',
    'libarm_compute.so',
    'libarm_compute_graph.so',
    'libgenie.so',
    'libplatformvalidatorshared.so',
  ].some((pattern) => normalizedMessage.includes(pattern));
}
```

**Explicación de las líneas 69–104:** (cabeceras doc de las líneas 58-68 y 80-90 omitidas)

- **Líneas 69-78**: `normalizeDetectedKeyword` normaliza el texto crudo del motor para mostrarlo en la UI: obtiene las palabras configuradas (`triggerWords`, p. ej. `['ayuda','socorro','auxilio','help']` desde `DEFAULT_SETTINGS`), normaliza a minúsculas (líneas 71-72) y, si la palabra detectada está entre las configuradas, la devuelve tal cual (líneas 73-75); si no, devuelve la primera palabra configurada, o la cruda, o el literal `'ayuda'` como último recurso (línea 77). Evita que la UI muestre frases extrañas del motor.
- **Líneas 91-104**: `isRecoverableNativeWakeWordError` decide si un mensaje de error nativo (de la JVM/Android) es "recuperable" y habilita el fallback simulado. Compara en minúsculas contra nombres de librerías nativas del runtime ONNX/ARM (`libonnxruntime4j_jni.so`, `libarm_compute.so`, `libarm_compute_graph.so`, `libcalculator.so`, `libgenie.so`, `libplatformvalidatorshared.so`) y patrones genéricos (`dlopen failed`, `exceptionininitializererror`). Es decir, ante fallos de carga de `.so` o inicialización de clases JNI, degrada a simulación en lugar de bloquear la guardia.

```ts
class WakeWordServiceClass {
  private bridgeInstance: KeyWordRNBridgeInstance | null = null;
  private bridgeSubscription: { remove?: () => void } | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription: { remove(): void } | null = null;
  private initializationPromise: Promise<void> | null = null;
  private fallbackToSimulation = false;
  private isRunning = false;
  private remoteLoopPromise: Promise<void> | null = null;
  private remoteLoopSession = 0;
  private runtimeUnavailableReason: string | null = null;

  constructor() {
    this.attachAppStateListener();
  }
```

**Explicación de las líneas 106–120:**

- **Línea 106**: declara la clase interna (no exportada) que encapsula todo el estado del modo guardia.
- **Líneas 107-116**: campos privados. `bridgeInstance` es la instancia nativa del SDK; `bridgeSubscription` la suscripción a eventos de keyword; `countdownTimer` el intervalo del countdown; `appStateSubscription` el listener de `AppState`; `initializationPromise` serializa la inicialización (evita dobles inits); `fallbackToSimulation` activa el modo simulado; `isRunning` indica escucha activa; `remoteLoopPromise`/`remoteLoopSession` controlan el bucle remoto (sesión incremental para invalidar bucles viejos); `runtimeUnavailableReason` guarda la causa de indisponibilidad en runtime.
- **Líneas 118-120**: el constructor suscribe el listener de `AppState` de inmediato (única vez, ya que es singleton). El listener se mantiene de por vida.

```ts
  async start(): Promise<void> {
    this.ensureBaseAvailability();

    if (WAKE_WORD_FOREGROUND_ONLY && AppState.currentState !== 'active') {
      throw new Error(
        'El modo guardia automático solo puede iniciarse con SafeAlert abierto en primer plano.'
      );
    }

    const microphonePermission = await PermissionsService.requestMicrophone();
    if (microphonePermission !== 'granted') {
      throw new Error(
        'Debes conceder acceso al micrófono para activar la vigilancia por voz.'
      );
    }

    if (this.shouldUseRemoteAudioGuard()) {
      await this.startDetection();
      return;
    }

    await this.initializeNativeBridge();
    await this.startDetection();
  }
```

**Explicación de las líneas 133–156:** (cabecera doc de las líneas 122-132 omitida)

`start()` es la puerta de entrada pública del modo guardia, llamada por el botón "ACTIVAR GUARDIA" de `app/(tabs)/index.tsx`.

- **Línea 134**: `ensureBaseAvailability()` lanza si `WAKE_WORD_DISABLED_REASON` o `runtimeUnavailableReason` bloquean el inicio.
- **Líneas 136-140**: con `WAKE_WORD_FOREGROUND_ONLY = true`, si la app no está en `active` lanza error: no se puede iniciar la guardia con la app en segundo plano o pantalla bloqueada desde cero.
- **Líneas 142-147**: pide el permiso de micrófono vía `PermissionsService.requestMicrophone()` (react-native-permissions: `ANDROID.RECORD_AUDIO`/`IOS.MICROPHONE`). Si no es `'granted'`, lanza error con texto orientado al usuario. (Nota: `'blocked'` y `'denied'` se tratan igual: error.)
- **Líneas 149-152**: si aplica la guardia remota (flag + URL + API key), delega en `startDetection()` (que derivará a `startRemoteAudioGuard`) y retorna.
- **Líneas 154-155**: en caso contrario, inicializa el puente nativo y luego arranca la detección. Nótese que si `initializeNativeBridge` activó el fallback simulado, `startDetection` solo arma el estado.

```ts
  async stop(): Promise<void> {
    this.clearCountdown();
    await this.stopDetection();
    useGuardStore.getState().resetAlertState();
    useSettingsStore.getState().updateSettings({ guardModeEnabled: false });
  }

  async restoreAfterBoot(): Promise<void> {
    if (!useGuardStore.getState().isArmed) {
      return;
    }

    try {
      await this.start();
    } catch (error) {
      useGuardStore.getState().setArmed(false);
      throw error;
    }
  }
```

**Explicación de las líneas 169–198:** (cabeceras doc de las líneas 158-168 y 176-186 omitidas)

- **Líneas 169-174**: `stop()` (botón "DESACTIVAR GUARDIA"): limpia el countdown, detiene la detección (`stopDetection` → `suspendDetection` + `setArmed(false)`), resetea el estado de alerta y apaga el flag persistido `guardModeEnabled` en settings.
- **Líneas 187-198**: `restoreAfterBoot()` se invoca desde `app/_layout.tsx` al arrancar (líneas 269-282). Si `useGuardStore.isArmed` es falso (no persistido) no hace nada (líneas 188-190). Si está armado, intenta `start()`; ante error desarma (`setArmed(false)`, línea 195) y relanza para que el layout lo registre. Recuperación tras muerte del proceso/arranque en frío gracias a la persistencia de `isArmed` en AsyncStorage (`useGuardStore` con `partialize: { isArmed }`).

```ts
  cancelAlert(): void {
    this.clearCountdown();
    useGuardStore.getState().resetAlertState();

    if (useGuardStore.getState().isArmed && AppState.currentState === 'active') {
      void this.startDetection();
    }
  }

  isAvailable(): boolean {
    return !this.getUnavailableReason();
  }

  getUnavailableReason(): string {
    return this.runtimeUnavailableReason || WAKE_WORD_DISABLED_REASON;
  }

  private ensureBaseAvailability(): void {
    const unavailableReason = this.getUnavailableReason();
    if (unavailableReason) {
      throw new Error(unavailableReason);
    }
  }

  private getThreshold(): number {
    const configured = useSettingsStore.getState().wakeWordSensitivity;
    return Math.min(Math.max(configured, 0.3), 0.95);
  }

  private setGuardFeedback(message: string | null, transcript?: string | null): void {
    const guardStore = useGuardStore.getState();
    guardStore.setGuardStatusMessage(message);
    if (transcript !== undefined) {
      guardStore.setLastHeardTranscript(transcript);
    }
  }
```

**Explicación de las líneas 211–246:** (cabecera doc de las líneas 200-210 omitida)

- **Líneas 211-218**: `cancelAlert()` lo llama `src/hooks/useAlert.ts` (botón "cancelar alerta" del countdown en la UI): limpia el countdown (línea 212) y resetea el estado de alerta (línea 213). Si la guardia sigue armada y la app está en primer plano, rearma la escucha en segundo plano (`void this.startDetection()`, líneas 215-217). La alerta ya enviada no se puede "des-enviar": el reset solo afecta al estado local.
- **Líneas 220-222**: `isAvailable()` = no hay razón de indisponibilidad. Usado por las pantallas para ocultar/mostrar el modo guardia.
- **Líneas 224-226**: `getUnavailableReason()` prioriza la razón de runtime (`runtimeUnavailableReason`, p. ej. error nativo no recuperable) sobre la de configuración estática (`WAKE_WORD_DISABLED_REASON`).
- **Líneas 228-233**: `ensureBaseAvailability()` lanza con la razón si existe.
- **Líneas 235-238**: `getThreshold()` lee la sensibilidad configurada (`wakeWordSensitivity`, default 0.7 según `DEFAULT_SETTINGS`) y la acota al intervalo [0.3, 0.95]. El mismo valor se pasa al SDK y se reaplica al rearmar.
- **Líneas 240-246**: `setGuardFeedback()` centraliza la actualización de UI: mensaje de estado y, opcionalmente, el transcripto oído. No actualiza si `transcript` es `undefined` (permite limpiar con `null`).

```ts
  private shouldUseRemoteAudioGuard(): boolean {
    return REMOTE_AUDIO_GUARD_CONFIGURED && AudioAlertApiService.isConfigured();
  }

  private async initializeNativeBridge(): Promise<void> {
    if (this.bridgeInstance || this.fallbackToSimulation) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      const wakeWordModule = await loadWakeWordModule();
      const instance = await wakeWordModule.createKeyWordRNBridgeInstance(
        'safealert_guard',
        false
      );
      const threshold = this.getThreshold();

      await instance.createInstance(WAKE_WORD_MODEL_NAME, threshold, 3);

      if (WAKE_WORD_LICENSE_KEY) {
        const licensed = await instance.setKeywordDetectionLicense(WAKE_WORD_LICENSE_KEY);
        if (!licensed) {
          console.warn('[WakeWordService] La licencia del motor no fue aceptada.');
        }
      }

      this.bridgeSubscription?.remove?.();
      this.bridgeSubscription = instance.onKeywordDetectionEvent((phrase: string) => {
        void this.handleKeywordDetected(phrase);
      });
      this.bridgeInstance = instance;
      this.fallbackToSimulation = false;
      this.runtimeUnavailableReason = null;
      this.setGuardFeedback('Guardia por voz lista para escuchar.', null);
    })()
      .catch((error: unknown) => {
        this.bridgeInstance = null;
        this.bridgeSubscription = null;
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo inicializar el motor de detección por voz.';

        if (isRecoverableNativeWakeWordError(message)) {
          console.warn(
            '[WakeWordService] Fallback a modo simulado por fallo nativo recuperable:',
            message
          );
          this.fallbackToSimulation = true;
          this.runtimeUnavailableReason = null;
          return;
        }

        this.runtimeUnavailableReason = message;
        throw error;
      })
      .finally(() => {
        this.initializationPromise = null;
      });

    return this.initializationPromise;
  }
```

**Explicación de las líneas 259–324:** (cabecera doc de las líneas 248-258 omitida)

- **Líneas 259-261**: `shouldUseRemoteAudioGuard()` = flag remoto && `AudioAlertApiService.isConfigured()`.
- **Líneas 263-266**: `initializeNativeBridge()` es idempotente: si ya hay instancia o fallback activo, sale sin más.
- **Líneas 268-270**: si hay una inicialización en curso, devuelve la misma promesa (serialización).
- **Líneas 272-297**: IIFE async que crea la instancia nativa. Línea 273: carga el módulo (Android). Líneas 274-277: `createKeyWordRNBridgeInstance('safealert_guard', false)` crea la instancia del bridge con id `'safealert_guard'` y `isSticky=false`. Línea 278: calcula el umbral. Línea 280: `instance.createInstance(WAKE_WORD_MODEL_NAME, threshold, 3)` inicializa el motor con el modelo **`wakeword_es.onnx`** (asset empaquetado por Metro vía `assetExts: ['onnx', ...]`), la sensibilidad y un buffer de 3. Líneas 282-287: si hay licencia configurada ([SECRETO OCULTO]) la registra y avisa si es rechazada. Líneas 289-292: reemplaza la suscripción previa (si existe) y suscribe `onKeywordDetectionEvent`, que invoca `handleKeywordDetected(phrase)` en fire-and-forget (`void`). Líneas 293-296: guarda la instancia, marca éxito, limpia la razón de indisponibilidad y actualiza el feedback de UI.
- **Líneas 298-318**: manejo de errores de inicialización. Limpia instancia/suscripción (299-300). Si el error es "recuperable" (librerías nativas que no cargan), activa `fallbackToSimulation = true`, limpia la razón y retorna sin lanzar (306-314): la guardia seguirá como "simulada". Si no es recuperable, guarda `runtimeUnavailableReason` y relanza (316-317).
- **Líneas 319-321**: `finally` libera la promesa de inicialización para permitir futuros reintentos.
- **Línea 323**: devuelve la promesa en curso a quien llamó.

```ts
  private async startDetection(): Promise<void> {
    if (this.isRunning) return;

    if (this.shouldUseRemoteAudioGuard()) {
      await this.startRemoteAudioGuard();
      return;
    }

    try {
      if (!this.bridgeInstance) {
        await this.initializeNativeBridge();
      }

      if (this.fallbackToSimulation) {
        console.log('[WakeWordService] Modo guardia simulado activo.');
        this.isRunning = true;
        useGuardStore.getState().setArmed(true);
        useSettingsStore.getState().updateSettings({ guardModeEnabled: true });
        this.runtimeUnavailableReason = null;
        this.setGuardFeedback('Modo guardia simulado activo. La detección automática real no está disponible.', null);
        return;
      }

      if (!this.bridgeInstance) {
        throw new Error('El motor de voz no quedó disponible en este dispositivo.');
      }

      console.log('[WakeWordService] Iniciando detección automática...');
      await this.bridgeInstance.startKeywordDetection(this.getThreshold());
      this.isRunning = true;
      useGuardStore.getState().setArmed(true);
      useSettingsStore.getState().updateSettings({ guardModeEnabled: true });
      this.runtimeUnavailableReason = null;
      this.setGuardFeedback('Escuchando palabras de activación...', null);
    } catch (error) {
      this.isRunning = false;
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar la detección automática.';

      if (isRecoverableNativeWakeWordError(message)) {
        console.warn(
          '[WakeWordService] Se activa fallback simulado tras error al iniciar la detección:',
          message
        );
        this.fallbackToSimulation = true;
        this.runtimeUnavailableReason = null;
        this.bridgeInstance = null;
        this.bridgeSubscription = null;
        this.isRunning = true;
        useGuardStore.getState().setArmed(true);
        useSettingsStore.getState().updateSettings({ guardModeEnabled: true });
        return;
      }

      this.runtimeUnavailableReason = message;
      throw error;
    }
  }
```

**Explicación de las líneas 326–385:** (cabecera doc de las líneas 326-335 no existe; el método empieza en 326)

`startDetection()` es el punto común de arranque de la escucha, usado por `start()`, `cancelAlert()`, `handleAppStateChange()` y `dispatchDetectedAlert()` (rearme).

- **Línea 327**: si ya está corriendo, no hace nada (evita dobles arranques).
- **Líneas 329-332**: si aplica guardia remota, delega en `startRemoteAudioGuard()` (bucle de chunks).
- **Líneas 334-337**: si no hay instancia nativa, la inicializa primero.
- **Líneas 339-347**: rama de fallback simulado: marca `isRunning`, arma el estado (`setArmed(true)`, `guardModeEnabled: true`), limpia la razón y muestra el mensaje de "modo guardia simulado" en la UI. Aquí **no hay escucha real**: es un placebo controlado que avisa al usuario. [OBSERVACIÓN TÉCNICA] Un usuario podría creer que está protegido cuando la app solo "simula".
- **Líneas 349-351**: si tras inicializar no hay instancia y no hay fallback, lanza error de motor no disponible.
- **Líneas 353-359**: vía real: `bridgeInstance.startKeywordDetection(this.getThreshold())` inicia la escucha continua del micrófono con el umbral actual. Marca `isRunning`, arma el estado y muestra "Escuchando palabras de activación...".
- **Líneas 360-384**: `catch`: si el error de arranque es recuperable, activa el fallback simulado y lo arma (367-379); si no, guarda la razón y relanza (382-383). OJO: en la rama de fallback el código marca `isRunning = true` y `setArmed(true)` (líneas 376-378): degradación silenciosa del modo real al simulado.

```ts
  private async suspendDetection(): Promise<void> {
    if (this.shouldUseRemoteAudioGuard()) {
      this.remoteLoopSession += 1;
      this.isRunning = false;
      await AudioRecordingService.cancelSnippetRecording();
      this.setGuardFeedback(null, null);
      return;
    }

    if (this.fallbackToSimulation) {
      this.isRunning = false;
      return;
    }

    if (this.bridgeInstance && this.isRunning) {
      await this.bridgeInstance.stopKeywordDetection();
    }

    this.isRunning = false;
  }

  private async stopDetection(): Promise<void> {
    console.log('[WakeWordService] Deteniendo detección automática...');
    await this.suspendDetection();
    useGuardStore.getState().setArmed(false);
  }
```

**Explicación de las líneas 387–412:**

- **Líneas 387-394**: `suspendDetection()` en modo remoto: incrementa `remoteLoopSession` (invalida el bucle en curso), apaga `isRunning` y cancela la grabación de snippet activa (libera el micrófono). Limpia el feedback.
- **Líneas 396-399**: en modo simulado solo apaga `isRunning` (no hay nada nativo que detener).
- **Líneas 401-403**: modo nativo: si hay instancia y estaba corriendo, llama `stopKeywordDetection()` (detiene la escucha del micrófono).
- **Línea 405**: apaga `isRunning` en todos los casos.
- **Líneas 408-412**: `stopDetection()` = `suspendDetection()` + desarmar (`setArmed(false)`). Usado por `stop()`.

```ts
  private async handleKeywordDetected(rawKeyword: string): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    await this.suspendDetection();
    const detectedKeyword = normalizeDetectedKeyword(rawKeyword);
    this.setGuardFeedback(
      `Coincidencia detectada: ${detectedKeyword}. Enviando alerta...`,
      rawKeyword
    );
    useGuardStore.getState().setDetectedKeyword(detectedKeyword);
    void this.dispatchDetectedAlert(detectedKeyword);
  }
```

**Explicación de las líneas 414–427:**

Callback del motor nativo cuando detecta la palabra de activación (se suscribe en la línea 290).

- **Líneas 415-417**: si la escucha ya no está activa, ignora el evento (evita alertas fantasma tras un stop).
- **Línea 419**: suspende la detección (detiene la escucha nativa y libera el micrófono) para poder grabar/enviar sin conflicto.
- **Línea 420**: normaliza la palabra detectada.
- **Líneas 421-424**: actualiza la UI con el mensaje "Coincidencia detectada: X. Enviando alerta..." y guarda el transcripto crudo.
- **Línea 425**: persiste la keyword detectada en el store (la UI del countdown/estado la muestra).
- **Línea 426**: dispara el envío en segundo plano (`void this.dispatchDetectedAlert(...)`): no se espera el envío aquí.

```ts
  private async startRemoteAudioGuard(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    const sessionId = this.remoteLoopSession + 1;
    this.remoteLoopSession = sessionId;
    this.isRunning = true;
    this.runtimeUnavailableReason = null;
    useGuardStore.getState().setArmed(true);
    useSettingsStore.getState().updateSettings({ guardModeEnabled: true });
    this.setGuardFeedback('Guardia lista. Voy grabando fragmentos cortos para detectar una frase de ayuda.', null);

    console.log('[WakeWordService] Iniciando guardia remota por audio...', {
      sessionId,
      chunkMs: AUDIO_GUARD_CHUNK_MS,
    });

    const loopPromise = this.runRemoteAudioGuardLoop(sessionId).finally(() => {
      if (this.remoteLoopPromise === loopPromise) {
        this.remoteLoopPromise = null;
      }
    });
    this.remoteLoopPromise = loopPromise;
  }
```

**Explicación de las líneas 440–464:** (cabecera doc de las líneas 429-439 omitida)

`startRemoteAudioGuard()` arranca el bucle de guardia remota (modo 2).

- **Líneas 441-443**: si ya está corriendo, sale.
- **Líneas 445-447**: crea un nuevo id de sesión incremental. `remoteLoopSession` es la clave de cancelación cooperativa del bucle.
- **Líneas 448-451**: arma el estado y muestra feedback ("Guardia lista. Voy grabando fragmentos cortos...").
- **Líneas 453-456**: log de arranque con id de sesión y duración de chunk.
- **Líneas 458-463**: lanza `runRemoteAudioGuardLoop(sessionId)` como promesa en segundo plano y guarda la referencia en `remoteLoopPromise`; cuando termina, se limpia la referencia solo si sigue siendo la misma promesa (evita que un bucle viejo borre la referencia del nuevo).

```ts
  private async runRemoteAudioGuardLoop(sessionId: number): Promise<void> {
    while (
      this.remoteLoopSession === sessionId &&
      useGuardStore.getState().isArmed &&
      AppState.currentState === 'active'
    ) {
      try {
        this.setGuardFeedback('Grabando 2 segundos de audio...', null);
        const snippet = await AudioRecordingService.recordSnippet(AUDIO_GUARD_CHUNK_MS);
        if (!snippet || this.remoteLoopSession !== sessionId) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }

        const configuredWords = useSettingsStore.getState().triggerWords;
        this.setGuardFeedback('Analizando el audio grabado...', null);
        const detection = await AudioAlertApiService.detectAlertFromFile(
          snippet.uri,
          configuredWords
        );

        if (this.remoteLoopSession !== sessionId) {
          return;
        }

        if (detection.alertDetected) {
          this.remoteLoopSession += 1;
          this.isRunning = false;
          const detectedKeyword =
            detection.matchedKeyword || normalizeDetectedKeyword(detection.transcript);
          console.log('[WakeWordService] Alerta detectada por audio remoto.', {
            sessionId,
            detectedKeyword,
            transcript: detection.transcript,
          });
          this.setGuardFeedback(
            `Detecté una posible alerta: ${detectedKeyword}. Enviando alerta...`,
            detection.transcript || null
          );
          useGuardStore.getState().setDetectedKeyword(detectedKeyword);
          void this.dispatchDetectedAlert(detectedKeyword);
          return;
        }

        this.setGuardFeedback(
          detection.transcript
            ? 'Escuché una frase, pero no coincidió con las palabras de activación.'
            : 'No detecté una frase clara. Sigo escuchando.',
          detection.transcript || null
        );
      } catch (error) {
        console.warn('[WakeWordService] Error en detección remota por audio:', error);
        this.setGuardFeedback('Hubo un problema temporal al analizar el audio. Voy a reintentar.', null);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (this.remoteLoopSession === sessionId) {
      this.isRunning = false;
      this.setGuardFeedback('Guardia remota detenida.', null);
    }
  }
```

**Explicación de las líneas 477–538:** (cabecera doc de las líneas 466-476 omitida)

Bucle principal del modo guardia remoto: graba chunks de 2 s y los analiza en el servidor.

- **Líneas 478-482**: condición del `while`: la sesión sigue vigente (`remoteLoopSession === sessionId`), el usuario sigue armado y **la app está en primer plano** (`AppState.currentState === 'active'`). Si la app pasa a segundo plano, el bucle termina solo.
- **Líneas 483-489**: feedback "Grabando...", graba el chunk (línea 485). Si no hay snippet (permiso, error) o la sesión cambió durante la grabación, espera 250 ms y reintenta (líneas 486-489).
- **Líneas 491-496**: lee las palabras configuradas y envía el chunk a `detectAlertFromFile` (transcripción + comparación remota). Feedback "Analizando...".
- **Líneas 498-500**: si la sesión cambió mientras se analizaba, abandona el bucle (la guardia se detuvo o reinició).
- **Líneas 502-519**: detección positiva: invalida la sesión (503), apaga `isRunning` (504), resuelve la keyword (505-506, prioriza `matchedKeyword`), loguea (507-511), informa en la UI (512-515), persiste la keyword (516) y dispara el envío (517). Retorna: el bucle termina.
- **Líneas 521-526**: sin detección: feedback según si hubo transcripto ("Escuché una frase, pero no coincidió..." / "No detecté una frase clara. Sigo escuchando.") y guarda el transcripto. El bucle continúa (siguiente chunk).
- **Líneas 527-531**: `catch`: cualquier error (red, servidor, grabación) se registra, informa "reintentar" y espera 500 ms antes de la siguiente iteración. **No hay backoff exponencial**: un servidor caído provoca reintentos cada ~2,75 s indefinidamente mientras la guardia esté armada. [RIESGO]
- **Líneas 534-537**: al salir del `while` con sesión vigente (p. ej. app a segundo plano), marca `isRunning = false` y feedback "Guardia remota detenida".

```ts
  private startCountdown(keyword: string): void {
    const guardStore = useGuardStore.getState();
    const settings = useSettingsStore.getState();
    const countdownSeconds =
      settings.alertCountdownSeconds || ALERT_COUNTDOWN_SECONDS;

    guardStore.setDetectedKeyword(keyword);
    guardStore.setAlertPhase('countdown');
    guardStore.setCountdownSeconds(countdownSeconds);

    let secondsLeft = countdownSeconds;
    this.countdownTimer = setInterval(() => {
      secondsLeft -= 1;
      guardStore.setCountdownSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        this.clearCountdown();
        void this.dispatchDetectedAlert(keyword);
      }
    }, 1000);
  }

  private async dispatchDetectedAlert(keyword: string): Promise<void> {
    try {
      await AlertService.send(keyword);
    } catch (error) {
      console.error('[WakeWordService] Falló el envío tras detección:', error);
    } finally {
      if (useGuardStore.getState().isArmed && AppState.currentState === 'active') {
        try {
          await this.startDetection();
        } catch (error) {
          console.error('[WakeWordService] No se pudo rearmar la escucha:', error);
        }
      }
    }
  }

  private clearCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }
```

**Explicación de las líneas 540–583:** (cabecera doc de las líneas 540-560 no existe; la del método empieza en la 540 que es la firma)

- **Líneas 540-560**: `startCountdown(keyword)` implementa una cuenta atrás de gracia antes de enviar la alerta. Lee los segundos configurados (`settings.alertCountdownSeconds` o `ALERT_COUNTDOWN_SECONDS = 3`), fija la fase `'countdown'` en el store y decrementa cada segundo con `setInterval`; al llegar a 0 limpia el timer y dispara `dispatchDetectedAlert`. **Este método no se invoca desde ningún punto del archivo ni se encontraron llamadas externas**: el flujo actual detecta y envía de inmediato vía `handleKeywordDetected`/`runRemoteAudioGuardLoop`. La cancelación la gestiona la UI (hook `useAlert` → `cancelAlert`), no este countdown. [POTENCIALMENTE NO UTILIZADO]
- **Líneas 562-576**: `dispatchDetectedAlert(keyword)` envía la alerta con `AlertService.send(keyword)` (línea 564; el envío completo incluye ubicación, contactos, Firestore y, si `audioEnabled`, graba 60 s y sube el audio a Firebase Storage + réplica a PythonAnywhere). En `catch` registra error (566); en `finally`, si la guardia sigue armada y la app activa, **rearma** la escucha (568-574). [OBSERVACIÓN TÉCNICA] `AlertService.send` dispara `recordAndUpload` en fire-and-forget (60 s de grabación); el rearme de `startDetection` puede ocurrir mientras esa grabación aún usa el micrófono (posible conflicto de audio en Android/iOS).
- **Líneas 578-583**: `clearCountdown()` limpia el intervalo si existe.

```ts
  private attachAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        void this.handleAppStateChange(nextState);
      }
    );
  }

  private async handleAppStateChange(nextState: AppStateStatus): Promise<void> {
    console.log('[WakeWordService] AppState:', nextState);

    if (!useGuardStore.getState().isArmed) {
      return;
    }

    if (nextState === 'active') {
      if (!this.isRunning) {
        try {
          await this.startDetection();
        } catch (error) {
          console.error('[WakeWordService] No se pudo restaurar al volver al primer plano:', error);
        }
      }
      return;
    }

    if (WAKE_WORD_FOREGROUND_ONLY && this.isRunning) {
      try {
        await this.suspendDetection();
      } catch (error) {
        console.error('[WakeWordService] No se pudo pausar al salir de primer plano:', error);
      }
    }
  }
}

export const WakeWordService = new WakeWordServiceClass();
```

**Explicación de las líneas 585–622:**

- **Líneas 585-592**: `attachAppStateListener()` se llama en el constructor; cada cambio de `AppState` deriva a `handleAppStateChange` (la suscripción devuelve `{ remove }`, nunca se elimina porque el singleton vive toda la app).
- **Líneas 594-619**: `handleAppStateChange(nextState)`. Línea 595: log de cada transición de estado. Líneas 597-599: si la guardia no está armada, ignora. Líneas 601-610: al volver a `'active'`, si la escucha no está corriendo, la restaura (`startDetection`); si la app estuvo en segundo plano mientras la guardia estaba armada, al volver se rearma (esto cubre la detección tras desbloquear la pantalla, siempre que la app no fuera matada). Líneas 612-618: con `WAKE_WORD_FOREGROUND_ONLY = true`, al salir de primer plano (background/bloqueo) y si estaba escuchando, llama `suspendDetection()`: **la escucha se pausa cuando la pantalla se bloquea o la app pasa a segundo plano**.
- **Línea 622**: exporta el singleton `WakeWordService`.

## Fichas de funciones y métodos

### Funciones de módulo

### loadWakeWordModule (líneas 46–56)

- Firma (código original): `async function loadWakeWordModule(): Promise<WakeWordModule>`
- Propósito técnico y funcional: cargar el SDK nativo solo en Android, una única vez (cache).
- Parámetros: ninguno. Retorno: `Promise<WakeWordModule>`. Excepciones: `Error` si `Platform.OS !== 'android'`.
- Dependencias: `Platform`, `wakeWordModulePromise`.
- Flujo interno: guarda de plataforma → import dinámico cacheado → retorno.
- Desde dónde se llama: `initializeNativeBridge` (línea 273).
- Efectos secundarios y riesgos: el import dinámico referencia código nativo; en web Metro lo sustituye por el shim (nunca se llega por la guarda de plataforma).

### normalizeDetectedKeyword (líneas 69–78)

- Firma (código original): `function normalizeDetectedKeyword(rawKeyword: string): string`
- Propósito técnico y funcional: mapear el texto detectado a una keyword configurada o a la primera configurada.
- Parámetros: `rawKeyword: string`. Retorno: `string`. Excepciones: ninguna.
- Dependencias: `useSettingsStore.getState().triggerWords`.
- Desde dónde se llama: `handleKeywordDetected` (línea 420) y `runRemoteAudioGuardLoop` (línea 506).
- Efectos secundarios y riesgos: ninguno. Si `triggerWords` está vacío, usa `'ayuda'` como palabra por defecto.

### isRecoverableNativeWakeWordError (líneas 91–104)

- Firma (código original): `function isRecoverableNativeWakeWordError(message: string): boolean`
- Propósito técnico y funcional: clasificar errores nativos de carga de librerías como recuperables (degradación a simulación).
- Parámetros: `message: string`. Retorno: `boolean`. Excepciones: ninguna.
- Dependencias: lista de patrones hardcodeada (líneas 94-103).
- Desde dónde se llama: `initializeNativeBridge` (línea 306) y `startDetection` (línea 367).
- Efectos secundarios y riesgos: [RIESGO] Un error que coincida por substring con un patrón (p. ej. cualquier mensaje que contenga "dlopen failed") degrada la guardia a simulación sin alertar de forma destacada al usuario.

### Métodos públicos de WakeWordServiceClass

### start (líneas 133–156)

- Firma (código original): `async start(): Promise<void>`
- Propósito técnico: validar disponibilidad, permiso y primer plano, e iniciar la detección (nativa o remota).
- Propósito funcional: activar la vigilancia por voz desde la UI.
- Parámetros: ninguno. Retorno: `Promise<void>`. Excepciones: razón de indisponibilidad, error de primer plano, permiso denegado, errores del motor no recuperables.
- Dependencias: `ensureBaseAvailability`, `PermissionsService.requestMicrophone`, `shouldUseRemoteAudioGuard`, `initializeNativeBridge`, `startDetection`.
- Desde dónde se llama: botón de guardia de `app/(tabs)/index.tsx` (línea 173) y `restoreAfterBoot` (línea 193).
- Efectos secundarios y riesgos: solicita permiso de micrófono; puede dejar la guardia en modo simulado sin que el usuario lo note (ver fallback). Registra logs.

### stop (líneas 169–174)

- Firma (código original): `async stop(): Promise<void>`
- Propósito: desactivar la guardia y limpiar estados.
- Parámetros: ninguno. Retorno: `Promise<void>`. Excepciones: posibles en `stopDetection` (capturadas por el llamador).
- Desde dónde se llama: botón de guardia de `index.tsx` (línea 169).
- Efectos secundarios: resetea `guardModeEnabled` persistido y el estado de alerta.

### restoreAfterBoot (líneas 187–198)

- Firma (código original): `async restoreAfterBoot(): Promise<void>`
- Propósito: rearmar la guardia tras arranque en frío si estaba armada.
- Desde dónde se llama: `app/_layout.tsx` (línea 274).
- Efectos secundarios: ante fallo desarma (`setArmed(false)`) y relanza el error.

### cancelAlert (líneas 211–218)

- Firma (código original): `cancelAlert(): void`
- Propósito: cancelar la alerta en curso (countdown de la UI) y rearmar la escucha.
- Desde dónde se llama: `src/hooks/useAlert.ts` (línea 52).
- Efectos secundarios: resetea estado; rearma escucha en fire-and-forget si procede.

### isAvailable (líneas 220–222) y getUnavailableReason (líneas 224–226)

- Firmas: `isAvailable(): boolean` y `getUnavailableReason(): string`.
- Propósito: consulta de disponibilidad para la UI.
- Desde dónde se llaman: `index.tsx` (102, 158, 319) y `settings.tsx` (253-339).
- Efectos secundarios: ninguno.

### Métodos privados

- `ensureBaseAvailability` (228-233): lanza con la razón de indisponibilidad si existe. Llamado por `start`.
- `getThreshold` (235-238): acota la sensibilidad configurada a [0.3, 0.95]. Llamado por `initializeNativeBridge` y `startDetection`.
- `setGuardFeedback` (240-246): actualiza mensaje de estado y transcripto en `useGuardStore`. Llamado en múltiples puntos.
- `shouldUseRemoteAudioGuard` (259-261): decide el modo remoto. Llamado por `start`, `startDetection`, `suspendDetection`.
- `initializeNativeBridge` (263-324): crea la instancia del SDK, carga el modelo ONNX, registra licencia y suscribe eventos; con degradación a simulación ante errores recuperables. Llamado por `start` y `startDetection`.
- `startDetection` (326-385): arranca la escucha nativa/remota/simulada con rearme idempotente. Llamado por `start`, `cancelAlert`, `handleAppStateChange` y `dispatchDetectedAlert`.
- `suspendDetection` (387-406): pausa la escucha por modo (remoto: invalida sesión y cancela snippet; nativo: `stopKeywordDetection`; simulado: solo flag). Llamado por `handleKeywordDetected`, `handleAppStateChange` y `stopDetection`.
- `stopDetection` (408-412): suspende y desarma. Llamado por `stop`.
- `handleKeywordDetected` (414-427): callback del motor nativo; suspende, normaliza, actualiza UI y dispara el envío. Suscrito en `initializeNativeBridge`.
- `startRemoteAudioGuard` (440-464): arranca el bucle remoto con sesión incremental. Llamado por `startDetection`.
- `runRemoteAudioGuardLoop` (477-538): bucle de chunks (grabar → analizar → decidir). Lanzado por `startRemoteAudioGuard`.
- `startCountdown` (540-560): countdown de gracia. [POTENCIALMENTE NO UTILIZADO] — no se encontraron llamadas.
- `dispatchDetectedAlert` (562-576): envía con `AlertService.send` y rearms en `finally`. Llamado por `handleKeywordDetected` (void), `runRemoteAudioGuardLoop` (void) y `startCountdown` (void, si llegara a usarse).
- `clearCountdown` (578-583): limpia el intervalo. Llamado por `stop`, `cancelAlert` y `startCountdown`.
- `attachAppStateListener` (585-592): suscribe `AppState`. Llamado en el constructor.
- `handleAppStateChange` (594-619): gestiona primer plano/segundo plano. Suscrito en `attachAppStateListener`.

## Clases / interfaces / tipos

### WakeWordServiceClass (líneas 106–620)

- Responsabilidad: estado y orquestación completa del modo guardia por voz (nativo/remoto/simulado), permisos, ciclo de vida y envío de alerta.
- Campos (tabla):

| Campo | Tipo | Finalidad |
| --- | --- | --- |
| `bridgeInstance` | `KeyWordRNBridgeInstance \| null` | Instancia nativa del SDK react-native-wakeword |
| `bridgeSubscription` | `{ remove?: () => void } \| null` | Suscripción a eventos de keyword |
| `countdownTimer` | `ReturnType<typeof setInterval> \| null` | Intervalo del countdown (hoy sin uso efectivo) |
| `appStateSubscription` | `{ remove(): void } \| null` | Listener de AppState |
| `initializationPromise` | `Promise<void> \| null` | Serializa la inicialización del motor |
| `fallbackToSimulation` | `boolean` | Modo simulado activo |
| `isRunning` | `boolean` | Escucha en curso |
| `remoteLoopPromise` | `Promise<void> \| null` | Referencia del bucle remoto en curso |
| `remoteLoopSession` | `number` | Contador de sesión para invalidar bucles remotos |
| `runtimeUnavailableReason` | `string \| null` | Razón de indisponibilidad en runtime |

- Relaciones: consume `useGuardStore`/`useSettingsStore` (Zustand) y delega en `AlertService`, `AudioAlertApiService`, `AudioRecordingService`, `PermissionsService`; se integra con react-native-wakeword (módulo nativo). Es un singleton (patrón de servicio).
- Ciclo de vida: se instancia al importar el módulo (línea 622) y vive durante toda la sesión de la app; su listener de `AppState` nunca se retira. El estado persistente de guardia (`isArmed`) vive en AsyncStorage vía `useGuardStore` y permite `restoreAfterBoot`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Líneas 540-560: `startCountdown` está implementado pero **sin llamadas** en el flujo actual (grep interno sin resultados). El flujo detecta y envía la alerta de inmediato (`handleKeywordDetected` → `dispatchDetectedAlert`). El countdown que ve el usuario en la UI lo gestionan la pantalla y `useAlert`/`cancelAlert`, no este método. [POTENCIALMENTE NO UTILIZADO]
- [OBSERVACIÓN TÉCNICA] Código legado de Porcupine no relacionado con este archivo: el proyecto conserva `src/config/porcupine.ts` (configuración de Porcupine/Picovoice con `PORCUPINE_ACCESS_KEY = ''`, `KEYWORD_LABELS`, `getKeywordPaths()` que devuelve `[]`) y `assets/keywords/*.ppn` (4 archivos de 1 byte, placeholders), además de `PORCUPINE_SENSITIVITY` duplicada en `src/config/constants.ts`. **Ninguno de esos símbolos es importado por `WakeWordService.ts` ni por otro archivo del proyecto** (verificado por grep): el motor actual es react-native-wakeword con modelo ONNX, no Porcupine. [NIVEL DE CERTEZA: Confirmado por código] Estado: CÓDIGO LEGADO / [POTENCIALMENTE NO UTILIZADO].
- [OBSERVACIÓN TÉCNICA] No hay rastro de la librería DAVoice ni de `@react-native-voice/voice` en el código de producción (`src/`, `app/`): las únicas referencias a `@react-native-voice/voice` están en `temp_voice_resources/` (carpeta de ejemplos/experimentos externa, excluida del análisis). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] Modelo ONNX: `assets/models/wakeword_es.onnx` (710.136 bytes) existe y es referenciado por nombre (`WAKE_WORD_MODEL_NAME = 'wakeword_es.onnx'`, línea 280 de features.ts/280 de este archivo). Metro lo empaqueta como asset gracias a `assetExts: ['onnx','ppn','tflite']` en `metro.config.js`. [NIVEL DE CERTEZA: Altamente probable] el SDK resuelve el modelo por nombre desde los assets de Android.
- [OBSERVACIÓN TÉCNICA] Doble ruta de detección (nativa y remota) que comparte el mismo objetivo: complejidad de mantenimiento alta; `REMOTE_AUDIO_GUARD_CONFIGURED` decide en tiempo de compilación según variables de entorno. Ambas rutas comparten `dispatchDetectedAlert`, `suspendDetection` y el mismo estado.
- [OBSERVACIÓN TÉCNICA] Degradación a modo simulado: `isRecoverableNativeWakeWordError` (substrings de librerías nativas) activa `fallbackToSimulation`; en ese modo la app marca la guardia como "armada" y muestra un mensaje textual ("Modo guardia simulado activo...") pero **no escucha nada**: una persona en peligro que active la guardia en un dispositivo con el motor roto no generará alertas automáticas. El mensaje en la UI del modo simulado puede pasar desapercibido.
- [OBSERVACIÓN TÉCNICA] Logs `console.log/warn/error` con texto en español e información de estado (líneas 340, 353, 409, 453-456, 507-511, 595): no contienen secretos, pero la línea 595 registra cada cambio de AppState y 507-511 el transcripto detectado (posible contenido de voz transcrito remotamente).
- [OBSERVACIÓN TÉCNICA] `app.json` no declara un config plugin de react-native-wakeword (la búsqueda de "wakeword" en `app.json` no dio resultados); los plugins declarados son expo-av/audio (líneas 114-121 con texto de permiso de micrófono), react-native-permissions y `./plugins/withManifestConflictFix`. La integración del SDK nativo depende de autolinking y del manifiesto Android (no analizado).
- [OBSERVACIÓN TÉCNICA] `restoreAfterBoot` depende de que `isArmed` haya persistido y de que el arranque ocurra con la app en primer plano (si la app se lanza por un arranque en segundo plano, `start()` lanza por `WAKE_WORD_FOREGROUND_ONLY` y `_layout.tsx` desarma la guardia).
- [OBSERVACIÓN TÉCNICA] Con la pantalla bloqueada o app en segundo plano la detección **se pausa** (`handleAppStateChange` líneas 612-618 con `WAKE_WORD_FOREGROUND_ONLY = true`), tanto en el motor nativo como en el bucle remoto (condición `AppState.currentState === 'active'`). El modo guardia NO vigila con la pantalla bloqueada; solo se restaura al volver a primer plano. [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [ALTO] Clave de licencia del motor en el cliente: `WAKE_WORD_LICENSE_KEY` se lee de `EXPO_PUBLIC_WAKE_WORD_LICENSE` y se incrusta en el bundle/APK (aviso en `features.ts` de que ninguna `EXPO_PUBLIC_*` debe ser secreta). Si se usa una licencia comercial real, quedará expuesta a extracción del APK. Valor: [SECRETO OCULTO]. [RECOMENDACIÓN] Evaluar si la licencia es necesaria o puede omitirse (el código ya la hace opcional, líneas 282-287).
- [MEDIO] Falsa sensación de seguridad en modo simulado: si el motor nativo falla con errores "recuperables", la guardia queda armada sin capacidad real de detección. [RECOMENDACIÓN] Mostrar un estado visual inequívoco (icono de advertencia, texto persistente) y bloquear el armado o exigir confirmación cuando `fallbackToSimulation` esté activo.
- [MEDIO] Privacidad del audio remoto: en modo guardia remoto, la app graba y transmite fragmentos de 2 s de audio ambiente (incluida conversación de terceros) a un servidor externo de forma continua, sin indicador visible más allá del texto de estado en la pantalla de guardia. Dato biométrico (voz) según DAMMA/DAMA-DMBOK; requiere consentimiento informado y minimización.
- [BAJO] Logs con contexto de usuario/estado (líneas 507-511 con transcripto; 595 con AppState) sin datos de autenticación; revisar si Sentry captura console.
- [INFORMATIVO] Permisos: `requestMicrophone` usa react-native-permissions con `ANDROID.RECORD_AUDIO`/`IOS.MICROPHONE`, declarados en `app.json` (Android permissions, líneas 86-93) con texto de uso de micrófono en el plugin iOS (línea 121). Correcto.
- [INFORMATIVO] No hay secretos impresos en logs en este archivo (la licencia no se loguea; solo "no fue aceptada").
- [INFORMATIVO] El envío de la alerta delega en `AlertService.send`, cuyo tratamiento de datos (contactos, ubicación) está fuera de este archivo.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Detección solo en primer plano: con `WAKE_WORD_FOREGROUND_ONLY = true`, la palabra de activación no se detecta con pantalla bloqueada ni app en segundo plano; la app depende de que el usuario deje SafeAlert abierta y desbloqueada. [RECOMENDACIÓN] Si el requisito es vigilancia con pantalla bloqueada, evaluar el modo "sticky"/servicio en primer plano del SDK (el segundo parámetro de `createKeyWordRNBridgeInstance` es `false`) y una notificación persistente, además de los permisos/batería asociados. Documentar la limitación actual como comportamiento esperado del producto.
- [RIESGO] Conflicto de micrófono al rearmar: `dispatchDetectedAlert` rearma la escucha en cuanto `AlertService.send` retorna, pero la grabación de 60 s del audio de la alerta sigue en curso (fire-and-forget). [RECOMENDACIÓN] Esperar a que termine la grabación (evento/estado compartido) antes de `startDetection`.
- [RIESGO] Reintentos sin backoff en el bucle remoto (líneas 527-531): un fallo sostenido de red/servidor produce peticiones cada ~2,75 s y consume batería/datos indefinidamente. [RECOMENDACIÓN] Backoff exponencial y límite de reintentos con degradación a aviso al usuario.
- [RIESGO] Método `startCountdown` muerto y tres modos de guardia: la complejidad acumulada (nativo + remoto + simulado + countdown no usado) dificulta el mantenimiento y las pruebas. [RECOMENDACIÓN] Auditoría de producto para eliminar el modo no usado y unificar la lógica de degradación.
- [RIESGO] La persistencia de `isArmed` y `restoreAfterBoot` pueden rearmar una guardia en un dispositivo cuyo motor falló (modo simulado) sin que el usuario lo sepa al desbloquear. [RECOMENDACIÓN] Al restaurar, si `fallbackToSimulation` está activo, mostrar diálogo de advertencia en primer plano.
- [RECOMENDACIÓN] Eliminar el código legado de Porcupine (`src/config/porcupine.ts`, `PORCUPINE_SENSITIVITY` en constants, `assets/keywords/*.ppn` de 1 byte) en una limpieza controlada, tras confirmar que ningún build los referencia (verificado por grep que no hay imports).
- [RECOMENDACIÓN] Reducir los logs de estado (AppState, transcriptos) a nivel debug para minimizar fuga de metadatos en telemetría.
