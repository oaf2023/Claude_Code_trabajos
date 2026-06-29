/* ============================================================================
* Archivo         : PythonAnywhereSync.ts
* Descripción     : Servicio para sincronización de perfiles con PythonAnywhere.
*                   ⚠️  Esta sincronización expone la clave en el cliente.
*                   Migrar a Firebase Function como proxy para eliminar
*                   este riesgo. Por ahora la clave se lee de variable de entorno.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { syncProfileToBackend } from './PythonAnywhereSync';
* ============================================================================ */

import { PA_API_URL } from '../config/features';

const PYTHONANYWHERE_API_URL = `${PA_API_URL}/api/v1/sync-user`;
const SYNC_SECRET_KEY = process.env.EXPO_PUBLIC_PA_SYNC_SECRET || '';

export interface UserProfileSync {
  userId: string;
  userName: string;
  userPhone: string;
  selfieUrl: string;
}

/* ============================================================================
* Función         : syncProfileToBackend
* Descripción     : Envía los datos reales del perfil a la DB central.
* Fecha           : 2026-03-30
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : API Endpoint: https://oaf.pythonanywhere.com/api/v1/sync-user
* Ingesta         : data: UserProfileSync
* Devolución      : Promise<{success: boolean, message: string}>
* Uso             : await syncProfileToBackend(profileData);
* ============================================================================ */
export const syncProfileToBackend = async (data: UserProfileSync): Promise<{success: boolean, message: string}> => {
  console.log(`[PythonAnywhereSync] Sincronizando perfil real para usuario: ${data.userId}`);
  
  try {
    const response = await fetch(PYTHONANYWHERE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Secret': SYNC_SECRET_KEY
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      console.log('[PythonAnywhereSync] Sincronización exitosa.');
      return { success: true, message: 'Perfil sincronizado correctamente.' };
    } else {
      const errorMsg = await response.text();
      console.error(`[PythonAnywhereSync] Error backend: ${response.status} - ${errorMsg}`);
      return { success: false, message: `Error de servidor: ${response.status}` };
    }
  } catch (error) {
    console.error('[PythonAnywhereSync] Error de red:', error);
    return { success: false, message: 'Error de red al conectar con PythonAnywhere.' };
  }
};

/* ============================================================================
* Función         : getRemoteLogs
* Descripción     : Obtiene logs remotos desde PythonAnywhere.
* Fecha           : 2026-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : API Endpoint: https://oaf.pythonanywhere.com/api/logs
* Ingesta         : limit: number
* Devolución      : Promise<string[]>
* Uso             : const logs = await getRemoteLogs(20);
* ============================================================================ */
export const getRemoteLogs = async (limit: number = 50): Promise<string[]> => {
  console.log(`[PythonAnywhereSync] Recuperando últimos ${limit} logs...`);
  
  try {
    const response = await fetch(`https://oaf.pythonanywhere.com/api/v1/logs?limit=${limit}`);
    if (response.ok) {
      return await response.json();
    }
    return ['Error al obtener logs remotos'];
  } catch (error) {
    return ['Error de conexión al obtener logs'];
  }
};
