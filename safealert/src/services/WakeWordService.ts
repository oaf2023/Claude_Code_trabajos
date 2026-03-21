/* ============================================================================
* Archivo         : WakeWordService.ts
* Descripción     : Orquestación simulada del modo guardia por voz para evitar crashes nativos.
* Autor           : oafon
* Fecha           : 2026-03-20
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : WakeWordService.start(), stop(), cancelAlert() y restoreAfterBoot().
* ============================================================================ */

import { AppState, AppStateStatus } from 'react-native';
import { ALERT_COUNTDOWN_SECONDS } from '../config/constants';
import {
  WAKE_WORD_DISABLED_REASON,
  WAKE_WORD_ENABLED,
} from '../config/features';
import { useGuardStore } from '../stores/useGuardStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { AlertService } from './AlertService';
import { PermissionsService } from './PermissionsService';

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

class WakeWordServiceClass {
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription: { remove(): void } | null = null;
  private isRunning = false;
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

    const microphonePermission = await PermissionsService.requestMicrophone();
    if (microphonePermission !== 'granted') {
      throw new Error(
        'Debes conceder acceso al micrófono para activar la vigilancia por voz.'
      );
    }

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
    return WAKE_WORD_ENABLED && !this.getUnavailableReason();
  }

  getUnavailableReason(): string {
    return this.runtimeUnavailableReason || WAKE_WORD_DISABLED_REASON;
  }

  private ensureBaseAvailability(): void {
    if (!this.isAvailable()) {
      console.warn('[WakeWordService] No disponible:', this.getUnavailableReason());
    }
  }

  private async startDetection(): Promise<void> {
    if (this.isRunning) return;

    try {
      console.log('[WakeWordService] Simulando inicio de detección (Modo Desarrollo)...');
      this.isRunning = true;
      useGuardStore.getState().setArmed(true);
    } catch (error) {
      this.isRunning = false;
      throw error;
    }
  }

  private async stopDetection(): Promise<void> {
    console.log('[WakeWordService] Simulando parada de detección...');
    this.isRunning = false;
    useGuardStore.getState().setArmed(false);
  }

  private async handleKeywordDetected(rawKeyword: string): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    await this.stopDetection();
    this.startCountdown(normalizeDetectedKeyword(rawKeyword));
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
  }
}

export const WakeWordService = new WakeWordServiceClass();
