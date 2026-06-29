# SafeAlert Apple

Cliente Apple separado que reutiliza el codigo compartido de SafeAlert.

## Objetivos

- iPhone y iPad mediante Expo iOS.
- Mac mediante Expo Web o PWA.

## Comandos

- npm run ios
- npm run mac
- npm run web
- npm run typecheck

## Notas tecnicas

- El codigo de negocio y pantallas se reutiliza desde las carpetas ../app y ../src.
- En Apple y web, Firebase usa la capa modular definida en ../src/config/firebase.ts.
- Android sigue usando React Native Firebase nativo desde el proyecto principal.