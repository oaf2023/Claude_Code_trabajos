/* ============================================================================
* Archivo         : WakeWordService.ts
* Descripción     : Versión temporal desactivada (Mock) de detección de voz.
* Autor           : oafon
* Fecha           : 2026-03-18
* Versión         : 2.0.1
* Lenguaje        : TypeScript 5.0
* Uso             : WakeWordService.start() (Desactivado).
* ============================================================================ */

import { Platform } from 'react-native';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useGuardStore } from '../stores/useGuardStore';

export const WakeWordService = {
  /* ============================================================================
  * Función         : start
  * Descripción     : Versión dummy, no hace nada.
  * Fecha           : 2026-03-18
  * Versión         : 2.0.1
  * ============================================================================ */
  async start() {
    console.log('[WakeWordService] Activación por voz desactivada temporalmente para evitar problemas de dependencias.');
  },

  /* ============================================================================
  * Función         : stop
  * Descripción     : Versión dummy, no hace nada.
  * Fecha           : 2026-03-18
  * Versión         : 2.0.1
  * ============================================================================ */
  async stop() {
    console.log('[WakeWordService] Motor de voz (fantasma) detenido.');
  },
};
