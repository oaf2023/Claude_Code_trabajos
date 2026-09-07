# Documento: TUTORIAL-DISTRIBUCION-AYUDAME.md

## Resumen
- Tutorial paso a paso para publicar la app actual SafeAlert bajo una marca comercial nueva, "Ayudame": renombrado de identidad, publicación en Google Play, publicación en App Store y distribución por código QR/landing web.
- Parte de la configuración actual del proyecto (app.json, eas.json, package.json, DEPLOY.md) y recomienda, si Ayudame va a convivir con SafeAlert, usar una identidad separada (`com.ayudame.app`) en lugar de solo renombrar el nombre visible.
- Incluye checklist por tienda, comandos PowerShell/EAS resumidos, errores comunes al renombrar y una recomendación final sobre las dos estrategias posibles (app nueva vs. rebranding).

## Contenido clave
- Punto de partida declarado: nombre visible SafeAlert; slug Expo `safealert`; scheme `safealert`; Android package `com.safealert.app`; iOS bundle identifier `com.safealert.app`.
- Identidad nueva recomendada: nombre Ayudame; slug `ayudame`; scheme `ayudame`; package/bundle `com.ayudame.app`.
- Paso 1: cambios en `app.json` (`name`, `slug`, `scheme`, `ios.bundleIdentifier`, `android.package`).
- Paso 2: nuevas apps Android/iOS en Firebase y reemplazo de `google-services.json` / `GoogleService-Info.plist`.
- Paso 3: subir `expo.version` y `android.versionCode` (ejemplo 1.1.0 → 1.2.0, versionCode 3).
- Pasos 4-6: typecheck; builds EAS Android (`--profile preview` APK, `--profile production` AAB); ficha en Google Play Console (Internal testing → producción); publicación iOS con `npx eas build -p ios --profile production` y `npx eas submit -p ios --profile production`, distribución inicial por TestFlight.
- Pasos 7-8: QR a APK directo (escenario A) vs. landing con botones de tienda y detección de dispositivo (escenario B); iOS por QR solo hacia TestFlight/App Store.
- Paso 9-10: flujo recomendado de lanzamiento y comandos útiles resumidos.
- Errores comunes: cambiar solo el nombre visible; reutilizar `google-services.json` de SafeAlert con `com.ayudame.app`; no incrementar versionCode; QR de APK para iPhone; mantener scheme viejo.

## Relación con el código real
- Coincidencias verificadas en `app.json`:
  - `name: SafeAlert` ✔; `scheme: safealert` ✔; `android.package: com.safealert.app` ✔; `ios.bundleIdentifier: com.safealert.app` ✔; versión actual `1.2.0` y `versionCode: 4`.
  - Perfiles EAS `preview` (APK) y `production` (AAB) en `eas.json` ✔; scripts npm `build:android:preview/production` y `typecheck` en `package.json` ✔.
- Discrepancias:
  - [OBSERVACIÓN TÉCNICA] El tutorial declara "Slug Expo: safealert"; el valor real en `app.json` es `alertas`. Cualquier operación que dependa del slug (URLs de Expo/EAS, actualización OTA) debe usar `alertas`. [NIVEL DE CERTEZA: Confirmado por código]
  - [OBSERVACIÓN TÉCNICA] El ejemplo de versión (1.1.0 → 1.2.0, versionCode 3) ya quedó superado: el proyecto está en 1.2.0 con versionCode 4; al ejecutar el tutorial habría que partir de esos valores.
  - [OBSERVACIÓN TÉCNICA] Los enlaces internos del documento usan sintaxis wiki `[app.json](safealert/app.json)` (rutas relativas con prefijo `safealert/`) que no resuelven dentro del repositorio tal cual: se refieren a `app.json`, `eas.json`, `package.json`, `DEPLOY.md` y `google-services.json` en la raíz del proyecto.
  - [OBSERVACIÓN TÉCNICA] `GoogleService-Info.plist`: no existe carpeta `ios/` versionada hoy; el archivo se obtendría al preparar el build iOS con EAS (coherente con el paso 2 del tutorial, que lo da por descargable).

## Estado y uso
- VIGENTE como guía de trabajo para un rebranding planificado ("Ayudame"): instrucciones operativas correctas en su mayoría, con un dato factual desactualizado/incorrecto (slug) y ejemplos de versión superados. Si el rebranding sigue adelante, hay que contrastarlo con el `app.json` real.
- [NIVEL DE CERTEZA: Altamente probable]

## Seguridad
- [INFORMATIVO] No contiene secretos; advierte correctamente de no reutilizar `google-services.json` entre identidades distintas.
- [INFORMATIVO] La gestión de credenciales de firma/keystore queda referenciada a DEPLOY.md/SETUP.md, sin valores en el documento.
