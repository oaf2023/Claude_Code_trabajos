export interface AppSettings {
  triggerWords: string[];
  messageTemplate: string;
  audioEnabled: boolean;
  guardModeEnabled: boolean;
  wakeWordSensitivity: number; // 0.0 - 1.0
  alertCountdownSeconds: number; // seconds to cancel before sending
}

export const DEFAULT_SETTINGS: AppSettings = {
  triggerWords: ['ayuda', 'socorro', 'auxilio', 'help'],
  messageTemplate:
    '{name} necesita ayuda urgente! Ubicación: {location} — Hora: {time}',
  audioEnabled: true,
  guardModeEnabled: false,
  wakeWordSensitivity: 0.7,
  alertCountdownSeconds: 3,
};
