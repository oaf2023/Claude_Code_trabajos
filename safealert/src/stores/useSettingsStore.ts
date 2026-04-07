import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS } from '../types/Settings';

interface SettingsState extends AppSettings {
  userId: string | null;
  isOnboarded: boolean;
  userName: string;
  userPhone: string;
  userSelfieUrl: string | null;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setUserId: (id: string) => void;
  setOnboarded: (value: boolean) => void;
  setUserName: (name: string) => void;
  setUserPhone: (phone: string) => void;
  setUserSelfieUrl: (url: string) => void;
  setHasSubscription: (value: boolean) => void;
  setPaymentOverdue: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      userId: null,
      isOnboarded: false,
      userName: '',
      userPhone: '',
      userSelfieUrl: null,

      updateSettings: (patch) => set((state) => ({ ...state, ...patch })),
      setUserId: (userId) => set({ userId }),
      setOnboarded: (isOnboarded) => set({ isOnboarded }),
      setUserName: (userName) => set({ userName }),
      setUserPhone: (userPhone) => set({ userPhone }),
      setUserSelfieUrl: (userSelfieUrl) => set({ userSelfieUrl }),
      setHasSubscription: (hasSubscription) => set({ hasSubscription }),
      setPaymentOverdue: (paymentOverdue) => set({ paymentOverdue }),
    }),
    {
      name: 'safealert-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        userName: state.userName,
        userPhone: state.userPhone,
        userSelfieUrl: state.userSelfieUrl,
        triggerWords: state.triggerWords,
        messageTemplate: state.messageTemplate,
        audioEnabled: state.audioEnabled,
        hasSubscription: state.hasSubscription,
        paymentOverdue: state.paymentOverdue,
        alertCountdownSeconds: state.alertCountdownSeconds,
        wakeWordSensitivity: state.wakeWordSensitivity,
      }),
    }
  )
);
