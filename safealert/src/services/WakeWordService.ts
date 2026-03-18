/* ============================================================================
* Archivo         : WakeWordService.ts
* Descripción     : Servicio para la detección de palabras de activación (Wake Word) usando Picovoice Porcupine.
* Autor           : oafon
* Fecha           : 2026-03-18
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.0
* Uso             : WakeWordService.start() para iniciar la escucha activa.
* ============================================================================ */

import {
  PorcupineManager,
  PorcupineErrors,
} from '@picovoice/porcupine-react-native';
import { Platform } from 'react-native';
import { useGuardStore } from '../stores/useGuardStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { PORCUPINE_SENSITIVITY } from '../config/constants';

let porcupineManager: PorcupineManager | null = null;

export const WakeWordService = {
  /* ============================================================================
  * Función         : start
  * Descripción     : Inicializa y comienza la escucha de palabras clave (ayuda, socorro).
  * Fecha           : 2026-03-18
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.0
  * Conexiones      : Conecta con Picovoice SDK y GuardStore.
  * Ingesta         : N/A (Lee de SettingsStore internamente)
  * Devolución      : Promise<void>
  * Uso             : await WakeWordService.start()
  * ============================================================================ */
  async start() {
    if (porcupineManager) return;

    const { triggerWords, wakeWordSensitivity } = useSettingsStore.getState();
    const accessKey = process.env.EXPO_PUBLIC_PORCUPINE_ACCESS_KEY;

    if (!accessKey) {
      console.warn('[WakeWordService] No Access Key found. Wake word disabled.');
      return;
    }

    try {
      // Mapeo de archivos .ppn según plataforma
      const keywordPaths = Platform.select({
        ios: {
          ayuda: 'keywords/ayuda_ios.ppn',
          socorro: 'keywords/socorro_ios.ppn',
        },
        android: {
          ayuda: 'keywords/ayuda_android.ppn',
          socorro: 'keywords/socorro_android.ppn',
        },
      });

      const activePaths = triggerWords
        .map((w) => (keywordPaths as any)[w])
        .filter(Boolean);
      const sensitivities = activePaths.map(() => wakeWordSensitivity || PORCUPINE_SENSITIVITY);

      porcupineManager = await PorcupineManager.fromKeywordPaths(
        accessKey,
        activePaths,
        (keywordIndex) => {
          const detected = triggerWords[keywordIndex];
          console.log(`[WakeWordService] Palabra detectada: ${detected}`);
          // Emitir evento o llamar a store directamente
          // useAlert hook escucha cambios en el estado o eventos
        },
        (error) => {
          console.error('[WakeWordService] Error en Porcupine:', error);
        },
        'model/porcupine_model_es.pv', // Modelo en español
        sensitivities
      );

      await porcupineManager.start();
      console.log('[WakeWordService] Escucha activa iniciada.');
    } catch (e) {
      console.error('[WakeWordService] Error al inicializar:', e);
      porcupineManager = null;
    }
  },

  /* ============================================================================
  * Función         : stop
  * Descripción     : Detiene la escucha y libera los recursos del manager.
  * Fecha           : 2026-03-18
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.0
  * Conexiones      : N/A
  * Ingesta         : N/A
  * Devolución      : Promise<void>
  * Uso             : await WakeWordService.stop()
  * ============================================================================ */
  async stop() {
    if (porcupineManager) {
      await porcupineManager.stop();
      await porcupineManager.delete();
      porcupineManager = null;
      console.log('[WakeWordService] Escucha detenida.');
    }
  },
};
