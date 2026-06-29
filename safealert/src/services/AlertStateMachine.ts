/* ============================================================================
* Archivo         : AlertStateMachine.ts
* Descripción     : Máquina de estados persistente para el flujo de alerta SOS.
*                   Sobrevive a cierre del proceso, reinicio, pérdida de red
*                   y actualización de la app. Almacenada en AsyncStorage cifrado.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AlertStateMachine.transition('locating', { alertId: '...' })
* ============================================================================ */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertLocation, AlertContact } from '../types/Alert';

export type AlertMachineState =
  | 'idle'
  | 'locating'
  | 'sending'
  | 'awaiting_confirmation'
  | 'completed'
  | 'failed';

export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'confirmed';

export interface ContactDelivery {
  phone: string;
  name: string;
  status: DeliveryStatus;
  channel: 'sms' | 'push' | 'call';
  attempts: number;
  lastError: string | null;
  confirmedAt: number | null;
}

export interface MachineContext {
  alertId: string | null;
  userId: string | null;
  triggerWord: string;
  isTest: boolean;
  location: AlertLocation | null;
  locationFailed: boolean;
  contacts: ContactDelivery[];
  messageText: string;
  audioUrl: string | null;
  audioPath: string | null;
  createdAt: number;
  updatedAt: number;
  errorMessage: string | null;
  retryCount: number;
}

interface MachineState {
  state: AlertMachineState;
  context: MachineContext;
}

interface AlertMachineStore {
  machine: MachineState;
  transition: (newState: AlertMachineState, updates?: Partial<MachineContext>) => void;
  updateContext: (updates: Partial<MachineContext>) => void;
  updateContactStatus: (phone: string, status: DeliveryStatus, error?: string | null) => void;
  reset: () => void;
}

const initialContext: MachineContext = {
  alertId: null,
  userId: null,
  triggerWord: '',
  isTest: false,
  location: null,
  locationFailed: false,
  contacts: [],
  messageText: '',
  audioUrl: null,
  audioPath: null,
  createdAt: 0,
  updatedAt: 0,
  errorMessage: null,
  retryCount: 0,
};

const initialState: MachineState = {
  state: 'idle',
  context: { ...initialContext },
};

const ALLOWED_TRANSITIONS: Record<AlertMachineState, AlertMachineState[]> = {
  idle: ['locating'],
  locating: ['sending', 'failed'],
  sending: ['awaiting_confirmation', 'failed'],
  awaiting_confirmation: ['completed', 'failed', 'sending'],
  completed: [],
  failed: ['locating', 'idle'],
};

function isValidTransition(from: AlertMachineState, to: AlertMachineState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export const useAlertMachineStore = create<AlertMachineStore>()(
  persist(
    (set) => ({
      machine: { ...initialState },

      transition: (newState, updates) =>
        set((current) => {
          const from = current.machine.state;
          if (!isValidTransition(from, newState)) {
            console.warn(
              `[AlertStateMachine] Transición inválida: ${from} → ${newState}`
            );
            return current;
          }

          const now = Date.now();
          const nextContext: MachineContext = {
            ...current.machine.context,
            ...(updates || {}),
            updatedAt: now,
          };

          if (newState === 'completed' || newState === 'failed') {
            nextContext.retryCount = 0;
          }

          return {
            machine: {
              state: newState,
              context: nextContext,
            },
          };
        }),

      updateContext: (updates) =>
        set((current) => ({
          machine: {
            ...current.machine,
            context: {
              ...current.machine.context,
              ...updates,
              updatedAt: Date.now(),
            },
          },
        })),

      updateContactStatus: (phone, status, error = null) =>
        set((current) => {
          const contacts = current.machine.context.contacts.map((c) =>
            c.phone === phone
              ? {
                  ...c,
                  status,
                  lastError: error,
                  attempts: c.attempts + (status === 'pending' ? 0 : 1),
                  confirmedAt: status === 'confirmed' ? Date.now() : c.confirmedAt,
                }
              : c
          );
          return {
            machine: {
              ...current.machine,
              context: { ...current.machine.context, contacts, updatedAt: Date.now() },
            },
          };
        }),

      reset: () =>
        set({
          machine: { ...initialState, context: { ...initialContext } },
        }),
    }),
    {
      name: 'alert-machine-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ machine: state.machine }),
    }
  )
);

export function buildContactDeliveries(
  contacts: { name: string; phone: string }[]
): ContactDelivery[] {
  return contacts.map((c) => ({
    phone: c.phone,
    name: c.name,
    status: 'pending' as DeliveryStatus,
    channel: 'sms' as const,
    attempts: 0,
    lastError: null,
    confirmedAt: null,
  }));
}

export function hasPendingDeliveries(
  contacts: ContactDelivery[]
): boolean {
  return contacts.some((c) => c.status === 'pending' || c.status === 'failed');
}

export function getCompletedCount(contacts: ContactDelivery[]): number {
  return contacts.filter((c) => c.status === 'sent' || c.status === 'confirmed').length;
}

export function canRetry(machine: MachineState): boolean {
  if (machine.state !== 'failed') return false;
  return machine.context.retryCount < 3;
}
