# Archivo: package.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| package.json | 84 | JSON (npm) | 2679 | Manifiesto npm: scripts, dependencias y configuración | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Manifiesto npm del proyecto SafeAlert. Declara el punto de entrada (`index.ts`), los scripts de desarrollo/build/test/publicación, las dependencias de runtime (Expo SDK 55, React Native 0.83, Firebase, expo-router, Zustand, wakeword, Sentry, etc.), las devDependencies (Jest/ts-jest/TypeScript) y una sección `expo.doctor` para excluir comprobaciones de directorios nativos de dos paquetes.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Es el manifiesto activo: scripts usados por el flujo de desarrollo (`expo start`, `eas build`, `jest`, `tsc`). [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

No importa módulos (archivo de datos). Declara dependencias que agrupa por tipo:

| Campo | Tipo | Nota |
| --- | --- | --- |
| `main` | — | `index.ts`, entrada real de la app (ver `index.ts.md`) |
| `dependencies` | runtime | 44 paquetes (líneas 21-63) |
| `devDependencies` | desarrollo | 7 paquetes (líneas 66-71) |
| `scripts` | npm | 13 comandos (líneas 5-19) |
| `expo.doctor.reactNativeDirectoryCheck.exclude` | config | Excluye `expo-av` y `react-native-wakeword` del chequeo de directorios nativos |

## Componentes que dependen de este archivo

- Todos los flujos de build/test: `npm start`, `npm test`, `npx tsc`, `eas build`.
- `metro.config.js`, `babel.config.js`, `tsconfig.json`, `jest.config.js` se resuelven junto a este manifiesto.
- `index.ts` como `main`.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `name` | `safealert` | string | Nombre del paquete | Línea 2 |
| `version` | `1.0.0` | string | Versión del paquete npm (distinta de la versión de app `1.2.0` de app.json) | Línea 3 |
| `main` | `index.ts` | string | Entrada de la app | Línea 4 |
| `private` | `true` | boolean | Evita publicación accidental en npm | Línea 73 |

## Estructura (funciones / clases / tipos)

No aplica. Estructura JSON: `scripts`, `dependencies`, `devDependencies`, `expo`.

## Análisis línea por línea

```json
{
  "name": "safealert",
  "version": "1.0.0",
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "build:android:preview": "eas build -p android --profile preview",
    "build:android:production": "eas build -p android --profile production",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "web:build": "expo export --platform web && node scripts/patch-import-meta.js",
    "web:serve": "npx serve dist -l 5800 --no-clipboard",
    "web:dev": "npm run web:build && npm run web:serve",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
```

**Explicación de las líneas 1–19:**

- **Línea 4**: `main: index.ts` — convierte a `index.ts` en el módulo que Metro carga primero (la entrada real, ver `index.ts.md`).
- **Línea 6**: `start` arranca el servidor de desarrollo de Expo.
- **Línea 7**: `android` compila y ejecuta en Android (`expo run:android`, build nativo local).
- **Líneas 8-9**: builds EAS de Android con perfiles `preview` y `production` (definidos en `eas.json`).
- **Línea 10**: `ios` compila y ejecuta en iOS.
- **Línea 11**: `web` arranca Expo en modo web.
- **Línea 12**: `web:build` exporta el bundle web con `expo export --platform web` y ejecuta después `scripts/patch-import-meta.js` (parche post-proceso del bundle, relacionado con `import.meta`).
- **Línea 13**: `web:serve` sirve la carpeta `dist` con `serve` en el puerto 5800.
- **Línea 14**: `web:dev` encadena build y servidor web.
- **Línea 15**: `typecheck` ejecuta TypeScript sin emitir (`tsc --noEmit`).
- **Líneas 16-18**: comandos Jest: una vez, en modo watch y con cobertura.

```json
  "dependencies": {
    "@expo/metro-runtime": "~55.0.12",
    "@expo/vector-icons": "^15.1.1",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-native-firebase/app": "^23.8.8",
    "@react-native-firebase/auth": "^23.8.8",
    "@react-native-firebase/firestore": "^23.8.8",
    "@react-native-firebase/functions": "^23.8.8",
    "@react-native-firebase/storage": "^23.8.8",
    "@sentry/react-native": "~7.11.0",
    "eventemitter3": "^5.0.4",
    "expo": "~55.0.6",
    "expo-av": "^16.0.8",
    "expo-battery": "~55.0.14",
    "expo-camera": "~55.0.11",
    "expo-constants": "~55.0.9",
    "expo-file-system": "~55.0.11",
    "expo-font": "~55.0.4",
    "expo-linking": "~55.0.8",
    "expo-localization": "~55.0.16",
    "expo-location": "~55.1.4",
    "expo-media-library": "~55.0.10",
    "expo-notifications": "~55.0.13",
    "expo-router": "~55.0.7",
    "expo-secure-store": "~55.0.15",
    "expo-splash-screen": "~55.0.12",
    "expo-status-bar": "~55.0.4",
    "expo-task-manager": "~55.0.10",
    "firebase": "^12.12.1",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "react-native": "0.83.2",
    "react-native-device-info": "^15.0.2",
    "react-native-gesture-handler": "~2.30.0",
    "react-native-haptic-feedback": "^2.3.4",
    "react-native-permissions": "^5.5.1",
    "react-native-reanimated": "4.2.1",
    "react-native-safe-area-context": "~5.6.2",
    "react-native-screens": "~4.23.0",
    "react-native-wakeword": "^1.1.82",
    "react-native-web": "^0.21.0",
    "react-native-worklets": "0.7.2",
    "zod": "^4.3.6",
    "zustand": "^5.0.12"
  },
```

