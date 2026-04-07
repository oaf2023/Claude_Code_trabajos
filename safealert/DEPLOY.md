# SafeAlert - Deploy del MVP

## Checklist previo

1. Validar que estén presentes android/app/google-services.json y ios/GoogleService-Info.plist.
2. Ejecutar npm run typecheck en la app.
3. Ejecutar npm run build dentro de functions.
4. Confirmar que las reglas de Firestore y Storage estén listas para producción.
5. Verificar que functions/.env no tenga secretos de ejemplo.

## Comandos base

```bash
cd C:\Claude_Code_trabajos\safealert
firebase login
firebase deploy --only firestore:rules,storage
firebase deploy --only functions
```

## Validaciones después del deploy

```bash
firebase functions:list
firebase functions:log --only sendAlertSMS
```

## Notas operativas

- La app no debe publicitar wake word ni background tracking en esta etapa.
- El botón de llamada es asistido: abre el dialer tras una acción explícita del usuario.
- Si Twilio no está configurado, la Function usa un fallback interno y deja provider, providerMessageId, attempts y lastError en la trazabilidad del documento.

## Distribucion Android

### APK por QR para pruebas reales

1. Ejecutar `npm run build:android:preview`.
2. Descargar la APK generada por EAS.
3. Publicarla en un hosting accesible desde el telefono.
4. Generar una landing con QR hacia la URL directa de descarga:

```bash
pwsh -File .\scripts\New-AndroidInstallQr.ps1 -DownloadUrl https://mi-host/safealert.apk -Version 1.0.0
```

1. Instalar la APK en Android y validar permisos, Firebase y flujo SOS.

### Publicacion controlada en Google Play

1. Ejecutar `npm run build:android:production`.
2. Subir el archivo `.aab` a Google Play Console.
3. Publicar primero en `Internal testing`.
4. Compartir el enlace de testers y validar instalacion remota.

### Requisitos minimos antes de distribuir

- Keystore release configurado por variables `MYAPP_RELEASE_*`.
- `google-services.json` alineado con `com.safealert.app`.
- `versionCode` incrementado respecto de la build anterior.
- `npm run typecheck` y build Android validados antes de compartir la instalacion.

## Secretos requeridos en Functions

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567
```

No documentes tokens reales en este archivo ni en commits.
