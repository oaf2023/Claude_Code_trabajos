import { create } from 'zustand';
import { Alert as AppAlert, AlertLocation } from '../types/Alert';

type AlertPhase =
  | 'idle'
  | 'countdown' // showing cancel overlay
  | 'capturing' // getting location + recording audio
  | 'sending' // writing to Firestore
  | 'sent'
  | 'error';

interface GuardState {
  isArmed: boolean;
  alertPhase: AlertPhase;
  countdownSeconds: number;
  lastAlert: AppAlert | null;
  lastLocation: AlertLocation | null;
  detectedKeyword: string | null;

  setArmed: (armed: boolean) => void;
  setAlertPhase: (phase: AlertPhase) => void;
  setCountdownSeconds: (seconds: number) => void;
  setLastAlert: (alert: AppAlert) => void;
  setLastLocation: (location: AlertLocation) => void;
  setDetectedKeyword: (keyword: string | null) => void;
  reset: () => void;
}

export const useGuardStore = create<GuardState>((set) => ({
  isArmed: false,
  alertPhase: 'idle',
  countdownSeconds: 3,
  lastAlert: null,
  lastLocation: null,
  detectedKeyword: null,

  setArmed: (isArmed) => set({ isArmed }),
  setAlertPhase: (alertPhase) => set({ alertPhase }),
  setCountdownSeconds: (countdownSeconds) => set({ countdownSeconds }),
  setLastAlert: (lastAlert) => set({ lastAlert }),
  setLastLocation: (lastLocation) => set({ lastLocation }),
  setDetectedKeyword: (detectedKeyword) => set({ detectedKeyword }),
  reset: () =>
    set({ alertPhase: 'idle', countdownSeconds: 3, detectedKeyword: null }),
}));
