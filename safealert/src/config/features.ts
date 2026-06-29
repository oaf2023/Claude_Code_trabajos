/* ============================================================================
* Archivo         : features.ts
* Descripción     : Feature flags y utilidades de configuración operativa del MVP.
*                   ⚠️  Las variables EXPO_PUBLIC_* se incrustan en el APK.
*                   Ningún secreto debe residir aquí. Para claves sensibles,
*                   usar un backend proxy (Firebase Function) como intermediario.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : Importar flags y utilidades desde los servicios y pantallas.
* ============================================================================ */

import { Platform } from 'react-native';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);

const EXPO_PUBLIC_ENV = {
  EXPO_PUBLIC_ENABLE_WAKE_WORD: process.env.EXPO_PUBLIC_ENABLE_WAKE_WORD,
  EXPO_PUBLIC_ENABLE_AUDIO_GUARD: process.env.EXPO_PUBLIC_ENABLE_AUDIO_GUARD,
  EXPO_PUBLIC_ENABLE_PAYMENTS: process.env.EXPO_PUBLIC_ENABLE_PAYMENTS,
  EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION:
    process.env.EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION,
  EXPO_PUBLIC_WAKE_WORD_LICENSE: process.env.EXPO_PUBLIC_WAKE_WORD_LICENSE,
  EXPO_PUBLIC_AUDIO_ALERT_API_URL: process.env.EXPO_PUBLIC_AUDIO_ALERT_API_URL,
  EXPO_PUBLIC_AUDIO_ALERT_API_KEY: process.env.EXPO_PUBLIC_AUDIO_ALERT_API_KEY,
  EXPO_PUBLIC_AUDIO_ALERT_LANGUAGE: process.env.EXPO_PUBLIC_AUDIO_ALERT_LANGUAGE,
  EXPO_PUBLIC_AUDIO_ALERT_THRESHOLD: process.env.EXPO_PUBLIC_AUDIO_ALERT_THRESHOLD,
  EXPO_PUBLIC_AUDIO_GUARD_CHUNK_MS: process.env.EXPO_PUBLIC_AUDIO_GUARD_CHUNK_MS,
  EXPO_PUBLIC_PA_API_URL: process.env.EXPO_PUBLIC_PA_API_URL,
} as const;

/* ============================================================================
* Función         : readBooleanEnv
* Descripción     : Lee flags públicos de Expo de forma estática para que Metro los incruste correctamente.
* Fecha           : 2026-03-28
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

/* ============================================================================
* Función         : readStringEnv
* Descripción     : Lee valores string públicos de Expo con fallback seguro.
* Fecha           : 2026-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : AUDIO_ALERT_API_URL, AUDIO_ALERT_API_KEY, AUDIO_ALERT_LANGUAGE
* Ingesta         : name, fallback
* Devolución      : string
* Uso             : readStringEnv('EXPO_PUBLIC_AUDIO_ALERT_API_URL', '')
* ============================================================================ */
function readStringEnv(
  name: keyof typeof EXPO_PUBLIC_ENV,
  fallback: string
): string {
  const rawValue = EXPO_PUBLIC_ENV[name];
  if (!rawValue) {
    return fallback;
  }

  return rawValue.trim() || fallback;
}

/* ============================================================================
* Función         : readNumberEnv
* Descripción     : Lee valores numéricos públicos de Expo con límites defensivos.
* Fecha           : 2026-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : AUDIO_ALERT_THRESHOLD, AUDIO_GUARD_CHUNK_MS
* Ingesta         : name, fallback
* Devolución      : number
* Uso             : readNumberEnv('EXPO_PUBLIC_AUDIO_GUARD_CHUNK_MS', 2000)
* ============================================================================ */
function readNumberEnv(
  name: keyof typeof EXPO_PUBLIC_ENV,
  fallback: number
): number {
  const rawValue = EXPO_PUBLIC_ENV[name];
  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export const AUTHENTICATION_TIMEOUT_MS = 8000;
export const WAKE_WORD_ENABLED = readBooleanEnv(
  'EXPO_PUBLIC_ENABLE_WAKE_WORD',
  false
);
export const AUDIO_GUARD_ENABLED = readBooleanEnv(
  'EXPO_PUBLIC_ENABLE_AUDIO_GUARD',
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
export const AUDIO_ALERT_API_URL = readStringEnv(
  'EXPO_PUBLIC_AUDIO_ALERT_API_URL',
  ''
);
export const AUDIO_ALERT_API_KEY = readStringEnv(
  'EXPO_PUBLIC_AUDIO_ALERT_API_KEY',
  ''
);
export const AUDIO_ALERT_LANGUAGE = readStringEnv(
  'EXPO_PUBLIC_AUDIO_ALERT_LANGUAGE',
  'es'
);
export const AUDIO_ALERT_THRESHOLD = Math.min(
  100,
  Math.max(0, readNumberEnv('EXPO_PUBLIC_AUDIO_ALERT_THRESHOLD', 82))
);
export const AUDIO_GUARD_CHUNK_MS = Math.max(
  1000,
  readNumberEnv('EXPO_PUBLIC_AUDIO_GUARD_CHUNK_MS', 2000)
);
export const WAKE_WORD_MODEL_NAME = 'wakeword_es.onnx';
export const WAKE_WORD_FOREGROUND_ONLY = true;
export const REMOTE_AUDIO_GUARD_CONFIGURED =
  AUDIO_GUARD_ENABLED && !!AUDIO_ALERT_API_URL && !!AUDIO_ALERT_API_KEY;

const wakeWordBaseReason = REMOTE_AUDIO_GUARD_CONFIGURED
  ? null
  : !WAKE_WORD_ENABLED
    ? 'La activación por voz está desactivada por configuración.'
    : Platform.OS !== 'android'
      ? 'La activación por voz quedó habilitada solo para Android en esta etapa.'
      : null;

export const WAKE_WORD_DISABLED_REASON = wakeWordBaseReason || '';
export const PAYMENTS_DISABLED_REASON =
  'La pasarela de pagos está pausada temporalmente hasta terminar las pruebas funcionales.';
export const PA_API_URL = readStringEnv(
  'EXPO_PUBLIC_PA_API_URL',
  'https://oaf.pythonanywhere.com'
);

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