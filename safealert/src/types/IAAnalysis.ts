/* ============================================================================
* Archivo         : IAAnalysis.ts
* Descripción     : Tipos e interfaces para el análisis de IA de alertas.
* Autor           : oafon
* Fecha           : 2026-03-21
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* ============================================================================ */

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface IAAnalysis {
  transcript?: string;
  detectedEmotion?: string;
  urgencyScore: number; // 0 to 1
  urgencyLevel: UrgencyLevel;
  keyKeywords: string[];
  backgroundNoiseContext?: string;
  recommendedAction?: string;
  processedAt: number;
}

export interface IAProcessResult {
  alertId: string;
  analysis: IAAnalysis;
  status: 'success' | 'failed';
}
