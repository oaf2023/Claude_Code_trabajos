/* ============================================================================
* Archivo         : constants.ts
* Descripción     : Constantes de configuración de SafeAlert.
*                   Los colores ahora se importan desde theme/tokens.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { APP_NAME, COLORS, ALERT_COUNTDOWN_SECONDS } from './constants'
* ============================================================================ */

import { color } from '../theme/tokens';

export const APP_NAME = 'SafeAlert';

// Alert timing
export const ALERT_COUNTDOWN_SECONDS = 3;
export const AUDIO_RECORDING_SECONDS = 60;
export const GPS_FRESH_FIX_TIMEOUT_MS = 8000;
export const LOCATION_UPDATE_INTERVAL_MS = 5 * 60 * 1000;
export const DEV_FALLBACK_LOCATION = {
  lat: -34.6037,
  lon: -58.3816,
  accuracy: 5000,
};

// Porcupine
export const PORCUPINE_SENSITIVITY = 0.7;

// Firestore collections
export const COLLECTION_USERS = 'users';
export const COLLECTION_CONTACTS = 'contacts';
export const COLLECTION_ALERTS = 'alerts';
export const COLLECTION_SETTINGS = 'settings';

// SMS message format
export const SMS_PREFIX = '🚨 AVISO';
export const SMS_TEST_PREFIX = '🧪 PRUEBA';

// Colores (backward compatibility — usar color tokens directamente)
export const COLORS = {
  danger: color.danger,
  dangerDark: color.dangerDark,
  dangerLight: color.dangerLight,
  safe: color.safe,
  safeLight: color.safeLight,
  warning: color.warning,
  warningLight: color.warningLight,
  neutral: color.neutral500,
  background: color.background,
  white: '#FFFFFF',
  text: color.textPrimary,
  textMuted: color.textSecondary,
  border: color.border,
};
