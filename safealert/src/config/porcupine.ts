// Configuración de detección de voz
// Porcupine se agregará cuando esté disponible el Access Key de Picovoice

export const PORCUPINE_ACCESS_KEY =
  process.env.EXPO_PUBLIC_PORCUPINE_ACCESS_KEY || '';

export const PORCUPINE_SENSITIVITY = 0.7;

export const KEYWORD_LABELS = ['ayuda', 'socorro', 'auxilio'];

export const getKeywordPaths = (): string[] => [];
