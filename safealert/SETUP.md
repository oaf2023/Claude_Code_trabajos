# SafeAlert - Setup del MVP publicable

## Alcance real actual

- SOS manual inmediato.
- Contactos de confianza.
- Captura de ubicación puntual.
- Envío de alerta por Firestore + Cloud Functions.
- Audio opcional como adjunto posterior.
- Permisos claros para ubicación, notificaciones y micrófono opcional.

## Capacidades explícitamente fuera del MVP

- No hay wake word productivo.
- No hay llamada autónoma real del sistema.
- No hay seguimiento de ubicación en segundo plano para publicación.

## Requisitos previos

- Node.js 20+
- npm
- Firebase CLI
- EAS CLI para builds distribuidas
- Android Studio para Android
- Xcode 15+ para iOS

## Archivos obligatorios no versionados

- android/app/google-services.json
- ios/GoogleService-Info.plist

Sin esos archivos, la autenticación anónima de Firebase no inicializa y la app queda en estado de error controlado.

## Configuración de Firebase

1. Crear proyecto en Firebase.
2. Habilitar Authentication con proveedor Anónimo.
3. Habilitar Firestore y Storage en modo producción.
4. Habilitar Functions en plan Blaze si se usará proveedor SMS externo.
5. Desplegar reglas:

```bash
firebase deploy --only firestore:rules,storage
```

## Variables de entorno

Cliente móvil, archivo .env:

```env
EXPO_PUBLIC_ENABLE_WAKE_WORD=false
EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION=false
```

Cloud Functions, archivo functions/.env:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567
```

Si no configuras Twilio, las Functions dejan trazabilidad en pendingNotifications como fallback interno. No pongas esas credenciales en el cliente móvil.

## Instalación y validación

```bash
npm install
npm run typecheck
```

Funciones:

```bash
cd functions
npm install
npm run build
cd ..
```

## Desarrollo local

```bash
npx expo run:android
```

o en iOS:

```bash
npx expo run:ios
```

## Flujo de alerta vigente

1. El usuario pulsa SOS manual.
2. La app captura ubicación actual con fallback a última conocida.
3. La app crea users/{uid}/alerts/{alertId} en Firestore.
4. La Cloud Function envía SMS o fallback interno con trazabilidad por contacto.
5. Si el usuario habilitó audio y concedió micrófono, se sube users/{uid}/alerts/{alertId}/voice.m4a.
6. Una actualización posterior puede disparar un follow-up con el enlace del audio.
