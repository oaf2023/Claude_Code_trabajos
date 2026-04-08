/* ============================================================================

* Archivo         : triggerWords.ts
* Descripción     : Utilidades para normalizar y presentar palabras de activación.
* Autor           : oafon
* Fecha           : 2026-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Importar normalizeTriggerWord y buildVisibleTriggerWords desde pantallas y servicios.
* ============================================================================ */

/* ============================================================================

* Función         : normalizeTriggerWord
* Descripción     : Limpia una palabra o frase de activación para guardarla de forma consistente.
* Fecha           : 2026-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : buildVisibleTriggerWords, settings.tsx
* Ingesta         : value: string
* Devolución      : string
* Uso             : normalizeTriggerWord('  Ayudame  ')
* ============================================================================ */
export function normalizeTriggerWord(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/* ============================================================================

* Función         : buildVisibleTriggerWords
* Descripción     : Devuelve la lista visible de palabras de activación sin vacíos ni duplicados.
* Fecha           : 2026-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : HomeScreen, SettingsScreen, WakeWordService
* Ingesta         : triggerWords: string[]
* Devolución      : string[]
* Uso             : buildVisibleTriggerWords(['ayuda', 'ayuda', ' socorro '])
* ============================================================================ */
export function buildVisibleTriggerWords(triggerWords: string[]): string[] {
  const uniqueWords = new Set<string>();

  triggerWords.forEach((word) => {
    const normalizedWord = normalizeTriggerWord(word);
    if (normalizedWord) {
      uniqueWords.add(normalizedWord);
    }
  });

  return Array.from(uniqueWords);
}