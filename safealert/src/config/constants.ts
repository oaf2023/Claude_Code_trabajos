export const APP_NAME = 'SafeAlert';

// Alert timing
export const ALERT_COUNTDOWN_SECONDS = 3;
export const AUDIO_RECORDING_SECONDS = 10;
export const GPS_FRESH_FIX_TIMEOUT_MS = 8000;
export const LOCATION_UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Porcupine
export const PORCUPINE_SENSITIVITY = 0.7;

// Firestore collections
export const COLLECTION_USERS = 'users';
export const COLLECTION_CONTACTS = 'contacts';
export const COLLECTION_ALERTS = 'alerts';
export const COLLECTION_SETTINGS = 'settings';

// SMS message format
export const SMS_PREFIX = '[SAFEALERT]';
export const SMS_TEST_PREFIX = '[SAFEALERT-TEST]';

// Colors
export const COLORS = {
  danger: '#DC2626',
  dangerDark: '#B91C1C',
  dangerLight: '#FEE2E2',
  safe: '#16A34A',
  safeLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  neutral: '#6B7280',
  background: '#F9FAFB',
  white: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
};
