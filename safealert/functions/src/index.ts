import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

export { sendAlertSMS, sendAudioFollowUp } from './sendAlertSMS';
export { cleanupOldAlerts } from './cleanupOldAlerts';
