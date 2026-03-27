/* ============================================================================
* Archivo         : features.ts
* Descripción     : Feature flags y utilidades de configuración operativa del MVP.
* Autor           : oafon
* Fecha           : 2026-03-27
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : Importar flags y utilidades desde los servicios y pantallas.
* ============================================================================ */

import { Platform } from 'react-native';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
const EXPO_PUBLIC_ENV = {
  EXPO_PUBLIC_ENABLE_WAKE_WORD: process.env.EXPO_PUBLIC_ENABLE_WAKE_WORD,
  EXPO_PUBLIC_ENABLE_PAYMENTS: process.env.EXPO_PUBLIC_ENABLE_PAYMENTS,
  EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION:
    process.env.EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION,
  EXPO_PUBLIC_WAKE_WORD_LICENSE: process.env.EXPO_PUBLIC_WAKE_WORD_LICENSE,
} as const;

/* ============================================================================
* Función         : readBooleanEnv
* Descripción     : Lee flags públicas de Expo con acceso estático compatible con el bundler.
* Fecha           : 2026-03-27
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : WAKE_WORD_ENABLED, PAYMENTS_ENABLED, BACKGROUND_LOCATION_ENABLED
* Ingesta         : name: keyof typeof EXPO_PUBLIC_ENV, fallback: boolean
* Devolución      : boolean
* Uso             : readBooleanEnv('EXPO_PUBLIC_ENABLE_WAKE_WORD', false)
* ============================================================================ */
function readBooleanEnv(
  name: keyof typeof EXPO_PUBLIC_ENV,
  fallback: boolean
): boolean {
  const rawValue = EXPO_PUBLIC_ENV[name];
  if (!rawValue) {
    return fallback;
  }

  return ENABLED_VALUES.has(rawValue.trim().toLowerCase());
}

export const AUTHENTICATION_TIMEOUT_MS = 8000;
export const WAKE_WORD_ENABLED = readBooleanEnv(
  'EXPO_PUBLIC_ENABLE_WAKE_WORD',
  false
);
export const PAYMENTS_ENABLED = readBooleanEnv(
  'EXPO_PUBLIC_ENABLE_PAYMENTS',
  false
);
export const BACKGROUND_LOCATION_ENABLED = readBooleanEnv(
  'EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION',
  false
);
export const WAKE_WORD_LICENSE_KEY =
  EXPO_PUBLIC_ENV.EXPO_PUBLIC_WAKE_WORD_LICENSE?.trim() || '';
export const WAKE_WORD_MODEL_NAME = 'wakeword_es.onnx';
export const WAKE_WORD_FOREGROUND_ONLY = true;

const wakeWordBaseReason = !WAKE_WORD_ENABLED
  ? 'La activación por voz está desactivada por configuración.'
  : Platform.OS !== 'android'
    ? 'La activación por voz quedó habilitada solo para Android en esta etapa.'
    : null;

export const WAKE_WORD_DISABLED_REASON = wakeWordBaseReason || '';
export const PAYMENTS_DISABLED_REASON =
  'La pasarela de pagos está pausada temporalmente hasta terminar las pruebas funcionales.';

/* ============================================================================
* Función         : buildAlertAudioStoragePath
* Descripción     : Construye la ruta canónica de Storage para audios de alerta.
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : AudioRecordingService, cleanupOldAlerts, storage.rules
* Ingesta         : userId: string, alertId: string
* Devolución      : string
* Uso             : buildAlertAudioStoragePath(userId, alertId)
* ============================================================================ */
export function buildAlertAudioStoragePath(
  userId: string,
  alertId: string
): string {
  return `users/${userId}/alerts/${alertId}/voice.m4a`;
}