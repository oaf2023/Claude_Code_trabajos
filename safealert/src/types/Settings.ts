export interface AppSettings {
  triggerWords: string[];
  messageTemplate: string;
  audioEnabled: boolean;
  hasSubscription: boolean;
  guardModeEnabled: boolean;
  reminderNotificationsEnabled: boolean;
  reminderHour: number;
  wakeWordSensitivity: number; // 0.0 - 1.0
  alertCountdownSeconds: number; // seconds to cancel before sending
}

export const DEFAULT_SETTINGS: AppSettings = {
  triggerWords: ['ayuda', 'socorro', 'auxilio', 'help'],
  messageTemplate:
    '{name} necesita ayuda urgente! Ubicación: {location} — Hora: {time}',
  audioEnabled: true,
  hasSubscription: false,
  guardModeEnabled: false,
  reminderNotificationsEnabled: false,
  reminderHour: 9,
  wakeWordSensitivity: 0.7,
  alertCountdownSeconds: 3,
};
