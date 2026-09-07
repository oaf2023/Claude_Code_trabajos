# Archivo: src/theme/index.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/theme/index.ts | 15 | TypeScript 5.9 | 657 | Design system / Barril de re-exportación | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Archivo barril (barrel) del design system: re-exporta todos los tokens visuales
(`color`, `spacing`, `borderRadius`, `typography`, `shadow`), los tipos `ColorKey` y
`SpacingKey`, y los tres componentes del sistema (`Icon`, `Button`, `Card`). Permite
importar el design system completo con un solo path: `import { color, spacing, Icon }
from '../theme'` (o `../../src/theme` desde las pantallas de `app/`).

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — el barril es el punto de entrada habitual del
theme para pantallas y componentes.

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `./tokens` (color, spacing, borderRadius, typography, shadow; tipos ColorKey, SpacingKey) | interna | Re-export (línea 11-12) | Sí |
| `./Icon` (Icon) | interna | Re-export (línea 13) | Sí |
| `./Button` (Button) | interna | Re-export (línea 14) | Sí |
| `./Card` (Card) | interna | Re-export (línea 15) | Sí |

Nota: re-exporta los tipos `ColorKey` y `SpacingKey` pero NO `BorderRadiusKey`
(aunque `tokens.ts` lo exporta): pequeño hueco del barril (ver Observaciones).

## Componentes que dependen de este archivo

| Archivo dependiente | Símbolos usados |
| --- | --- |
| app/(tabs)/_layout.tsx | color |
| app/(tabs)/settings.tsx | color, spacing, borderRadius, shadow |
| app/_layout.tsx | color |
| app/(tabs)/index.tsx | color, spacing, borderRadius, typography, shadow |
| app/(tabs)/history.tsx | color, spacing |
| app/(tabs)/contacts.tsx | color, spacing, borderRadius, shadow |
| app/como-funciona.tsx, bienvenida.tsx, permissions.tsx, test-alert.tsx, contacts/[id].tsx | color, spacing, borderRadius, shadow |
| src/components/PaymentModal.tsx | color |
| src/components/TrialExpiredModal.tsx | color |
| src/components/PaymentOverdueModal.tsx | color |

[OBSERVACIÓN TÉCNICA] Los consumidores de pantalla importan del barril casi
exclusivamente TOKENS; los componentes `Icon`, `Button` y `Card` exportados por el
barril no aparecen en esos imports (Icon se importa directo en WebModeBanner, Button
en M3Button, y Card no tiene consumidores — ver análisis individuales).

## Variables globales y constantes

No define valores propios: solo re-exporta. Sin secretos.

## Estructura (funciones / clases / tipos)

- Re-export de valores de tokens (línea 11).
- Re-export de tipos (línea 12).
- Re-export de componentes (líneas 13-15).

## Análisis línea por línea

**Bloque líneas 1-15 (archivo completo):**

```ts
/* ============================================================================
* Archivo         : index.ts
* Descripción     : Re-export del design system.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { color, spacing, Icon } from '../theme'
* ============================================================================ */

export { color, spacing, borderRadius, typography, shadow } from './tokens';
export type { ColorKey, SpacingKey } from './tokens';
export { Icon } from './Icon';
export { Button } from './Button';
export { Card } from './Card';
```

**Explicación de las líneas 1-15:**
- **Líneas 1-9**: cabecera estándar (2026-06-29).
- **Línea 11**: re-exporta los cinco objetos de tokens. Nota: re-exporta `borderRadius`
  como valor pero NO su tipo derivado `BorderRadiusKey` (ver línea 12).
- **Línea 12**: re-exporta los tipos `ColorKey` y `SpacingKey`. `BorderRadiusKey` queda
  fuera, aunque se exporta desde `tokens.ts`; los consumidores que lo necesiten deben
  importarlo desde `theme/tokens` directamente.
- **Líneas 13-15**: re-exporta los tres componentes del design system: `Icon`,
  `Button` y `Card`.

## Fichas de funciones y métodos

No aplica (barril sin lógica).

## Clases / interfaces / tipos

No define tipos propios. Re-exporta `ColorKey` y `SpacingKey` desde tokens (pero no
`BorderRadiusKey`).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` El barril no re-exporta `BorderRadiusKey` (solo ColorKey y
  SpacingKey), pese a exportar el valor `borderRadius`: inconsistencia menor de API.
- `[INFORMATIVO]` El barril exporta `Button` y `Card` que hoy tienen consumo nulo o
  indirecto (Button solo vía M3Button; Card sin consumidores): el barril los expone
  "para uso futuro", aumentando la superficie de API no ejercitada.

## Seguridad

- `[INFORMATIVO]` Sin hallazgos: no hay secretos ni lógica.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: inconsistencia de tipos exportados puede confundir consumidores
  (buscan BorderRadiusKey en el barril y no está).
- `[RECOMENDACIÓN]` Añadir `BorderRadiusKey` (y opcionalmente tipos de typography y
  shadow) al re-export del barril para mantener la API completa y consistente.
