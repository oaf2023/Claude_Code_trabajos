/* ============================================================================
* Archivo         : TrialService.ts
* Descripción     : Cliente HTTP para sincronización de contactos de emergencia
*                   con safealert_tel.db en PythonAnywhere y verificación del
*                   período de prueba de 10 días.
*                   [FASE 6] Usa uid (Firebase Auth) como identificador principal.
* Autor           : oafon
* Fecha           : 2026-04-10 · 2026-09-06 (Fase 6)
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : TrialService.syncContacto(...) / TrialService.checkPrueba(...)
* ============================================================================ */

import { PA_API_URL, AUDIO_ALERT_API_KEY } from '../config/features';

/* ============================================================================
* Función         : buildHeaders
* Descripción     : Construye los headers comunes para las llamadas a la API.
* Fecha           : 2026-04-10
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : TrialService
* Ingesta         : void
* Devolución      : Record<string, string>
* Uso             : Interno
* ============================================================================ */
function buildHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': AUDIO_ALERT_API_KEY || '',
  };
}

export interface EstadoPrueba {
  activo: boolean;
  expirado: boolean;
  pago: boolean;
  fechaExpiracion: string | null;
}

export const TrialService = {
  /* ============================================================================
  * Función         : syncContacto
  * Descripción     : [FASE 6] Sincroniza un contacto con safealert_tel.db usando
  *                   uid (Firebase Auth) como identificador principal. El device_id
  *                   se envía como campo adicional para trazabilidad.
  * Fecha           : 2026-04-10 · 2026-09-06 (Fase 6)
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : flask_app.py /api/tel/contacto
  * Ingesta         : uid, nombre, telefono, principal, deviceId?
  * Devolución      : Promise<void>
  * Uso             : await TrialService.syncContacto(uid, 'Ana', '+5491155...', true)
  * ============================================================================ */
  async syncContacto(
    uid: string,
    nombre: string,
    telefono: string,
    principal: boolean,
    deviceId?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${PA_API_URL}/api/tel/contacto`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ uid, device_id: deviceId || '', nombre, telefono, principal }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.warn('[TrialService] syncContacto error HTTP', response.status, body);
      }
    } catch (error) {
      console.warn('[TrialService] syncContacto fallo de red:', error);
    }
  },

  /* ============================================================================
  * Función         : borrarContacto
  * Descripción     : [FASE 6] Marca un contacto como borrado usando uid como
  *                   identificador principal.
  * Fecha           : 2026-04-10 · 2026-09-06 (Fase 6)
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : flask_app.py /api/tel/contacto/borrar
  * Ingesta         : uid, telefono, deviceId?
  * Devolución      : Promise<void>
  * Uso             : await TrialService.borrarContacto(uid, '+5491155...')
  * ============================================================================ */
  async borrarContacto(uid: string, telefono: string, deviceId?: string): Promise<void> {
    try {
      const response = await fetch(`${PA_API_URL}/api/tel/contacto/borrar`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify({ uid, device_id: deviceId || '', telefono }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.warn('[TrialService] borrarContacto error HTTP', response.status, body);
      }
    } catch (error) {
      console.warn('[TrialService] borrarContacto fallo de red:', error);
    }
  },

  /* ============================================================================
  * Función         : checkPrueba
  * Descripción     : [FASE 6] Consulta el estado del período de prueba usando
  *                   uid o device_id como identificador.
  * Fecha           : 2026-04-10 · 2026-09-06 (Fase 6)
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : flask_app.py /api/tel/prueba/<identifier>
  * Ingesta         : identifier: string (uid o device_id)
  * Devolución      : Promise<EstadoPrueba>
  * Uso             : const estado = await TrialService.checkPrueba(uid)
  * ============================================================================ */
  async checkPrueba(identifier: string): Promise<EstadoPrueba> {
    try {
      const response = await fetch(
        `${PA_API_URL}/api/tel/prueba/${encodeURIComponent(identifier)}`,
        { headers: buildHeaders() }
      );
      if (!response.ok) {
        return { activo: false, expirado: false, pago: false, fechaExpiracion: null };
      }
      const data = await response.json();
      return {
        activo: !!data.activo,
        expirado: !!data.expirado,
        pago: !!data.pago,
        fechaExpiracion: data.fecha_expiracion ?? null,
      };
    } catch (error) {
      console.warn('[TrialService] checkPrueba fallo de red:', error);
      return { activo: false, expirado: false, pago: false, fechaExpiracion: null };
    }
  },
};
