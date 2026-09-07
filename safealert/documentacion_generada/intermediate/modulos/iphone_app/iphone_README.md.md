# Documento: iphone/README.md — SafeAlert Apple

## Resumen

El README describe el **cliente Apple separado de SafeAlert** (carpeta `iphone/`),
que reutiliza el código compartido del proyecto padre. Establece sus objetivos
(iPhone/iPad mediante Expo iOS; Mac mediante Expo Web/PWA), los comandos de arranque
(`npm run ios`, `npm run mac`, `npm run web`, `npm run typecheck`) y tres notas
técnicas sobre la arquitectura: reutilización de `../app` y `../src`, uso de la capa
modular de Firebase `../src/config/firebase.ts` en Apple/web, y mantenimiento de
React Native Firebase nativo para Android en el proyecto principal.

## Contenido clave

- **Título**: SafeAlert Apple — cliente separado que reutiliza código compartido.
- **Objetivos** (líneas 5-8): iPhone/iPad vía Expo iOS; Mac vía Expo Web/PWA.
- **Comandos** (líneas 10-15): `npm run ios`, `npm run mac`, `npm run web`,
  `npm run typecheck` (coinciden con los scripts de `iphone/package.json`).
- **Notas técnicas** (líneas 17-21):
  - El negocio y las pantallas se reutilizan desde `../app` y `../src`.
  - En Apple y web, Firebase usa la capa modular `../src/config/firebase.ts`.
  - Android sigue usando React Native Firebase nativo desde el proyecto principal.

## Relación con el código real

- Los comandos del README (líneas 12-15) coinciden exactamente con los `scripts` de
  `iphone/package.json` (líneas 7-11): `ios`, `mac`, `web`, `typecheck`.
- La afirmación de reutilización de `../app` y `../src` se confirma en el código:
  - Todos los archivos de `iphone/app/` son reexports puros hacia `../app/...`
    (p. ej. `iphone/app/_layout.tsx` hace `export { default } from '../../app/_layout'`).
  - `iphone/tsconfig.json` incluye `../app/**/*` y `../src/**/*` en su `include`.
  - `iphone/metro.config.js` añade la raíz del monorepo a `watchFolders` y el
    `node_modules` raíz a `nodeModulesPaths`.
- La afirmación sobre Firebase se confirma: `src/config/firebase.ts` (523 líneas,
  cabecera v2.0.0 de 2026-04-21) es una capa híbrida que importa el SDK JS modular de
  Firebase (`firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/storage`,
  `firebase/functions`) y usa `Platform` de react-native, exactamente lo que declara
  la dependencia `firebase` en `iphone/package.json`.
- [NIVEL DE CERTEZA: Confirmado por código] El README describe fielmente una
  arquitectura de variante reutilizadora (no una app independiente ni duplicada).

[NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

Sin secretos ni datos sensibles en el README. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [INFORMATIVO] El README no menciona la dependencia implícita del `node_modules`
  raíz; recomendación de documentarlo (ver `iphone/metro.config.js`).
- [RECOMENDACIÓN] Sería útil documentar el estado de publicación (TestFlight/App
  Store) y la divergencia de rutas respecto a la app principal.
