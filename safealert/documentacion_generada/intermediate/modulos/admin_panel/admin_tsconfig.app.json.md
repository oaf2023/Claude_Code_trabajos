# Archivo: admin/tsconfig.app.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/tsconfig.app.json | 26 | JSON (TypeScript) | 655 | Configuración TypeScript de la aplicación (`src/`) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Configuración de compilación/type-check del código de la aplicación (`src/`) para
el panel admin. Aplica target ES2023, JSX `react-jsx`, resolución de módulos
*bundler*, modo ESM estricto (`verbatimModuleSyntax`), detección de módulos forzada
y reglas estrictas de lint de TypeScript (`noUnusedLocals`, `noUnusedParameters`,
`noFallthroughCasesInSwitch`, `erasableSyntaxOnly`). No emite JavaScript
(`noEmit`): Vite se encarga del bundle; `tsc` solo verifica tipos en el build.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`. Es el proyecto referenciado que cubre `src/`
(incluye `src/main.tsx`, componentes, páginas y libs). [NIVEL DE CERTEZA:
Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `types: ["vite/client"]` | externa (tipos de Vite, vía paquete `vite`) | Provee tipos de `import.meta.env` (usado en `src/lib/api.ts`) y de assets | Sí |
| `lib: ["ES2023", "DOM"]` | estándar | APIs de ECMAScript 2023 y del navegador (fetch, localStorage, URLSearchParams) | Sí |

## Componentes que dependen de este archivo

- `tsconfig.json` (raíz) lo referencia.
- `package.json` (`build`: `tsc -b`).
- Todo el código bajo `src/` (15 archivos TS/TSX del módulo).

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `tsBuildInfoFile` | `./node_modules/.tmp/tsconfig.app.tsbuildinfo` | string | Caché incremental del build mode | Línea 3 |
| `target` | `"es2023"` | string | Sintaxis de salida objetivo | Línea 4 |
| `lib` | `["ES2023", "DOM"]` | array | Librerías de tipos disponibles | Línea 5 |
| `module` | `"esnext"` | string | Sistema de módulos (ESM nativo) | Línea 6 |
| `types` | `["vite/client"]` | array | Tipos globales incluidos | Línea 7 |
| `moduleResolution` | `"bundler"` | string | Resolución compatible con bundlers | Línea 12 |
| `jsx` | `"react-jsx"` | string | Transform automático de JSX (sin importar React) | Línea 17 |
| `include` | `["src"]` | array | Archivos cubiertos | Línea 25 |

## Estructura (funciones / clases / tipos)

Configuración declarativa con `compilerOptions` y `include`.

## Análisis línea por línea

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "allowArbitraryExtensions": true,
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**Explicación de las líneas 1–26:**

- **Línea 3**: ruta del archivo de información incremental (dentro de
  `node_modules/.tmp`, fuera del árbol de código).
- **Línea 4**: `target: es2023`: sintaxis objetivo ES2023.
- **Línea 5**: incluye tipos de ES2023 y del DOM (fetch, localStorage, etc.).
- **Línea 6**: `module: esnext`: módulos ESM sin transpilar.
- **Línea 7**: solo tipos globales de `vite/client` (imprescindible para
  `import.meta.env.VITE_API_URL` en `lib/api.ts`).
- **Línea 8**: `allowArbitraryExtensions`: permite importar archivos con
  extensiones no estándar declaradas (comodidad de Vite).
- **Línea 9**: `skipLibCheck`: no revisa tipos dentro de `node_modules` (acelera).
- **Línea 12**: `moduleResolution: bundler`: resolución de módulos como la de Vite.
- **Línea 13**: `allowImportingTsExtensions`: permite importar con extensión `.ts`
  (no emitido, por eso es seguro con `noEmit`).
- **Línea 14**: `verbatimModuleSyntax`: exige `import type` para tipos (de ahí los
  `type X` en los imports de páginas y `Layout.tsx`); es coherente con el código
  real analizado.
- **Línea 15**: `moduleDetection: force`: trata todos los archivos como módulos
  aunque no tengan import/export.
- **Línea 16**: `noEmit: true`: `tsc` solo verifica; Vite empaqueta.
- **Línea 17**: `jsx: react-jsx`: transform automático de JSX (React 19 no
  requiere `import React` en cada archivo, como se observa en los componentes).
- **Línea 20**: `noUnusedLocals`: error si hay variables locales sin usar.
- **Línea 21**: `noUnusedParameters`: error si hay parámetros sin usar.
- **Línea 22**: `erasableSyntaxOnly`: prohíbe sintaxis no borrable en la emisión
  (enums/namespaces con valor), alineado con el estilo de código que usa uniones de
  tipos y const objects.
- **Línea 23**: `noFallthroughCasesInSwitch`: obliga a `break/return` en switch
  (el código usa `if` encadenados, no switch).
- **Línea 25**: `include: ["src"]`: cubre todo el código de la aplicación.

## Fichas de funciones y métodos

No aplica (JSON declarativo).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NOTA] No se fija `"strict": true` explícitamente en este archivo. Sin embargo,
  el estilo de código (tipos explícitos con `null | undefined`) sugiere manejo
  estricto. [NIVEL DE CERTEZA: Inferido] — sin `strict`, TypeScript aplica un modo
  menos exigente; recomendable revisar.
- [NOTA] `allowArbitraryExtensions` + `allowImportingTsExtensions` son opciones del
  ecosistema Vite/TS moderno que solo tienen sentido con `noEmit`.
- [INFORMATIVO] La combinación `verbatimModuleSyntax` + `erasableSyntaxOnly`
  explica por qué los archivos analizados usan `import type` y uniones de tipos en
  lugar de `enum`.

## Seguridad

- [INFORMATIVO] Sin secretos. Las opciones de tipos no afectan la seguridad en
  runtime, pero `strict` ausente podría dejar pasar errores de nulabilidad que en
  runtime causen fallos (por ejemplo campos `null` de la API tratados como
  siempre presentes).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Evaluar activar `"strict": true` (y `noUncheckedIndexedAccess`)
  para endurecer el type-check del panel, dada la gran cantidad de campos
  anulables en las interfaces de la API.
- [RECOMENDACIÓN] Extraer opciones compartidas a un `tsconfig.base.json` para
  mantener sincronizados `tsconfig.app.json` y `tsconfig.node.json`.
