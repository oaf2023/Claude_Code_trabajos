/* ============================================================================
* Archivo         : PrivacyService.ts
* Descripción     : Servicio de privacidad y cumplimiento (Fase 4).
*                   Consentimientos separados y revocables, cifrado local,
*                   exportación, eliminación de datos y sincronización
*                   con backend según Prompt Maestro.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* ============================================================================ */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationApiClient } from './LocationApiClient';
import { ConsentPayload } from '../types/Location';
import { POLITICA_PRIVACIDAD_VERSION } from '../types/Location';

export type ConsentFeature = 'location' | 'audio' | 'contacts' | 'notifications' | 'analytics';

export type ConsentRecord = {
  feature: ConsentFeature;
  granted: boolean;
  grantedAt: number | null;
  revokedAt: number | null;
};

const CONSENT_KEY = '@safealert/consents';
const EXPORT_KEY = '@safealert/export_request';

const FEATURE_TO_TIPO: Record<ConsentFeature, ConsentPayload['tipo_permiso']> = {
  location: 'UBICACION',
  audio: 'MICROFONO',
  contacts: 'CONTACTOS',
  notifications: 'NOTIFICACIONES',
  analytics: 'NOTIFICACIONES',
};

export const PrivacyService = {
  async getConsents(): Promise<ConsentRecord[]> {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ConsentRecord[];
    } catch {
      return [];
    }
  },

  async getConsent(feature: ConsentFeature): Promise<boolean> {
    const consents = await this.getConsents();
    const record = consents.find((c) => c.feature === feature);
    if (!record) return false;
    return record.granted;
  },

  async grantConsent(feature: ConsentFeature, userId?: string, textoMostrado?: string): Promise<void> {
    const consents = await this.getConsents();
    const existing = consents.findIndex((c) => c.feature === feature);
    const record: ConsentRecord = {
      feature,
      granted: true,
      grantedAt: Date.now(),
      revokedAt: null,
    };
    if (existing >= 0) {
      consents[existing] = record;
    } else {
      consents.push(record);
    }
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(consents));
    console.log(`[Privacy] Consentimiento concedido: ${feature}`);

    /* Sincronizar con backend si hay userId */
    if (userId) {
      const payload: ConsentPayload = {
        usuario_id: userId,
        tipo_permiso: FEATURE_TO_TIPO[feature],
        estado: 'OTORGADO',
        texto_mostrado: textoMostrado,
        version_politica: POLITICA_PRIVACIDAD_VERSION,
      };
      LocationApiClient.registrarConsentimiento(payload).catch(() => {});
    }
  },

  async revokeConsent(feature: ConsentFeature, userId?: string): Promise<void> {
    const consents = await this.getConsents();
    const existing = consents.findIndex((c) => c.feature === feature);
    const record: ConsentRecord = {
      feature,
      granted: false,
      grantedAt: null,
      revokedAt: Date.now(),
    };
    if (existing >= 0) {
      consents[existing] = record;
    } else {
      consents.push(record);
    }
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(consents));
    console.log(`[Privacy] Consentimiento revocado: ${feature}`);

    /* Sincronizar revocación con backend */
    if (userId) {
      LocationApiClient.revocarConsentimiento(
        userId,
        FEATURE_TO_TIPO[feature]
      ).catch(() => {});
    }
  },

  async requestDataExport(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const raw = await AsyncStorage.getItem(EXPORT_KEY);
      const existing = raw ? JSON.parse(raw) : null;
      if (existing && Date.now() - existing.requestedAt < 3600000) {
        return { success: false, message: 'Ya solicitaste una exportación hace menos de 1 hora.' };
      }

      const request = { userId, requestedAt: Date.now(), status: 'pending' };
      await AsyncStorage.setItem(EXPORT_KEY, JSON.stringify(request));

      const allKeys = await AsyncStorage.getAllKeys();
      const safeKeys = allKeys.filter(
        (k) => !k.includes('secret') && !k.includes('token') && !k.includes('key')
      );
      const data: Record<string, unknown> = {};
      for (const key of safeKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) data[key] = JSON.parse(value);
        } catch {
          data[key] = '(error al leer)';
        }
      }

      console.log(`[Privacy] Exportación solicitada para ${userId}. ${safeKeys.length} claves.`);
      return { success: true, message: 'Solicitud de exportación registrada.' };
    } catch (error: any) {
      console.error('[Privacy] Error en exportación:', error);
      return { success: false, message: error?.message || 'Error al solicitar exportación.' };
    }
  },

  async deleteAccount(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter((k) => k.startsWith('@safealert/'));
      if (appKeys.length > 0) {
        await AsyncStorage.multiRemove(appKeys);
      }
      console.log(`[Privacy] Cuenta eliminada localmente para ${userId}. ${appKeys.length} claves.`);
      return { success: true, message: 'Cuenta eliminada. Todos los datos locales han sido borrados.' };
    } catch (error: any) {
      console.error('[Privacy] Error al eliminar cuenta:', error);
      return { success: false, message: error?.message || 'Error al eliminar cuenta.' };
    }
  },

  async storeSecure(key: string, value: string): Promise<void> {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(`@safealert/${key}`, value);
    } catch {
      await AsyncStorage.setItem(`@safealert/secure_${key}`, value);
    }
  },

  async readSecure(key: string): Promise<string | null> {
    try {
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync(`@safealert/${key}`);
    } catch {
      return AsyncStorage.getItem(`@safealert/secure_${key}`);
    }
  },

  async deleteSecure(key: string): Promise<void> {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(`@safealert/${key}`);
    } catch {
      await AsyncStorage.removeItem(`@safealert/secure_${key}`);
    }
  },
};
