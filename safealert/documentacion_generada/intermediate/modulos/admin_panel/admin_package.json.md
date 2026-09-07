# Archivo: admin/package.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/package.json | 27 | JSON | 587 | Manifiesto npm del panel admin | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Manifiesto del paquete `admin`: define identidad, scripts de desarrollo/build/lint,
y las dependencias de runtime y desarrollo del panel web React + Vite + TypeScript.
Es la base para instalar (`npm install`), correr en desarrollo (`npm run dev`),
compilar (`npm run build`) y publicar el artefacto estático.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`. Los scripts y dependencias corresponden con
los archivos del proyecto (`vite.config.ts`, `src/main.tsx`, `.oxlintrc.json`).
[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `react` ^19.2.8 | externa (runtime) | Componentes JSX | Sí |
| `react-dom` ^19.2.8 | externa (runtime) | `src/main.tsx` (render del root) | Sí |
| `react-router-dom` ^7.18.2 | externa (runtime) | `App.tsx`, `Layout.tsx` y páginas (rutas) | Sí |
| `recharts` ^3.10.1 | externa (runtime) | Gráficos del Dashboard (consumido por `Dashboard.tsx`) | Sí |
| `@types/node` ^24.13.3 | externa (dev) | Tipos de Node para `vite.config.ts`/scripts (tsconfig.node.json) | Sí |
| `@types/react` ^19.2.17 | externa (dev) | Tipos de React | Sí |
| `@types/react-dom` ^19.2.3 | externa (dev) | Tipos de React DOM | Sí |
| `@vitejs/plugin-react` ^6.0.4 | externa (dev) | Plugin React de Vite (`vite.config.ts`) | Sí |
| `oxlint` ^1.75.0 | externa (dev) | Linter (`npm run lint`) | Sí |
| `typescript` ~6.0.2 | externa (dev) | Compilador (`tsc -b` en build) | Sí |
| `vite` ^8.2.0 | externa (dev) | Dev server y bundler | Sí |

## Componentes que dependen de este archivo

- `vite.config.ts`: usa `@vitejs/plugin-react` y `vite`.
- `tsconfig.app.json` / `tsconfig.node.json`: proyectos referenciados compilados con
  `tsc -b` en el script `build`.
- `src/main.tsx`: usa `react`, `react-dom` y `./index.css`; arranca la app.
- `src/App.tsx`: usa `react-router-dom` (rutas protegidas).
- `src/pages/Dashboard.tsx`: usa `recharts` (gráficos). [NIVEL DE CERTEZA:
  Confirmado por código parcial — verificado que `recharts` solo se referencia en
  Dashboard]

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `name` | `"admin"` | string | Nombre del paquete | Línea 2 |
| `private` | `true` | boolean | Impide publicación accidental en npm | Línea 3 |
| `version` | `"0.0.0"` | string | Versión (sin versionar, plantilla) | Línea 4 |
| `type` | `"module"` | string | ESM (import/export nativos) | Línea 5 |
| `scripts.dev` | `"vite"` | string | Servidor de desarrollo | Línea 7 |
| `scripts.build` | `"tsc -b && vite build"` | string | Type-check + build de producción | Línea 8 |
| `scripts.lint` | `"oxlint"` | string | Lint con Oxlint | Línea 9 |
| `scripts.preview` | `"vite preview"` | string | Sirve el build para revisión | Línea 10 |

## Estructura (funciones / clases / tipos)

No aplica (JSON declarativo): secciones `name`, `private`, `version`, `type`,
`scripts` (4 comandos), `dependencies` (4) y `devDependencies` (7).

## Análisis línea por línea

```json
{
  "name": "admin",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-router-dom": "^7.18.2",
    "recharts": "^3.10.1"
  },
  "devDependencies": {
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.4",
    "oxlint": "^1.75.0",
    "typescript": "~6.0.2",
    "vite": "^8.2.0"
  }
}
```

**Explicación de las líneas 1–27:**

Manifiesto completo del paquete.

- **Línea 2**: `"name": "admin"` identifica el paquete dentro del monorepo.
- **Línea 3**: `"private": true` evita publicar el panel accidentalmente en el
  registro npm.
- **Línea 4**: `"version": "0.0.0"`: versión de plantilla sin seguimiento
  semántico; el proyecto no la versiona.
- **Línea 5**: `"type": "module"`: ESM; habilita `import`/`export` y que
  `vite.config.ts` se interprete como módulo.
- **Línea 7**: `"dev": "vite"`: arranca el servidor de desarrollo de Vite (HMR).
- **Línea 8**: `"build": "tsc -b && vite build"`: primero type-check con los
  proyectos referenciados de tsconfig (compila en modo build, `noEmit`) y luego
  empaqueta con Vite; cualquier error de tipos aborta el build.
- **Línea 9**: `"lint": "oxlint"`: ejecuta Oxlint con la configuración de
  `.oxlintrc.json`.
- **Línea 10**: `"preview": "vite preview"`: sirve el build generado en `dist/`
  para verificación local.
- **Líneas 12-17**: dependencias de runtime. `react` y `react-dom` 19.2.x;
  `react-router-dom` v7 (usado en modo declarativo con `NavLink/Outlet/rutas`);
  `recharts` v3 para los gráficos del Dashboard.
- **Líneas 18-26**: dependencias de desarrollo: tipos (`@types/*`), plugin React de
  Vite, `oxlint` (linter rápido en Rust), `typescript` ~6.0.2 (fijado con tilde,
  no caret) y `vite` 8.2.x.
- **Línea 27**: cierre del objeto.

## Fichas de funciones y métodos

No aplica (JSON sin funciones).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `"version": "0.0.0"` y la falta de scripts de test
  (`test`), `typecheck` independiente o `deploy` indican que es un paquete de
  plantilla Vite sin pipeline de pruebas ni despliegue automatizado en npm.
  [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] `typescript` con `~6.0.2` (tilde) permite parches 6.0.x pero no menores
  6.1; el resto usa caret (^). Estrategia de versionado mixta.
- [NOTA] No existe `engines` que fije la versión de Node requerida por Vite 8.
- [NOTA] Rango de versiones de React 19.2.x y Vite 8.x; coherentes con las
  cabeceras de los fuentes (React 19, TS 5.9 declarado en comentarios).

## Seguridad

- [INFORMATIVO] Sin secretos ni URLs en el manifiesto.
- [BAJO] Dependencias con rangos `^` (actualizaciones automáticas de parches y
  menores): recomendable auditar con `npm audit` y considerar lockfile y
  `overrides`/renovación controlada para evitar regresiones o vulnerabilidades
  transitivas.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Añadir script `"test"` y, si aplica, `"deploy"`/`"preview"` con
  verificación, para integrar pruebas al ciclo.
- [RECOMENDACIÓN] Declarar `"engines": { "node": ">=..." }` acorde a Vite 8 para
  evitar fallos por versión de Node.
- [RECOMENDACIÓN] Mantener el lockfile actualizado y ejecutar `npm audit` en el
  CI; revisar periódicamente las dependencias (react-router-dom v7 y recharts v3
  son APIs recientes).
- [RECOMENDACIÓN] Revisar que `tsc -b` con `typescript ~6.0.2` sea compatible con
  las opciones de los tsconfig (`erasableSyntaxOnly`, `verbatimModuleSyntax`).
