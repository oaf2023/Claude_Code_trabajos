import { useGuardStore } from '../stores/useGuardStore';
import { AlertService } from '../services/AlertService';
import { WakeWordService } from '../services/WakeWordService';

export function useAlert() {
  const alertPhase = useGuardStore((s) => s.alertPhase);
  const countdownSeconds = useGuardStore((s) => s.countdownSeconds);
  const lastAlert = useGuardStore((s) => s.lastAlert);
  const detectedKeyword = useGuardStore((s) => s.detectedKeyword);

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
