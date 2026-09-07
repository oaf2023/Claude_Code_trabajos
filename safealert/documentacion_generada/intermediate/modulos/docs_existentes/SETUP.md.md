# Documento: SETUP.md

## Resumen
- Guía de configuración y puesta en marcha del "MVP publicable" de SafeAlert. Define el alcance real (SOS manual inmediato, contactos de confianza, ubicación puntual, alerta por Firestore + Cloud Functions, audio opcional) y excluye explícitamente del MVP la wake word productiva, la llamada autónoma y el seguimiento de ubicación en segundo plano.
- Cubre requisitos previos, archivos de Firebase obligatorios no versionados, configuración de Firebase, variables de entorno (cliente y Functions), instalación/validación, desarrollo local y distribución Android (firma release, APK por QR, AAB para Google Play, automatización con scripts PowerShell).
- Cierra con el flujo de alerta vigente en 6 pasos. Es un documento operativo alineado con el estado "MVP" del producto.

## Contenido clave
- Alcance fuera del MVP: sin wake word productivo, sin llamada autónoma real, sin background location para publicación.
- Requisitos: Node.js 20+, npm, Firebase CLI, EAS CLI, Android Studio, Xcode 15+.
- Archivos obligatorios no versionados: `android/app/google-services.json` e `ios/GoogleService-Info.plist`; sin ellos la auth anónima no inicializa y la app entra en estado de error controlado.
- Firebase: auth anónima, Firestore + Storage en modo producción, Functions en plan Blaze si hay proveedor SMS externo, deploy de reglas con `firebase deploy --only firestore:rules,storage`.
- Variables cliente (`.env`): `EXPO_PUBLIC_ENABLE_WAKE_WORD=false`, `EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION=false`. Variables Functions (`functions/.env`): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (valores de ejemplo con `x`, no reales). Si Twilio no está, las Functions dejan trazabilidad en `pendingNotifications` como fallback interno.
- Instalación/validación: `npm install`, `npm run typecheck`, `cd functions && npm install && npm run build`.
- Desarrollo local: `npx expo run:android` / `npx expo run:ios`.
- Distribución Android: keystore release con variables `MYAPP_RELEASE_STORE_FILE/PASSWORD/KEY_ALIAS/KEY_PASSWORD` (fallback a firma debug si no existen); `npx eas build -p android --profile preview` (APK) y `--profile production` (AAB); incrementar `versionCode`; scripts `New-AndroidReleaseKeystore.ps1` y `New-AndroidInstallQr.ps1` (escribe landing HTML en `dist/android-distribution/`).
- Flujo de alerta vigente: pulso SOS → ubicación con fallback a última conocida → `users/{uid}/alerts/{alertId}` en Firestore → Cloud Function envía SMS o fallback interno con trazabilidad por contacto → si audio habilitado se sube `voice.m4a` → follow-up opcional con el enlace del audio.

## Relación con el código real
- Coincidencias verificadas:
  - Flags `EXPO_PUBLIC_ENABLE_WAKE_WORD=false` y `EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION=false` presentes como valores por defecto en `.env.example` raíz; `features.ts` los lee con fallback `false` (además existen `EXPO_PUBLIC_ENABLE_AUDIO_GUARD`, `EXPO_PUBLIC_ENABLE_PAYMENTS`, `EXPO_PUBLIC_ENABLE_PAYMENTS_DEMO` no citadas en SETUP.md).
  - Fallback interno en `pendingNotifications`: confirmado en `functions/src/sendAlertSMS.ts` (colección `pendingNotifications`, colecciones `_functionEvents`; reglas Firestore las bloquean al cliente).
  - Variables Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` confirmadas en `functions/.env.example`. [OBSERVACIÓN TÉCNICA] El código real además soporta `TWILIO_API_KEY_SID` y `TWILIO_API_SECRET` (auth por API key) y un `TWILIO_DEFAULT_SENDER_ID` hardcodeado como fallback; SETUP.md no los menciona.
  - Path de audio `voice.m4a`: confirmado (`buildAlertAudioStoragePath` en `src/config/features.ts`).
  - Scripts PowerShell `scripts/New-AndroidReleaseKeystore.ps1` y `scripts/New-AndroidInstallQr.ps1`: existen.
  - Perfiles EAS preview/production y scripts npm `build:android:*`: confirmados en `eas.json` y `package.json`.
  - Reglas Firestore para producción y auth anónima: alineadas con `firestore.rules` y configuración de la app.
- Discrepancias:
  - [OBSERVACIÓN TÉCNICA] `ios/GoogleService-Info.plist`: no existe carpeta `ios/` en el repositorio local (se genera en builds EAS). El requisito es correcto para builds iOS, pero ese archivo no está versionado ni presente hoy.
  - [OBSERVACIÓN TÉCNICA] El documento cita solo 2 variables de entorno del cliente; el `.env.example` real declara 14 (`EXPO_PUBLIC_*`) y `features.ts` lee además `EXPO_PUBLIC_AUDIO_ALERT_LANGUAGE`, `EXPO_PUBLIC_AUDIO_ALERT_THRESHOLD` y `EXPO_PUBLIC_AUDIO_GUARD_CHUNK_MS`. Cobertura documental incompleta.
  - [OBSERVACIÓN TÉCNICA] Las variables de firma `MYAPP_RELEASE_*` no están en `.env`/`.env.example` reales; SETUP.md las declara como variables de entorno local/CI (coherente, pero no verificable en el repo).

## Estado y uso
- VIGENTE: describe con precisión el MVP publicado/desplegable actual y coincide con el código en los puntos esenciales (flujo de alerta por Cloud Functions, fallback `pendingNotifications`, flags desactivados por defecto). Es la guía operativa a seguir para reproducir el entorno.
- [NIVEL DE CERTEZA: Altamente probable]

## Seguridad
- [INFORMATIVO] Correcto: separa credenciales Twilio (Functions/backend) del cliente y advierte "No pongas esas credenciales en el cliente móvil"; el archivo solo muestra placeholders.
- [INFORMATIVO] Recomienda keystore de producción fuera del repositorio. Sin hallazgos de exposición de secretos en el documento.
