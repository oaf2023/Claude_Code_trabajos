/* ============================================================================
* Archivo         : WakeWordService.ts
* Descripción     : Servicio para la detección de palabras de activación (Wake Word) usando DaVoice.io SDK.
* Autor           : oafon
* Fecha           : 2026-03-18
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.0
* Uso             : WakeWordService.start() para iniciar la escucha activa mediante DaVoice.
* ============================================================================ */

import {
  WakeWordManager,
} from 'react-native-wakeword';
import { Platform } from 'react-native';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useGuardStore } from '../stores/useGuardStore';

let wakeWordManager: WakeWordManager | null = null;

export const WakeWordService = {
  /* ============================================================================
  * Función         : start
  * Descripción     : Inicializa el motor DaVoice.io y comienza la detección de "ayuda" y "socorro".
  * Fecha           : 2026-03-18
  * Versión         : 2.0.0
  * Lenguaje        : TypeScript 5.0
  * Conexiones      : DaVoice SDK, GuardStore, SettingsStore.
  * Ingesta         : N/A (Usa claves de entorno y estado de settings)
  * Devolución      : Promise<void>
  * Uso             : await WakeWordService.start()
  * ============================================================================ */
  async start() {
    if (wakeWordManager) return;

    const { wakeWordSensitivity } = useSettingsStore.getState();
    const sdkKey = process.env.EXPO_PUBLIC_DAVOICE_SDK_KEY;

    if (!sdkKey) {
      console.warn('[WakeWordService] No DaVoice SDK Key found. Wake word disabled.');
      return;
    }

    try {
      // Configuración de modelos .onnx (estándar DaVoice)
      const modelPath = Platform.select({
        ios: 'models/wakeword_es.onnx',
        android: 'models/wakeword_es.onnx',
      });

      // Inicialización de DaVoice Manager
      wakeWordManager = new WakeWordManager(sdkKey, {
        modelPath: modelPath!,
        threshold: wakeWordSensitivity || 0.7,
        onKeywordDetected: (keyword: string) => {
          console.log(`[WakeWordService] Palabra detectada: ${keyword}`);
          // Disparamos lógica de alerta
        },
        onError: (error: any) => {
          console.error('[WakeWordService] DaVoice Error:', error);
        }
      });

      await wakeWordManager.start();
      console.log('[WakeWordService] Motor DaVoice iniciado correctamente.');
    } catch (e) {
      console.error('[WakeWordService] Error al inicializar DaVoice:', e);
      wakeWordManager = null;
    }
  },

  /* ============================================================================
  * Función         : stop
  * Descripción     : Detiene la escucha de DaVoice y libera recursos.
  * Fecha           : 2026-03-18
  * Versión         : 2.0.0
  * Lenguaje        : TypeScript 5.0
  * Conexiones      : N/A
  * Ingesta         : N/A
  * Devolución      : Promise<void>
  * Uso             : await WakeWordService.stop()
  * ============================================================================ */
  async stop() {
    if (wakeWordManager) {
      await wakeWordManager.stop();
      wakeWordManager = null;
      console.log('[WakeWordService] Motor DaVoice detenido.');
    }
  },
};
