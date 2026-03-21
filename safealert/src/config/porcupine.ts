/* ============================================================================
* Archivo         : porcupine.ts
* Descripción     : Configuración declarativa del feature flag de wake word.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Importar flags de disponibilidad de wake word.
* ============================================================================ */

import {
  WAKE_WORD_DISABLED_REASON,
  WAKE_WORD_ENABLED,
} from './features';

export const PORCUPINE_ACCESS_KEY = '';
export const PORCUPINE_SENSITIVITY = 0.7;
export const KEYWORD_LABELS = ['ayuda', 'socorro', 'auxilio'];
export const PORCUPINE_FEATURE_ENABLED = WAKE_WORD_ENABLED;
export const PORCUPINE_UNAVAILABLE_REASON = WAKE_WORD_DISABLED_REASON;

export const getKeywordPaths = (): string[] => [];
