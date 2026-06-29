/* ============================================================================
* Archivo         : en.ts
* Descripción     : English translations.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { en } from '../i18n/en';
* ============================================================================ */

import type { Translations } from './types';

export const en: Translations = {
  app: {
    name: 'SafeAlert',
    tagline: 'Your personal safety guard',
  },

  home: {
    guardActive: 'Guard mode ACTIVE',
    guardInactive: 'Guard mode INACTIVE',
    activate: 'ACTIVATE\nGUARD',
    deactivate: 'DEACTIVATE\nGUARD',
    alertDetected: 'ALERT DETECTED',
    sending: 'SENDING\nALERT',
    guardActiveShort: 'GUARD\nACTIVE',
    panic: 'SEND ALERT NOW',
    panicSub: 'Location to your contacts',
    testAlert: 'Test alert (no real SMS)',
    noContacts: 'No trusted contacts',
    noContactsSub: 'Tap to add contacts',
    contactsCount: '{count} active contact | {count} active contacts',
  },

  alert: {
    pending: 'Alert registered. Pending processing.',
    partial: 'Alert partially sent to {count} contacts',
    failed: 'Alert could not be sent from the backend.',
    sent: 'Alert sent to {count} contacts',
    cancel: 'CANCEL',
    dismiss: 'END',
    incognito: 'INCOGNITO',
    cancelHold: 'Hold for five seconds to return',
    keyword: 'Keyword: "{word}"',
    sendingTo: 'Sending alert to {count} contacts...',
    locating: 'Getting location...',
    sendingMsg: 'Sending alert...',
  },

  protection: {
    active: 'Protection active',
    limited: 'Protection limited',
    stopped: 'Protection stopped',
  },

  contacts: {
    title: 'Contacts',
    empty: 'No trusted contacts',
    emptySub: 'Add people who will receive your location in emergencies.',
    add: 'Add contact',
    edit: 'Edit contact',
    delete: 'Delete',
    deleteConfirm: 'Delete {name}?',
    priority: 'Priority for assisted call',
    activeCount: '{active} of {total} contacts active',
    headerHint: 'The active primary contact is used for the assisted call.',
    loading: 'Loading contacts...',
  },

  history: {
    title: 'History',
    empty: 'No alerts yet',
    emptySub: 'Your sent alerts will appear here with delivery details.',
    noSession: 'Session unavailable',
    noSessionSub: 'Sign in to view your history.',
    deliveries: 'Deliveries:',
    test: 'TEST',
  },

  settings: {
    title: 'Settings',
    howToUse: 'How SafeAlert works →',
    permissions: 'View permissions →',
    audio: 'Record voice message',
    audioSub: 'Records 10 seconds of audio and sends as a second message',
    reminders: 'Enable daily reminder',
    remindersSub: 'Reminds you to check permissions and contacts once a day.',
    template: 'Message template',
    templateSub: 'Use {location} for location and {time} for time.',
    templateSave: 'Save template',
    voice: 'Voice activation',
    voiceSub: 'The Spanish model listens on Android.',
    addWord: 'New keyword...',
    addWordBtn: 'Add',
    sensitivity: 'Detection sensitivity',
    sensitivityLow: 'Low\n(fewer false)',
    sensitivityMedium: 'Medium\n(recommended)',
    sensitivityHigh: 'High\n(more detection)',
    countdown: 'Cancel time',
    countdownSub: 'Seconds to cancel an accidental alert',
    privacy: 'Privacy & data',
    privacyAction: 'Manage my data',
  },

  permissions: {
    title: 'Required permissions',
    location: 'Location',
    locationSub: 'Required to send your location in alerts.',
    notifications: 'Notifications',
    notificationsSub: 'Required for reminders and alerts.',
    microphone: 'Microphone',
    microphoneSub: 'Required to record emergency audio.',
    contacts: 'Contacts',
    contactsSub: 'Required to select trusted contacts.',
    grantAll: 'Grant all permissions',
  },

  onboarding: {
    welcome: 'Your safety,\nin one app',
    welcomeSub: 'SafeAlert monitors your voice and sends your location to trusted contacts when you need it most.',
    start: 'Get Started',
    alreadyRegistered: 'I already have an account',
    howItWorks: 'How SafeAlert works',
    step1Title: 'Voice activation',
    step1Desc: 'Say "Help" and SafeAlert triggers the alert automatically.',
    step2Title: 'Trusted contacts',
    step2Desc: 'Choose who receives your location in an emergency.',
    step3Title: 'Alert sent',
    step3Desc: 'Your contacts receive an SMS with your exact location.',
    understand: 'Got it',
  },

  errors: {
    noContacts: 'No active contacts',
    sessionNotReady: 'Session not ready. Please try again.',
    generic: 'An unexpected error occurred.',
    retry: 'Retry',
    network: 'Network error. Check your connection.',
  },
};
