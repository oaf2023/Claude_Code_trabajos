# Archivo: admin/.oxlintrc.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/.oxlintrc.json | 8 | JSON (config de linter) | 245 | Configuración de Oxlint (lint del panel) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Configuración del linter **Oxlint** (linter rápido en Rust del proyecto Oxc) que
se ejecuta con `npm run lint` (`oxlint`). Activa los plugins `react`,
`typescript` y `oxc`, y define dos reglas: `react/rules-of-hooks` como error y
`react/only-export-components` como advertencia permitiendo exports constantes.
Reemplaza a ESLint en esta plantilla Vite.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`. Coherente con el script `lint` de
`package.json` y con la recomendación del README (template de Vite). [NIVEL DE
CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `./node_modules/oxlint/configuration_schema.json` (`$schema`) | interna (dev) | Validación del JSON en el editor | Sí (referencia local; requiere `npm install`) |
| plugins `react`, `typescript`, `oxc` | externas (provistas por `oxlint`) | Aplican reglas de esos ecosistemas | Sí |

## Componentes que dependen de este archivo

- `package.json` (`"lint": "oxlint"`): Oxlint lee este archivo automáticamente.
- Todo `src/` (objetivo del lint): componentes, páginas y libs.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `$schema` | `./node_modules/oxlint/configuration_schema.json` | string | Ruta al esquema JSON para autocompletado | Línea 2 |
| `plugins` | `["react", "typescript", "oxc"]` | array | Conjuntos de reglas activados | Línea 3 |
| `react/rules-of-hooks` | `"error"` | string | Reglas de hooks de React como error | Línea 5 |
| `react/only-export-components` | `["warn", { allowConstantExport: true }]` | array | Solo exportar componentes (excepto constantes) | Línea 6 |

## Estructura (funciones / clases / tipos)

JSON declarativo con secciones `$schema`, `plugins`, `rules`.

## Análisis línea por línea

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

**Explicación de las líneas 1–8:**

- **Línea 2**: `$schema` apunta al esquema local de Oxlint (validación y
  autocompletado en el editor; requiere `node_modules` instalado).
- **Línea 3**: activa los plugins `react` (reglas de React/JSX), `typescript`
  (reglas específicas TS) y `oxc` (reglas propias del motor Oxc).
- **Línea 5**: `react/rules-of-hooks` como `error`: aplica las reglas de Hooks de
  React (que los hooks se llamen incondicionalmente y en el mismo orden); relevante
  para `Layout.tsx` (uso de `useState`/`useEffect`) y las páginas.
- **Línea 6**: `react/only-export-components` como `warn` con
  `allowConstantExport: true`: permite exportar junto a componentes constantes no
  JSX (como `NAV_ITEMS` o diccionarios) sin avisar, pero advierte si se exportan
  componentes mezclados con otra lógica. Esto explica el patrón del proyecto
  (archivos que exportan componentes y constantes a la vez, p. ej. `Badges.tsx` o
  los diccionarios de `format.ts`).

## Fichas de funciones y métodos

No aplica (JSON declarativo).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] La configuración es mínima: no activa reglas "type-aware"
  ni categorías completas. El README del proyecto sugiere instalar
  `oxlint-tsgolint` y usar `options.typeAware: true` para lint con tipos (no
  aplicado). [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] No hay reglas de seguridad/calidad custom (p. ej. `no-console`,
  `no-secrets`); se confía en las categorías por defecto de Oxlint.
- [INFORMATIVO] El patrón `allowConstantExport: true` es compatible con archivos
  que exportan constantes y componentes juntos, como se ve en el código real
  (componentes + diccionarios/constantes en el mismo archivo).

## Seguridad

- [INFORMATIVO] Sin secretos. El lint no incluye reglas específicas de detección
  de secretos (p. ej. evitar claves hardcodeadas); recomendable añadirlas si se
  desea una barrera automática.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Considerar activar lint "type-aware" (`oxlint-tsgolint` +
  `options.typeAware: true`) para detectar problemas que requieren tipos
  (siguiendo el propio README del proyecto).
- [RECOMENDACIÓN] Revisar que `npm run lint` se ejecute en CI junto al build para
  mantener la calidad de hooks y exports.
