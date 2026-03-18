import { EventEmitter } from 'eventemitter3';
import { useGuardStore } from '../stores/useGuardStore';
import { AlertService } from './AlertService';
import { ALERT_COUNTDOWN_SECONDS } from '../config/constants';

// Event emitter for wake word detection events
export const WakeWordEvents = new EventEmitter();

class WakeWordServiceClass {
  private isRunning = false;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private alertTriggered = false;

  /**
   * Start wake word detection.
   * TODO: Integrar Porcupine cuando esté disponible el Access Key.
   * Por ahora solo se usa el botón manual de pánico.
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[WakeWordService] Modo guardia activado (solo botón manual)');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.clearCountdown();
    this.isRunning = false;
    console.log('[WakeWordService] Modo guardia desactivado');
  }

  triggerKeyword(keyword: string = 'ayuda'): void {
    console.log(`[WakeWordService] Palabra detectada: "${keyword}"`);
    WakeWordEvents.emit('keyword_detected', { keyword });

    const guardStore = useGuardStore.getState();
    guardStore.setDetectedKeyword(keyword);
    guardStore.setAlertPhase('countdown');

    this.alertTriggered = false;
    let secondsLeft = ALERT_COUNTDOWN_SECONDS;
    guardStore.setCountdownSeconds(secondsLeft);

    this.countdownTimer = setInterval(() => {
      secondsLeft--;
      guardStore.setCountdownSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        this.clearCountdown();
        if (!this.alertTriggered) {
          this.alertTriggered = true;
          AlertService.send(keyword).catch((e) =>
            console.error('[WakeWordService] Alerta falló:', e)
          );
        }
      }
    }, 1000);
  }

  cancelAlert(): void {
    this.clearCountdown();
    this.alertTriggered = true;
    useGuardStore.getState().reset();
    console.log('[WakeWordService] Alerta cancelada por el usuario');
  }

  private clearCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  get running(): boolean {
    return this.isRunning;
  }
}

export const WakeWordService = new WakeWordServiceClass();
