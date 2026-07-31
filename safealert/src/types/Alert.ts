/* ============================================================================
* Archivo         : Alert.ts
* Descripción     : Tipos e interfaces del dominio de alertas SOS y ubicaciones.
*                   Ampliado con clasificación de origen del Prompt Maestro.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* ============================================================================ */

import { IAAnalysis } from './IAAnalysis';

export type AlertStatus = 'pending' | 'sent' | 'partial' | 'failed';
export type SMSStatus = 'pending' | 'sent' | 'failed';

export type LocationSource = 'GPS' | 'NAVEGADOR' | 'IP' | 'MANUAL';

export type PermissionStatusValue =
  | 'GRANTED'
  | 'DENIED'
  | 'PROMPT'
  | 'NO_DISPONIBLE'
  | 'NO_SOLICITADO'
  | 'ERROR';

export interface AlertLocation {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
  isStale?: boolean;
  staleMinutes?: number;
  /** Prompt Maestro: clasificación de origen obligatoria */
  source?: LocationSource;
  /** Prompt Maestro: estado del permiso de ubicación */
  permissionStatus?: PermissionStatusValue;
  /** Altitud en metros */
  altitude?: number;
  /** Velocidad en m/s */
  speed?: number;
  /** Rumbo en grados */
  direction?: number;
  /** Dirección confirmada (para origen MANUAL) */
  address?: string;
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
  triggerWord: string;
  location: AlertLocation;
  mapsLink: string;
  audioUrl: string | null;
  audioPath?: string | null;
  messageTemplate: string;
  contacts: AlertContact[];
  status: AlertStatus;
  iaAnalysis?: IAAnalysis;
  isTest?: boolean;
}
