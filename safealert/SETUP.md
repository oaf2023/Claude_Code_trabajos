# SafeAlert - Setup del MVP publicable

**Versión**: 2.0.0 | **Fecha**: 2026-09-06

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
5. **Configurar Secret Manager** con los siguientes secretos:
   - `MP_WEBHOOK_SECRET` — Secreto de firma de webhooks de MercadoPago
   - `PA_INTERNAL_KEY` — Clave interna para PythonAnywhere
6. Desplegar reglas:

```bash
firebase deploy --only firestore:rules,storage
```

7. Desplegar Cloud Functions:

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

## Variables de entorno

### Cliente móvil (archivo .env)

```env
# Feature flags
EXPO_PUBLIC_ENABLE_WAKE_WORD=false
EXPO_PUBLIC_ENABLE_AUDIO_GUARD=false
EXPO_PUBLIC_ENABLE_PAYMENTS=false      # ⚠️ CONGELADO - no habilitar hasta Fase 2+4
EXPO_PUBLIC_ENABLE_PAYMENTS_DEMO=false # ⚠️ CONGELADO
EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION=false

# APIs
EXPO_PUBLIC_PA_API_URL=https://oaf.pythonanywhere.com
EXPO_PUBLIC_AUDIO_ALERT_API_URL=https://oaf.pythonanywhere.com/api/audio/detectar-alerta
EXPO_PUBLIC_AUDIO_ALERT_API_KEY=tu_api_key_aqui
EXPO_PUBLIC_AUDIO_ALERT_LANGUAGE=es
EXPO_PUBLIC_AUDIO_ALERT_THRESHOLD=82
EXPO_PUBLIC_AUDIO_GUARD_CHUNK_MS=2000
```

### Cloud Functions (functions/.env)

```env
# ⚠️ SECRETO — este archivo está en .gitignore
MP_ACCESS_TOKEN=APP_USR-... # Token de producción MercadoPago
PAYMENTS_ENABLED=false      # ⚠️ CONGELADO
PA_API_URL=https://oaf.pythonanywhere.com
```

### Secretos en Firebase Secret Manager

```bash
# Configurar secretos (solo primera vez)
npx firebase functions:secrets:set MP_WEBHOOK_SECRET
npx firebase functions:secrets:set PA_INTERNAL_KEY
```

## Variables de entorno críticas (NO commitear)

| Variable | Ubicación | Descripción |
|----------|-----------|-------------|
| `MP_ACCESS_TOKEN` | functions/.env | Token MercadoPago (producción) |
| `MP_WEBHOOK_SECRET` | Secret Manager | Secreto de firma HMAC-SHA256 |
| `PA_INTERNAL_KEY` | Secret Manager | Clave interna PythonAnywhere |
| `AUDIO_ALERT_API_KEY` | .env (cliente) | API key para alertas de audio |

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

## Flujo de pago (actualmente congelado)

1. La app llama a `createPaymentOrder` (Cloud Function).
2. La Cloud Function crea la orden en MercadoPago con `external_reference: uid:{uid}:deviceId:{deviceId}`.
3. MercadoPago notifica al webhook `mpWebhook`.
4. El webhook verifica la firma HMAC-SHA256 (Fase 1).
5. El webhook parsea el external_reference para obtener uid (Fase 2).
6. El webhook actualiza la suscripción en Firestore.
