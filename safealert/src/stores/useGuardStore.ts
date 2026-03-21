/* ============================================================================
* Archivo         : useGuardStore.ts
* Descripción     : Estado global canónico del flujo de alerta y modo guardia.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Consumir con useGuardStore(selector) desde hooks y pantallas.
* ============================================================================ */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALERT_COUNTDOWN_SECONDS } from '../config/constants';
import { Alert as AppAlert, AlertLocation } from '../types/Alert';

export type AlertPhase =
  | 'idle'
  | 'countdown'
  | 'capturing'
  | 'sending'
  | 'sent'
  | 'error';

interface GuardState {
  isArmed: boolean;
  alertPhase: AlertPhase;
  countdownSeconds: number;
  detectedKeyword: string | null;
  lastLocation: AlertLocation | null;
  lastAlert: AppAlert | null;
  setArmed: (value: boolean) => void;
  setAlertPhase: (phase: AlertPhase) => void;
  setCountdownSeconds: (seconds: number) => void;
  setDetectedKeyword: (keyword: string | null) => void;
  setLastLocation: (location: AlertLocation | null) => void;
  setLastAlert: (alert: AppAlert | null) => void;
  resetAlertState: () => void;
}

export const useGuardStore = create<GuardState>()(
  persist(
    (set) => ({
      isArmed: false,
      alertPhase: 'idle',
      countdownSeconds: ALERT_COUNTDOWN_SECONDS,
      detectedKeyword: null,
      lastLocation: null,
      lastAlert: null,

      setArmed: (value) => set({ isArmed: value }),
      setAlertPhase: (phase) => set({ alertPhase: phase }),
      setCountdownSeconds: (seconds) => set({ countdownSeconds: seconds }),
      setDetectedKeyword: (keyword) => set({ detectedKeyword: keyword }),
      setLastLocation: (location) => set({ lastLocation: location }),
      setLastAlert: (alert) => set({ lastAlert: alert }),
      resetAlertState: () =>
        set({
          alertPhase: 'idle',
          countdownSeconds: ALERT_COUNTDOWN_SECONDS,
          detectedKeyword: null,
        }),
    }),
    {
      name: 'guard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ isArmed: state.isArmed }),
    }
  )
);
