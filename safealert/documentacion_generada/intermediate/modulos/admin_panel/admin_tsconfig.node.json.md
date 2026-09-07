# Archivo: admin/tsconfig.node.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/tsconfig.node.json | 23 | JSON (TypeScript) | 558 | Configuración TypeScript para herramientas Node (config de Vite) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Configuración de type-check del lado herramientas/Node del proyecto: cubre
únicamente `vite.config.ts` (entorno Node, módulos `nodenext`, tipos `node`).
Permite que Vite y su plugin se tipen correctamente al ejecutar `tsc -b` en el
script `build`, separado del código de la aplicación (`tsconfig.app.json`).

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`. Incluye solo `vite.config.ts`; coherente con
el contenido real de ese archivo. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `types: ["node"]` | externa (`@types/node`, devDependency) | Provee tipos de Node (`process`, `path`, etc.) para la config | Sí |
| `module: "nodenext"` | estándar | Resolución de módulos estilo Node ESM para `vite.config.ts` | Sí |

## Componentes que dependen de este archivo

- `tsconfig.json` (raíz) lo referencia.
- `package.json` (`build`: `tsc -b`).
- `vite.config.ts` (único archivo incluido).

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `tsBuildInfoFile` | `./node_modules/.tmp/tsconfig.node.tsbuildinfo` | string | Caché incremental del build mode | Línea 3 |
| `target` | `"es2023"` | string | Sintaxis objetivo | Línea 4 |
| `lib` | `["ES2023"]` | array | Sin librerías DOM (entorno Node) | Línea 5 |
| `types` | `["node"]` | array | Tipos de Node | Línea 6 |
| `module` | `"nodenext"` | string | Resolución de módulos Node | Línea 10 |
| `include` | `["vite.config.ts"]` | array | Archivos cubiertos | Línea 22 |

## Estructura (funciones / clases / tipos)

Configuración declarativa con `compilerOptions` e `include`.

## Análisis línea por línea

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

**Explicación de las líneas 1–23:**

- **Línea 3**: caché incremental propia del proyecto Node.
- **Línea 4**: `target: es2023`.
- **Línea 5**: `lib: ["ES2023"]` sin DOM: el entorno es Node, no hay APIs de
  navegador disponibles para tipar aquí.
- **Línea 6**: `types: ["node"]`: activa los tipos globales de Node (requiere
  `@types/node`, presente en `devDependencies` de `package.json`).
- **Línea 7**: `skipLibCheck` para acelerar.
- **Línea 10**: `module: "nodenext"`: resolución de módulos según el runtime Node
  ESM (coherente con `"type": "module"` del package.json). Se diferencia de
  `tsconfig.app.json` (bundler), porque la config corre en Node, no en el bundle.
- **Línea 11**: `allowImportingTsExtensions` (sin emisión, seguro con `noEmit`).
- **Línea 12**: `verbatimModuleSyntax` (imports de tipo explícitos).
- **Línea 13**: `moduleDetection: force`.
- **Línea 14**: `noEmit: true` (solo verificación).
- **Líneas 17-20**: mismas reglas de lint que el proyecto app (`noUnusedLocals`,
  `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`).
- **Línea 22**: `include: ["vite.config.ts"]`: el archivo de configuración de
  Vite es el único objetivo de este proyecto.

## Fichas de funciones y métodos

No aplica (JSON declarativo).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NOTA] Separa deliberadamente el entorno DOM (`src/`) del entorno Node
  (`vite.config.ts`), evitando que los tipos de navegador contaminen la
  configuración de herramientas y viceversa. [NIVEL DE CERTEZA: Confirmado por
  código]
- [INFORMATIVO] `module: "nodenext"` + `"type": "module"` del package.json: la
  config de Vite se interpreta como ESM de Node; Vite 8 la carga sin transpilar
  gracias a esta coherencia.

## Seguridad

- [INFORMATIVO] Sin secretos ni implicaciones de seguridad de runtime (solo
  type-check de herramientas de desarrollo).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Si en el futuro se añaden más herramientas Node (scripts,
  plugins), ampliar el `include` o crear proyectos referenciados adicionales.
- [RECOMENDACIÓN] Mantener `@types/node` alineado con la versión de Node usada en
  CI/desarrollo para evitar discrepancias de tipos.
