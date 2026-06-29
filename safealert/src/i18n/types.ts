/* ============================================================================
* Archivo         : types.ts
* Descripción     : Tipo compartido para todas las traducciones.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : import type { Translations } from './types';
* ============================================================================ */

export interface Translations {
  app: { name: string; tagline: string };
  home: {
    guardActive: string;
    guardInactive: string;
    activate: string;
    deactivate: string;
    alertDetected: string;
    sending: string;
    guardActiveShort: string;
    panic: string;
    panicSub: string;
    testAlert: string;
    noContacts: string;
    noContactsSub: string;
    contactsCount: string;
  };
  alert: {
    pending: string;
    partial: string;
    failed: string;
    sent: string;
    cancel: string;
    dismiss: string;
    incognito: string;
    cancelHold: string;
    keyword: string;
    sendingTo: string;
    locating: string;
    sendingMsg: string;
  };
  protection: { active: string; limited: string; stopped: string };
  contacts: {
    title: string;
    empty: string;
    emptySub: string;
    add: string;
    edit: string;
    delete: string;
    deleteConfirm: string;
    priority: string;
    activeCount: string;
    headerHint: string;
    loading: string;
  };
  history: {
    title: string;
    empty: string;
    emptySub: string;
    noSession: string;
    noSessionSub: string;
    deliveries: string;
    test: string;
  };
  settings: {
    title: string;
    howToUse: string;
    permissions: string;
    audio: string;
    audioSub: string;
    reminders: string;
    remindersSub: string;
    template: string;
    templateSub: string;
    templateSave: string;
    voice: string;
    voiceSub: string;
    addWord: string;
    addWordBtn: string;
    sensitivity: string;
    sensitivityLow: string;
    sensitivityMedium: string;
    sensitivityHigh: string;
    countdown: string;
    countdownSub: string;
    privacy: string;
    privacyAction: string;
  };
  permissions: {
    title: string;
    location: string;
    locationSub: string;
    notifications: string;
    notificationsSub: string;
    microphone: string;
    microphoneSub: string;
    contacts: string;
    contactsSub: string;
    grantAll: string;
  };
  onboarding: {
    welcome: string;
    welcomeSub: string;
    start: string;
    alreadyRegistered: string;
    howItWorks: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    understand: string;
  };
  errors: {
    noContacts: string;
    sessionNotReady: string;
    generic: string;
    retry: string;
    network: string;
  };
}
