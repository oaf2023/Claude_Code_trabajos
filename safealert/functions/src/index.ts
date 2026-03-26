import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

export { sendAlertSMS, sendAudioFollowUp, sendLocationPulseUpdate } from './sendAlertSMS';
export { cleanupOldAlerts } from './cleanupOldAlerts';
export { createPaymentOrder } from './createPaymentOrder';
export { mpWebhook } from './mpWebhook';
