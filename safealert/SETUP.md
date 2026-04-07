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

## Distribucion Android

### 1. Preparar firma release

- Crear un keystore de produccion fuera del repositorio.
- Configurar estas variables en el entorno local o CI antes de compilar release:

```bash
MYAPP_RELEASE_STORE_FILE=C:/ruta-segura/safealert-release.keystore
MYAPP_RELEASE_STORE_PASSWORD=tu_password
MYAPP_RELEASE_KEY_ALIAS=tu_alias
MYAPP_RELEASE_KEY_PASSWORD=tu_password_de_clave
```

- Si esas variables no estan definidas, Android usa la firma debug solo como fallback para pruebas internas.

### 2. Generar APK para instalar por QR

```bash
npx eas build -p android --profile preview
```

- El perfil `preview` genera una APK instalable.
- Subi esa APK a un hosting estable y genera un QR a la URL de descarga.
- En el dispositivo Android hay que habilitar la instalacion desde origen desconocido la primera vez.

### 3. Generar AAB para Google Play

```bash
npx eas build -p android --profile production
```

- El perfil `production` genera un Android App Bundle listo para Google Play Internal Testing o publicacion posterior.
- Incrementa `versionCode` en cada release Android antes de publicar una nueva build.

### 4. Comandos utiles

```bash
npm run build:android:preview
npm run build:android:production
```

### 5. Automatizar keystore y QR

Crear keystore release:

```bash
pwsh -File .\scripts\New-AndroidReleaseKeystore.ps1 -KeystorePath C:\secure\safealert-release.keystore -KeyAlias safealert-release
```

Generar landing con QR a una APK ya publicada:

```bash
pwsh -File .\scripts\New-AndroidInstallQr.ps1 -DownloadUrl https://mi-host/safealert.apk -Version 1.0.0
```

Esto escribe una landing HTML en `dist/android-distribution/` para subirla al hosting que uses.

## Flujo de alerta vigente

1. El usuario pulsa SOS manual.
2. La app captura ubicación actual con fallback a última conocida.
3. La app crea users/{uid}/alerts/{alertId} en Firestore.
4. La Cloud Function envía SMS o fallback interno con trazabilidad por contacto.
5. Si el usuario habilitó audio y concedió micrófono, se sube users/{uid}/alerts/{alertId}/voice.m4a.
6. Una actualización posterior puede disparar un follow-up con el enlace del audio.
