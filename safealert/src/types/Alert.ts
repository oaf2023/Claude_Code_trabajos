export type AlertStatus = 'pending' | 'sent' | 'partial' | 'failed';
export type SMSStatus = 'pending' | 'sent' | 'failed';

export interface AlertLocation {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
  isStale?: boolean; // true if using last known location
  staleMinutes?: number;
}

export interface AlertContact {
  name: string;
  phone: string;
  smsStatus: SMSStatus;
  provider?: string | null;
  providerMessageId?: string | null;
  attempts?: number;
  lastError?: string | null;
}

export interface Alert {
  id: string;
  userId: string;
  triggeredAt: number;
  triggerWord: string; // 'manual' | 'ayuda' | 'socorro' | etc.
  location: AlertLocation;
  mapsLink: string;
  audioUrl: string | null;
  audioPath?: string | null;
  messageTemplate: string;
  contacts: AlertContact[];
  status: AlertStatus;
  isTest?: boolean;
}
