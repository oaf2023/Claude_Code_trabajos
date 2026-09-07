# Archivo: admin/vite.config.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/vite.config.ts | 7 | TypeScript 5.9 (config ESM) | 161 | Configuración de build/dev server (Vite) | FUNCIONALIDAD EXISTENTE (mínima) | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Archivo de configuración de Vite para el panel admin. Registra únicamente el plugin
oficial de React (`@vitejs/plugin-react`) y no declara ninguna otra opción:
sin proxy de desarrollo, sin alias de rutas, sin configuración de build custom ni
variables de entorno estáticas. Todo el resto usa los valores por defecto de Vite.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` (configuración mínima de plantilla). El plugin
React es necesario para el transform JSX/refresco. [NIVEL DE CERTEZA: Confirmado
por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `defineConfig` de `vite` | externa (dev) | Línea 5 (envuelve la config) | Sí |
| `react` de `@vitejs/plugin-react` | externa (dev) | Línea 6 (`plugins: [react()]`) | Sí |

## Componentes que dependen de este archivo

- `package.json` (script `dev`/`build`/`preview` lo invocan vía CLI de Vite).
- `tsconfig.node.json` lo incluye como único archivo (`include: ["vite.config.ts"]`).
- El proyecto completo (entrada `index.html` → `src/main.tsx`) se compila según esta
  configuración.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| (sin constantes propias) | — | — | Config declarativa sin variables | — |
| Variable de entorno `VITE_API_URL` | `[SECRETO OCULTO]` (no definida aquí; se lee en `src/lib/api.ts` vía `import.meta.env`) | string | URL base de la API inyectada en build | Consumida en `lib/api.ts` línea 136 |

## Estructura (funciones / clases / tipos)

- `defineConfig({...})` — invocación única que exporta el objeto de configuración
  (función de Vite, no definida en este archivo).

## Análisis línea por línea

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

**Explicación de las líneas 1–7:**

Configuración completa de Vite.

- **Línea 1**: importa `defineConfig` de Vite (helper de tipado/autocompletado).
- **Línea 2**: importa el plugin React por defecto (`@vitejs/plugin-react`), que
  añade el transform JSX con Fast Refresh (HMR) en desarrollo.
- **Línea 4**: comentario con la URL de documentación oficial de configuración.
- **Línea 5**: exporta por defecto el resultado de `defineConfig`.
- **Línea 6**: `plugins: [react()]` activa el plugin React. No hay sección `server`,
  `build`, `resolve.alias` ni `envPrefix`; todo con valores por defecto.
- **Línea 7**: cierre.

## Fichas de funciones y métodos

No aplica (configuración declarativa).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] **No existe proxy de desarrollo hacia el backend.**
  En desarrollo, las peticiones de `lib/api.ts` van directas a la URL resuelta por
  `getBaseUrl()` (configurada en la pantalla de login/admin o `VITE_API_URL`), lo
  que requiere que el backend permita CORS desde el origen de Vite (p. ej.
  `http://localhost:5173`). [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] Sin alias de importación (`@/`): todas las importaciones internas usan
  rutas relativas (`../lib/api`, `./components/...`).
- [NOTA] El build produce estáticos en `dist/` (convención Vite), consumibles por
  cualquier hosting estático; el nombre raíz de la app es `index.html`.

## Seguridad

- [INFORMATIVO] Sin secretos en el archivo. No define `server.proxy` ni expone
  cabeceras. La política CORS depende del backend.
- [BAJO] Al no configurar proxy ni `envDir`, la única variable de entorno relevante
  es `VITE_API_URL` (prefijo `VITE_`, expuesta al bundle por diseño de Vite); no
  deben colocarse aquí secretos que no sean públicos en el cliente.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Si se desea eliminar la dependencia de CORS en desarrollo,
  añadir `server.proxy` para `/api` hacia el backend local y usar en `getBaseUrl`
  una ruta relativa en desarrollo.
- [RECOMENDACIÓN] Considerar `resolve.alias` con `@` para simplificar las rutas de
  importación relativas actuales.
- [RECOMENDACIÓN] Documentar en un `.env.example` del módulo admin la variable
  `VITE_API_URL` (nombre y propósito) sin valores reales.
