/* ============================================================================
* Archivo         : DeviceService.ts
* Descripción     : Genera y persiste un ID de dispositivo estable basado en UUID v4
*                   almacenado en AsyncStorage. Incluye obtención de MAC address
*                   y unique ID del dispositivo para registro en backend.
* Autor           : oafon
* Fecha           : 2026-04-07
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { DeviceService } from '../services/DeviceService';
*                   const id = await DeviceService.getDeviceId();
*                   const mac = await DeviceService.getMacAddress();
* ============================================================================ */

import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

const STORAGE_KEY = '@safealert/device_id';

/* ============================================================================
* Función         : generateUUID
* Descripción     : Genera un UUID v4 con el prefijo "sa-" para identificar
*                   dispositivos SafeAlert. Sin dependencias nativas.
* Fecha           : 2026-04-01
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : getDeviceId
* Ingesta         : void
* Devolución      : string  — e.g. "sa-550e8400-e29b-41d4-a716-446655440000"
* Uso             : const id = generateUUID()
* ============================================================================ */
function generateUUID(): string {
  const hex = '0123456789abcdef';
  let uuid = 'sa-';
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

  for (let i = 0; i < template.length; i++) {
    const ch = template[i];
    if (ch === 'x') {
      uuid += hex[Math.floor(Math.random() * 16)];
    } else if (ch === 'y') {
      uuid += hex[(Math.floor(Math.random() * 4) + 8)];
    } else {
      uuid += ch;
    }
  }
  return uuid;
}

/* ============================================================================
* Función         : getDeviceId
* Descripción     : Recupera el ID de dispositivo persistido en AsyncStorage.
*                   Si no existe, genera uno nuevo y lo almacena.
*                   El ID es estable durante toda la vida de la instalación.
* Fecha           : 2026-04-01
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : AsyncStorage, generateUUID
* Ingesta         : void
* Devolución      : Promise<string>
* Uso             : const deviceId = await DeviceService.getDeviceId()
* ============================================================================ */
async function getDeviceId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && stored.startsWith('sa-')) {
      return stored;
    }
    const newId = generateUUID();
    await AsyncStorage.setItem(STORAGE_KEY, newId);
    return newId;
  } catch (error) {
    console.error('[DeviceService] Error accediendo AsyncStorage:', error);
    // Fallback temporal: no persiste pero evita crash
    return generateUUID();
  }
}

/* ============================================================================
* Función         : getMacAddress
* Descripción     : Obtiene la dirección MAC del dispositivo.
*                   En Android 6+ (API 23+) la API pública retorna "02:00:00:00:00:00"
*                   por restricciones de privacidad. En ese caso devuelve vacío
*                   para que el backend use device_unique_id como identificador.
* Fecha           : 2026-04-07
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : react-native-device-info, PaymentService
* Ingesta         : void
* Devolución      : Promise<string>  — MAC real, "02:00:00:00:00:00" o vacío en error
* Uso             : const mac = await DeviceService.getMacAddress()
* ============================================================================ */
async function getMacAddress(): Promise<string> {
  try {
    const mac = await DeviceInfo.getMacAddress();
    return mac ?? '';
  } catch (error) {
    console.warn('[DeviceService] getMacAddress no disponible:', error);
    return '';
  }
}

/* ============================================================================
* Función         : getDeviceUniqueId
* Descripción     : Obtiene el identificador único persistente del dispositivo.
*                   En Android retorna ANDROID_ID; en iOS retorna identifierForVendor.
*                   Es más confiable que MAC address en dispositivos modernos.
* Fecha           : 2026-04-07
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : react-native-device-info, PaymentService
* Ingesta         : void
* Devolución      : Promise<string>
* Uso             : const uid = await DeviceService.getDeviceUniqueId()
* ============================================================================ */
async function getDeviceUniqueId(): Promise<string> {
  try {
    return await DeviceInfo.getUniqueId();
  } catch (error) {
    console.warn('[DeviceService] getDeviceUniqueId no disponible:', error);
    return '';
  }
}

/* ============================================================================
* Función         : isEmulator
* Descripción     : Detecta si la aplicación se está ejecutando en un emulador
*                   (Android Studio AVD o iOS Simulator) versus dispositivo real.
* Fecha           : 2026-04-09
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : react-native-device-info, PaymentModal
* Ingesta         : void
* Devolución      : Promise<boolean>
* Uso             : const emu = await DeviceService.isEmulator()
* ============================================================================ */
async function isEmulator(): Promise<boolean> {
  try {
    return await DeviceInfo.isEmulator();
  } catch (error) {
    console.warn('[DeviceService] isEmulator check error:', error);
    return false;
  }
}

export const DeviceService = {
  getDeviceId,
  getMacAddress,
  getDeviceUniqueId,
  isEmulator,
};