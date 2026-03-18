# SafeAlert - Guía de Configuración

## Requisitos previos

- Node.js 20+
- npm o yarn
- Expo CLI: `npm install -g expo-cli`
- Firebase CLI: `npm install -g firebase-tools`
- Para iOS: macOS + Xcode 15+
- Para Android: Android Studio + SDK

---

## 1. Configurar Firebase

1. Ir a https://console.firebase.google.com y crear un proyecto
2. Habilitar en Firebase Console:
   - **Authentication** → Método: Anónimo
   - **Firestore Database** → Modo producción
   - **Storage** → Modo producción
   - **Functions** → Plan Blaze (requerido para llamadas externas como Twilio)

3. **Android**: Agregar app Android (Package: `com.safealert.app`)
   - Descargar `google-services.json`
   - Colocar en `android/app/google-services.json`

4. **iOS**: Agregar app iOS (Bundle ID: `com.safealert.app`)
   - Descargar `GoogleService-Info.plist`
   - Colocar en `ios/GoogleService-Info.plist`

5. Aplicar las reglas de seguridad:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

---

## 2. Configurar Twilio

1. Crear cuenta en https://www.twilio.com
2. Obtener un número de teléfono con capacidad SMS
3. Copiar Account SID, Auth Token y número

4. Crear `functions/.env` (basado en `functions/.env.example`):
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_PHONE_NUMBER=+15551234567
   ```

5. Desplegar las Cloud Functions:
   ```bash
   cd functions
   npm install
   npm run build
   cd ..
   firebase deploy --only functions
   ```

---

## 3. Configurar Picovoice Porcupine (detección de voz)

1. Crear cuenta gratuita en https://picovoice.ai
2. Ir a https://console.picovoice.ai y obtener tu **Access Key**

3. Para las palabras en español ("ayuda", "socorro"), generar archivos `.ppn`:
   - Ir a https://console.picovoice.ai/ppn
   - Crear keyword "ayuda" para iOS (ARM64) → descargar `ayuda_ios.ppn`
   - Crear keyword "ayuda" para Android (ARM) → descargar `ayuda_android.ppn`
   - Repetir para "socorro"
   - Colocar los archivos en `assets/keywords/`

4. Crear `.env` en la raíz del proyecto:
   ```
   EXPO_PUBLIC_PORCUPINE_ACCESS_KEY=tu_access_key_aqui
   ```

> **Nota**: Mientras no tengas los archivos `.ppn` personalizados, la app usará
> la keyword "Alexa" de prueba (inglés). Para producción, usa las keywords en español.

---

## 4. Generar el proyecto nativo

```bash
npx expo prebuild --clean
```

Esto genera las carpetas `android/` e `ios/` con el código nativo.

---

## 5. Ejecutar en desarrollo

```bash
# Android
npx expo run:android

# iOS (requiere macOS)
npx expo run:ios
```

---

## 6. Compilar para producción

Instalar EAS CLI:
```bash
npm install -g eas-cli
eas login
eas build:configure
```

Compilar:
```bash
# Android APK/AAB
eas build --platform android

# iOS IPA
eas build --platform ios
```

---

## Variables de entorno requeridas

| Variable | Archivo | Descripción |
|----------|---------|-------------|
| `EXPO_PUBLIC_PORCUPINE_ACCESS_KEY` | `.env` | Clave de Picovoice para detección de voz |
| `TWILIO_ACCOUNT_SID` | `functions/.env` | SID de cuenta Twilio |
| `TWILIO_AUTH_TOKEN` | `functions/.env` | Token de autenticación Twilio |
| `TWILIO_PHONE_NUMBER` | `functions/.env` | Número de teléfono Twilio (E.164) |

---

## Estructura del proyecto

```
safealert/
├── app/                  # Pantallas (Expo Router)
│   ├── (tabs)/           # Navegación con tabs
│   │   ├── index.tsx     # HomeScreen (dashboard principal)
│   │   ├── contacts.tsx  # Gestión de contactos
│   │   └── settings.tsx  # Configuración
│   ├── contacts/[id].tsx # Agregar/editar contacto
│   ├── permissions.tsx   # Gestión de permisos
│   └── test-alert.tsx    # Prueba de alerta
├── src/
│   ├── services/         # Lógica de negocio
│   ├── stores/           # Estado (Zustand)
│   ├── hooks/            # React hooks
│   ├── types/            # TypeScript interfaces
│   ├── config/           # Configuración (Firebase, Porcupine)
│   └── utils/            # Utilidades
├── functions/            # Firebase Cloud Functions (Twilio SMS)
└── assets/keywords/      # Archivos .ppn de Porcupine
```

---

## Flujo de alerta

1. Usuario activa **Modo Guardia** → Porcupine empieza a escuchar en background
2. Usuario dice "ayuda" → Overlay de 3 segundos para cancelar
3. Si no cancela → `AlertService.send()`:
   - Captura GPS (con fallback a última ubicación conocida)
   - Escribe documento en Firestore `users/{uid}/alerts/{id}`
4. **Cloud Function** se dispara automáticamente:
   - Lee contactos del documento
   - Envía SMS via Twilio a cada número con ubicación + mensaje
5. En paralelo: graba 10s de audio y lo sube a Firebase Storage
6. Segunda Cloud Function envía link de audio a los mismos contactos
