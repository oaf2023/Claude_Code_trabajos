/* ============================================================================
* Archivo         : features.ts
* Descripción     : Feature flags y utilidades de configuración operativa del MVP.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Importar flags y utilidades desde los servicios y pantallas.
* ============================================================================ */

import { Platform } from 'react-native';

export const AUTHENTICATION_TIMEOUT_MS = 8000;
export const WAKE_WORD_ENABLED = true;
export const BACKGROUND_LOCATION_ENABLED = false;
export const WAKE_WORD_LICENSE_KEY = 'safealert_trial_key';
export const WAKE_WORD_MODEL_NAME = 'wakeword_es.onnx';
export const WAKE_WORD_FOREGROUND_ONLY = true;

const wakeWordBaseReason = !WAKE_WORD_ENABLED
  ? 'La activación por voz está desactivada por configuración.'
  : Platform.OS !== 'android'
    ? 'La activación por voz quedó habilitada solo para Android en esta etapa.'
    : !WAKE_WORD_LICENSE_KEY
      ? 'Falta configurar EXPO_PUBLIC_WAKE_WORD_LICENSE para iniciar la escucha por voz.'
      : null;

export const WAKE_WORD_DISABLED_REASON = wakeWordBaseReason || '';

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