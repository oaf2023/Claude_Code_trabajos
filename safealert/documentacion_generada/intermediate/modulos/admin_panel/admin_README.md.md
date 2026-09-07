# Documento: admin/README.md

## Resumen

El `README.md` del módulo admin **no es un documento de proyecto personalizado**:
es el README estándar que genera la plantilla oficial "React + TypeScript + Vite"
(oxlint edition) al crear el proyecto. Está escrito en inglés y describe de forma
genérica el setup mínimo de React con Vite, los dos plugins oficiales disponibles
(`@vitejs/plugin-react` con Oxc y `@vitejs/plugin-react-swc` con SWC), la nota
sobre el React Compiler desactivado por impacto en rendimiento de dev/build, y las
instrucciones para expandir la configuración de Oxlint (reglas type-aware con
`oxlint-tsgolint` y `options.typeAware: true`). No documenta la funcionalidad real
del panel (rutas, API, autenticación, scripts de despliegue, variables de entorno).
Tiene 32 líneas y tamaño 1278 bytes.

## Contenido clave

- **Líneas 1–3**: título "# React + TypeScript + Vite" y descripción genérica del
  template con HMR y "some Oxlint rules".
- **Líneas 5–8**: enumera los dos plugins oficiales de React para Vite:
  `@vitejs/plugin-react` (usa Oxc) y `@vitejs/plugin-react-swc` (usa SWC), con
  enlaces a sus repositorios en GitHub. El proyecto real usa el primero
  (`@vitejs/plugin-react` en `vite.config.ts` y `devDependencies`), no el SWC.
- **Líneas 10–12**: sección "React Compiler": explica que el compilador de React
  no está habilitado en el template por su impacto en rendimiento de dev y build, y
  enlaza la documentación oficial de instalación. [NIVEL DE CERTEZA: Confirmado
  por código] No hay evidencia en `package.json` ni en `vite.config.ts` de que el
  React Compiler (plugin `babel-plugin-react-compiler`) esté activado.
- **Líneas 14–16**: sección "Expanding the Oxlint configuration": recomienda
  habilitar reglas type-aware instalando `oxlint-tsgolint` y editando
  `.oxlintrc.json`.
- **Líneas 18–30**: bloque de código JSON de ejemplo mostrando cómo añadir
  `options.typeAware: true` a `.oxlintrc.json` (la configuración real actual de
  `.oxlintrc.json` NO incluye esa opción: es la configuración base sin type-aware).
- **Líneas 31–32**: enlace a la documentación de reglas de Oxlint.

## Relación con el código real

El contenido del README **no refleja la aplicación real** del panel admin y no
aporta documentación de uso específica. Comparación verificada contra el código:

- Coincide con la realidad en: (1) stack React + TypeScript + Vite + Oxlint
  confirmado por `package.json`; (2) plugin React oficial `@vitejs/plugin-react`
  confirmado en `vite.config.ts`; (3) `.oxlintrc.json` real con los plugins
  `react`, `typescript`, `oxc` y las mismas dos reglas del ejemplo del README.
- No coincide o no cubre: el nombre del paquete es `admin` (no "react-ts template");
  no documenta las rutas del panel (`/`, `/usuarios`, `/usuarios/:usuarioId`,
  `/pagos-simulados`, `/admin`, `/login`), el cliente API de `src/lib/api.ts`
  (autenticación `X-Admin-Key`, URL base `VITE_API_URL`/`localStorage`), ni las
  variables de entorno necesarias. Tampoco hay guía de despliegue (build estático
  a `dist/`), ni documentación de seguridad/datos, ni registro de cambios.
- El ejemplo JSON del README (con `options.typeAware`) es una *aspiración*: la
  configuración vigente de `.oxlintrc.json` no la incluye. [NIVEL DE CERTEZA:
  Confirmado por código]

[NIVEL DE CERTEZA: Confirmado por código] — el README es la plantilla original de
Vite sin personalizar; la documentación real del proyecto SafeAlert está dispersa
en los comentarios de cabecera de cada archivo fuente y en la documentación
generada de la auditoría, no en este README.
