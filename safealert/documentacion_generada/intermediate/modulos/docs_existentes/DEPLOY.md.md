# Documento: DEPLOY.md

## Resumen
- Guía breve de despliegue del MVP de SafeAlert: checklist previo, comandos base de Firebase (reglas + Functions), validaciones post-deploy y notas operativas sobre el alcance real (sin wake word ni background tracking publicitados; llamada asistida; fallback interno de SMS si Twilio no está configurado).
- La segunda mitad repite y condensa la distribución Android (APK por QR y publicación controlada en Google Play) y lista los secretos requeridos en Functions con valores de ejemplo ficticios.
- Es un documento complementario de SETUP.md orientado al operador que despliega y distribuye.

## Contenido clave
- Checklist previo: `google-services.json` + `GoogleService-Info.plist` presentes; `npm run typecheck`; `npm run build` en `functions`; reglas Firestore/Storage listas; `functions/.env` sin secretos de ejemplo.
- Comandos base: `firebase login`; `firebase deploy --only firestore:rules,storage`; `firebase deploy --only functions`.
- Validaciones: `firebase functions:list`; `firebase functions:log --only sendAlertSMS`.
- Notas operativas: no promocionar wake word ni background tracking; el botón de llamada es asistido (abre el dialer tras acción explícita); sin Twilio la Function usa fallback interno y deja `provider`, `providerMessageId`, `attempts` y `lastError` en la trazabilidad del documento.
- Distribución Android: `npm run build:android:preview` (APK) → hosting + landing QR (`New-AndroidInstallQr.ps1`); `npm run build:android:production` (AAB) → Google Play Internal testing.
- Requisitos mínimos: keystore release con `MYAPP_RELEASE_*`; `google-services.json` alineado con `com.safealert.app`; `versionCode` incrementado; typecheck y build validados.
- Secretos requeridos (placeholder `x`): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`; advertencia de no documentar tokens reales en el archivo ni en commits.

## Relación con el código real
- Coincidencias verificadas:
  - Función `sendAlertSMS` existe y se exporta (`functions/src/index.ts` línea 6); `firebase functions:log --only sendAlertSMS` es aplicable.
  - Trazabilidad por contacto (`provider`, `providerMessageId`, `attempts`, `lastError`): el código de `sendAlertSMS.ts` escribe `provider` y maneja reintentos/fallback; campos coherentes con la descripción. [NIVEL DE CERTEZA: Altamente probable]
  - `google-services.json` presente en raíz y `app.json` con `android.package: com.safealert.app` (coincide con el requisito de alineación).
  - Scripts npm `build:android:preview/production` y `scripts/New-AndroidInstallQr.ps1` existen.
  - Variables Twilio citadas coinciden con `functions/.env.example`.
- Discrepancias y omisiones:
  - [OBSERVACIÓN TÉCNICA] `ios/GoogleService-Info.plist`: no existe carpeta `ios/` versionada en el repo (el archivo se genera en builds EAS). El checklist es correcto para el flujo EAS, pero el archivo no está presente localmente.
  - [OBSERVACIÓN TÉCNICA] El documento no menciona las variables de auth por API key de Twilio (`TWILIO_API_KEY_SID`, `TWILIO_API_SECRET`) ni el sender ID por defecto que el código real usa como fallback.
  - [OBSERVACIÓN TÉCNICA] No cubre el despliegue del backend Flask (PythonAnywhere / Cloud Run) ni de Cloud Functions de pago (`createPaymentOrder`, `mpWebhook`), pese a que la app los consume; el alcance "deploy" del documento es solo Firebase + distribución móvil.

## Estado y uso
- VIGENTE (parcial): correcto para el despliegue Firebase/Functions y la distribución Android del MVP; incompleto como guía integral de deploy (omite backend y Functions de pago). Coherente con SETUP.md.
- [NIVEL DE CERTEZA: Altamente probable]

## Seguridad
- [INFORMATIVO] Manejo correcto de secretos: solo placeholders y advertencia explícita de no versionar tokens reales.
- [INFORMATIVO] Recomienda validar que `functions/.env` no tenga secretos de ejemplo antes de desplegar.
