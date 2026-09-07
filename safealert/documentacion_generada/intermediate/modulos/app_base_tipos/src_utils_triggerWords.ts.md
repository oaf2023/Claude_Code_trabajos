# Archivo: src/utils/triggerWords.ts

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/utils/triggerWords.ts |
| Líneas totales | 51 |
| Lenguaje | TypeScript 5.9 |
| Tamaño (bytes) | 2198 |
| Categoría | Utilidades de normalización y presentación de palabras de activación |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Centraliza la normalización de las palabras de activación de la alerta SOS:
`normalizeTriggerWord` limpia una palabra/frase (recorta espacios, pasa a minúsculas y
colapsa espacios internos múltiples) y `buildVisibleTriggerWords` devuelve la lista
visible sin vacíos ni duplicados. Garantiza que lo que el usuario configura y lo que el
motor de wake word compara usen la misma forma canónica.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Ambas funciones se importan de forma real en las pantallas de
Home y Ajustes:

- `app/(tabs)/index.tsx` (línea 36): `import { buildVisibleTriggerWords } ...` (uso en línea 101).
- `app/(tabs)/settings.tsx` (líneas 30-32): importa `buildVisibleTriggerWords` y `normalizeTriggerWord` (usos en líneas 49, 69, 72, 98).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna | — | — | — |

Usa `String.trim`, `toLowerCase`, `replace` con regex y `Set` del estándar.

## Componentes que dependen de este archivo

Referencias reales encontradas con búsqueda sobre el código fuente:

- `app/(tabs)/index.tsx` (línea 36): muestra las palabras visibles en la pantalla de inicio (`visibleTriggerWords`, línea 101).
- `app/(tabs)/settings.tsx` (líneas 30-32): valida y agrega nuevas palabras normalizadas (`normalizeTriggerWord`, línea 69) y recalcula la lista visible (líneas 49, 72, 98).
- Consumidor de dominio indirecto: el servicio de wake word compara la palabra detectada
  contra la configuración; la normalización previa mantiene la consistencia.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| Regex de espacios | `/\s+/g` | RegExp (literal) | Colapsa espacios internos múltiples en uno solo | Línea 25 |

## Estructura (funciones / clases / tipos)

- Funciones exportadas: `normalizeTriggerWord`, `buildVisibleTriggerWords`.

## Análisis línea por línea

```ts
/* ============================================================================

* Archivo         : triggerWords.ts
* Descripción     : Utilidades para normalizar y presentar palabras de activación.
* Autor           : oafon
* Fecha           : 2026-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Importar normalizeTriggerWord y buildVisibleTriggerWords desde pantallas y servicios.
* ============================================================================ */
```

**Explicación de las líneas 1–10:**

- **Línea 1**: apertura del comentario de cabecera estándar del proyecto (con una línea en
  blanco tras ella).
- **Líneas 2–9**: metadatos (autor `oafon`, fecha `2026-03-30`, versión `1.0.0`) y nota de
  uso: importar ambas funciones desde pantallas y servicios.
- **Línea 10**: cierre de la cabecera.

```ts
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
```

**Explicación de las líneas 12–26:**

- **Líneas 12–23**: cabecera de función estándar del proyecto (descripción, conexiones con
  `buildVisibleTriggerWords` y `settings.tsx`, ingesta y devolución).
- **Línea 24**: firma de `normalizeTriggerWord(value: string): string`.
- **Línea 25**: devuelve el valor con `trim()` (recorta espacios iniciales y finales),
  `toLowerCase()` (minúsculas) y `replace(/\s+/g, ' ')` (colapsa cualquier secuencia de
  espacios en blanco a un único espacio).
- **Línea 26**: cierre.

```ts
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
```

**Explicación de las líneas 28–51:**

- **Líneas 28–39**: cabecera de función (conexiones declaradas: HomeScreen,
  SettingsScreen y WakeWordService; ejemplo de uso con duplicados y espacios).
- **Línea 40**: firma de `buildVisibleTriggerWords(triggerWords: string[]): string[]`.
- **Línea 41**: crea un `Set<string>` para eliminar duplicados automáticamente.
- **Líneas 43–48**: recorre la lista de entrada:
  - Línea 44: normaliza cada palabra con `normalizeTriggerWord`.
  - Líneas 45–47: si el resultado no es vacío, lo agrega al `Set`.
- **Línea 50**: convierte el `Set` en array (`Array.from`), devolviendo la lista visible
  sin vacíos ni duplicados y en el orden de primera aparición.
- **Línea 51**: cierre.

## Fichas de funciones y métodos

### `normalizeTriggerWord(value)` (líneas 24–26)

- Firma original: `export function normalizeTriggerWord(value: string): string`.
- Propósito técnico: forma canónica de una palabra de activación.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| value | string | Palabra o frase bruta |

- Retorno: string normalizado (trim + minúsculas + espacios colapsados).
- Excepciones: ninguna.
- Flujo: encadenamiento de `trim()`, `toLowerCase()` y `replace(/\s+/g, ' ')`.
- Desde dónde se llama: `buildVisibleTriggerWords` (línea 44) y `app/(tabs)/settings.tsx` (línea 69).
- Efectos secundarios: ninguno.

### `buildVisibleTriggerWords(triggerWords)` (líneas 40–51)

- Firma original: `export function buildVisibleTriggerWords(triggerWords: string[]): string[]`.
- Propósito técnico: lista deduplicada y sin vacíos para UI.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| triggerWords | string[] | Lista configurada (puede traer vacíos y duplicados) |

- Retorno: string[] limpio.
- Excepciones: ninguna.
- Flujo: normalizar cada palabra, descartar vacíos, deduplicar con `Set`, devolver array.
- Desde dónde se llama: `app/(tabs)/index.tsx` (línea 101) y `app/(tabs)/settings.tsx` (líneas 49, 72, 98).
- Efectos secundarios: ninguno.

## Clases / interfaces / tipos

Ninguna: el archivo exporta solo funciones.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: la normalización a minúsculas es solo de presentación; si el
  motor de wake word (DaVoice) es sensible a mayúsculas o acentos, la comparación real
  debe hacerse con la misma transformación. [NIVEL DE CERTEZA: Inferido].
- [OBSERVACIÓN TÉCNICA]: los acentos no se normalizan (p. ej. `ayúdame` y `ayudame` se
  consideran distintas). Si la app apunta a usuarios hispanohablantes, podría interesar
  una normalización Unicode de diacríticos, pero cambiaría la palabra que el usuario ve.
- [NIVEL DE CERTEZA: Confirmado por código] para los usos en `index.tsx` y `settings.tsx`.

## Seguridad

- INFORMATIVO: las palabras de activación son configuración de usuario; no se encontró
  riesgo de inyección (se usan como datos comparados, no como código). No hay secretos.
- No se detectan hallazgos de seguridad relevantes.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: verificar que la comparación de palabras en el servicio de wake word
  aplica la misma normalización (o un punto de comparación único) para evitar falsos
  negativos por espacios o mayúsculas.
- [RECOMENDACIÓN]: decidir explícitamente si las palabras deben distinguir acentos y
  documentarlo para el usuario final.
