/* ============================================================================
* Archivo         : WakeWordService.ts
* Descripción     : Orquestación del modo guardia por voz con integración nativa y rearme seguro.
* Autor           : oafon
* Fecha           : 2026-03-25
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.9
* Uso             : WakeWordService.start(), stop(), cancelAlert() y restoreAfterBoot().
* ============================================================================ */

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

/* ============================================================================
* Función         : loadWakeWordModule
* Descripción     : Carga el módulo nativo de wake word solo cuando el runtime actual lo soporta.
* Fecha           : 2026-04-21
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : WakeWordServiceClass.initializeNativeBridge
* Ingesta         : Sin argumentos
* Devolución      : Promise<WakeWordModule>
* Uso             : const module = await loadWakeWordModule()
* ============================================================================ */
async function loadWakeWordModule(): Promise<WakeWordModule> {
  if (Platform.OS !== 'android') {
    throw new Error('El módulo nativo de wake word solo está disponible en Android.');
  }

  if (!wakeWordModulePromise) {
    wakeWordModulePromise = import('react-native-wakeword');
  }

  return wakeWordModulePromise;
}

/* ============================================================================
* Función         : normalizeDetectedKeyword
* Descripción     : Normaliza el texto detectado por el motor para presentarlo en la UI.
* Fecha           : 2026-03-20
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : WakeWordServiceClass.handleKeywordDetected, useSettingsStore
* Ingesta         : rawKeyword: string
* Devolución      : string
* Uso             : normalizeDetectedKeyword(rawKeyword)
* ============================================================================ */
function normalizeDetectedKeyword(rawKeyword: string): string {
  const configuredWords = useSettingsStore.getState().triggerWords;
  const normalizedRaw = rawKeyword.trim().toLowerCase();

  if (configuredWords.includes(normalizedRaw)) {
    return normalizedRaw;
  }

  return configuredWords[0] || normalizedRaw || 'ayuda';
}

/* ============================================================================
* Función         : isRecoverableNativeWakeWordError
* Descripción     : Detecta errores nativos recuperables y habilita fallback simulado.
* Fecha           : 2026-03-25
* Versión         : 1.2.1
* Lenguaje        : TypeScript 5.9
* Conexiones      : WakeWordServiceClass.initializeNativeBridge, WakeWordServiceClass.startDetection
* Ingesta         : message: string
* Devolución      : boolean
* Uso             : isRecoverableNativeWakeWordError(message)
* ============================================================================ */
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

  /* ============================================================================
  * Función         : start
  * Descripción     : Inicia la escucha simulada del modo guardia.
  * Fecha           : 2026-03-20
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : PermissionsService, useGuardStore
  * Ingesta         : Sin argumentos
  * Devolución      : Promise<void>
  * Uso             : await WakeWordService.start()
  * ============================================================================ */
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

  /* ============================================================================
  * Función         : stop
  * Descripción     : Detiene la escucha simulada del modo guardia y limpia el countdown.
  * Fecha           : 2026-03-20
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : useGuardStore
  * Ingesta         : Sin argumentos
  * Devolución      : Promise<void>
  * Uso             : await WakeWordService.stop()
  * ============================================================================ */
  async stop(): Promise<void> {
    this.clearCountdown();
    await this.stopDetection();
    useGuardStore.getState().resetAlertState();
    useSettingsStore.getState().updateSettings({ guardModeEnabled: false });
  }

  /* ============================================================================
  * Función         : restoreAfterBoot
  * Descripción     : Restaura la escucha simulada si el usuario dejó el modo guardia activado.
  * Fecha           : 2026-03-20
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : useGuardStore, WakeWordServiceClass.start
  * Ingesta         : Sin argumentos
  * Devolución      : Promise<void>
  * Uso             : await WakeWordService.restoreAfterBoot()
  * ============================================================================ */
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

  /* ============================================================================
  * Función         : cancelAlert
  * Descripción     : Cancela el countdown actual y rearma la escucha simulada.
  * Fecha           : 2026-03-20
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : useGuardStore, WakeWordServiceClass.startDetection
  * Ingesta         : Sin argumentos
  * Devolución      : void
  * Uso             : WakeWordService.cancelAlert()
  * ============================================================================ */
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

  /* ============================================================================
  * Función         : shouldUseRemoteAudioGuard
  * Descripción     : Determina si el modo guardia debe usar detección remota por audio.
  * Fecha           : 2026-03-30
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : start, startDetection
  * Ingesta         : Sin argumentos
  * Devolución      : boolean
  * Uso             : this.shouldUseRemoteAudioGuard()
  * ============================================================================ */
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

  /* ============================================================================
  * Función         : startRemoteAudioGuard
  * Descripción     : Inicia el loop de detección remota por chunks de audio.
  * Fecha           : 2026-03-30
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : AudioRecordingService, AudioAlertApiService, useGuardStore
  * Ingesta         : Sin argumentos
  * Devolución      : Promise<void>
  * Uso             : await this.startRemoteAudioGuard()
  * ============================================================================ */
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

  /* ============================================================================
  * Función         : runRemoteAudioGuardLoop
  * Descripción     : Ejecuta la escucha remota por audio mientras el modo guardia permanezca activo.
  * Fecha           : 2026-03-30
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : AudioRecordingService, AudioAlertApiService, startCountdown
  * Ingesta         : sessionId: number
  * Devolución      : Promise<void>
  * Uso             : void this.runRemoteAudioGuardLoop(sessionId)
  * ============================================================================ */
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
