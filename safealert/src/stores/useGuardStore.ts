import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from '../types/Alert';

export type AlertPhase =
  | 'inactivo'
  | 'capturando'
  | 'enviando'
  | 'enviado'
  | 'error';

interface GuardState {
  isArmed: boolean;
  alertPhase: AlertPhase;
  lastAlert: Alert | null;
  
  // Actions
  toggleArmed: () => void;
  setArmed: (value: boolean) => void;
  setAlertPhase: (phase: AlertPhase) => void;
  setLastAlert: (alert: Alert) => void;
  reset: () => void;
}

export const useGuardStore = create<GuardState>()(
  persist(
    (set) => ({
      isArmed: false,
      alertPhase: 'inactivo',
      lastAlert: null,

      toggleArmed: () => set((state) => ({ isArmed: !state.isArmed })),
      setArmed: (value) => set({ isArmed: value }),
      setAlertPhase: (phase) => set({ alertPhase: phase }),
      setLastAlert: (alert) => set({ lastAlert: alert }),
      reset: () => set({ alertPhase: 'inactivo', lastAlert: null }),
    }),
    {
      name: 'guard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ isArmed: state.isArmed }), // Solo persistimos isArmed
    }
  )
);