**Explicación de las líneas 20–64:**

- **Línea 21**: `@expo/metro-runtime` (runtime de Metro para web/SSR de expo-router).
- **Línea 22**: `@expo/vector-icons` (iconos).
- **Línea 23**: `@react-native-async-storage/async-storage` 2.2.0 (almacenamiento local; en tests se mockea vía localStorage en `jest.setup.js`).
- **Líneas 24-28**: módulos nativos de React Native Firebase: app, auth, firestore, functions y storage (v23.x). Se configuran con el plugin `@react-native-firebase/app` de `app.json`.
- **Línea 29**: `@sentry/react-native ~7.11.0` (crash reporting; plugin de config nativa en `app.json`).
- **Línea 30**: `eventemitter3` (emitter ligero, probablemente usado por la capa de servicios de alertas).
- **Línea 31**: `expo ~55.0.6` (SDK principal; nota: en app.json se usa el ecosistema ~55).
- **Línea 32**: `expo-av ^16.0.8` (audio/video, deprecado; grabación de voz SOS).
- **Líneas 33-47**: módulos Expo: batería, cámara, constants, file-system, font, linking, localization, location, media-library, notifications, router, secure-store, splash-screen, status-bar, task-manager. Cubren: estado de batería, fotos/vídeo, almacenamiento, deep links, idioma, GPS, notificaciones push, enrutado, almacén seguro (tokens), splash y tareas en segundo plano.
- **Línea 48**: `firebase ^12.12.1` (SDK JS de Firebase, usado en web/PWA donde no hay módulos nativos).
- **Líneas 49-50**: `react 19.2.0` y `react-dom 19.2.0` (React 19; DOM para web).
- **Línea 51**: `react-native 0.83.2` (RN 0.83).
- **Línea 52**: `react-native-device-info` (info de dispositivo; se shimmea en web).
- **Líneas 53-58**: gesture-handler, haptic-feedback, permissions, reanimated (4.2.1), safe-area-context, screens (navegación/gestos).
- **Línea 59**: `react-native-wakeword ^1.1.82` (activación por palabra de alerta; SDK con artefactos Maven/onnx; se shimmea en web).
- **Línea 60**: `react-native-web ^0.21.0` (render web de RN).
- **Línea 61**: `react-native-worklets 0.7.2` (worklets para Reanimated 4).
- **Línea 62**: `zod ^4.3.6` (validación de esquemas).
- **Línea 63**: `zustand ^5.0.12` (gestión de estado global).

```json
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@types/react": "~19.2.2",
    "babel-preset-expo": "~55.0.8",
    "jest": "^29.7.0",
    "ts-jest": "^29.4.11",
    "typescript": "~5.9.2"
  },
  "private": true,
  "expo": {
    "doctor": {
      "reactNativeDirectoryCheck": {
        "exclude": [
          "expo-av",
          "react-native-wakeword"
        ]
      }
    }
  }
}
```

**Explicación de las líneas 65–84:**

- **Líneas 66-71**: devDependencies: tipos de Jest, tipos de React 19, `babel-preset-expo` (preset de Babel usado en `babel.config.js`), `jest` 29, `ts-jest` 29 (transformador TS para Jest, preset de `jest.config.js`) y `typescript ~5.9.2`.
- **Línea 73**: `private: true` evita publicación accidental a npm.
- **Líneas 74-83**: configuración `expo.doctor.reactNativeDirectoryCheck.exclude`: excluye a `expo-av` y `react-native-wakeword` del chequeo de directorios nativos que hace `expo-doctor`, porque ambos paquetes no siguen el layout estándar de directorios RN (causa conocida de falsos positivos del doctor).

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Hay dos versiones divergentes: la del paquete npm (`1.0.0`) y la de la app en `app.json` (`1.2.0`). No es un error funcional (npm no publica), pero puede confundir al auditar releases.
- [OBSERVACIÓN TÉCNICA] `firebase` (SDK JS) y `@react-native-firebase/*` conviven: la app usa RNFirebase en nativo y Firebase JS probablemente en la PWA web (coherente con los shims de `metro.config.js`).
- [OBSERVACIÓN TÉCNICA] Se mantienen `expo-av` (deprecado) y `react-native-wakeword` (SDK propietario), ambos excluidos del chequeo de `expo-doctor`.
- [NOTA] Rangos con `~`/`^` mixtos: los paquetes `expo-*` usan `~` (parches dentro del SDK) y los de Firebase/wakeword usan `^` (menor/mayor), lo que exige fijar versiones en CI para builds reproducibles.

## Seguridad

- [INFORMATIVO] No hay secretos en este archivo. `private: true` reduce el riesgo de publicación accidental.
- [BAJO] El rango `^` en dependencias de seguridad crítica (Firebase, Sentry) puede arrastrar actualizaciones menores no controladas entre builds; se recomienda lockfile (`package-lock.json` presente en el proyecto) para reproducibilidad.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Mantener `package.json` version y la versión de `app.json` sincronizadas o documentar su diferencia (build vs. paquete).
- [RECOMENDACIÓN] Vigilar la deprecación de `expo-av` (migrar a `expo-audio`) y la política de licencia de `react-native-wakeword` (hay `EXPO_PUBLIC_WAKE_WORD_LICENSE` en `.env.example`).
- [RECOMENDACIÓN] Ejecutar `npm audit`/`expo-doctor` periódicamente para controlar vulnerabilidades de la cadena de dependencias.
