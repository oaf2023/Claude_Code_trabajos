/* ============================================================================
* Archivo         : AudioAlertApiService.ts
* Descripción     : Cliente HTTP para detección remota de alertas por audio.
* Autor           : oafon
* Fecha           : 2026-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AudioAlertApiService.detectAlertFromFile(uri, keywords)
* ============================================================================ */

import {
  AUDIO_ALERT_API_KEY,
  AUDIO_ALERT_API_URL,
  AUDIO_ALERT_LANGUAGE,
  AUDIO_ALERT_THRESHOLD,
  PA_API_URL,
  REMOTE_AUDIO_GUARD_CONFIGURED,
} from '../config/features';
import { DeviceService } from './DeviceService';

interface AudioAlertApiDiffMatch {
  token: string;
  keyword: string;
  score: number;
}

interface AudioAlertApiResponse {
  ok: boolean;
  alerta_detectada?: boolean;
  texto_normalizado?: string;
  texto_crudo?: string;
  coincidencias_exactas?: string[];
  coincidencias_difusas?: AudioAlertApiDiffMatch[];
  mejor_match?: AudioAlertApiDiffMatch | null;
  detail?: string;
}

export interface AudioAlertDetectionResult {
  alertDetected: boolean;
  transcript: string;
  matchedKeyword: string | null;
  exactMatches: string[];
  fuzzyMatches: AudioAlertApiDiffMatch[];
}

function normalizeMatches(matches: string[] | undefined): string[] {
  return (matches || []).map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function resolveMatchedKeyword(response: AudioAlertApiResponse): string | null {
  const exactMatches = normalizeMatches(response.coincidencias_exactas);
  if (exactMatches.length > 0) {
    return exactMatches[0];
  }

  const fuzzyKeyword = response.mejor_match?.keyword?.trim().toLowerCase();
  return fuzzyKeyword || null;
}

export const AudioAlertApiService = {
  /* ============================================================================
  * Función         : isConfigured
  * Descripción     : Indica si la configuración remota de guardia por audio está disponible.
  * Fecha           : 2026-03-30
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : WakeWordService
  * Ingesta         : Sin argumentos
  * Devolución      : boolean
  * Uso             : AudioAlertApiService.isConfigured()
  * ============================================================================ */
  isConfigured(): boolean {
    return REMOTE_AUDIO_GUARD_CONFIGURED;
  },

  /* ============================================================================
  * Función         : detectAlertFromFile
  * Descripción     : Envía un audio local al backend remoto y normaliza la detección.
  * Fecha           : 2026-03-30
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : WakeWordService, API PythonAnywhere
  * Ingesta         : fileUri, keywords
  * Devolución      : Promise<AudioAlertDetectionResult>
  * Uso             : await AudioAlertApiService.detectAlertFromFile(uri, ['ayuda'])
  * ============================================================================ */
  async detectAlertFromFile(
    fileUri: string,
    keywords: string[]
  ): Promise<AudioAlertDetectionResult> {
    if (!this.isConfigured()) {
      throw new Error('La API remota de guardia por audio no está configurada.');
    }

    const payload = new FormData();
    payload.append('archivo', {
      uri: fileUri,
      name: 'guard-snippet.m4a',
      type: 'audio/m4a',
    } as any);
    payload.append('language', AUDIO_ALERT_LANGUAGE);
    payload.append('threshold', String(AUDIO_ALERT_THRESHOLD));
    if (keywords.length > 0) {
      payload.append('keywords', keywords.join(','));
    }

    const response = await fetch(AUDIO_ALERT_API_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': AUDIO_ALERT_API_KEY,
        Accept: 'application/json',
      },
      body: payload,
    });

    const responseText = await response.text();
    const data = JSON.parse(responseText) as AudioAlertApiResponse;

    if (!response.ok || !data.ok) {
      throw new Error(data.detail || 'La API remota rechazó el análisis del audio.');
    }

    return {
      alertDetected: Boolean(data.alerta_detectada),
      transcript: data.texto_normalizado?.trim() || data.texto_crudo?.trim() || '',
      matchedKeyword: resolveMatchedKeyword(data),
      exactMatches: normalizeMatches(data.coincidencias_exactas),
      fuzzyMatches: data.coincidencias_difusas || [],
    };
  },

  /* ============================================================================
  * Función         : uploadSecurityRecording
  * Descripción     : Sincroniza la grabación de seguridad de 1 minuto con PythonAnywhere.
  *                   Nombre del archivo: {deviceUniqueId}_{timestamp}.m4a
  * Fecha           : 2026-04-09
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : AlertService, PythonAnywhere Backend, DeviceService
  * Ingesta         : fileUri: string, alertId: string, userId: string
  * Devolución      : Promise<boolean>
  * Uso             : await AudioAlertApiService.uploadSecurityRecording(uri, id, user)
  * ============================================================================ */
  async uploadSecurityRecording(
    fileUri: string,
    alertId: string,
    userId: string
  ): Promise<boolean> {
    try {
      if (!PA_API_URL || !AUDIO_ALERT_API_KEY) {
        return false;
      }

      // Detectar extensión real del archivo generado por expo-av
      const ext = fileUri.split('.').pop()?.toLowerCase() ?? 'm4a';
      const allowedExt = ['m4a', 'mp4', 'aac', 'wav', 'caf'].includes(ext) ? ext : 'm4a';

      // Obtener identificador único del equipo con fallback seguro
      const deviceId = (await DeviceService.getDeviceUniqueId().catch(() => 'unknown'))
        .replace(/[^a-zA-Z0-9_\-]/g, '_')
        .slice(0, 36);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename  = `${deviceId}_${timestamp}.${allowedExt}`;

      const payload = new FormData();
      payload.append('archivo', {
        uri: fileUri,
        name: filename,
        type: `audio/${allowedExt}`,
      } as any);
      payload.append('alertId', alertId);
      payload.append('userId', userId);
      payload.append('duration', '60');
      payload.append('filename', filename);

      const endpoint = `${PA_API_URL}/api/security/upload-recording`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-API-Key': AUDIO_ALERT_API_KEY,
          Accept: 'application/json',
        },
        body: payload,
      });

      return response.ok;
    } catch (error) {
      console.warn('[AudioAlertApiService] Fallo al subir grabación a PythonAnywhere:', error);
      return false;
    }
  },
};