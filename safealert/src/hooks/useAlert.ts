/* ============================================================================
* Archivo         : useAlert.ts
* Descripción     : Hook de fachada para consumir el flujo canónico de alerta.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : const alert = useAlert();
* ============================================================================ */

import { AlertService } from '../services/AlertService';
import { WakeWordService } from '../services/WakeWordService';
import { useGuardStore } from '../stores/useGuardStore';

/* ============================================================================
* Función         : useAlert
* Descripción     : Expone el estado y acciones públicas del flujo de alerta.
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : useGuardStore, AlertService
* Ingesta         : Sin argumentos
* Devolución      : Objeto con estado y acciones de alerta
* Uso             : useAlert()
* ============================================================================ */
export function useAlert() {
  const alertPhase = useGuardStore((s) => s.alertPhase);
  const countdownSeconds = useGuardStore((s) => s.countdownSeconds);
  const lastAlert = useGuardStore((s) => s.lastAlert);
  const detectedKeyword = useGuardStore((s) => s.detectedKeyword);
  const lastLocation = useGuardStore((s) => s.lastLocation);

  const triggerManual = async () => {
    try {
      await AlertService.send('manual');
    } catch (e) {
      console.error('[useAlert] Manual trigger failed:', e);
      throw e;
    }
  };

  const triggerTest = async () => {
    try {
      await AlertService.send('test', true);
    } catch (e) {
      console.error('[useAlert] Test trigger failed:', e);
      throw e;
    }
  };

  const cancelCountdown = () => {
    WakeWordService.cancelAlert();
  };

  return {
    alertPhase,
    countdownSeconds,
    lastAlert,
    lastLocation,
    detectedKeyword,
    triggerManual,
    triggerTest,
    cancelCountdown,
    isAlerting:
      alertPhase === 'countdown' ||
      alertPhase === 'capturing' ||
      alertPhase === 'sending',
  };
}
