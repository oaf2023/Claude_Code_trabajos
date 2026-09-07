# Archivo: admin/tsconfig.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/tsconfig.json | 7 | JSON (TypeScript) | 119 | Configuración de solución TypeScript (project references) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Archivo raíz de TypeScript en modo "solución": no compila código propio (`files:
[]`) sino que orquesta dos proyectos referenciados: `tsconfig.app.json` (código de
la aplicación `src/`) y `tsconfig.node.json` (configuración de herramientas Node,
`vite.config.ts`). Es el que ejecuta `tsc -b` (build mode) en el script `build` de
`package.json`.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`. Patrón estándar de plantillas Vite recientes.
[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `./tsconfig.app.json` (referencia) | interna | Compila `src/` | Sí |
| `./tsconfig.node.json` (referencia) | interna | Compila `vite.config.ts` | Sí |

## Componentes que dependen de este archivo

- `package.json` script `build` (`tsc -b`) lo invoca.
- `tsconfig.app.json` y `tsconfig.node.json` son sus hijos referenciados.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `files` | `[]` | array | Sin archivos propios (solo referencias) | Línea 2 |
| `references` | `[tsconfig.app.json, tsconfig.node.json]` | array | Proyectos a compilar en orden | Líneas 3-6 |

## Estructura (funciones / clases / tipos)

Configuración declarativa: `files` vacío + dos `references`.

## Análisis línea por línea

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**Explicación de las líneas 1–7:**

- **Línea 2**: `"files": []` indica que este tsconfig no incluye archivos de
  compilación directos; actúa solo como raíz.
- **Líneas 3-6**: `references` declara los proyectos hijos. `tsc -b` los compila
  de forma incremental y en el orden correcto: primero el de la app y el de Node
  (independientes entre sí). Cada hijo debe tener `composite` o modo build
  compatible (aquí usan `noEmit` + `tsBuildInfoFile`, patrón de Vite).
- **Línea 7**: cierre.

## Fichas de funciones y métodos

No aplica (JSON declarativo).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NOTA] Este archivo no define `compilerOptions` propios: todas las opciones
  viven en los hijos; mantener consistencia entre ambos (por ejemplo `noUnused*`
  y `erasableSyntaxOnly` están duplicadas en los dos hijos).
- [INFORMATIVO] La compilación incremental (build mode) acelera los type-check
  repetidos del script `build`.

## Seguridad

- [INFORMATIVO] Sin secretos. No hay opciones que afecten seguridad de runtime.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Verificar que el editor (VS Code) use este tsconfig raíz para
  que las referencias cruzadas y `erasableSyntaxOnly` se apliquen de forma
  consistente en toda la app.
- [RECOMENDACIÓN] Mantener sincronizadas las opciones compartidas entre
  `tsconfig.app.json` y `tsconfig.node.json` (o extraer un `tsconfig.base.json`)
  para evitar divergencias.
