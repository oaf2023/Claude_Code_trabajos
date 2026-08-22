/* ============================================================================
* Archivo         : LocationApiClient.ts
* Descripción     : Cliente HTTP para los endpoints de ubicación del
*                   Prompt Maestro. Envía ubicaciones, accesos y
*                   consentimientos al backend PythonAnywhere.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : flask_app.py (endpoints /api/v1/)
* Ingesta         : Payloads de ubicación, acceso y consentimiento
* Devolución      : Promises con respuesta del servidor
* ============================================================================ */

import { PA_API_URL } from '../config/features';
import { LocationPayload, ConsentPayload, AccesoPayload } from '../types/Location';

const API_BASE = `${PA_API_URL}/api/v1`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const { getIdToken } = await import('../config/firebase');
    const token = await getIdToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    /* Sin autenticación */
  }
  return headers;
}

export const LocationApiClient = {
  async enviarUbicacion(payload: LocationPayload): Promise<{ success: boolean; id?: number }> {
    const headers = await getAuthHeaders();
    try {
      const resp = await fetch(`${API_BASE}/ubicaciones`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        console.warn('[LocationApi] Error enviando ubicación:', resp.status);
        return { success: false };
      }
      return await resp.json();
    } catch (err) {
      console.warn('[LocationApi] Error de red:', err);
      return { success: false };
    }
  },

  async enviarUbicacionManual(payload: LocationPayload): Promise<{ success: boolean; id?: number }> {
    const headers = await getAuthHeaders();
    try {
      const resp = await fetch(`${API_BASE}/ubicaciones/manual`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        console.warn('[LocationApi] Error enviando ubicación manual:', resp.status);
        return { success: false };
      }
      return await resp.json();
    } catch (err) {
      console.warn('[LocationApi] Error de red:', err);
      return { success: false };
    }
  },

  async registrarAcceso(payload: AccesoPayload): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    try {
      const resp = await fetch(`${API_BASE}/accesos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      return { success: resp.ok };
    } catch {
      return { success: false };
    }
  },

  async registrarConsentimiento(payload: ConsentPayload): Promise<{ success: boolean; id?: number }> {
    const headers = await getAuthHeaders();
    try {
      const resp = await fetch(`${API_BASE}/consentimientos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!resp.ok) return { success: false };
      return await resp.json();
    } catch {
      return { success: false };
    }
  },

  async revocarConsentimiento(usuario_id: string, tipo_permiso: string, sesion_id?: string): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    try {
      const resp = await fetch(`${API_BASE}/consentimientos/revocar`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ usuario_id, tipo_permiso, sesion_id }),
      });
      return { success: resp.ok };
    } catch {
      return { success: false };
    }
  },

  async obtenerUltimaUbicacion(usuario_id: string): Promise<any> {
    const headers = await getAuthHeaders();
    try {
      const resp = await fetch(`${API_BASE}/ubicaciones/ultima/${usuario_id}`, { headers });
      if (!resp.ok) return null;
      return await resp.json();
    } catch {
      return null;
    }
  },
};
