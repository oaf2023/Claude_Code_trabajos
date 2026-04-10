/* ============================================================================
* Archivo         : TrialService.ts
* Descripción     : Cliente HTTP para sincronización de contactos de emergencia
*                   con safealert_tel.db en PythonAnywhere y verificación del
*                   período de prueba de 10 días.
* Autor           : oafon
* Fecha           : 2026-04-10
* Versión         : 1.0.0
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
  * Descripción     : Sincroniza un contacto de emergencia con safealert_tel.db.
  *                   Se llama al agregar un contacto en la app. Si es el primer
  *                   contacto del equipo, el backend inicia el período de prueba.
  * Fecha           : 2026-04-10
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : flask_app.py /api/tel/contacto
  * Ingesta         : device_id, nombre, telefono, principal
  * Devolución      : Promise<void>
  * Uso             : await TrialService.syncContacto(deviceId, 'Ana', '+5491155...', true)
  * ============================================================================ */
  async syncContacto(
    device_id: string,
    nombre: string,
    telefono: string,
    principal: boolean
  ): Promise<void> {
    try {
      const response = await fetch(`${PA_API_URL}/api/tel/contacto`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ device_id, nombre, telefono, principal }),
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
  * Descripción     : Marca un contacto como borrado (borrado=1) en safealert_tel.db.
  *                   El registro queda persistido pero inactivo (borrado lógico).
  * Fecha           : 2026-04-10
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : flask_app.py /api/tel/contacto/borrar
  * Ingesta         : device_id, telefono
  * Devolución      : Promise<void>
  * Uso             : await TrialService.borrarContacto(deviceId, '+5491155...')
  * ============================================================================ */
  async borrarContacto(device_id: string, telefono: string): Promise<void> {
    try {
      const response = await fetch(`${PA_API_URL}/api/tel/contacto/borrar`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify({ device_id, telefono }),
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
  * Descripción     : Consulta el estado del período de prueba del equipo.
  *                   Retorna si el período está activo, expirado y si el usuario pagó.
  *                   Si hay error de red o el device no tiene período registrado,
  *                   retorna activo=false, expirado=false para no bloquear al usuario.
  * Fecha           : 2026-04-10
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : flask_app.py /api/tel/prueba/<device_id>
  * Ingesta         : device_id: string
  * Devolución      : Promise<EstadoPrueba>
  * Uso             : const estado = await TrialService.checkPrueba(deviceId)
  * ============================================================================ */
  async checkPrueba(device_id: string): Promise<EstadoPrueba> {
    try {
      const response = await fetch(
        `${PA_API_URL}/api/tel/prueba/${encodeURIComponent(device_id)}`,
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
